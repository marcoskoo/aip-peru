import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface ChatRequest {
  question: string
  weather?: unknown
  notams?: unknown[]
}

export async function POST(request: NextRequest) {
  try {
    const { question, weather, notams }: ChatRequest = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      )
    }

    const weatherStr = weather
      ? JSON.stringify(weather, null, 2).slice(0, 2000)
      : 'No disponible'

    const notamsStr =
      notams && Array.isArray(notams) && notams.length > 0
        ? notams
            .slice(0, 20)
            .map(
              (n: Record<string, unknown>) =>
                `- [${n.priority || 'N/A'}] ${n.notamId || ''}: ${(n.subject as string) || ''} ${(n.condition as string) || ''}`
            )
            .join('\n')
        : 'No hay NOTAMs activos'

    const systemPrompt = `Eres el Agente IA SPIM del sistema AIP PERÚ (CORPAC).
Respondes preguntas sobre meteorología aeronáutica (METAR/TAF) y NOTAMs de la FIR Lima.

Contexto de datos en tiempo real:
=== METAR/TAF SPIM ===
${weatherStr}

=== NOTAMs ACTIVOS ===
${notamsStr}

Instrucciones:
- Responde en ESPAÑOL, de forma concisa y profesional
- Máximo 200 palabras
- Usa los datos reales proporcionados; si no tienes dato, dilo
- Formato Markdown (negritas, listas si es necesario)`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    })

    const response =
      completion.choices[0]?.message?.content ||
      'No pude procesar tu consulta en este momento.'

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in SPIM chat:', error)
    return NextResponse.json(
      { error: 'Error al procesar la consulta' },
      { status: 500 }
    )
  }
}
