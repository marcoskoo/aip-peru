import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  PERUVIAN_STATIONS_BY_ICAO,
  type PeruvianStation,
} from '@/lib/aviation/peru-stations'
import { notamStatus } from '@/lib/aviation/notam-parser'

// ─── Types ────────────────────────────────────────────────────────────

interface ParsedMetar {
  raw: string
  time: string
  wind: { direction: number; speed: number; gust?: number; variable?: boolean; varFrom?: number; varTo?: number }
  visibility: { value: number; unit: string }
  clouds: { quantity: string; height: number; type?: string }[]
  temperature: number
  dewpoint: number
  qnh: number
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
  weather?: string[]
  remarks?: string
  auto?: boolean
  cavok?: boolean
}

interface TafPeriod {
  type: string
  from: string
  to?: string
  wind?: { direction: number; speed: number; gust?: number }
  visibility?: { value: number; unit: string }
  clouds?: { quantity: string; height: number; type?: string }[]
  weather?: string[]
  flightCategory?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
}

// ─── Weather Cache (module-level, shared across requests) ─────────────

interface WeatherCacheEntry {
  data: {
    metar: ParsedMetar | null
    taf: { raw: string; time: string; periods: TafPeriod[] } | null
    fetchedAt: string
    source: string
  }
  timestamp: number
}

const weatherCache = new Map<string, WeatherCacheEntry>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// ─── Fetch with Timeout ───────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIP-Peru/1.0', Accept: 'application/json' },
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Flight Category ──────────────────────────────────────────────────

function getFlightCategory(
  visibility: number,
  ceiling: number | null
): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  if (visibility < 800 || (ceiling !== null && ceiling < 500)) return 'LIFR'
  if (visibility < 1600 || (ceiling !== null && ceiling < 1000)) return 'IFR'
  if (visibility < 5000 || (ceiling !== null && ceiling < 3000)) return 'MVFR'
  return 'VFR'
}

// ─── METAR Parser ─────────────────────────────────────────────────────

function parseMetar(raw: string): ParsedMetar {
  const parts = raw.trim().split(/\s+/)
  let idx = 0
  // Saltar prefijo "METAR" o "SPECI" si está presente (aviationweather.gov lo incluye)
  if (parts[idx] === 'METAR' || parts[idx] === 'SPECI') idx++
  if (/^[A-Z]{4}$/.test(parts[idx])) idx++
  const isAuto = parts[idx] === 'AUTO'
  if (isAuto) idx++
  const timeStr = parts[idx]
  idx++

  let wind = { direction: 0, speed: 0, gust: undefined, variable: false } as ParsedMetar['wind']
  const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?(KT|MPS|KMH)?$/)
  if (windMatch) {
    wind.direction = windMatch[1] === 'VRB' ? 0 : parseInt(windMatch[1])
    wind.speed = parseInt(windMatch[2])
    if (windMatch[4]) wind.gust = parseInt(windMatch[4])
    wind.variable = windMatch[1] === 'VRB'
    idx++
  }

  // Variable wind direction: e.g. "160V220" (viento variable entre 160° y 220°)
  const varMatch = parts[idx]?.match(/^(\d{3})V(\d{3})$/)
  if (varMatch) {
    wind.varFrom = parseInt(varMatch[1])
    wind.varTo = parseInt(varMatch[2])
    idx++
  }

  let visibility = { value: 9999, unit: 'm' } as ParsedMetar['visibility']
  if (parts[idx] === 'CAVOK' || parts[idx] === '9999') {
    visibility = { value: 9999, unit: 'm' }
    idx++
  } else {
    const visMatch = parts[idx]?.match(/^(\d{4})$/)
    if (visMatch) {
      visibility = { value: parseInt(visMatch[1]), unit: 'm' }
      idx++
    } else {
      const visSmMatch = parts[idx]?.match(/^(\d+)SM$/)
      if (visSmMatch) {
        visibility = { value: parseInt(visSmMatch[1]) * 1609, unit: 'm' }
        idx++
      }
    }
  }

  const weather: string[] = []
  const wxPattern = /^([+-]?)(TS|SH|FZ|BL|DR|MI|BC|PR|VC)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS|WC|WK)$/
  while (wxPattern.test(parts[idx] || '')) {
    weather.push(parts[idx])
    idx++
  }

  const clouds: ParsedMetar['clouds'] = []
  const cloudPattern = /^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i
  let ceiling: number | null = null
  while (cloudPattern.test(parts[idx] || '')) {
    const match = parts[idx].match(cloudPattern)!
    const height = parseInt(match[2])
    const quantity = match[1].toUpperCase()
    clouds.push({ quantity, height, type: match[3] })
    if (['BKN', 'OVC'].includes(quantity)) ceiling = height * 100
    idx++
  }

  let temperature = 0
  let dewpoint = 0
  const tempMatch = parts[idx]?.match(/^(M?\d{2})\/(M?\d{2})$/)
  if (tempMatch) {
    temperature = parseInt(tempMatch[1].replace('M', '-'))
    dewpoint = parseInt(tempMatch[2].replace('M', '-'))
    idx++
  }

  let qnh = 1013
  const qnhMatch = parts[idx]?.match(/^(A|Q)(\d{4})$/)
  if (qnhMatch) {
    const match = parts[idx].match(/^(A|Q)(\d{4})$/)!
    qnh = match[1] === 'A' ? Math.round(parseInt(match[2]) / 100 * 33.8639) : parseInt(match[2])
    idx++
  }

  let remarks: string | undefined
  if (parts[idx] === 'RMK') {
    idx++
    remarks = parts.slice(idx).join(' ')
  }

  const flightCategory = getFlightCategory(visibility.value, ceiling)

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
    cavok: raw.includes('CAVOK'),
  }
}

