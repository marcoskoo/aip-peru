import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────

interface ParsedMetar {
  raw: string
  time: string
  wind: { direction: number; speed: number; gust?: number; variable?: boolean; varFrom?: number; varTo?: number }
  visibility: { value: number; unit: string }
  clouds: { quantity: string; height: number; type?: string }[]
  temperature: number
  dewpoint: number
  qnh: number
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR"
  weather?: string[]
  remarks?: string
  auto?: boolean
  cavok?: boolean
}

interface TafPeriod {
  type: string
  from: string
  to?: string
  probability?: number
  wind?: { direction: number; speed: number; gust?: number }
  visibility?: { value: number; unit: string }
  clouds?: { quantity: string; height: number; type?: string }[]
  weather?: string[]
  flightCategory?: "VFR" | "MVFR" | "IFR" | "LIFR"
}

interface WeatherCacheEntry {
  data: {
    icaoCode: string
    metar: ParsedMetar | null
    taf: { raw: string; time: string; periods: TafPeriod[] } | null
    fetchedAt: string
    source: string
  }
  timestamp: number
}

// ─── In-Memory Cache ──────────────────────────────────────────────

const weatherCache = new Map<string, WeatherCacheEntry>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// ─── Fetch with Timeout ──────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AIP-Peru/1.0',
        'Accept': 'application/json',
      },
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Flight Category Determination ───────────────────────────────

function getFlightCategory(visibility: number, ceiling: number | null): "VFR" | "MVFR" | "IFR" | "LIFR" {
  const visMeters = visibility
  const ceilingFt = ceiling

  if (visMeters < 800 || (ceilingFt !== null && ceilingFt < 500)) return "LIFR"
  if (visMeters < 1600 || (ceilingFt !== null && ceilingFt < 1000)) return "IFR"
  if (visMeters < 5000 || (ceilingFt !== null && ceilingFt < 3000)) return "MVFR"
  return "VFR"
}

// ─── Simple METAR Parser ─────────────────────────────────────────

function parseMetar(raw: string): ParsedMetar {
  const parts = raw.trim().split(/\s+/)
  let idx = 0

  // ICAO code
  if (/^[A-Z]{4}$/.test(parts[idx])) idx++

  // Auto
  const isAuto = parts[idx] === "AUTO"
  if (isAuto) idx++

  // Time
  const timeStr = parts[idx]
  idx++

  // Wind
  let wind = { direction: 0, speed: 0, gust: undefined, variable: false, varFrom: undefined, varTo: undefined } as ParsedMetar["wind"]
  const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?(KT|MPS|KMH)?$/)
  if (windMatch) {
    wind.direction = windMatch[1] === "VRB" ? 0 : parseInt(windMatch[1])
    wind.speed = parseInt(windMatch[2])
    if (windMatch[4]) wind.gust = parseInt(windMatch[4])
    wind.variable = windMatch[1] === "VRB"
    idx++
  }

  // Variable wind direction
  const varMatch = parts[idx]?.match(/^(\d{3})V(\d{3})$/)
  if (varMatch) {
    wind.varFrom = parseInt(varMatch[1])
    wind.varTo = parseInt(varMatch[2])
    idx++
  }

  // Visibility
  let visibility = { value: 9999, unit: "m" } as ParsedMetar["visibility"]
  if (parts[idx] === "CAVOK") {
    visibility = { value: 9999, unit: "m" }
    idx++
  } else if (parts[idx] === "9999") {
    visibility = { value: 9999, unit: "m" }
    idx++
  } else {
    const visMatch = parts[idx]?.match(/^(\d{4})$/)
    if (visMatch) {
      visibility = { value: parseInt(visMatch[1]), unit: "m" }
      idx++
    } else {
      const visSmMatch = parts[idx]?.match(/^(\d+)SM$/)
      if (visSmMatch) {
        visibility = { value: parseInt(visSmMatch[1]) * 1609, unit: "m" }
        idx++
      }
    }
  }

  // Weather
  const weather: string[] = []
  const weatherPattern = /^([+-]?)(TS|SH|FZ|BL|DR|MI|BC|PR|VC)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS|WC|WK)$/
  while (weatherPattern.test(parts[idx] || "")) {
    weather.push(parts[idx])
    idx++
  }

  // Clouds
  const clouds: ParsedMetar["clouds"] = []
  const cloudPattern = /^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i
  let ceiling: number | null = null
  while (cloudPattern.test(parts[idx] || "")) {
    const match = parts[idx].match(cloudPattern)!
    const height = parseInt(match[2])
    const quantity = match[1].toUpperCase()
    clouds.push({ quantity, height, type: match[3] })
    if (["BKN", "OVC"].includes(quantity)) {
      ceiling = height * 100
    }
    idx++
  }

  // Temperature/Dewpoint
  let temperature = 0
  let dewpoint = 0
  const tempMatch = parts[idx]?.match(/^(M?\d{2})\/(M?\d{2})$/)
  if (tempMatch) {
    temperature = parseInt(tempMatch[1].replace("M", "-"))
    dewpoint = parseInt(tempMatch[2].replace("M", "-"))
    idx++
  }

  // QNH
  let qnh = 1013
  const qnhMatch = parts[idx]?.match(/^(A|Q)(\d{4})$/)
  if (qnhMatch) {
    const match = parts[idx].match(/^(A|Q)(\d{4})$/)!
    qnh = match[1] === "A" ? Math.round(parseInt(match[2]) / 100 * 33.8639) : parseInt(match[2])
    idx++
  }

  // Remarks
  let remarks: string | undefined
  if (parts[idx] === "RMK") {
    idx++
    remarks = parts.slice(idx).join(" ")
  }

  const flightCategory = getFlightCategory(visibility.value, ceiling)

  // Build ISO time from DDHHMMZ
  const dayMatch = timeStr?.match(/^(\d{2})(\d{2})(\d{2})Z?$/)
  let isoTime = new Date().toISOString()
  if (dayMatch) {
    const now = new Date()
    const day = parseInt(dayMatch[1])
    const hour = parseInt(dayMatch[2])
    const minute = parseInt(dayMatch[3])
    isoTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour, minute)).toISOString()
  }

  return {
    raw,
    time: isoTime,
    wind,
    visibility,
    clouds,
    temperature,
    dewpoint,
    qnh,
    flightCategory,
    weather: weather.length > 0 ? weather : undefined,
    remarks,
    auto: isAuto,
    cavok: raw.includes("CAVOK"),
  }
}

