import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseNotams, type ParsedNotam } from '@/lib/aviation/notam-parser'
import { PERUVIAN_ICAOS } from '@/lib/aviation/peru-stations'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

    // 3. Insertar/upsertar cada NOTAM en Prisma.
    //    Usamos findUnique + create/update para que si el notamId ya existe,
    //    lo actualicemos en lugar de fallar (comportamiento idempotente).
    let inserted = 0
    let skipped = 0
    const errors: string[] = []
    const items: Array<{
      notamId: string
      icao: string
      validFrom: string | null
      validTo: string | null
      summary: string
      action: 'created' | 'updated' | 'skipped'
    }> = []

    for (const n of parsed) {
      try {
        // Validaciones mínimas
        if (!PERUVIAN_ICAOS.has(n.icao)) {
          skipped++
          errors.push(`${n.notam_id}: ICAO ${n.icao} no es peruano (FIR SPIM).`)
          continue
        }
        if (!n.valid_from) {
          skipped++
          errors.push(`${n.notam_id}: fecha B) (effectiveFrom) inválida o ausente.`)
          continue
        }

        const effectiveFrom = new Date(n.valid_from)
        if (Number.isNaN(effectiveFrom.getTime())) {
          skipped++
          errors.push(`${n.notam_id}: effectiveFrom no es una fecha válida.`)
          continue
        }

        const isPerm = n.valid_to === 'PERM'
        const effectiveTo =
          isPerm || !n.valid_to ? null : new Date(n.valid_to)
        if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
          skipped++
          errors.push(`${n.notam_id}: effectiveTo no es una fecha válida.`)
          continue
        }

        // Inferir subject/condition/scope desde la clasificación Q)
        const subject = inferSubject(n.classification)
        const condition = inferCondition(n.summary)
        const scope = inferScope(n.classification)
        const priority = inferPriority(n)

        const existing = await db.notam.findUnique({
          where: { notamId: n.notam_id },
          select: { id: true },
        })

        if (existing) {
          // Actualizar el existente (el texto puede haber sido corregido)
          await db.notam.update({
            where: { id: existing.id },
            data: {
              type: n.notam_type,
              replacesId: n.ref_notam_id ?? null,
              fir: 'SPIM',
              effectiveFrom,
              effectiveTo,
              isPermanent: isPerm,
              scope,
              subject,
              condition,
              text: n.message,
              source: 'CORPAC-AIS-MANUAL',
              verified: true,
              priority,
              airportId: airportByIcao.get(n.icao) ?? null,
            },
          })
          inserted++
          items.push({
            notamId: n.notam_id,
            icao: n.icao,
            validFrom: n.valid_from,
            validTo: n.valid_to,
            summary: n.summary,
            action: 'updated',
          })
        } else {
          await db.notam.create({
            data: {
              notamId: n.notam_id,
              type: n.notam_type,
              replacesId: n.ref_notam_id ?? null,
              fir: 'SPIM',
              effectiveFrom,
              effectiveTo,
              isPermanent: isPerm,
              scope,
              subject,
              condition,
              text: n.message,
              source: 'CORPAC-AIS-MANUAL',
              verified: true,
              priority,
              airportId: airportByIcao.get(n.icao) ?? null,
            },
          })
          inserted++
          items.push({
            notamId: n.notam_id,
            icao: n.icao,
            validFrom: n.valid_from,
            validTo: n.valid_to,
            summary: n.summary,
            action: 'created',
          })
        }
      } catch (err) {
        skipped++
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${n.notam_id}: ${msg}`)
      }
    }

    return NextResponse.json({
      ok: true,
      inserted,
      skipped,
      errors,
      items,
      parsedTotal: parsed.length,
    })
  } catch (error) {
    console.error('Error in NOTAM ingest:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno al procesar NOTAMs' },
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
