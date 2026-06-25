import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  PERUVIAN_ICAOS,
  PERUVIAN_STATIONS_BY_ICAO,
  type PeruvianStation,
} from '@/lib/aviation/peru-stations'

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

    // Active NOTAMs for FIR SPIM
    const activeNotamWhere = {
      fir: 'SPIM',
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: { gte: now } }, { isPermanent: true }],
    }

    // NOTAM counts grouped by airportId
    const notamGroups = await db.notam.groupBy({
      by: ['airportId'],
      where: activeNotamWhere,
      _count: { id: true },
    })

    // Map airportId → NOTAM count
    const notamCountByAirport = new Map<string, number>()
    for (const g of notamGroups) {
      if (g.airportId) {
        notamCountByAirport.set(g.airportId, g._count.id)
      }
    }

    // Total active NOTAMs (including those without airportId — FIR-level)
    const totalActiveNotams = await db.notam.count({ where: activeNotamWhere })

    // Fetch all Peruvian airports from DB
    const dbAirports = await db.airport.findMany({
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
      const notamCount = notamCountByAirport.get(a.id) || 0

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
        notamCount: 0,
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