// ─── Simple TAF Period Parser ────────────────────────────────────

function parseTafPeriods(raw: string): TafPeriod[] {
  const periods: TafPeriod[] = []
  const parts = raw.trim().split(/\s+/)

  // Skip TAF header and ICAO/time
  let idx = 0
  while (idx < parts.length && !/^(FM|TEMPO|BECMG|PROB)/.test(parts[idx])) {
    idx++
  }

  // Skip first period indicator
  idx++

  while (idx < parts.length) {
    const part = parts[idx]

    if (part === "TEMPO" || part === "BECMG") {
      const type = part
      idx++
      const timeGroup = parts[idx]
      idx++

      let from = ""
      let to: string | undefined
      if (timeGroup?.includes("/")) {
        const [fromStr, toStr] = timeGroup.split("/")
        const now = new Date()
        const day = parseInt(fromStr.substring(0, 2))
        const hour = parseInt(fromStr.substring(2, 4))
        from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour)).toISOString()
        const toDay = parseInt(toStr.substring(0, 2))
        const toHour = parseInt(toStr.substring(2, 4))
        to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), toDay, toHour)).toISOString()
      }

      const period: TafPeriod = { type, from, to }
      let ceiling: number | null = null

      const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/)
      if (windMatch) {
        period.wind = {
          direction: windMatch[1] === "VRB" ? 0 : parseInt(windMatch[1]),
          speed: parseInt(windMatch[2]),
          gust: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        }
        idx++
      }

      const vis = parts[idx]
      if (/^\d{4}$/.test(vis) || vis === "9999") {
        period.visibility = { value: parseInt(vis), unit: "m" }
        idx++
      }

      const wx: string[] = []
      while (/^([+-]?)(TS|SH|FZ|BL|DR|MI|BC|PR|VC)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/.test(parts[idx] || "")) {
        wx.push(parts[idx])
        idx++
      }

      const clouds: TafPeriod["clouds"] = []
      while (/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i.test(parts[idx] || "")) {
        const match = parts[idx].match(/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i)!
        const height = parseInt(match[2])
        const quantity = match[1].toUpperCase()
        clouds.push({ quantity, height, type: match[3] })
        if (["BKN", "OVC"].includes(quantity)) {
          ceiling = height * 100
        }
        idx++
      }

      if (wx.length > 0) period.weather = wx
      if (clouds.length > 0) period.clouds = clouds
      if (period.visibility) {
        period.flightCategory = getFlightCategory(period.visibility.value, ceiling)
      }

      periods.push(period)
    } else if (part === "FM") {
      idx++
      const timeStr = parts[idx]
      idx++

      const now = new Date()
      const day = parseInt(timeStr?.substring(0, 2) || "01")
      const hour = parseInt(timeStr?.substring(2, 4) || "00")
      const minute = parseInt(timeStr?.substring(4, 6) || "00")
      const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour, minute)).toISOString()

      const period: TafPeriod = { type: "FM", from }
      let ceiling: number | null = null

      const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/)
      if (windMatch) {
        period.wind = {
          direction: windMatch[1] === "VRB" ? 0 : parseInt(windMatch[1]),
          speed: parseInt(windMatch[2]),
          gust: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        }
        idx++
      }

      const vis = parts[idx]
      if (/^\d{4}$/.test(vis) || vis === "9999") {
        period.visibility = { value: parseInt(vis), unit: "m" }
        idx++
      }

      const wx: string[] = []
      while (/^([+-]?)(TS|SH|FZ|BL|DR|MI|BC|PR|VC)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/.test(parts[idx] || "")) {
        wx.push(parts[idx])
        idx++
      }

      const clouds: TafPeriod["clouds"] = []
      while (/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i.test(parts[idx] || "")) {
        const match = parts[idx].match(/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i)!
        const height = parseInt(match[2])
        const quantity = match[1].toUpperCase()
        clouds.push({ quantity, height, type: match[3] })
        if (["BKN", "OVC"].includes(quantity)) {
          ceiling = height * 100
        }
        idx++
      }

      if (wx.length > 0) period.weather = wx
      if (clouds.length > 0) period.clouds = clouds
      if (period.visibility) {
        period.flightCategory = getFlightCategory(period.visibility.value, ceiling)
      }

      periods.push(period)
    } else if (part?.startsWith("PROB")) {
      const prob = parseInt(part.replace("PROB", ""))
      idx++

      const timeGroup = parts[idx]
      idx++

      let from = ""
      let to: string | undefined
      if (timeGroup?.includes("/")) {
        const [fromStr, toStr] = timeGroup.split("/")
        const now = new Date()
        const day = parseInt(fromStr.substring(0, 2))
        const hour = parseInt(fromStr.substring(2, 4))
        from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour)).toISOString()
        const toDay = parseInt(toStr.substring(0, 2))
        const toHour = parseInt(toStr.substring(2, 4))
        to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), toDay, toHour)).toISOString()
      }

      const period: TafPeriod = { type: "PROB", from, to, probability: prob }
      let ceiling: number | null = null

      const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/)
      if (windMatch) {
        period.wind = {
          direction: windMatch[1] === "VRB" ? 0 : parseInt(windMatch[1]),
          speed: parseInt(windMatch[2]),
          gust: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        }
        idx++
      }

      const vis = parts[idx]
      if (/^\d{4}$/.test(vis) || vis === "9999") {
        period.visibility = { value: parseInt(vis), unit: "m" }
        idx++
      }

      const wx: string[] = []
      while (/^([+-]?)(TS|SH|FZ|BL|DR|MI|BC|PR|VC)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/.test(parts[idx] || "")) {
        wx.push(parts[idx])
        idx++
      }

      const clouds: TafPeriod["clouds"] = []
      while (/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i.test(parts[idx] || "")) {
        const match = parts[idx].match(/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i)!
        const height = parseInt(match[2])
        const quantity = match[1].toUpperCase()
        clouds.push({ quantity, height, type: match[3] })
        if (["BKN", "OVC"].includes(quantity)) {
          ceiling = height * 100
        }
        idx++
      }

      if (wx.length > 0) period.weather = wx
      if (clouds.length > 0) period.clouds = clouds
      if (period.visibility) {
        period.flightCategory = getFlightCategory(period.visibility.value, ceiling)
      }

      periods.push(period)
    } else {
      idx++
    }
  }

  return periods
}