// ─── TAF Parser (periods) ─────────────────────────────────────────────

function parseTafPeriods(raw: string): TafPeriod[] {
  const periods: TafPeriod[] = []
  const parts = raw.trim().split(/\s+/)
  let idx = 0
  // Avanzar hasta el primer keyword de cambio (FM/TEMPO/BECMG/PROB).
  // NO consumirlo aquí — el segundo while lo procesará como primer período.
  while (idx < parts.length && !/^(FM|TEMPO|BECMG|PROB)/.test(parts[idx])) idx++

  while (idx < parts.length) {
    const part = parts[idx]
    if (part === 'TEMPO' || part === 'BECMG') {
      const type = part
      idx++
      const timeGroup = parts[idx]
      idx++
      let from = ''
      let to: string | undefined
      if (timeGroup?.includes('/')) {
        const [fromStr, toStr] = timeGroup.split('/')
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
          direction: windMatch[1] === 'VRB' ? 0 : parseInt(windMatch[1]),
          speed: parseInt(windMatch[2]),
          gust: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        }
        idx++
      }
      const vis = parts[idx]
      if (/^\d{4}$/.test(vis) || vis === '9999') {
        period.visibility = { value: parseInt(vis), unit: 'm' }
        idx++
      }
      const clouds: TafPeriod['clouds'] = []
      while (/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i.test(parts[idx] || '')) {
        const match = parts[idx].match(/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i)!
        const height = parseInt(match[2])
        const quantity = match[1].toUpperCase()
        clouds.push({ quantity, height, type: match[3] })
        if (['BKN', 'OVC'].includes(quantity)) ceiling = height * 100
        idx++
      }
      if (clouds.length > 0) period.clouds = clouds
      if (period.visibility) period.flightCategory = getFlightCategory(period.visibility.value, ceiling)
      periods.push(period)
    } else if (part === 'FM') {
      idx++
      const timeStr = parts[idx]
      idx++
      const now = new Date()
      const day = parseInt(timeStr?.substring(0, 2) || '01')
      const hour = parseInt(timeStr?.substring(2, 4) || '00')
      const minute = parseInt(timeStr?.substring(4, 6) || '00')
      const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour, minute)).toISOString()
      const period: TafPeriod = { type: 'FM', from }
      let ceiling: number | null = null
      const windMatch = parts[idx]?.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/)
      if (windMatch) {
        period.wind = {
          direction: windMatch[1] === 'VRB' ? 0 : parseInt(windMatch[1]),
          speed: parseInt(windMatch[2]),
          gust: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        }
        idx++
      }
      const vis = parts[idx]
      if (/^\d{4}$/.test(vis) || vis === '9999') {
        period.visibility = { value: parseInt(vis), unit: 'm' }
        idx++
      }
      const clouds: TafPeriod['clouds'] = []
      while (/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i.test(parts[idx] || '')) {
        const match = parts[idx].match(/^(SKC|CLR|FEW|SCT|BKN|OVC|NSC|NCD)(\d{3})(CB|TCU|ACC)?$/i)!
        const height = parseInt(match[2])
        const quantity = match[1].toUpperCase()
        clouds.push({ quantity, height, type: match[3] })
        if (['BKN', 'OVC'].includes(quantity)) ceiling = height * 100
        idx++
      }
      if (clouds.length > 0) period.clouds = clouds
      if (period.visibility) period.flightCategory = getFlightCategory(period.visibility.value, ceiling)
      periods.push(period)
    } else {
      idx++
    }
  }
  return periods
}

