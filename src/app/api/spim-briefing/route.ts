import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ─── Types ────────────────────────────────────────────────────────

interface SpimBriefingRequest {
  action: 'briefing' | 'refresh'
}

// ─── Weather Fetch ──────────────────────────────────────────────

async function fetchWeather(icaoCode: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:3000`
    const res = await fetch(`${baseUrl}/api/weather/${icaoCode}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─── NOTAMs Fetch from DB ───────────────────────────────────────

async function fetchNotams(fir: string = 'SPIM') {
  try {
    const now = new Date()
    const notams = await db.notam.findMany({
      where: {
        fir,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: { gte: now } },
          { isPermanent: true },
        ],
      },
      include: {
        airport: {
          select: { icaoCode: true, name: true, city: true },
        },
      },
      orderBy: [{ effectiveFrom: 'desc' }],
      take: 50,
    })

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1,
    }
    notams.sort((a, b) => {
      const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (diff !== 0) return diff
      return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    })

    return notams
  } catch (error) {
    console.error('Error fetching NOTAMs:', error)
    return []
  }
}

// ─── LLM Briefing Generation ────────────────────────────────────

async function generateBriefing(weather: unknown, notams: unknown[]): Promise<string> {
  const weatherStr = weather
    ? JSON.stringify(weather, null, 2).slice(0, 3000)
    : 'Datos meteorológicos no disponibles'

  const notamsStr = notams.length > 0
    ? notams
        .slice(0, 30)
        .map((n: Record<string, unknown>) =>
          `- [${n.priority || 'N/A'}] ${n.notamId || 'SIN-ID'}: ${(n.subject as string) || ''} ${(n.condition as string) || ''}`
        )
        .join('\n')
    : 'No hay NOTAMs activos'

  const systemPrompt = `Eres un Agente IA especializado en aviación civil, integrado en el sistema AIP PERÚ de CORPAC.
Tu función es generar BRIEFINGS operacionales para la FIR Lima (SPIM), analizando datos de NOTAM, METAR y TAF.

Debes responder en ESPAÑOL, con un tono profesional y conciso, como un oficial AIS brevemente un piloto.

Estructura OBLIGATORIA del briefing:
1. **RESUMEN EJECUTIVO** (2-3 líneas): Estado general de la FIR Lima
2. **METEOROLOGÍA** (SPIM): Análisis del METAR actual y pronóstico TAF, categorías de vuelo, fenómenos significativos
3. **NOTAMs CRÍTICOS**: Solo los más relevantes (urgentes, alta prioridad, o que afecten rutas/pistas)
4. **RECOMENDACIONES OPERACIONALES**: 2-3 puntos clave para pilotos y despachadores

Usa formato Markdown. Sé específico con cifras (visibilidad, techo, viento). Máximo 400 palabras.`

  const userPrompt = `Genera un briefing operacional SPIM con los siguientes datos en tiempo real:

=== METAR/TAF SPIM ===
${weatherStr}

=== NOTAMs ACTIVOS FIR LIMA (SPIM) ===
Total: ${notams.length} NOTAMs activos

${notamsStr}

Genera el briefing ahora.`

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })
    return (
      completion.choices[0]?.message?.content ||
      'No se pudo generar el briefing en este momento.'
    )
  } catch (error) {
    console.error('Error generating briefing:', error)
    return `⚠️ **Error del Agente IA**

No se pudo generar el briefing automático. Datos disponibles:

- **METAR/TAF**: ${weather ? 'Disponible' : 'No disponible'}
- **NOTAMs activos**: ${notams.length}

Intenta nuevamente en unos momentos.`
  }
}

// ─── POST Handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const _body: SpimBriefingRequest = await request.json().catch(() => ({ action: 'briefing' }))

    // Fetch data in parallel
    const [weather, notams] = await Promise.all([
      fetchWeather('SPIM'),
      fetchNotams('SPIM'),
    ])

    // Generate AI briefing
    const briefing = await generateBriefing(weather, notams)

    return NextResponse.json({
      briefing,
      weather,
      notams: notams.slice(0, 20),
      notamCount: notams.length,
      generatedAt: new Date().toISOString(),
      source: 'Agente IA SPIM',
    })
  } catch (error) {
    console.error('Error in SPIM briefing:', error)
    return NextResponse.json(
      { error: 'Error al generar el briefing SPIM' },
      { status: 500 }
    )
  }
}

// ─── GET Handler (quick status) ──────────────────────────────────

export async function GET() {
  try {
    const notams = await fetchNotams('SPIM')
    const urgent = notams.filter((n) => n.priority === 'URGENT').length
    const high = notams.filter((n) => n.priority === 'HIGH').length

    return NextResponse.json({
      fir: 'SPIM',
      notamCount: notams.length,
      urgentCount: urgent,
      highCount: high,
      status: 'online',
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener estado SPIM' },
      { status: 500 }
    )
  }
}
