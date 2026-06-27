/**
 * Parser de NOTAMs OACI — versión TypeScript (espejo del parser Python).
 *
 * Extrae NOTAMs en formato OACI de un texto plano pegado manualmente o
 * recibido por email. Cada NOTAM se estructura así:
 *
 *     A1234/25 NOTAMN
 *     Q) SPIM/QFALC/IV/NBO/A/000/999/...
 *     A) SPJC
 *     B) 2501151200
 *     C) 2501161200           (o "C) PERM")
 *     D) 1200-1400             (opcional)
 *     E) RWY 15/33 CLOSED...
 *     F) ...
 *     G) ...
 *
 * Tipos reconocidos: NOTAMN (nuevo), NOTAMR (reemplaza), NOTAMC (cancela).
 * Las fechas B)/C) son UTC en formato YYMMDDHHmm.
 */

import { PERUVIAN_ICAOS } from './peru-stations'

// ----------------------------------------------------------------------------
// Regex (espejo de scripts/notam-email-parser.py)
// ----------------------------------------------------------------------------

// Cabecera: "A1234/25 NOTAMN" | "A1234/25 NOTAMR A0999/25" | "A1234/25 NOTAMC A0999/25"
// Acepta espacios flexibles.
//
// La palabra "NOTAM" es OPCIONAL: muchos boletines CORPAC enviados por correo
// vienen solo con "A1234/25" seguido de "Q) SPIM/..." sin la palabra clave.
// Para evitar falsos positivos (un número "A1234/25" mencionado en texto
// normal), exigimos que en los próximos 300 caracteres aparezca "Q) XXXX/"
// o "A) XXXX" (formato OACI).
const NOTAM_HEADER_RE = /(?:^|\n)[ \t]*([A-Z]\d{3,4})\s*\/\s*(\d{2})(?:[ \t]+NOTAM([NRCA]?)\b)?(?=[\s\S]{0,300}?(?:Q\)\s*[A-Z]{4}\s*\/|A\)\s*[A-Z]{4}\b))/gi

// Metadata inter-NOTAM del portal AIS Perú.
// El portal inserta, antes de cada NOTAM, una línea con el formato:
//     "SPZO - CUSCO"
//     "18/06/2026 01:04:00"
// (o variantes como "SPZO - CUSCO 10/12/2025" en una sola línea).
// Esta metadata NO es parte del NOTAM anterior — el parser la corta del mensaje.
//
// Patrón 1 (dos líneas): "ICAO - CIUDAD" en una línea, seguido de fecha DD/MM/YYYY HH:MM:SS en la siguiente.
// Patrón 2 (una línea): "ICAO - CIUDAD  DD/MM/YYYY HH:MM:SS" (separados por 2+ espacios o tab).
// Patrón 3 (solo fecha): una línea aislada con "DD/MM/YYYY HH:MM:SS" tras el campo G) o tras una línea en blanco.
//
// Para no romper mensajes que casualmente contengan "SPXX - Something", exigimos:
//   - ICAO debe ser peruano (conjunto PERUVIAN_ICAOS).
//   - La fecha debe tener formato DD/MM/YYYY HH:MM:SS o DD/MM/YYYY.
const INTER_NOTAM_META_RE = new RegExp(
  [
    // Patrón 1: "SPXX - CIUDAD\nDD/MM/YYYY HH:MM:SS" (salto directo)
    `(?:\\b(?:${Array.from(PERUVIAN_ICAOS).join('|')})\\b\\s*-\\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s]{1,40}\\s*\\n\\s*\\d{1,2}/\\d{1,2}/\\d{4}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?)`,
    // Patrón 1b: "SPXX - CIUDAD\n\nDD/MM/YYYY HH:MM:SS" (con línea en blanco)
    `|(?:\\b(?:${Array.from(PERUVIAN_ICAOS).join('|')})\\b\\s*-\\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s]{1,40}\\s*\\n\\s*\\n\\s*\\d{1,2}/\\d{1,2}/\\d{4}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?)`,
    // Patrón 2: "SPXX - CIUDAD  DD/MM/YYYY HH:MM:SS" (una sola línea, 2+ espacios o tab)
    `|(?:\\b(?:${Array.from(PERUVIAN_ICAOS).join('|')})\\b\\s*-\\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s]{1,40}\\s{2,}\\d{1,2}/\\d{1,2}/\\d{4}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?)`,
    // Patrón 3: línea aislada con fecha sola, SOLO si va después de una línea en blanco o es la última del chunk
    `|(?:\\n\\s*\\n\\s*\\d{1,2}/\\d{1,2}/\\d{4}\\s+\\d{1,2}:\\d{2}(?::\\d{2})?\\s*$)`,
  ].join(''),
  'i',
)

// Q) SPIM/QFALC/...
const Q_LINE_RE = /Q\)\s*([A-Z]{4})\s*\/\s*([A-Z]+)/i

// A) SPJC
const A_LINE_RE = /A\)\s*([A-Z]{4})\b/i