// ─── Sample Data Generators ───────────────────────────────────────────

function generateSampleMetar(icaoCode: string): string | null {
  const now = new Date()
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hour = String(now.getUTCHours()).padStart(2, '0')
  const minute = String(Math.floor(now.getUTCMinutes() / 5) * 5).padStart(2, '0')
  const data: Record<string, { wind: string; vis: string; clouds: string; temp: string; qnh: string; wx?: string }> = {
    SPJC: { wind: '15009KT', vis: '9999', clouds: 'OVC030', temp: '21/17', qnh: 'Q1012' },
    SPZO: { wind: '35008KT', vis: '9999', clouds: 'FEW040', temp: '18/05', qnh: 'Q1022' },
    SPUR: { wind: '09006KT', vis: '9999', clouds: 'SCT030', temp: '28/22', qnh: 'Q1010' },
    SPQU: { wind: '22012KT', vis: '9999', clouds: 'SCT020 BKN035', temp: '20/14', qnh: 'Q1015' },
    SPHI: { wind: '20010G20KT', vis: '6000', clouds: 'BKN015 OVC030', temp: '19/16', qnh: 'Q1012', wx: '-RA' },
    SPCL: { wind: '14008KT', vis: '9999', clouds: 'FEW020', temp: '24/18', qnh: 'Q1011' },
    SPIM: { wind: 'VRB03KT', vis: '3000', clouds: 'OVC008', temp: '16/15', qnh: 'Q1014', wx: 'FG' },
    SPJA: { wind: '06005KT', vis: '9999', clouds: 'SKC', temp: '32/20', qnh: 'Q1008' },
    SPST: { wind: '11008KT', vis: '9999', clouds: 'SCT035', temp: '30/22', qnh: 'Q1009' },
    SPME: { wind: '34006KT', vis: '9999', clouds: 'FEW030', temp: '28/18', qnh: 'Q1010' },
    SPTU: { wind: '22012KT', vis: '8000', clouds: 'SCT025 BKN040', temp: '25/20', qnh: 'Q1011' },
    SPLO: { wind: '09010KT', vis: '9999', clouds: 'SCT030', temp: '20/10', qnh: 'Q1020' },
  }
  const d = data[icaoCode]
  if (!d) return null
  return [icaoCode, `${day}${hour}${minute}Z`, d.wind, d.vis, d.wx, d.clouds, d.temp, d.qnh].filter(Boolean).join(' ')
}