// ─── Sample Data Generators ──────────────────────────────────────

function generateSampleMetar(icaoCode: string): string | null {
  const now = new Date()
  const day = String(now.getUTCDate()).padStart(2, "0")
  const hour = String(now.getUTCHours()).padStart(2, "0")
  const minute = String(Math.floor(now.getUTCMinutes() / 5) * 5).padStart(2, "0")

  // Known Peruvian airports with typical weather
  const weatherData: Record<string, { wind: string; vis: string; clouds: string; temp: string; dew: string; qnh: string; wx?: string }> = {
    "SPJC": { wind: "18010KT", vis: "9999", clouds: "SCT025 BKN040", temp: "22/16", qnh: "Q1013" },
    "SPZO": { wind: "35008KT", vis: "9999", clouds: "FEW040", temp: "18/05", qnh: "Q1022" },
    "SPUR": { wind: "09006KT", vis: "9999", clouds: "SCT030", temp: "28/22", qnh: "Q1010" },
    "SPQU": { wind: "22012KT", vis: "9999", clouds: "SCT020 BKN035", temp: "20/14", qnh: "Q1015" },
    "SPHI": { wind: "20010G20KT", vis: "6000", clouds: "BKN015 OVC030", temp: "19/16", qnh: "Q1012", wx: "-RA" },
    "SPCL": { wind: "14008KT", vis: "9999", clouds: "FEW020", temp: "24/18", qnh: "Q1011" },
    "SPIM": { wind: "VRB03KT", vis: "3000", clouds: "OVC008", temp: "16/15", qnh: "Q1014", wx: "FG" },
    "SPJA": { wind: "06005KT", vis: "9999", clouds: "SKC", temp: "32/20", qnh: "Q1008" },
    "SPST": { wind: "11008KT", vis: "9999", clouds: "SCT035", temp: "30/22", qnh: "Q1009" },
    "SPME": { wind: "34006KT", vis: "9999", clouds: "FEW030", temp: "28/18", qnh: "Q1010" },
    "SPTU": { wind: "22012KT", vis: "8000", clouds: "SCT025 BKN040", temp: "25/20", qnh: "Q1011" },
    "SPLO": { wind: "09010KT", vis: "9999", clouds: "SCT030", temp: "20/10", qnh: "Q1020" },
  }

  const data = weatherData[icaoCode]
  if (!data) return null

  const parts = [
    icaoCode,
    `${day}${hour}${minute}Z`,
    data.wind,
    data.vis,
    data.wx,
    data.clouds,
    `${data.temp}`,
    data.qnh,
  ].filter(Boolean)

  return parts.join(" ")
}