// B) y C): "B) 2501151200" o "B) 2501151200 EST" o "C) PERM"
const DATE_LINE_RE = /([BC])\)\s*(PERM|EST|\d{6}(?:\d{4})?)/gi

// Referencia: en NOTAMR/NOTAMC, el ID referenciado aparece justo después
const REF_RE = /NOTAM[RC]\s+([A-Z]\d{3,4}\s*\/\s*\d{2})/i

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

export type NotamType = 'NOTAMN' | 'NOTAMR' | 'NOTAMC' | 'NOTAMA'

export interface ParsedNotam {
  icao: string
  notam_id: string
  notam_type: NotamType
  ref_notam_id: string | null
  message: string
  summary: string
  filed: string | null
  valid_from: string | null
  valid_to: string | null
  classification: string | null
  q_code: string | null      // Q-code OACI completo (e.g. "QFALC", "QWLLW")
  location_a: string | null  // Designador de lugar del campo A) (e.g. "SPJC", "SPIM")
  source_email_id: string
}

export interface IngestResult {
  parsed: ParsedNotam[]
  inserted: ParsedNotam[]
  skipped: ParsedNotam[]
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/**
 * Convierte "250115" + "1200" → "2025-01-15T12:00:00Z".
 * Si recibe "PERM" o "EST", devuelve el literal.
 */
function parseNotamDate(value: string): string | null {
  if (!value) return null
  const upper = value.toUpperCase()
  if (upper === 'PERM' || upper === 'EST') return upper

  // Formato esperado: YYMMDD o YYMMDDHHmm
  const m = /^(\d{2})(\d{2})(\d{2})(\d{0,4})$/.exec(upper)
  if (!m) return null

  const yy = parseInt(m[1], 10)
  const year = yy < 80 ? 2000 + yy : 1900 + yy
  const mm = parseInt(m[2], 10)
  const dd = parseInt(m[3], 10)
  let hh = 0
  let mi = 0
  if (m[4] && m[4].length >= 4) {
    hh = parseInt(m[4].slice(0, 2), 10)
    mi = parseInt(m[4].slice(2, 4), 10)
  } else if (m[4] && m[4].length >= 2) {
    hh = parseInt(m[4].slice(0, 2), 10)
  }

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh > 23 || mi > 59) return null

  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${year}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(mi)}:00Z`
}

function extractIcao(message: string): string | null {
  const m = A_LINE_RE.exec(message)
  if (m) {
    const icao = m[1].toUpperCase()
    if (PERUVIAN_ICAOS.has(icao)) return icao
  }
  // Fallback: buscar cualquier ICAO peruano mencionado
  for (const sp of PERUVIAN_ICAOS) {
    const re = new RegExp(`\\b${sp}\\b`)
    if (re.test(message)) return sp
  }
  return null
}

/**
 * Summary = primeras 200 chars del campo E), o del mensaje completo si no hay E).
 */
function extractSummary(message: string): string {
  const m = /E\)\s*([\s\S]*?)(?:\n[A-Z]\)|$)/i.exec(message)
  const raw = m ? m[1] : message
  return raw.replace(/\s+/g, ' ').trim().slice(0, 200)
}

// ----------------------------------------------------------------------------
// API
// ----------------------------------------------------------------------------

/**
 * Extrae todos los NOTAMs del texto plano.
 *
 * Soporta NOTAMs pegados manualmente desde el portal AIS Perú (con o sin
 * línea de cabecera "dd/mm/yyyy HH:mm:ss" antes de cada NOTAM).
 */
export function parseNotams(text: string, sourceEmailId = 'manual'): ParsedNotam[] {
  const items: ParsedNotam[] = []

  // Normalizar saltos de línea y quoted-printable
  let normalized = text.replace(/=\r?\n/g, '')
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Encontrar todos los inicios de NOTAM
  const starts: number[] = []
  let m: RegExpExecArray | null
  NOTAM_HEADER_RE.lastIndex = 0
  while ((m = NOTAM_HEADER_RE.exec(normalized)) !== null) {
    starts.push(m.index)
  }
  if (starts.length === 0) return items

  starts.push(normalized.length)

  for (let i = 0; i < starts.length - 1; i++) {
    const chunk = normalized.slice(starts[i], starts[i + 1])

    NOTAM_HEADER_RE.lastIndex = 0
    const hm = NOTAM_HEADER_RE.exec(chunk)
    if (!hm) continue

    const notamSeq = hm[1].toUpperCase()
    const notamYear = hm[2]
    const kindRaw = (hm[3] || '').toUpperCase()
    const notamId = `${notamSeq}/${notamYear}`

    let notamType: NotamType
    if (kindRaw === 'N') notamType = 'NOTAMN'
    else if (kindRaw === 'R') notamType = 'NOTAMR'
    else if (kindRaw === 'C') notamType = 'NOTAMC'
    else if (kindRaw === 'A') notamType = 'NOTAMA'
    else notamType = 'NOTAMN'

    // NOTAM referenciado (R/C)
    let refNotamId: string | null = null
    if (notamType === 'NOTAMR' || notamType === 'NOTAMC') {
      const rm = REF_RE.exec(chunk)
      if (rm) refNotamId = rm[1].replace(/\s+/g, '').toUpperCase()
    }

    // Q) → clasificación + Q-code completo
    let classification: string | null = null
    let qCode: string | null = null
    const qm = Q_LINE_RE.exec(chunk)
    if (qm) {
      classification = qm[2].toUpperCase()
      qCode = qm[2].toUpperCase()
    }

    // A) → designador de lugar (locationA)
    let locationA: string | null = null
    const am = A_LINE_RE.exec(chunk)
    if (am) {
      locationA = am[1].toUpperCase()
    }

    // B) y C) → fechas
    let validFrom: string | null = null
    let validToEnd: string | null = null // valor literal de C)
    DATE_LINE_RE.lastIndex = 0
    let dm: RegExpExecArray | null
    while ((dm = DATE_LINE_RE.exec(chunk)) !== null) {
      const which = dm[1].toUpperCase()
      const val = dm[2].toUpperCase()
      if (which === 'B') {
        validFrom = parseNotamDate(val)
      } else if (which === 'C') {
        validToEnd = val
      }
    }

    // Resolver valid_to: PERM | EST | ISO
    let validTo: string | null = null
    if (validToEnd === 'PERM') {
      validTo = 'PERM'
    } else if (validToEnd === 'EST') {
      // "EST" = estimated. La fecha real viene en el campo B..C numérico que
      // acabamos de parsear. Pero el regex solo capturó "EST". Necesitamos
      // volver a buscar el patrón "C) 2606272359 EST".
      const cEst = /C\)\s*(\d{6}(?:\d{4})?)\s*EST/i.exec(chunk)
      validTo = cEst ? parseNotamDate(cEst[1]) : null
    } else if (validToEnd) {
      validTo = parseNotamDate(validToEnd)
    }

    // Mensaje limpio
    let message = chunk.trim()

    // ── Cortar metadata inter-NOTAM del portal AIS Perú ──────────────
    // El portal inserta entre NOTAMs líneas como:
    //   "SPEO - CHIMBOTE"
    //   "18/06/2026 01:04:00"
    // que NO son parte del NOTAM actual sino el encabezado del siguiente.
    // Las detectamos y truncamos el mensaje antes de esa línea.
    const metaMatch = INTER_NOTAM_META_RE.exec(message)
    if (metaMatch && metaMatch.index > 0) {
      // Solo truncamos si el match aparece DESPUÉS del cuerpo útil del NOTAM
      // (es decir, después del campo E) o del último campo OACI válido).
      // Si el match aparece muy al inicio, probablemente es un falso positivo
      // y no cortamos.
      const beforeMeta = message.slice(0, metaMatch.index).trim()
      if (beforeMeta.length >= 30) {
        // Tomamos también cualquier campo F)/G) que pudiera quedar en el chunk
        // antes de la metadata. El corte se hace en metaMatch.index.
        message = beforeMeta
      }
    }

    message = message.replace(/\n{3,}/g, '\n\n')
    const summary = extractSummary(message)

    // ICAO
    const icao = extractIcao(message)
    if (!icao) continue // no es de FIR SPIM

    items.push({
      icao,
      notam_id: notamId,
      notam_type: notamType,
      ref_notam_id: refNotamId,
      message: message.slice(0, 8000),
      summary,
      filed: null,
      valid_from: validFrom,
      valid_to: validTo,
      classification,
      q_code: qCode,
      location_a: locationA,
      source_email_id: sourceEmailId,
    })
  }

  return items
}

// ----------------------------------------------------------------------------
// Utilidades para el frontend (SPIM Briefing)
// ----------------------------------------------------------------------------

/**
 * Convierte un ISO 8601 (posiblemente sin 'Z') a timestamp ms.
 * Devuelve null si la fecha es inválida.
 */
export function parseIsoMs(iso: string): number | null {
  try {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
    const t = d.getTime()
    return Number.isNaN(t) ? null : t
  } catch {
    return null
  }
}

/**
 * Devuelve el estado de vigencia de un NOTAM según sus fechas:
 *  - 'upcoming'  : valid_from en el futuro
 *  - 'active'    : vigente ahora (PERM cuenta como activo)
 *  - 'expired'   : valid_to en el pasado
 *  - 'unknown'   : no hay fechas suficientes
 */
export function notamStatus(
  validFrom?: string | null,
  validTo?: string | null,
): 'upcoming' | 'active' | 'expired' | 'unknown' {
  if (validTo === 'PERM') return 'active'
  if (!validTo) return 'unknown'
  const now = Date.now()
  const to = parseIsoMs(validTo)
  if (to !== null && to < now) return 'expired'
  if (validFrom) {
    const from = parseIsoMs(validFrom)
    if (from !== null && from > now) return 'upcoming'
  }
  return 'active'
}

/**
 * Formatea los ms restantes como "DDd HH:MM:SS" o "HH:MM:SS".
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