function generateSampleTaf(icaoCode: string): string | null {
  const now = new Date()
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hour = String(now.getUTCHours()).padStart(2, '0')
  const tafData: Record<string, string> = {
    SPJC: `TAF SPJC ${day}${hour}00Z ${day}${hour}/36 18012KT 9999 SCT020 TX24/2419Z TN21/2511Z FM250100 15005KT 9000 BKN020`,
    SPZO: `TAF SPZO ${day}${hour}00Z ${day}${hour}/36 35008KT 9999 FEW040`,
    SPUR: `TAF SPUR ${day}${hour}00Z ${day}${hour}/36 09006KT 9999 SCT030`,
    SPHI: `TAF SPHI ${day}${hour}00Z ${day}${hour}/36 20010G20KT 6000 BKN015 TEMPO ${day}${hour}/36 3000 -RA OVC008`,
    SPCL: `TAF SPCL ${day}${hour}00Z ${day}${hour}/36 14008KT 9999 FEW020`,
    SPIM: `TAF SPIM ${day}${hour}00Z ${day}${hour}/36 VRB03KT 3000 OVC008 BECMG ${day}22/36 9999 SCT025`,
  }
  return tafData[icaoCode] || null
}

// ─── Readable Text Generators ─────────────────────────────────────────

function cloudQtyText(qty: string): string {
  const map: Record<string, string> = {
    SKC: 'despejado',
    CLR: 'despejado',
    FEW: 'pocas nubes',
    SCT: 'nubes dispersas',
    BKN: 'nubes fragmentadas',
    OVC: 'techo',
    NSC: 'sin nubes significativas',
  }
  return map[qty] || qty
}

function metarReadable(icao: string, m: ParsedMetar): string {
  const parts: string[] = [`METAR observado en estación ${icao}.`]
  const dir = m.wind.variable ? 'variable' : `${String(m.wind.direction).padStart(3, '0')}°`
  parts.push(`Viento desde ${dir} a ${String(m.wind.speed).padStart(2, '0')} nudos${m.wind.gust ? ` (ráfagas ${m.wind.gust})` : ''}.`)
  if (m.wind.varFrom != null && m.wind.varTo != null) {
    parts.push(`Dirección variable entre ${String(m.wind.varFrom).padStart(3, '0')}° y ${String(m.wind.varTo).padStart(3, '0')}°.`)
  }
  if (m.visibility.value >= 9999) {
    parts.push('Visibilidad 10 km o más.')
  } else {
    parts.push(`Visibilidad ${m.visibility.value} metros.`)
  }
  const ceiling = m.clouds.find((c) => ['BKN', 'OVC'].includes(c.quantity))
  if (ceiling) {
    parts.push(`Techo ${ceiling.quantity} a ${ceiling.height * 100} pies.`)
  } else if (m.clouds.length > 0) {
    const c = m.clouds[0]
    parts.push(`${cloudQtyText(c.quantity)} a ${c.height * 100} pies.`)
  }
  if (m.weather && m.weather.length > 0) {
    parts.push(`Fenómenos: ${m.weather.join(', ')}.`)
  }
  parts.push(`Temperatura ${m.temperature}°C, punto de rocío ${m.dewpoint}°C.`)
  parts.push(`QNH ${m.qnh} hPa.`)
  return parts.join(' ')
}

