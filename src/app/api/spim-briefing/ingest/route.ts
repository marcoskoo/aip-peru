import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseNotams, type ParsedNotam } from '@/lib/aviation/notam-parser'
import { PERUVIAN_ICAOS } from '@/lib/aviation/peru-stations'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
// Vercel: allow larger response bodies for 141+ NOTAMs
export const fetchCache = 'force-no-store'

/**
 * POST /api/spim-briefing/ingest
 *
 * Recibe texto plano con NOTAMs (pegado manualmente desde el portal AIS Perú
 * o desde un email del boletín NOTAM) y los inserta en la base de datos
 * (Prisma + PostgreSQL), deduplicando por notamId.
 *
 * Body:
 *   { "text": "A1234/25 NOTAMN\nQ) SPIM/QFALC/...\nA) SPJC\n..." }
 *
 * Response:
 *   {
 *     "ok": true,
 *     "inserted": 3,
 *     "skipped": 1,
 *     "errors": [],
 *     "items": [ { notamId, icao, validFrom, validTo, summary } ]
 *   }
 *
 * Performance note:
 *   El pipeline anterior hacía findUnique+create por cada NOTAM (282 queries
 *   para 141 NOTAMs) y timeout en Vercel serverless (maxDuration=30). Ahora
 *   usamos createMany+skipDuplicates en bloque y updateMany por chunks, lo que
 *   reduce de ~30s a ~2s para 141 NOTAMs.
 */
interface IngestBody {
  text?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body: IngestBody = await request.json().catch(() => ({}))
    const text = typeof body.text === 'string' ? body.text : ''

    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Texto vacío. Pega el contenido del NOTAM.' },
        { status: 400 },
      )
    }

    // 1. Parsear el texto con el parser OACI (espejo del Python)
    const parsed = parseNotams(text, 'manual-ingest-spim')

    if (parsed.length === 0) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        skipped: 0,
        errors: ['No se detectaron NOTAMs OACI válidos en el texto proporcionado.'],
        items: [],
      })
    }

    // 2. Resolver airportId (si existe un Airport con ese ICAO)
    const icaosInParsed = Array.from(new Set(parsed.map((n) => n.icao)))
    const airports = await db.airport.findMany({
      where: { icaoCode: { in: icaosInParsed } },
      select: { id: true, icaoCode: true },
    })
    const airportByIcao = new Map(airports.map((a) => [a.icaoCode, a.id]))

    // 3. Filtrar NOTAMs inválidos ANTES de tocar la DB (CPU-only).
    //    Esto evita hacer queries para NOTAMs que vamos a rechazar igual.
    const errors: string[] = []
    const skippedPre = { count: 0 }

    const validNotams: Array<ParsedNotam & {
      effectiveFrom: Date
      effectiveTo: Date | null
      isPerm: boolean
      subject: string
      condition: string
      scope: string
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    }> = []

    for (const n of parsed) {
      // Validaciones mínimas
      if (!PERUVIAN_ICAOS.has(n.icao)) {
        skippedPre.count++
        errors.push(`${n.notam_id}: ICAO ${n.icao} no es peruano (FIR SPIM).`)
        continue
      }
      if (!n.valid_from) {
        skippedPre.count++
        errors.push(`${n.notam_id}: fecha B) (effectiveFrom) inválida o ausente.`)
        continue
      }

      const effectiveFrom = new Date(n.valid_from)
      if (Number.isNaN(effectiveFrom.getTime())) {
        skippedPre.count++
        errors.push(`${n.notam_id}: effectiveFrom no es una fecha válida.`)
        continue
      }

      const isPerm = n.valid_to === 'PERM'
      const effectiveTo = isPerm || !n.valid_to ? null : new Date(n.valid_to)
      if (!isPerm && n.valid_to && effectiveTo && Number.isNaN(effectiveTo.getTime())) {
        skippedPre.count++
        errors.push(`${n.notam_id}: effectiveTo no es una fecha válida.`)
        continue
      }

      // Inferir subject/condition/scope desde la clasificación Q)
      const subject = inferSubject(n.classification)
      const condition = inferCondition(n.summary)
      const scope = inferScope(n.classification)
      const priority = inferPriority(n)

      validNotams.push({
        ...n,
        effectiveFrom,
        effectiveTo,
        isPerm,
        subject,
        condition,
        scope,
        priority,
      })
    }

    if (validNotams.length === 0) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        skipped: skippedPre.count,
        errors,
        items: [],
        parsedTotal: parsed.length,
      })
    }

    // 4. Bulk fetch de IDs ya existentes — UNA sola query en vez de N.
    const allIds = validNotams.map((n) => n.notam_id)
    const existing = await db.notam.findMany({
      where: { notamId: { in: allIds } },
      select: { notamId: true, id: true },
    })
    const existingIds = new Set(existing.map((e) => e.notamId))

    // 5. Dividir en "a crear" y "a actualizar"
    const toCreate = validNotams.filter((n) => !existingIds.has(n.notam_id))
    const toUpdate = validNotams.filter((n) => existingIds.has(n.notam_id))

    // 6. Bulk CREATE con skipDuplicates (una sola query SQL INSERT ... ON CONFLICT DO NOTHING)
    let created = 0
    if (toCreate.length > 0) {
      const result = await db.notam.createMany({
        data: toCreate.map((n) => ({
          notamId: n.notam_id,
          type: n.notam_type,
          replacesId: n.ref_notam_id ?? null,
          fir: 'SPIM',
          effectiveFrom: n.effectiveFrom,
          effectiveTo: n.effectiveTo,
          isPermanent: n.isPerm,
          scope: n.scope,
          subject: n.subject,
          condition: n.condition,
          text: n.message.slice(0, 8000),
          qCode: n.q_code ?? null,
          locationA: n.location_a ?? n.icao ?? null,
          source: 'CORPAC-AIS-MANUAL',
          verified: true,
          priority: n.priority,
          airportId: airportByIcao.get(n.icao) ?? null,
        })),
        skipDuplicates: true,
      })
      created = result.count
    }

    // 7. UPDATE en paralelo por chunks (para no saturar la conexión a Neon).
    //    Usamos $transaction con un lote pequeño para evitar timeouts.
    let updated = 0
    const UPDATE_CHUNK_SIZE = 10
    for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK_SIZE) {
      const chunk = toUpdate.slice(i, i + UPDATE_CHUNK_SIZE)
      const results = await Promise.allSettled(
        chunk.map((n) =>
          db.notam.update({
            where: { notamId: n.notam_id },
            data: {
              type: n.notam_type,
              replacesId: n.ref_notam_id ?? null,
              fir: 'SPIM',
              effectiveFrom: n.effectiveFrom,
              effectiveTo: n.effectiveTo,
              isPermanent: n.isPerm,
              scope: n.scope,
              subject: n.subject,
              condition: n.condition,
              text: n.message.slice(0, 8000),
              qCode: n.q_code ?? null,
              locationA: n.location_a ?? n.icao ?? null,
              source: 'CORPAC-AIS-MANUAL',
              verified: true,
              priority: n.priority,
              airportId: airportByIcao.get(n.icao) ?? null,
            },
          }),
        ),
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          updated++
        } else {
          const reason = r.reason
          errors.push(`update error: ${reason instanceof Error ? reason.message : String(reason)}`)
        }
      }
    }

    const items = validNotams.map((n) => ({
      notamId: n.notam_id,
      icao: n.icao,
      validFrom: n.valid_from,
      validTo: n.valid_to,
      summary: n.summary,
      action: (existingIds.has(n.notam_id) ? 'updated' : 'created') as
        | 'created'
        | 'updated',
    }))

    return NextResponse.json({
      ok: true,
      inserted: created + updated,
      created,
      updated,
      skipped: skippedPre.count,
      errors,
      items,
      parsedTotal: parsed.length,
    })
  } catch (error) {
    console.error('Error in NOTAM ingest:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { ok: false, error: `Error interno al procesar NOTAMs: ${msg}` },
      { status: 500 },
    )
  }
}

