/**
 * Cliente de la API pública de NOTAMs de la FAA (USNS).
 *
 * Por qué existe este módulo:
 *   - En el sandbox original, los NOTAMs se cargaban vía un pipeline IMAP→SQLite
 *     (scripts/notam-email-parser.py) que lee correos de AIS Perú desde Gmail.
 *   - En producción serverless (Vercel) ese pipeline no puede ejecutarse, por lo
 *     tanto la base de datos Neon queda vacía y la pestaña NOTAM no muestra nada.
 *   - La FAA publica NOTAMs internacionales (incluyendo FIR SPIM y todos los
 *     aeropuertos peruanos) en https://notams.aim.faa.gov/notamSearch/search
 *     con respuesta JSON y formato OACI completo en el campo `icaoMessage`.
 *
 * Estrategia:
 *   1) El endpoint /api/notams consulta primero la base de datos local.
 *   2) Si la base está vacía (o se solicita explícitamente), se hace fallback
 *      en vivo a la FAA con la lista de ICAOs peruanos.
 *   3) El texto crudo OACI (Q) A) B) C) D) E) F) G)) se devuelve intacto en
 *      el campo `text` — el usuario siempre ve el mensaje original, nunca una
 *      interpretación del sistema.
 *
 * Sin tokens ni API keys — es un endpoint público del gobierno de EE.UU.
 */

import { parseNotams, type ParsedNotam } from './notam-parser'

// ─── Tipos ────────────────────────────────────────────────────────────────

interface FaaNotamItem {
  facilityDesignator: string
  notamNumber: string
  icaoMessage: string
  startDate?: string
  endDate?: string
  featureName?: string
  icaoId?: string
  airportName?: string
  cancelledOrExpired?: boolean
  status?: string
}

interface FaaApiResponse {
  notamList?: FaaNotamItem[]
  totalNotamCount?: number
  error?: string
}

export interface NormalizedNotam {
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
  source: string
  verified: boolean
  airport: { icaoCode: string; name: string; city: string | null } | null
  createdAt: Date
  updatedAt: Date
}

// ─── Constantes ───────────────────────────────────────────────────────────

const FAA_ENDPOINT = 'https://notams.aim.faa.gov/notamSearch/search'

// Aeropuertos peruanos principales — la FAA devuelve NOTAMs para estos
// casi siempre. Los demás ICAOs peruanos pequeños rara vez tienen NOTAMs
// propios, pero si el usuario filtra por un aeropuerto específico, se
// consulta directamente a la FAA con ese código.
const MAJOR_PERUVIAN_ICAOS = [
  'SPIM', // FIR Lima (NOTAMs a nivel de FIR)
  'SPJC', // Jorge Chávez (Lima)
  'SPZO', // Rodríguez Ballón (Arequipa)
  'SPHI', // José Quiñones (Chiclayo)
  'SPQT', // Coronel FAP Francisco Secada Vignetta (Iquitos)
  'SPQU', // Rodríguez Ballón alterno (Arequipa) — en realidad SPZO
  'SPCL', // FAP David Abensur (Pucallpa)
  'SPRU', // Cap. FAP José A. Quiñones (Talara)
  'SPTU', // Jorge Chávez pista alterna (Tacna)
  'SPLO', // Jorge Chávez (Jauja)
  'SPME', // Tnte. Montagne (Moyobamba)
] as const

const TIMEOUT_MS = 12000

// ─── Fetch con timeout ────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, body: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AIP-Peru/1.0 (aip-peru.vercel.app)',
        Accept: 'application/json',
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Helpers de parsing ───────────────────────────────────────────────────

/**
 * Llama a la FAA y devuelve la lista cruda de NOTAMs (sin normalizar).
 */
async function fetchFaaNotams(icaos: string[]): Promise<FaaNotamItem[]> {
  if (icaos.length === 0) return []
  const designators = icaos.join(',')
  const body = `searchType=0&designatorsForLocation=${encodeURIComponent(designators)}&operationMode=1&offSet=0`

  const response = await fetchWithTimeout(FAA_ENDPOINT, body, TIMEOUT_MS)
  if (!response || !response.ok) return []

  try {
    const data = (await response.json()) as FaaApiResponse
    if (!data || data.error) return []
    return Array.isArray(data.notamList) ? data.notamList : []
  } catch {
    return []
  }
}

/**
 * Convierte "YYMMDDHHmm" (formato OACI) a Date UTC.
 * Ej: "2601240100" → 2026-01-24T01:00:00Z
 */
function parseOaciDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const v = value.trim().toUpperCase()
  if (v === 'PERM' || v === 'EST' || v === '') return null

  // YYMMDDHHmm
  const m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(v)
  if (m) {
    const yy = parseInt(m[1], 10)
    const year = yy < 80 ? 2000 + yy : 1900 + yy
    const mm = parseInt(m[2], 10)
    const dd = parseInt(m[3], 10)
    const hh = parseInt(m[4], 10)
    const mi = parseInt(m[5], 10)
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh > 23 || mi > 59) return null
    return new Date(Date.UTC(year, mm - 1, dd, hh, mi, 0))
  }
  // YYMMDDHHmm sin minutos (raro)
  const m2 = /^(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(v)
  if (m2) {
    const yy = parseInt(m2[1], 10)
    const year = yy < 80 ? 2000 + yy : 1900 + yy
    const mm = parseInt(m2[2], 10)
    const dd = parseInt(m2[3], 10)
    const hh = parseInt(m2[4], 10)
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh > 23) return null
    return new Date(Date.UTC(year, mm - 1, dd, hh, 0, 0))
  }
  return null
}

