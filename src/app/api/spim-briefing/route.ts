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
        // Incluye vigentes + próximos (para planificación de vuelo)
        OR: [
          { effectiveTo: { gte: now } },
          { isPermanent: true },
          // Próximos NOTAMs (effectiveFrom > now) pero que aún no expiran
          {
            AND: [
              { effectiveFrom: { gt: now } },
              { effectiveTo: { gte: now } },
            ],
          },
        ],
      },
      include: {
        airport: {
          select: { icaoCode: true, name: true, city: true },
        },
      },
      orderBy: [{ effectiveFrom: 'desc' }],
      take: 100, // ampliamos para que el sort por urgencia tenga material
    })

    // Sort compuesto:
    //  1. Expirados al fondo (no deberían venir por el where, pero por si acaso)
    //  2. Próximos después de los activos
    //  3. PERM después de los finitos
    //  4. Entre dos finitos: el que expira antes va primero (más urgente)
    //  5. Tie-break por prioridad y luego por fecha de emisión
    const priorityOrder: Record<string, number> = {
      URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1,
    }
    notams.sort((a, b) => {
      const nowMs = Date.now()
      const sa = notamStatus(a.effectiveFrom, a.effectiveTo, a.isPermanent)
      const sb = notamStatus(b.effectiveFrom, b.effectiveTo, b.isPermanent)
      // Expirados al fondo
      if (sa === 'expired' && sb !== 'expired') return 1
      if (sb === 'expired' && sa !== 'expired') return -1
      // Próximos después de los activos
      if (sa === 'upcoming' && sb !== 'upcoming') return 1
      if (sb === 'upcoming' && sa !== 'upcoming') return -1
      // PERM después de los finitos
      const aPerm = a.isPermanent || !a.effectiveTo
      const bPerm = b.isPermanent || !b.effectiveTo
      if (aPerm && !bPerm) return 1
      if (bPerm && !aPerm) return -1
      // Entre dos finitos: el que expira antes va primero (más urgente)
      const ta = aPerm ? Number.MAX_SAFE_INTEGER : a.effectiveTo!.getTime() - nowMs
      const tb = bPerm ? Number.MAX_SAFE_INTEGER : b.effectiveTo!.getTime() - nowMs
      if (ta !== tb) return ta - tb
      // Tie-break por prioridad
      const pa = priorityOrder[a.priority] || 0
      const pb = priorityOrder[b.priority] || 0
      if (pa !== pb) return pb - pa
      // Tie-break final: más reciente primero
      return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    })

    return notams.slice(0, 50)
  } catch (error) {
    console.error('Error fetching NOTAMs:', error)
    return []
  }
}

function notamStatus(
  effectiveFrom: Date,
  effectiveTo: Date | null,
  isPermanent: boolean,
): 'upcoming' | 'active' | 'expired' | 'unknown' {
  if (isPermanent) return 'active'
  if (!effectiveTo) return 'unknown'
  const now = Date.now()
  if (effectiveTo.getTime() < now) return 'expired'
  if (effectiveFrom.getTime() > now) return 'upcoming'
  return 'active'
}

// ─── LLM Briefing Generation ────────────────────────────────────

async function generateBriefing(weather: unknown, notams: unknown[]): Promise<string> {
  const weatherStr = weather
    ? JSON.stringify(weather, null, 2).slice(0, 3000)
    : 'Datos meteorológicos no disponibles'

  const notamsStr = notams.length > 0
    ? notams
        .slice(0, 30)
        .map((n: Record<string, unknown>) => {
          const isPerm = n.isPermanent
          const validTo = n.effectiveTo
            ? isPerm
              ? 'PERM'
              : new Date(n.effectiveTo as string).toISOString()
            : '?'
          return `- [${n.priority || 'N/A'}] ${n.notamId || 'SIN-ID'} (hasta: ${validTo}): ${(n.subject as string) || ''} ${(n.condition as string) || ''}`
        })
        .join('\n')
    : 'No hay NOTAMs activos'

  const systemPrompt = `Eres un Agente IA especializado en aviación civil, integrado en el sistema AIP PERÚ de CORPAC.
Tu función es generar BRIEFINGS operacionales para la FIR Lima (SPIM), analizando datos de NOTAM, METAR y TAF.

Debes responder en ESPAÑOL, con un tono profesional y conciso, como un oficial AIS brevemente un piloto.

Estructura OBLIGATORIA del briefing:
1. **RESUMEN EJECUTIVO** (2-3 líneas): Estado general de la FIR Lima
2. **METEOROLOGÍA** (SPIM): Análisis del METAR actual y pronóstico TAF, categorías de vuelo, fenómenos significativos
3. **NOTAMs CRÍTICOS**: Solo los más relevantes (urgentes, alta prioridad, o que afecten rutas/pistas). Indica cuánto tiempo les falta expirar si es relevante.
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

    // Serializar NOTAMs con fechas ISO (para el countdown del frontend)
    const notamsSerialized = notams.map((n) => ({
      id: n.id,
      notamId: n.notamId,
      type: n.type,
      replacesId: n.replacesId,
      fir: n.fir,
      effectiveFrom: n.effectiveFrom.toISOString(),
      effectiveTo: n.effectiveTo?.toISOString() ?? null,
      isPermanent: n.isPermanent,
      scope: n.scope,
      subject: n.subject,
      condition: n.condition,
      text: n.text,
      priority: n.priority,
      source: n.source,
      verified: n.verified,
      airport: n.airport
        ? {
            icaoCode: n.airport.icaoCode,
            name: n.airport.name,
            city: n.airport.city,
          }
        : null,
    }))

    return NextResponse.json({
      briefing,
      weather,
      notams: notamsSerialized.slice(0, 30),
      notamCount: notams.length,
      generatedAt: new Date().toISOString(),
      source: 'Agente IA SPIM',
    })
  } catch (error) {
    console.error('Error in SPIM briefing:', error)
    return NextResponse.json(
      { error: 'Error al generar el briefing SPIM' },
      { status: 500 },
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
      { status: 500 },
    )
  }
}
