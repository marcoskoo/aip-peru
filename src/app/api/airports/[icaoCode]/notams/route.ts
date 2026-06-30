import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { notamStatus } from '@/lib/aviation/notam-parser'
import { notExpiredFilter } from '@/lib/aviation/notam-filter'
import { fetchLiveNotams, type NormalizedNotam } from '@/lib/aviation/faa-notams'
import { prismaLikelyAvailable } from '@/lib/static-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── NOTAM Structured Parser (campos Q/A/B/C/D/E) ────────────────────
// Replica mínima del parser usado en /api/spim-agent/station/[icao]/route.ts
// NOTA: Este parser SOLO extrae los campos OACI del texto crudo para mostrarlos
//       de forma estructurada. NO interpreta, NO resume, NO genera texto nuevo.
//       El texto original siempre se entrega intacto en el campo `text`.

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

    // Resolver aeropuerto en la BD (solo si Prisma está disponible)
    let airport: { id: string; icaoCode: string; name: string; city: string | null } | null = null
    try {
      if (prismaLikelyAvailable()) {
        airport = await db.airport.findUnique({
          where: { icaoCode: code },
          select: { id: true, icaoCode: true, name: true, city: true },
        })
      }
    } catch (error) {
      console.warn(`[api/airports/${code}/notams] Prisma airport lookup failed:`, error)
    }

    // ══════════════════════════════════════════════════════════════════
    // ESTRATEGIA: FAA USNS EN VIVO ES LA FUENTE PRIMARIA
    //
    // Los NOTAMs deben ser REALES — la API pública de la FAA devuelve
    // NOTAMs OACI completos para cualquier aeropuerto peruano.
    // La DB se usa solo como suplemento para NOTAMs reales ingresados
    // manualmente por admin (p.ej. pegados desde correos de AIS Perú).
    // ══════════════════════════════════════════════════════════════════

    // ── 1) FAA live (PRIMARIO — NOTAMs reales y actuales) ──────────
    let liveNotams: NormalizedNotam[] = []
    try {
      liveNotams = await fetchLiveNotams(code, 'SPIM')
    } catch (e) {
      console.error(`FAA live fetch failed for ${code}:`, e)
    }

    // ── 2) DB supplement (NOTAMs reales manuales, no duplicados) ───
    const liveIds = new Set(liveNotams.map((n) => n.notamId))
    let dbNotams: Array<{
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
    }> = []

    if (airport && prismaLikelyAvailable()) {
      try {
        const dbWhere = {
          AND: [
            {
              OR: [
                { airportId: airport.id },
                { fir: 'SPIM', airportId: null, text: { contains: code } },
              ],
            },
            notExpiredFilter(now),
            ...(liveIds.size > 0
              ? [{ NOT: { notamId: { in: Array.from(liveIds) } } }]
              : []),
          ],
        }

        dbNotams = await db.notam.findMany({
          where: dbWhere,
          include: {
            airport: { select: { icaoCode: true, name: true, city: true } },
          },
          orderBy: [{ effectiveFrom: 'desc' }],
          take: 100,
        })
      } catch (error) {
        console.warn(`[api/airports/${code}/notams] Prisma notam query failed:`, error)
      }
    }

    // ── 3) Merge: FAA live primero, luego DB-only ──────────────────
    const merged: Array<{
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
    }> = [
      ...liveNotams.map((n) => ({
        id: n.id,
        notamId: n.notamId,
        type: n.type,
        replacesId: n.replacesId,
        fir: n.fir,
        effectiveFrom: n.effectiveFrom,
        effectiveTo: n.effectiveTo,
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
      })),
      ...dbNotams,
    ]

    const notams = merged.map(toStructured)

    return NextResponse.json({
      airportIcaoCode: code,
      notams,
      total: notams.length,
      active: notams.filter((n) => n.status === 'active' || n.status === 'perm').length,
      upcoming: notams.filter((n) => n.status === 'upcoming').length,
      source:
        liveNotams.length > 0 && dbNotams.length > 0
          ? 'faa-live+manual'
          : liveNotams.length > 0
            ? 'faa-live'
            : dbNotams.length > 0
              ? 'database'
              : 'empty',
      liveCount: liveNotams.length,
      dbCount: dbNotams.length,
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
