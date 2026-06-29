import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { PERUVIAN_AIRPORTS } from '@/lib/aviation/peru-airports-static'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Convierte un aeropuerto estático (PeruvianAirport) al shape que devuelve
 * Prisma (el que espera el frontend AirportListing / AerodromeSelector).
 *
 * elev en el estático está en PIES. Lo convertimos a metros para mostrar
 * ambas unidades como hace la BD ("X m / Y ft").
 */
function staticToAirportShape(a: typeof PERUVIAN_AIRPORTS[number]) {
  const elevFt = typeof a.elev === 'number' ? a.elev : 0
  const elevM = Math.round(elevFt * 0.3048)
  return {
    id: a.icao,
    icaoCode: a.icao,
    name: a.name,
    city: a.city,
    department: a.dept || '',
    elevation: `${elevM} m / ${elevFt} ft`,
    authorizedTraffic: 'IFR / VFR',
    fireCategory: '',
    category: a.cert || (a.name?.toUpperCase().includes('INTERNACIONAL') ? 'INTERNACIONAL' : 'NACIONAL'),
    arpLatitude: a.lat != null ? String(a.lat) : null,
    arpLongitude: a.lng != null ? String(a.lng) : null,
  }
}

/**
 * Aplica los filtros search/department al listado estático (case-insensitive).
 */
function filterStaticAirports(
  list: typeof PERUVIAN_AIRPORTS,
  search: string,
  department: string
) {
  const s = search.trim().toLowerCase()
  const d = department.trim().toLowerCase()
  return list.filter((a) => {
    if (d && !(a.dept || '').toLowerCase().includes(d)) return false
    if (s) {
      const hay = `${a.icao} ${a.iata || ''} ${a.name} ${a.city} ${a.short || ''}`.toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')?.trim() || ''
  const department = searchParams.get('department')?.trim() || ''

  // ─── Intento con Prisma ───────────────────────────────────────────
  // Funciona tanto para PostgreSQL (producción) como SQLite (sandbox).
  // Si la BD no está disponible o falla, caemos al listado estático
  // extraído del AIP PERÚ para que la UI nunca se rompa.
  try {
    if (process.env.DATABASE_URL) {
      const where: Record<string, unknown> = {}
      if (search) {
        // SQLite no soporta 'insensitive', lo manejamos manualmente abajo
        where.OR = [
          { city: { contains: search } },
          { name: { contains: search } },
          { icaoCode: { contains: search } },
        ]
      }
      if (department) {
        where.department = { contains: department }
      }

      const airports = await db.airport.findMany({
        where,
        select: {
          id: true,
          icaoCode: true,
          name: true,
          city: true,
          department: true,
          elevation: true,
          authorizedTraffic: true,
          fireCategory: true,
          category: true,
          arpLatitude: true,
          arpLongitude: true,
        },
        orderBy: [
          { category: 'desc' },  // INTERNACIONAL first, then NACIONAL
          { icaoCode: 'asc' },
        ],
      })

      // Filtro case-insensitive manual para SQLite (no soporta mode: 'insensitive')
      const filtered = search || department
        ? airports.filter((a) => {
            const s = search.toLowerCase()
            const d = department.toLowerCase()
            if (d && !(a.department || '').toLowerCase().includes(d)) return false
            if (s) {
              const hay = `${a.icaoCode} ${a.name} ${a.city}`.toLowerCase()
              if (!hay.includes(s)) return false
            }
            return true
          })
        : airports

      console.log(`[/api/airports] DB OK ${filtered.length} airports in ${Date.now() - startedAt}ms`)
      return NextResponse.json(filtered)
    }
    console.warn('[/api/airports] Sin DATABASE_URL, usando fallback estático')
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.warn('[/api/airports] Prisma falló, usando fallback estático:', errMsg)
  }

  // ─── Fallback estático (AIP PERÚ) ─────────────────────────────────
  const filtered = filterStaticAirports(PERUVIAN_AIRPORTS, search, department)
  const result = filtered
    .map(staticToAirportShape)
    .sort((a, b) => {
      // INTERNACIONAL primero, luego NACIONAL; dentro de cada grupo por ICAO
      const ca = a.category === 'INTERNACIONAL' ? 1 : 0
      const cb = b.category === 'INTERNACIONAL' ? 1 : 0
      if (ca !== cb) return cb - ca
      return a.icaoCode.localeCompare(b.icaoCode)
    })

  console.log(`[/api/airports] STATIC OK ${result.length} airports in ${Date.now() - startedAt}ms`)
  return NextResponse.json(result)
}
