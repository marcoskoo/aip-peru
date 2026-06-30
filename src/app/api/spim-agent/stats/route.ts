import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  PERUVIAN_ICAOS,
  PERUVIAN_STATIONS_BY_ICAO,
  type PeruvianStation,
} from '@/lib/aviation/peru-stations'
import { notExpiredFilter } from '@/lib/aviation/notam-filter'
import { fetchLiveNotams } from '@/lib/aviation/faa-notams'
import { prismaLikelyAvailable } from '@/lib/static-data'

// ─── Types ────────────────────────────────────────────────────────────

interface StationSummary {
  icao: string
  iata?: string
  name: string
  city: string
  region?: string
  type: string
  elevationFt?: number
  lat: number
  lon: number
  frequencies?: string
  notamCount: number
  hasMetar: boolean
  hasTaf: boolean
}

interface StatsResponse {
  totalStations: number
  metarCount: number
  tafCount: number
  notamCount: number
  notamSource?: string | null
  stations: StationSummary[]
  generatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Aeródromos peruanos con METAR/TAF disponible.
 * En producción, aviationweather.gov retorna datos para estaciones con OBS.
 * Lista de estaciones con servicio meteorológico (OBS) en Perú.
 */
const STATIONS_WITH_WEATHER = new Set([
  // Internacionales
  'SPJC', 'SPZO', 'SPQT', 'SPHI', 'SPQU', 'SPCL', 'SPUR', 'SPTN', 'SPTU', 'SPYL',
  // Nacionales principales con OBS
  'SPIM', 'SPJA', 'SPST', 'SPME', 'SPLO', 'SPZA', 'SPJI', 'SPJJ', 'SPJL', 'SPJR',
  'SPKI', 'SPLA', 'SPLB', 'SPLH', 'SPLN', 'SPLP', 'SPLX', 'SPMF', 'SPMS', 'SPNC',
  'SPNM', 'SPOA', 'SPON', 'SPPH', 'SPPY', 'SPQM', 'SPRU', 'SPSE', 'SPSO', 'SPUC',
  'SPUI', 'SPVN', 'SPWB', 'SPWT', 'SPYO', 'SPHY', 'SPHZ', 'SPHO', 'SPGB', 'SPGP',
  'SPBC', 'SPCM', 'SPCV', 'SPDR', 'SPDT', 'SPEE', 'SPEO', 'SPEP', 'SPAS', 'SPAY',
  'SPIN', 'SPIR', 'SPJE', 'SPAL',
])

// ─── GET Handler ──────────────────────────────────────────────────────

export async function GET() {
  try {
    const now = new Date()

    // Active NOTAMs for FIR SPIM.
    // Filtro "no expirado": incluye activos + próximos (upcoming) + permanentes.
    // Excluye solo los NOTAMs cuya fecha de fin ya pasó.
    // Esto hace que el badge del dashboard coincida con el conteo del detalle
    // de la estación (que también devuelve NOTAMs no expirados).
    const activeNotamWhere = {
      fir: 'SPIM',
      AND: [notExpiredFilter(now)],
    }

    // Map airportId → NOTAM count (from DB)
    const notamCountByAirport = new Map<string, number>()

    // Total active NOTAMs (including those without airportId — FIR-level)
    let totalActiveNotams = 0

    if (prismaLikelyAvailable()) {
      try {
        // NOTAM counts grouped by airportId
        const notamGroups = await db.notam.groupBy({
          by: ['airportId'],
          where: activeNotamWhere,
          _count: { id: true },
        })

        for (const g of notamGroups) {
          if (g.airportId) {
            notamCountByAirport.set(g.airportId, g._count.id)
          }
        }

        totalActiveNotams = await db.notam.count({ where: activeNotamWhere })
      } catch (error) {
        console.warn('[api/spim-agent/stats] Prisma NOTAM queries failed:', error)
      }
    }

    // ── FAA live fallback ───────────────────────────────────────────────
    // Si la DB local no tiene NOTAMs (pipeline email IMAP inactivo o DB
    // vaciada), hacemos fallback a la FAA en vivo para que el dashboard
    // muestre un conteo real en lugar de 0.
    // Esto es consistente con el comportamiento de /api/notams que también
    // hace fallback a FAA live cuando la DB está vacía.
    const liveNotamCountByIcao = new Map<string, number>()
    let liveNotamSource: string | null = null
    if (totalActiveNotams === 0) {
      try {
        const liveNotams = await fetchLiveNotams(undefined, 'SPIM')
        if (liveNotams.length > 0) {
          totalActiveNotams = liveNotams.length
          liveNotamSource = 'FAA USNS (live)'

          // Build per-station counts from live data.
          // liveNotams[].airport?.icaoCode gives the station ICAO.
          for (const n of liveNotams) {
            const icao = n.airport?.icaoCode
            if (icao) {
              liveNotamCountByIcao.set(icao, (liveNotamCountByIcao.get(icao) || 0) + 1)
            }
          }
        }
      } catch {
        // silently ignore — stats will just show 0
      }
    }

    // Fetch all Peruvian airports from DB (only if Prisma is available)
    let dbAirports: Array<{
      id: string
      icaoCode: string
      name: string
      city: string
      region: string | null
      department: string | null
      elevation: string | null
      category: string | null
      arpLatitude: string | null
      arpLongitude: string | null
    }> = []

    if (prismaLikelyAvailable()) {
      try {
        dbAirports = await db.airport.findMany({
          where: { icaoCode: { startsWith: 'SP' } },
          select: {
            id: true,
            icaoCode: true,
            name: true,
            city: true,
            region: true,
            department: true,
            elevation: true,
            category: true,
            arpLatitude: true,
            arpLongitude: true,
          },
          orderBy: [{ category: 'desc' }, { icaoCode: 'asc' }],
        })
      } catch (error) {
        console.warn('[api/spim-agent/stats] Prisma airport query failed:', error)
      }
    }

    // Build station list combining DB airports + canonical PERUVIAN_ICAOS
    const seenIcao = new Set<string>()
    const stations: StationSummary[] = []

    // First, add DB airports (they have richer data)
    for (const a of dbAirports) {
      const icao = a.icaoCode.toUpperCase()
      if (!PERUVIAN_ICAOS.has(icao) && !icao.startsWith('SP')) continue
      if (seenIcao.has(icao)) continue
      seenIcao.add(icao)

      const meta: PeruvianStation | undefined = PERUVIAN_STATIONS_BY_ICAO.get(icao)
      // Use DB count if available; otherwise fall back to live FAA count
      const notamCount = notamCountByAirport.get(a.id) || liveNotamCountByIcao.get(icao) || 0

      stations.push({
        icao,
        iata: meta?.iata,
        name: meta?.name || a.name,
        city: meta?.city || a.city,
        region: meta?.region || a.region || a.department || undefined,
        type: meta?.type || a.category || 'NACIONAL',
        elevationFt: meta?.elevationFt,
        lat: meta?.lat ?? -12.0,
        lon: meta?.lon ?? -77.0,
        frequencies: meta?.frequencies,
        notamCount,
        hasMetar: STATIONS_WITH_WEATHER.has(icao),
        hasTaf: STATIONS_WITH_WEATHER.has(icao),
      })
    }

    // Add any canonical Peruvian ICAOs not in DB
    for (const icao of PERUVIAN_ICAOS) {
      if (seenIcao.has(icao)) continue
      const meta: PeruvianStation | undefined = PERUVIAN_STATIONS_BY_ICAO.get(icao)
      stations.push({
        icao,
        iata: meta?.iata,
        name: meta?.name || icao,
        city: meta?.city || '—',
        region: meta?.region,
        type: meta?.type || 'NACIONAL',
        elevationFt: meta?.elevationFt,
        lat: meta?.lat ?? -12.0,
        lon: meta?.lon ?? -77.0,
        frequencies: meta?.frequencies,
        notamCount: liveNotamCountByIcao.get(icao) || 0,
        hasMetar: STATIONS_WITH_WEATHER.has(icao),
        hasTaf: STATIONS_WITH_WEATHER.has(icao),
      })
    }

    // Compute aggregate stats
    const metarCount = stations.filter((s) => s.hasMetar).length
    const tafCount = stations.filter((s) => s.hasTaf).length

    const response: StatsResponse = {
      totalStations: stations.length,
      metarCount,
      tafCount,
      notamCount: totalActiveNotams,
      notamSource: liveNotamSource,
      stations,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching SPIM agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SPIM agent stats' },
      { status: 500 }
    )
  }
}
