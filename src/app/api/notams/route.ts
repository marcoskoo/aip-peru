import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { fetchLiveNotams, type NormalizedNotam } from '@/lib/aviation/faa-notams'
import { notExpiredFilter } from '@/lib/aviation/notam-filter'

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
 * Aplica filtros in-memory a una lista de NOTAMs (usado para los resultados
 * en vivo de la FAA, ya que no podemos hacer queries SQL sobre ellos).
 */
function applyFilters(
  list: NotamRow[],
  opts: {
    search: string
    scope: string
    priority: string
    active: boolean
    airportId: string | null
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
    // Para FAA live, airportId no aplica directamente porque no hay DB ID,
    // pero si el usuario seleccionó un aeródromo, ya filtramos por su ICAO
    // al hacer la llamada a la FAA. Aquí solo aceptamos los que tienen
    // airport.icaoCode == el ICAO del aeródromo seleccionado.
    result = result.filter((n) => n.airport !== null)
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
    // Nuevos filtros solicitados:
    //   qCode       → filtra por código Q (e.g. "QFALC", "QWLLW"). Acepta coincidencia parcial.
    //   locationA   → filtra por designador de lugar del campo A) (e.g. "SPJC", "SPIM").
    //   validity    → "PERM" | "EST" | "FINITE" filtra por tipo de vigencia.
    //   textE       → filtra por texto dentro de la casilla E) (búsqueda contains).
    const qCode = searchParams.get('qCode')?.trim() || ''
    const locationA = searchParams.get('locationA')?.trim().toUpperCase() || ''
    const validity = searchParams.get('validity')?.trim().toUpperCase() || ''
    const textE = searchParams.get('textE')?.trim() || ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    // ── 1) Intentar primero la base de datos local ───────────────────────
    // Si la DB tiene NOTAMs (pipeline email IMAP activo), se usan esos.
    // Si está vacía, hacemos fallback a la FAA en vivo.
    const dbCount = await db.notam.count({ where: { fir } })

    if (dbCount > 0) {
      // Build where clause
      const where: Record<string, unknown> = { fir }
      const andParts: Record<string, unknown>[] = []

      if (search) {
        where.OR = [
          { notamId: { contains: search } },
          { text: { contains: search } },
          { subject: { contains: search } },
          { condition: { contains: search } },
        ]
      }
      if (scope) where.scope = scope
      if (priority) where.priority = priority
      if (airportId) where.airportId = airportId

      // ── Filtro por código Q (coincidencia parcial, case-insensitive) ──
      if (qCode) {
        const q = qCode.toUpperCase()
        andParts.push({
          OR: [
            { qCode: { equals: q } },
            { qCode: { contains: q } },
            // Fallback: buscar en el texto si qCode está vacío (NOTAMs viejos)
            { text: { contains: `Q) SPIM/${q}` } },
          ],
        })
      }

      // ── Filtro por designador de lugar (campo A) ──
      if (locationA) {
        andParts.push({
          OR: [
            { locationA: { equals: locationA } },
            // Fallback en texto: "A) SPJC"
            { text: { contains: `A) ${locationA}` } },
          ],
        })
      }

      // ── Filtro por tipo de vigencia ──
      if (validity === 'PERM') {
        andParts.push({ isPermanent: true })
      } else if (validity === 'EST') {
        // EST: NO es permanente Y el texto contiene "EST" en el campo C)
        andParts.push({
          isPermanent: false,
          text: { contains: 'EST' },
        })
      } else if (validity === 'FINITE') {
        // Vigencia finita (no PERM, no EST): tiene effectiveTo y no es PERM
        andParts.push({
          isPermanent: false,
          effectiveTo: { not: null },
        })
      }

      // ── Filtro por texto de la casilla E) ──
      if (textE) {
        // Búsqueda contains case-insensitive en el campo text.
        // El campo E) está embebido en text; usamos contains para buscarlo.
        andParts.push({ text: { contains: textE } })
      }

      if (andParts.length > 0) {
        where.AND = andParts
      }

      const now = new Date()

      if (active === 'true') {
        // Filtro "no expirado": incluye activos + próximos (upcoming) + permanentes.
        // Excluye solo los NOTAMs cuya fecha de fin ya pasó.
        // Esto resuelve la inconsistencia donde el listado mostraba menos NOTAMs
        // de los que el usuario esperaba (los "upcoming" estaban siendo ocultos
        // por el filtro `effectiveFrom <= now` anterior).
        where.AND = [
          ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
          notExpiredFilter(now),
        ]
      }

      const total = await db.notam.count({ where })

      // activeWhere usa el mismo filtro "no expirado" para que el conteo
      // activeStats sea consistente con el listado devuelto (where + active=true).
      const activeWhere = {
        fir,
        AND: [notExpiredFilter(now)],
      }

      const [activeTotal, activeUrgent, activeHigh] = await Promise.all([
        db.notam.count({ where: activeWhere }),
        db.notam.count({ where: { ...activeWhere, priority: 'URGENT' } }),
        db.notam.count({ where: { ...activeWhere, priority: 'HIGH' } }),
      ])

      const includeAirport = !!airportId

      const notams = await db.notam.findMany({
        where,
        include: {
          airport: includeAirport
            ? { select: { id: true, icaoCode: true, name: true, city: true } }
            : { select: { icaoCode: true, name: true } },
        },
        orderBy: [{ effectiveFrom: 'desc' }],
        take: limit,
        skip: offset,
      })

      notams.sort((a, b) => {
        const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
      })

      return NextResponse.json({
        notams,
        total,
        activeStats: {
          total: activeTotal,
          urgent: activeUrgent,
          high: activeHigh,
        },
        source: 'database',
      })
    }

    // ── 2) Fallback: FAA USNS en vivo ───────────────────────────────────
    // La DB está vacía — consultamos la FAA directamente.
    // Si airportId está seteado, resolvemos el ICAO y consultamos solo ese.
    let airportIcao: string | undefined
    if (airportId) {
      const airport = await db.airport.findUnique({
        where: { id: airportId },
        select: { icaoCode: true },
      })
      airportIcao = airport?.icaoCode
    }

    const liveNotams = await fetchLiveNotams(airportIcao, fir)

    // Convertir a NotamRow (mismo formato que devolvería Prisma)
    let rows: NotamRow[] = liveNotams.map((n: NormalizedNotam) => ({
      ...n,
      source: n.source || 'FAA USNS (live)',
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))

    // Aplicar filtros en memoria
    rows = applyFilters(rows, {
      search,
      scope,
      priority,
      active: active === 'true',
      airportId,
    })

    // Ordenar y paginar
    rows = sortByPriority(rows)
    const total = rows.length
    const paged = rows.slice(offset, offset + limit)

    return NextResponse.json({
      notams: paged,
      total,
      activeStats: computeActiveStats(rows),
      source: 'faa-live',
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