/**
 * Heurística simple para asignar prioridad basada en el código Q).
 *
 * Q-codes relevantes (subset OACI):
 *   - QMRLC, QMRAS, QMRAC  → runway closed, aircraft safety → HIGH
 *   - QFALC, QFAXX          → aerodrome facilities → MEDIUM
 *   - QNAAA, QNAxx          → airspace navigation warnings → HIGH
 *   - QWLLW, QWALW          → low-level wind shear → HIGH
 *   - QPXAO, QPxxx          → procedure changes → MEDIUM
 *
 * No es exhaustiva — cualquier Q-code no reconocido cae en MEDIUM.
 */
function priorityFromQCode(qCode: string | undefined, text: string): string {
  const q = (qCode || '').toUpperCase()
  const textUpper = text.toUpperCase()

  // Urgentes: cierres de pista, aerovías, aproximaciones
  if (q.startsWith('QMRL') || q.startsWith('QMRH') || q.startsWith('QMRA')) return 'URGENT'
  if (q.startsWith('QFALC') || q.startsWith('QFAXX')) return 'HIGH'
  if (q.startsWith('QNAA') || q.startsWith('QNA')) return 'HIGH'
  if (q.startsWith('QWLLW') || q.startsWith('QWALW')) return 'HIGH'

  // Palabras clave en el texto
  if (textUpper.includes('CLOSED') || textUpper.includes('CERRADA') || textUpper.includes('CERRADO')) return 'HIGH'
  if (textUpper.includes('UNAVAILABLE') || textUpper.includes('NO DISPONIBLE')) return 'HIGH'
  if (textUpper.includes('SUSPENDED') || textUpper.includes('SUSPENDID')) return 'HIGH'

  return 'MEDIUM'
}

/**
 * Extrae el Q-code y el scope de la línea Q).
 * Formato: Q) SPIM/QFALC/IV/NBO/A/000/999/1201S07707W005
 *                  ^^^^^^
 *                  Q-code (6 letras)
 *                                     ^
 *                                     Scope (A/E/W/...)
 */
function extractQFields(text: string): {
  qCode?: string
  scope?: string | null
  subject?: string
  condition?: string
  fir?: string
  coordinates?: string | null
  lat?: number | null
  lon?: number | null
  radius?: number | null
  lowerLimit?: string | null
  upperLimit?: string | null
} {
  const result: ReturnType<typeof extractQFields> = {}

  const qMatch = text.match(/Q\)\s*([A-Z]{4})\s*\/\s*([A-Z]{5,6})\s*\/\s*([A-Z]{2})\s*\/\s*([A-Z]{3})\s*\/\s*([AEW])\s*\/\s*(\d{3})\s*\/\s*(\d{3})\s*\/\s*(\d{4}[NS]\d{5}[EW]\d{3,})/i)
  if (qMatch) {
    result.fir = qMatch[1].toUpperCase()
    result.qCode = qMatch[2].toUpperCase()
    result.scope = qMatch[5].toUpperCase()
    result.lowerLimit = qMatch[6] === '000' ? 'SFC' : qMatch[6]
    result.upperLimit = qMatch[7] === '999' ? 'UNL' : qMatch[7]
    result.coordinates = qMatch[8].toUpperCase()

    // Parse coords: 1201S07707W005 → lat=-12.0167, lon=-77.1167, radius=5NM
    const coordMatch = qMatch[8].match(/^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])(\d{3})$/i)
    if (coordMatch) {
      const latDeg = parseInt(coordMatch[1], 10)
      const latMin = parseInt(coordMatch[2], 10)
      const lonDeg = parseInt(coordMatch[4], 10)
      const lonMin = parseInt(coordMatch[5], 10)
      result.lat = (latDeg + latMin / 60) * (coordMatch[3].toUpperCase() === 'S' ? -1 : 1)
      result.lon = (lonDeg + lonMin / 60) * (coordMatch[6].toUpperCase() === 'W' ? -1 : 1)
      result.radius = parseInt(coordMatch[7], 10)
    }

    // Subject y condition derivados del Q-code
    result.subject = qMatch[2].toUpperCase()
    result.condition = qMatch[5].toUpperCase()
  } else {
    // Fallback simple: solo capturar FIR y Q-code
    const simpleQ = text.match(/Q\)\s*([A-Z]{4})\s*\/\s*([A-Z]+)/i)
    if (simpleQ) {
      result.fir = simpleQ[1].toUpperCase()
      result.qCode = simpleQ[2].toUpperCase()
      result.subject = simpleQ[2].toUpperCase()
    }
  }

  return result
}