// ─── Helpers para inferir campos del modelo Notam desde el parser ─────────

function inferSubject(classification: string | null): string {
  if (!classification) return 'AD'
  // Q-codes típicos: QFALC (aerodrome closures), QLCAS (lighting), QMXLC (runway)
  const c = classification.toUpperCase()
  if (c.startsWith('FA')) return 'AD' // Aerodrome
  if (c.startsWith('LC')) return 'RWY' // Lighting
  if (c.startsWith('MX')) return 'RWY' // Maintenance runway
  if (c.startsWith('NL')) return 'NAV' // Navaid
  if (c.startsWith('CA')) return 'AIRSPACE' // Airspace
  if (c.startsWith('OB')) return 'OBST' // Obstacle
  if (c.startsWith('PB')) return 'PARA' // Parachute
  if (c.startsWith('UR')) return 'RES' // Rescue
  return 'AD'
}

function inferCondition(summary: string): string {
  const s = summary.toUpperCase()
  if (s.includes('CLSD') || s.includes('CLOSED') || s.includes('CERRAD')) return 'CLSD'
  if (s.includes('U/S') || s.includes('UNSERVICEABLE')) return 'U/S'
  if (s.includes('WIP') || s.includes('WORK IN PROGRESS')) return 'WIP'
  if (s.includes('ACT') || s.includes('ACTIVE')) return 'ACT'
  if (s.includes('AVBL') || s.includes('AVAILABLE')) return 'AVBL'
  return 'INFO'
}

function inferScope(classification: string | null): string {
  if (!classification) return 'A'
  const c = classification.toUpperCase()
  if (c.startsWith('FA') || c.startsWith('LC') || c.startsWith('MX')) return 'A' // Aerodrome
  if (c.startsWith('CA')) return 'E' // En-route
  if (c.startsWith('NL') || c.startsWith('OB') || c.startsWith('PB')) return 'W' // Warning
  return 'A'
}

function inferPriority(n: ParsedNotam): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const s = (n.summary || '').toUpperCase()
  // URGENT: cierres de pista, AD clausurado, falla de comunicación crítica
  if (
    s.includes('AD CLSD') ||
    s.includes('AERODROME CLOSED') ||
    s.includes('RWY CLSD') ||
    (s.includes('CLOSED') && s.includes('RWY'))
  ) {
    return 'URGENT'
  }
  // HIGH: navaids out, runway lighting, ILS failures
  if (
    s.includes('ILS') ||
    s.includes('VOR') ||
    s.includes('DME') ||
    s.includes('NDB') ||
    s.includes('U/S') ||
    s.includes('UNSERVICEABLE')
  ) {
    return 'HIGH'
  }
  // MEDIUM: WIP, obstacles, parachuting
  if (s.includes('WIP') || s.includes('OBST') || s.includes('PARA')) {
    return 'MEDIUM'
  }
  return 'LOW'
}
