import { NextResponse } from 'next/server'
import { PERUVIAN_ICAOS } from '@/lib/aviation/peru-stations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 300 // 5 minutos — el cache en memoria maneja el TTL real

// ─── In-Memory Cache ──────────────────────────────────────────────

interface StatusCacheEntry {
  data: Record<string, boolean>
  timestamp: number
}

const statusCache: StatusCacheEntry = {
  data: {},
  timestamp: 0,
}
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

// ─── Fetch con timeout ────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AIP-Peru/1.0',
        Accept: 'application/json',
      },
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Lista canónica de aeropuertos con servicio METAR/TAF ─────────
// Estos aeropuertos tienen datos simulados de respaldo en
// /api/weather/[icao]/route.ts y siempre dispondrán de información
// meteorológica en la app, incluso si aviationweather.gov no responde.
const FALLBACK_WEATHER_ICAOS = new Set<string>([
  'SPJC',
  'SPZO',
  'SPUR',
  'SPQU',
  'SPHI',
  'SPCL',
  'SPIM',
  'SPJA',
  'SPST',
  'SPME',
  'SPTU',
  'SPLO',
])

// ─── GET Handler ──────────────────────────────────────────────────

export async function GET() {
  try {
    // Devolver cache si es válido
    if (
      Object.keys(statusCache.data).length > 0 &&
      Date.now() - statusCache.timestamp < CACHE_TTL
    ) {
      return NextResponse.json(statusCache.data)
    }

    // Construir lista de ICAOs peruanos a verificar
    const icaos = Array.from(PERUVIAN_ICAOS)
    const statusMap: Record<string, boolean> = {}

    // Inicializar todos como false
    for (const icao of icaos) {
      statusMap[icao] = false
    }

    // Hacer petición batch a aviationweather.gov para METAR
    // (un solo request con todos los ICAOs separados por coma)
    try {
      const icaoParam = icaos.join(',')
      const metarResponse = await fetchWithTimeout(
        `https://aviationweather.gov/api/data/metar?ids=${icaoParam}&format=json`,
        10000,
      )

      if (metarResponse?.ok) {
        const metarData = await metarResponse.json()
        if (Array.isArray(metarData)) {
          for (const item of metarData) {
            const icaoId: string | undefined = item?.icaoId
            if (icaoId && icaos.includes(icaoId)) {
              // Si hay rawOb o rawText, el aeropuerto tiene METAR real
              if (item.rawOb || item.rawText || item.rawObs) {
                statusMap[icaoId] = true
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[/api/airports/weather-status] Error fetching METAR batch:', error)
    }

    // Hacer petición batch para TAF (algunos aeropuertos solo tienen TAF)
    try {
      const icaoParam = icaos.join(',')
      const tafResponse = await fetchWithTimeout(
        `https://aviationweather.gov/api/data/taf?ids=${icaoParam}&format=json`,
        10000,
      )

      if (tafResponse?.ok) {
        const tafData = await tafResponse.json()
        if (Array.isArray(tafData)) {
          for (const item of tafData) {
            const icaoId: string | undefined = item?.icaoId
            if (icaoId && icaos.includes(icaoId)) {
              if (item.rawTAF || item.rawText) {
                statusMap[icaoId] = true
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[/api/airports/weather-status] Error fetching TAF batch:', error)
    }

    // Añadir aeropuertos de respaldo (FALLBACK_WEATHER_ICAOS) como true
    // Aunque aviationweather.gov no responda para ellos, nuestra app
    // generará datos meteorológicos simulados.
    for (const icao of FALLBACK_WEATHER_ICAOS) {
      if (icaos.includes(icao)) {
        statusMap[icao] = true
      }
    }

    // Actualizar cache
    statusCache.data = statusMap
    statusCache.timestamp = Date.now()

    return NextResponse.json(statusMap)
  } catch (error) {
    console.error('[/api/airports/weather-status] ERROR:', error)
    // En caso de error, devolver al menos los aeropuertos de respaldo
    const fallback: Record<string, boolean> = {}
    for (const icao of PERUVIAN_ICAOS) {
      fallback[icao] = FALLBACK_WEATHER_ICAOS.has(icao)
    }
    return NextResponse.json(fallback)
  }
}
