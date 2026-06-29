import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { notamStatus } from '@/lib/aviation/notam-parser'
import { notExpiredFilter } from '@/lib/aviation/notam-filter'
import { fetchLiveNotams } from '@/lib/aviation/faa-notams'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── NOTAM Structured Parser (campos Q/A/B/C/D/E) ────────────────────
// Replica mínima del parser usado en /api/spim-agent/station/[icao]/route.ts

interface ParsedNotamFields {
  qCode: string | null
  fields: Record<string, string>
}

function parseNotamFields(raw: string): ParsedNotamFields {
  const qMatch = raw.match(/\bQ\)\s*([A-Z]+)/)
  const qCode = qMatch ? qMatch[1] : null
  const fields: Record<string, string> = {}
  const fieldRegex = /\b([A-E])\)\s*([^\n\r]*?)(?=\s+[A-E]\)|$)/g
  let m: RegExpExecArray | null
  while ((m = fieldRegex.exec(raw)) !== null) {
    fields[m[1]] = m[2].trim()
  }
  return { qCode, fields }
}

interface StructuredNotam {
  id: string
  notamId: string
  type: string
  replacesId: string | null
  fir: string
  effectiveFrom: string
  effectiveTo: string | null
  isPermanent: boolean
  scope: string | null
  subject: string
  condition: string
  text: string
  coordinates: string | null
  lat: number | null
  lon: number | null
  radius: number | null
  lowerLimit: string | null
  upperLimit: string | null
  priority: string
  source: string | null
  verified: boolean
  airport: { icaoCode: string; name: string; city: string | null } | null
  status: 'active' | 'upcoming' | 'expired' | 'perm'
  qCode: string | null
  fields: Record<string, string>
}

function toStructured(n: {
  id: string
  notamId: string
  type: string
  replacesId: string | null
  fir: string
  effectiveFrom: Date
  effectiveTo: Date | null
  isPermanent: boolean
  scope: string | null
  subject: string
  condition: string
  text: string
  coordinates: string | null
  lat: number | null
  lon: number | null
  radius: number | null
  lowerLimit: string | null
  upperLimit: string | null
  priority: string
  source: string | null
  verified: boolean
  airport: { icaoCode: string; name: string; city: string | null } | null
}): StructuredNotam {
  const status = notamStatus(
    n.effectiveFrom.toISOString(),
    n.effectiveTo?.toISOString() ?? (n.isPermanent ? 'PERM' : undefined)
  )
  const parsed = parseNotamFields(n.text)
  return {
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
    coordinates: n.coordinates,
    lat: n.lat,
    lon: n.lon,
    radius: n.radius,
    lowerLimit: n.lowerLimit,
    upperLimit: n.upperLimit,
    priority: n.priority,
    source: n.source,
    verified: n.verified,
    airport: n.airport,
    status: (n.isPermanent ? 'perm' : status) as StructuredNotam['status'],
    qCode: parsed.qCode,
    fields: parsed.fields,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params
    const code = icaoCode.toUpperCase()
    const now = new Date()

    // Resolver aeropuerto en la BD
    const airport = await db.airport.findUnique({
      where: { icaoCode: code },
      select: { id: true, icaoCode: true, name: true, city: true },
    })

    let notams: StructuredNotam[] = []

    if (airport) {
      // Estrategia: igual que /api/spim-agent/station/[icao]
      //   1) Si la BD tiene NOTAMs para este aeródromo, usarlos.
      //   2) Si no, consultar FAA USNS en vivo.
      const dbHasNotams =
        (await db.notam.count({
          where: {
            AND: [
              {
                OR: [
                  { airportId: airport.id },
                  { fir: 'SPIM', airportId: null, text: { contains: code } },
                ],
              },
              notExpiredFilter(now),
            ],
          },
        })) > 0

      if (dbHasNotams) {
        const dbNotams = await db.notam.findMany({
          where: {
            AND: [
              {
                OR: [
                  { airportId: airport.id },
                  { fir: 'SPIM', airportId: null, text: { contains: code } },
                ],
              },
              notExpiredFilter(now),
            ],
          },
          include: {
            airport: { select: { icaoCode: true, name: true, city: true } },
          },
          orderBy: [{ effectiveFrom: 'desc' }],
          take: 100,
        })

        notams = dbNotams.map(toStructured)
      } else {
        // Fallback FAA en vivo
        const liveNotams = await fetchLiveNotams(code, 'SPIM')
        notams = liveNotams.map(toStructured)
      }
    } else {
      // Aeropuerto no está en BD — intentar FAA en vivo igualmente
      const liveNotams = await fetchLiveNotams(code, 'SPIM')
      notams = liveNotams.map(toStructured)
    }

    return NextResponse.json({
      airportIcaoCode: code,
      notams,
      total: notams.length,
      active: notams.filter((n) => n.status === 'active' || n.status === 'perm').length,
      upcoming: notams.filter((n) => n.status === 'upcoming').length,
      source: airport ? 'database' : 'faa-live',
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching airport NOTAMs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airport NOTAMs' },
      { status: 500 }
    )
  }
}
