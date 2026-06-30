import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { fetchLiveNotams, type NormalizedNotam } from '@/lib/aviation/faa-notams'
import { notExpiredFilter } from '@/lib/aviation/notam-filter'
import { requireAdmin } from '@/lib/auth'
import { prismaLikelyAvailable } from '@/lib/static-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Priority order mapping for sorting
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

interface NotamRow {
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
  airportId: string | null
  priority: string
  source: string | null
  verified: boolean
  airport: { icaoCode: string; name: string; city: string | null } | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Aplica TODOS los filtros in-memory a una lista combinada de NOTAMs
 * (FAA live + DB supplement). El texto crudo nunca se modifica — los
 * filtros solo deciden qué NOTAMs mostrar/ocultar.
 */
function applyFilters(
  list: NotamRow[],
  opts: {
    search: string
    scope: string
    priority: string
    active: boolean
    airportId: string | null
    qCode: string
    locationA: string
    validity: string
    textE: string
  }
): NotamRow[] {
  let result = list
  const now = new Date()

  if (opts.active) {
    result = result.filter((n) => {
      if (n.isPermanent) return true
      if (!n.effectiveTo) return true
      return n.effectiveTo >= now
    })
  }

  if (opts.search) {
    const s = opts.search.toLowerCase()
    result = result.filter((n) =>
      n.notamId.toLowerCase().includes(s) ||
      n.text.toLowerCase().includes(s) ||
      n.subject.toLowerCase().includes(s) ||
      n.condition.toLowerCase().includes(s)
    )
  }

  if (opts.scope) {
    result = result.filter((n) => n.scope === opts.scope)
  }

  if (opts.priority) {
    result = result.filter((n) => n.priority === opts.priority)
  }

  if (opts.airportId) {
    result = result.filter((n) => n.airport !== null)
  }

  // ── Filtro por código Q (coincidencia parcial, case-insensitive) ──
  if (opts.qCode) {
    const q = opts.qCode.toUpperCase()
    result = result.filter((n) => {
      const nq = (n as { qCode?: string | null }).qCode
      if (nq && nq.toUpperCase().includes(q)) return true
      // Fallback: buscar "Q) SPIM/<qcode>" en el texto crudo
      return n.text.toUpperCase().includes(`Q)${q}`) ||
             n.text.toUpperCase().includes(`Q) ${q}`) ||
             n.text.toUpperCase().includes(`/${q}/`) ||
             n.text.toUpperCase().includes(`/${q} `)
    })
  }

  // ── Filtro por designador de lugar (campo A) ──
  if (opts.locationA) {
    const loc = opts.locationA.toUpperCase()
    result = result.filter((n) => {
      const nloc = (n as { locationA?: string | null }).locationA
      if (nloc && nloc.toUpperCase() === loc) return true
      // Fallback: "A) SPJC" en el texto crudo
      return n.text.toUpperCase().includes(`A)${loc}`) ||
             n.text.toUpperCase().includes(`A) ${loc}`)
    })
  }

  // ── Filtro por tipo de vigencia ──
  if (opts.validity === 'PERM') {
    result = result.filter((n) => n.isPermanent)
  } else if (opts.validity === 'EST') {
    result = result.filter((n) => !n.isPermanent && /\bEST\b/i.test(n.text))
  } else if (opts.validity === 'FINITE') {
    result = result.filter((n) => !n.isPermanent && n.effectiveTo !== null)
  }

  // ── Filtro por texto de la casilla E) ──
  if (opts.textE) {
    const te = opts.textE.toLowerCase()
    result = result.filter((n) => n.text.toLowerCase().includes(te))
  }

  return result
}

function sortByPriority(list: NotamRow[]): NotamRow[] {
  return list.sort((a, b) => {
    const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  })
}

function computeActiveStats(list: NotamRow[]) {
  const now = new Date()
  const active = list.filter((n) => {
    if (n.isPermanent) return true
    if (!n.effectiveTo) return true
    return n.effectiveTo >= now
  })
  return {
    total: active.length,
    urgent: active.filter((n) => n.priority === 'URGENT').length,
    high: active.filter((n) => n.priority === 'HIGH').length,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const scope = searchParams.get('scope')?.trim() || ''
    const priority = searchParams.get('priority')?.trim() || ''
    const fir = searchParams.get('fir')?.trim() || 'SPIM'
    const airportId = searchParams.get('airportId')?.trim() || ''
    const active = searchParams.get('active')?.trim() || ''
    const qCode = searchParams.get('qCode')?.trim() || ''
    const locationA = searchParams.get('locationA')?.trim().toUpperCase() || ''
    const validity = searchParams.get('validity')?.trim().toUpperCase() || ''
    const textE = searchParams.get('textE')?.trim() || ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    // ══════════════════════════════════════════════════════════════════
    // ESTRATEGIA: FAA USNS EN VIVO ES LA FUENTE PRIMARIA
    //
    // Los NOTAMs deben ser REALES y presentarse en formato crudo OACI,
    // sin interpretación del sistema. La API pública de la FAA devuelve
    // NOTAMs internacionales (incluyendo FIR SPIM y todos los aeropuertos
    // peruanos) con el texto OACI completo en el campo `icaoMessage`.
    //
    // La base de datos local se usa SOLO como suplemento para NOTAMs
    // reales ingresados manualmente por un administrador (p.ej. pegados
    // desde correos de AIS Perú). Estos se mezclan con los de la FAA,
    // deduplicando por notamId.
    // ══════════════════════════════════════════════════════════════════

    // Resolver airportId → ICAO si se especificó
    let airportIcao: string | undefined
    if (airportId && prismaLikelyAvailable()) {
      try {
        const airport = await db.airport.findUnique({
          where: { id: airportId },
          select: { icaoCode: true },
        })
        airportIcao = airport?.icaoCode
      } catch (error) {
        console.warn('[api/notams] Prisma airport lookup failed:', error)
      }
    }

    // ── 1) FAA live (PRIMARIO — NOTAMs reales y actuales) ──────────
    let liveNotams: NormalizedNotam[] = []
    try {
      liveNotams = await fetchLiveNotams(airportIcao, fir)
    } catch (e) {
      console.error('FAA live fetch failed:', e)
    }

    // ── 2) DB supplement (NOTAMs reales ingresados manualmente) ────
    // Solo se incluyen NOTAMs de la DB que NO estén ya en los resultados
    // de la FAA (dedup por notamId).
    // Solo si Prisma está disponible (sandbox / DB de producción).
    const liveIds = new Set(liveNotams.map((n) => n.notamId))
    const dbWhere: Record<string, unknown> = { fir }
    if (airportId) dbWhere.airportId = airportId

    let dbNotams: NotamRow[] = []
    if (prismaLikelyAvailable()) {
      try {
        const rows = liveIds.size > 0
          ? await db.notam.findMany({
              where: {
                ...dbWhere,
                NOT: { notamId: { in: Array.from(liveIds) } },
              },
              include: {
                airport: { select: { icaoCode: true, name: true, city: true } },
              },
              orderBy: [{ effectiveFrom: 'desc' }],
              take: 200,
            })
          : await db.notam.findMany({
              where: dbWhere,
              include: {
                airport: { select: { icaoCode: true, name: true, city: true } },
              },
              orderBy: [{ effectiveFrom: 'desc' }],
              take: 200,
            })
        dbNotams = rows as unknown as NotamRow[]
      } catch (error) {
        console.warn('[api/notams] Prisma notam query failed:', error)
      }
    }

    // ── 3) Merge: FAA live primero, luego DB-only ──────────────────
    const rows: NotamRow[] = [
      ...liveNotams.map((n: NormalizedNotam) => ({
        ...n,
        source: n.source || 'FAA USNS (live)',
      })),
      ...dbNotams.map((n) => ({
        ...n,
        source: n.source || 'AIS Perú (manual)',
      })) as NotamRow[],
    ]

    // ── 4) Aplicar filtros in-memory sobre la lista combinada ──────
    const filtered = applyFilters(rows, {
      search,
      scope,
      priority,
      active: active === 'true',
      airportId,
      qCode,
      locationA,
      validity,
      textE,
    })

    // ── 5) Ordenar y paginar ───────────────────────────────────────
    const sorted = sortByPriority(filtered)
    const total = sorted.length
    const paged = sorted.slice(offset, offset + limit)

    const sourceLabel =
      liveNotams.length > 0 && dbNotams.length > 0
        ? 'faa-live+manual'
        : liveNotams.length > 0
          ? 'faa-live'
          : dbNotams.length > 0
            ? 'database'
            : 'empty'

    return NextResponse.json({
      notams: paged,
      total,
      activeStats: computeActiveStats(sorted),
      source: sourceLabel,
      liveCount: liveNotams.length,
      dbCount: dbNotams.length,
    })
  } catch (error) {
    console.error('Error fetching NOTAMs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NOTAMs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['notamId', 'fir', 'effectiveFrom', 'subject', 'condition', 'text']
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse effectiveFrom
    const effectiveFrom = new Date(body.effectiveFrom)
    if (isNaN(effectiveFrom.getTime())) {
      return NextResponse.json(
        { error: 'Invalid effectiveFrom date' },
        { status: 400 }
      )
    }

    // Parse effectiveTo if provided
    let effectiveTo: Date | null = null
    if (body.effectiveTo) {
      effectiveTo = new Date(body.effectiveTo)
      if (isNaN(effectiveTo.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effectiveTo date' },
          { status: 400 }
        )
      }
    }

    const notam = await db.notam.create({
      data: {
        notamId: body.notamId,
        type: body.type || 'NOTAM',
        replacesId: body.replacesId || null,
        fir: body.fir,
        effectiveFrom,
        effectiveTo,
        isPermanent: body.isPermanent ?? !body.effectiveTo,
        scope: body.scope || null,
        subject: body.subject,
        condition: body.condition,
        text: body.text,
        coordinates: body.coordinates || null,
        lat: body.lat || null,
        lon: body.lon || null,
        radius: body.radius || null,
        lowerLimit: body.lowerLimit || null,
        upperLimit: body.upperLimit || null,
        airportId: body.airportId || null,
        priority: body.priority || 'MEDIUM',
        source: body.source || null,
        verified: body.verified ?? false,
      },
      include: {
        airport: body.airportId
          ? { select: { id: true, icaoCode: true, name: true, city: true } }
          : { select: { icaoCode: true, name: true } },
      },
    })

    return NextResponse.json(notam, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating NOTAM:', error)

    // Handle unique constraint violation (duplicate notamId)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A NOTAM with this ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create NOTAM' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Eliminar todos los NOTAMs (o filtrados por fir) ───────────────
//
// Query params:
//   ?fir=SPIM  → FIR a limpiar (default: SPIM)
//
// Respuesta:
//   { "ok": true, "deleted": 138, "fir": "SPIM" }
//
// Caso de uso: el usuario pegó un boletín de 138 NOTAMs dos veces y quiere
// empezar limpio para evitar duplicados antes de re-pegar.
export async function DELETE(request: NextRequest) {
  try {
    // ── Require admin authentication ────────────────────────────────
    // Only authenticated admins can delete all NOTAMs.
    const session = await requireAdmin()
    if (session instanceof Response) return session

    const { searchParams } = request.nextUrl
    const fir = searchParams.get('fir')?.trim() || 'SPIM'

    const result = await db.notam.deleteMany({ where: { fir } })

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      fir,
    })
  } catch (error) {
    console.error('Error deleting all NOTAMs:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { ok: false, error: `Error al eliminar NOTAMs: ${msg}` },
      { status: 500 }
    )
  }
}