function tafReadable(icao: string, t: { raw: string; periods: TafPeriod[] }): string {
  const parts: string[] = [`TAF observado en estación ${icao}.`]

  // If we have parsed periods, use the first one
  if (t.periods.length > 0) {
    const first = t.periods[0]
    if (first.wind) {
      const dir = first.wind.variable ? 'variable' : `${String(first.wind.direction).padStart(3, '0')}°`
      parts.push(`Viento desde ${dir} a ${String(first.wind.speed).padStart(2, '0')} nudos.`)
    }
    if (first.visibility) {
      parts.push(first.visibility.value >= 9999 ? 'Visibilidad 10 km o más.' : `Visibilidad ${first.visibility.value} metros.`)
    }
    const ceiling = first.clouds?.find((c) => ['BKN', 'OVC'].includes(c.quantity))
    if (ceiling) {
      parts.push(`Techo ${ceiling.quantity} a ${ceiling.height * 100} pies.`)
    }
    parts.push(`${t.periods.length} períodos de pronóstico.`)
  } else {
    // Fallback: parse wind/visibility/clouds from raw TAF text
    const raw = t.raw
    // Wind: (3 digits or VRB)(2-3 digits)(optional G + 2-3 digits)KT
    const windMatch = raw.match(/(?:^|\s)(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT/)
    if (windMatch) {
      const dir = windMatch[1] === 'VRB' ? 'variable' : `${windMatch[1]}°`
      parts.push(`Viento desde ${dir} a ${windMatch[2]} nudos${windMatch[3] ? ` (ráfagas ${windMatch[3]})` : ''}.`)
    }
    // Visibility: 4 digits or 9999, but not part of the date/time group
    // Look for visibility after the wind group
    const visMatch = raw.match(/KT\s+(\d{4}|9999|CAVOK)/)
    if (visMatch) {
      if (visMatch[1] === 'CAVOK' || visMatch[1] === '9999') {
        parts.push('Visibilidad 10 km o más.')
      } else {
        parts.push(`Visibilidad ${parseInt(visMatch[1])} metros.`)
      }
    }
    // Clouds: look for ceiling (BKN/OVC) first
    const cloudMatch = raw.match(/\s(BKN|OVC)(\d{3})/)
    if (cloudMatch) {
      parts.push(`Techo ${cloudMatch[1]} a ${parseInt(cloudMatch[2]) * 100} pies.`)
    } else {
      const anyCloud = raw.match(/\s(FEW|SCT)(\d{3})/)
      if (anyCloud) {
        parts.push(`${cloudQtyText(anyCloud[1])} a ${parseInt(anyCloud[2]) * 100} pies.`)
      }
    }
  }
  return parts.join(' ')
}

// ─── Fetch Weather ────────────────────────────────────────────────────

async function fetchWeather(icao: string) {
  const cached = weatherCache.get(icao)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  let metarRaw: string | null = null
  let tafRaw: string | null = null
  let source = 'simulated'

  try {
    // Aviationweather.gov API response fields:
    //   METAR endpoint → returns objects with `rawOb` (the raw METAR string)
    //   TAF endpoint   → returns objects with `rawTAF` (the raw TAF string)
    // Older API versions used `rawText` for both — kept as fallback for resilience.
    const [metarRes, tafRes] = await Promise.all([
      fetchWithTimeout(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, 8000),
      fetchWithTimeout(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`, 8000),
    ])
    if (metarRes?.ok) {
      const d = await metarRes.json()
      if (Array.isArray(d) && d.length > 0) {
        metarRaw = d[0].rawOb || d[0].rawText || d[0].rawObs || null
      }
    }
    if (tafRes?.ok) {
      const d = await tafRes.json()
      if (Array.isArray(d) && d.length > 0) {
        tafRaw = d[0].rawTAF || d[0].rawText || null
      }
    }
    if (metarRaw || tafRaw) source = 'aviationweather.gov'
  } catch {
    // fall through to simulated
  }

  if (!metarRaw) {
    metarRaw = generateSampleMetar(icao)
    if (source !== 'aviationweather.gov') source = 'simulated'
  }
  if (!tafRaw) {
    tafRaw = generateSampleTaf(icao)
    if (source !== 'aviationweather.gov') source = 'simulated'
  }

  const parsedMetar = metarRaw ? parseMetar(metarRaw) : null
  const parsedTaf = tafRaw ? { raw: tafRaw, time: new Date().toISOString(), periods: parseTafPeriods(tafRaw) } : null

  const data = {
    metar: parsedMetar,
    taf: parsedTaf,
    fetchedAt: new Date().toISOString(),
    source,
  }

  weatherCache.set(icao, { data, timestamp: Date.now() })
  return data
}

// ─── NOTAM Structured Parser ──────────────────────────────────────────

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
  priority: string
  source: string | null
  verified: boolean
  airport?: { icaoCode: string; name: string; city: string } | null
  status: 'vigente' | 'upcoming' | 'expired' | 'perm'
  qCode?: string
  fields: { label: string; value: string }[]
}

function parseNotamFields(text: string): { qCode?: string; fields: { label: string; value: string }[] } {
  const fields: { label: string; value: string }[] = []
  let qCode: string | undefined

  // Extract Q) line
  const qMatch = text.match(/Q\)\s*([^\n\r]+)/)
  if (qMatch) {
    qCode = qMatch[1].trim().split('/')[0]
    fields.push({ label: 'Q)', value: qMatch[1].trim() })
  }

  // Extract A) B) C) D) E) F) G) fields
  const fieldPattern = /([A-G])\)\s*([^\n\r]*(?:\n(?![A-G]\))[^\n\r]*)*)/g
  let match
  while ((match = fieldPattern.exec(text)) !== null) {
    const label = `${match[1]})`
    const value = match[2].trim().replace(/\s+/g, ' ')
    // Avoid duplicating Q) which was already added
    if (label !== 'Q)' && !fields.some((f) => f.label === label)) {
      fields.push({ label, value })
    }
  }

  return { qCode, fields }
}

// ─── GET Handler ──────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icao: string }> }
) {
  try {
    const { icao } = await params
    const code = icao.toUpperCase()

    if (!code.startsWith('SP')) {
      return NextResponse.json({ error: 'ICAO code must start with SP' }, { status: 400 })
    }

    // Station metadata
    const meta: PeruvianStation | undefined = PERUVIAN_STATIONS_BY_ICAO.get(code)
    const dbAirport = await db.airport.findUnique({
      where: { icaoCode: code },
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        department: true,
        elevation: true,
        category: true,
        arpLatitude: true,
        arpLongitude: true,
        communications: { select: { service: true, frequency: true, callsign: true } },
      },
    })

    // Build station info
    const stationInfo = {
      icao: code,
      iata: meta?.iata,
      name: meta?.name || dbAirport?.name || code,
      city: meta?.city || dbAirport?.city || '—',
      region: meta?.region || dbAirport?.region || dbAirport?.department || undefined,
      type: meta?.type || dbAirport?.category || 'NACIONAL',
      elevationFt: meta?.elevationFt,
      lat: meta?.lat ?? -12.0,
      lon: meta?.lon ?? -77.0,
      frequencies: meta?.frequencies,
    }

    // Fetch weather
    const weather = await fetchWeather(code)

    // Build readable text
    const metarReadableText = weather.metar ? metarReadable(code, weather.metar) : 'METAR no disponible.'
    const tafReadableText = weather.taf ? tafReadable(code, weather.taf) : 'TAF no disponible.'

    // Summary based on flight category
    let summary = 'Condiciones normales'
    let summaryColor: 'green' | 'amber' | 'red' = 'green'
    if (weather.metar) {
      const cat = weather.metar.flightCategory
      if (cat === 'IFR' || cat === 'LIFR') {
        summary = `Condiciones ${cat} — restricciones operacionales`
        summaryColor = 'red'
      } else if (cat === 'MVFR') {
        summary = 'Condiciones MVFR — precaución'
        summaryColor = 'amber'
      } else {
        summary = 'Condiciones normales (VFR)'
        summaryColor = 'green'
      }
    }

    // Fetch NOTAMs for this station
    const now = new Date()
    let notams: StructuredNotam[] = []

    if (dbAirport) {
      const dbNotams = await db.notam.findMany({
        where: {
          OR: [
            { airportId: dbAirport.id },
            { fir: 'SPIM', airportId: null, text: { contains: code } },
          ],
        },
        include: { airport: { select: { icaoCode: true, name: true, city: true } } },
        orderBy: [{ effectiveFrom: 'desc' }],
        take: 100,
      })

      notams = dbNotams.map((n) => {
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
          priority: n.priority,
          source: n.source,
          verified: n.verified,
          airport: n.airport,
          status: (n.isPermanent ? 'perm' : status) as StructuredNotam['status'],
          qCode: parsed.qCode,
          fields: parsed.fields,
        }
      })
    }

    // Determine last update time
    const lastUpdate = weather.metar?.time || weather.taf?.time || weather.fetchedAt

    return NextResponse.json({
      station: stationInfo,
      weather: {
        ...weather,
        metarReadable: metarReadableText,
        tafReadable: tafReadableText,
      },
      notams,
      notamCount: notams.length,
      summary,
      summaryColor,
      lastUpdate,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching station detail:', error)
    return NextResponse.json({ error: 'Failed to fetch station detail' }, { status: 500 })
  }
}