function generateSampleTaf(icaoCode: string): string | null {
  const now = new Date()
  const day = String(now.getUTCDate()).padStart(2, "0")
  const hour = String(now.getUTCHours()).padStart(2, "0")

  const tafData: Record<string, string> = {
    "SPJC": `TAF SPJC ${day}${hour}00Z ${day}${hour}/36 18010KT 9999 SCT025 BKN040 TEMPO ${day}${hour}/36 4000 -RA BKN015`,
    "SPZO": `TAF SPZO ${day}${hour}00Z ${day}${hour}/36 35008KT 9999 FEW040`,
    "SPUR": `TAF SPUR ${day}${hour}00Z ${day}${hour}/36 09006KT 9999 SCT030`,
    "SPHI": `TAF SPHI ${day}${hour}00Z ${day}${hour}/36 20010G20KT 6000 BKN015 TEMPO ${day}${hour}/36 3000 -RA OVC008`,
    "SPCL": `TAF SPCL ${day}${hour}00Z ${day}${hour}/36 14008KT 9999 FEW020`,
    "SPIM": `TAF SPIM ${day}${hour}00Z ${day}${hour}/36 VRB03KT 3000 OVC008 BECMG ${day}22/36 9999 SCT025`,
  }

  return tafData[icaoCode] || null
}

// ─── GET Handler ──────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params
    const code = icaoCode.toUpperCase()

    // Check cache first
    const cached = weatherCache.get(code)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Look up airport for elevation info
    const airport = await db.airport.findUnique({
      where: { icaoCode: code },
      select: { elevation: true, city: true },
    })

    // Try fetching real METAR/TAF from aviationweather.gov API
    let metarRaw: string | null = null
    let tafRaw: string | null = null
    let source = 'simulated'

    try {
      const [metarResponse, tafResponse] = await Promise.all([
        fetchWithTimeout(
          `https://aviationweather.gov/api/data/metar?ids=${code}&format=json`,
          8000
        ),
        fetchWithTimeout(
          `https://aviationweather.gov/api/data/taf?ids=${code}&format=json`,
          8000
        ),
      ])

      if (metarResponse?.ok) {
        const metarData = await metarResponse.json()
        if (Array.isArray(metarData) && metarData.length > 0) {
          metarRaw = metarData[0].rawText || metarData[0].rawObs || null
        }
      }

      if (tafResponse?.ok) {
        const tafData = await tafResponse.json()
        if (Array.isArray(tafData) && tafData.length > 0) {
          tafRaw = tafData[0].rawText || null
        }
      }

      // If we got real data, mark source
      if (metarRaw || tafRaw) {
        source = 'aviationweather.gov'
      }
    } catch (error) {
      console.error('Error fetching weather from external API:', error)
    }

    // Fallback to generated data if no real data
    if (!metarRaw) {
      metarRaw = generateSampleMetar(code)
      if (source !== 'aviationweather.gov') {
        source = 'simulated'
      }
    }

    if (!tafRaw) {
      tafRaw = generateSampleTaf(code)
      if (source !== 'aviationweather.gov') {
        source = 'simulated'
      }
    }

    // Parse METAR and TAF
    const parsedMetar = metarRaw ? parseMetar(metarRaw) : null
    const parsedTaf = tafRaw
      ? { raw: tafRaw, time: new Date().toISOString(), periods: parseTafPeriods(tafRaw) }
      : null

    const result = {
      icaoCode: code,
      metar: parsedMetar,
      taf: parsedTaf,
      fetchedAt: new Date().toISOString(),
      source,
    }

    // Update cache
    weatherCache.set(code, {
      data: result,
      timestamp: Date.now(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