/**
 * Normaliza un NOTAM de la FAA al formato que usa la base de datos
 * (compatible con el frontend NotamListing).
 */
function normalizeFaaItem(item: FaaNotamItem): NormalizedNotam | null {
  if (!item.icaoMessage || item.icaoMessage.trim().length === 0) return null

  // El parser de email espera texto plano — funciona igual de bien
  // con el icaoMessage de la FAA porque tiene el mismo formato OACI.
  const parsed: ParsedNotam | undefined = parseNotams(item.icaoMessage, 'faa-live')[0]
  if (!parsed) return null

  const qFields = extractQFields(item.icaoMessage)

  const effectiveFrom = parseOaciDate(parsed.valid_from) ?? new Date()
  let effectiveTo: Date | null = parseOaciDate(parsed.valid_to)
  const isPermanent = parsed.valid_to?.toUpperCase() === 'PERM'

  // Si no es permanente y no se pudo parsear la fecha, usar la endDate de la FAA
  if (!effectiveTo && !isPermanent && item.endDate && item.endDate !== 'PERM') {
    // La FAA usa formato "MM/DD/YYYY HHmm" — no es OACI. Intentamos ese.
    const faaDate = item.endDate.trim()
    const m = faaDate.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})(\d{2})/)
    if (m) {
      effectiveTo = new Date(Date.UTC(
        parseInt(m[3], 10),
        parseInt(m[1], 10) - 1,
        parseInt(m[2], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        0
      ))
    }
  }

  const priority = priorityFromQCode(qFields.qCode, item.icaoMessage)
  const fir = qFields.fir || parsed.icao?.startsWith('SP') ? 'SPIM' : (qFields.fir || 'SPIM')

  return {
    id: `faa-${item.facilityDesignator}-${item.notamNumber.replace(/[\/\s]/g, '-')}`,
    notamId: item.notamNumber,
    type: parsed.notam_type,
    replacesId: parsed.ref_notam_id,
    fir: fir || 'SPIM',
    effectiveFrom,
    effectiveTo: isPermanent ? null : effectiveTo,
    isPermanent,
    scope: qFields.scope ?? null,
    subject: qFields.subject || parsed.classification || 'NOTAM',
    condition: qFields.condition || '',
    text: item.icaoMessage.trim(), // TEXTO CRUDO — el usuario siempre ve el original
    coordinates: qFields.coordinates ?? null,
    lat: qFields.lat ?? null,
    lon: qFields.lon ?? null,
    radius: qFields.radius ?? null,
    lowerLimit: qFields.lowerLimit ?? null,
    upperLimit: qFields.upperLimit ?? null,
    airportId: null, // se asigna luego si hay match con DB
    priority,
    source: 'FAA USNS (live)',
    verified: false,
    airport: parsed.icao
      ? { icaoCode: parsed.icao, name: item.airportName || parsed.icao, city: null }
      : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ─── API pública ──────────────────────────────────────────────────────────

/**
 * Obtiene NOTAMs en vivo desde la FAA.
 *
 * Uso típico:
 *   - Sin filtros: devuelve NOTAMs para SPIM (FIR) + principales aeropuertos.
 *   - Con `airportIcao`: devuelve NOTAMs solo para ese aeropuerto.
 *
 * @param airportIcao  Código ICAO del aeropuerto (ej: "SPJC"). Si se pasa,
 *                     solo se consultan NOTAMs para ese aeropuerto.
 * @param fir           Código FIR (ej: "SPIM"). Por defecto "SPIM".
 */
export async function fetchLiveNotams(
  airportIcao?: string,
  fir = 'SPIM'
): Promise<NormalizedNotam[]> {
  let icaos: string[]
  if (airportIcao) {
    icaos = [airportIcao.toUpperCase()]
  } else {
    // FIR-wide: FIR + major airports
    icaos = Array.from(new Set([fir.toUpperCase(), ...MAJOR_PERUVIAN_ICAOS]))
  }

  const items = await fetchFaaNotams(icaos)
  if (items.length === 0) return []

  const normalized: NormalizedNotam[] = []
  const seen = new Set<string>()

  for (const item of items) {
    // Saltar NOTAMs cancelados/expirados explícitamente
    if (item.cancelledOrExpired === true) continue

    const n = normalizeFaaItem(item)
    if (!n) continue

    // Deduplicar por notamId (la FAA puede devolver el mismo NOTAM dos veces
    // si se consulta por FIR y por aeropuerto a la vez).
    if (seen.has(n.notamId)) continue
    seen.add(n.notamId)

    normalized.push(n)
  }

  return normalized
}

/**
 * Versión que devuelve solo NOTAMs activos o próximos (no expirados).
 */
export async function fetchActiveLiveNotams(
  airportIcao?: string,
  fir = 'SPIM'
): Promise<NormalizedNotam[]> {
  const all = await fetchLiveNotams(airportIcao, fir)
  const now = Date.now()
  return all.filter((n) => {
    if (n.isPermanent) return true
    if (!n.effectiveTo) return true
    return n.effectiveTo.getTime() >= now
  })
}
