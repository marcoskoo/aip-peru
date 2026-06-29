#!/usr/bin/env node
/**
 * Extrae aeródromos de prisma/seed.ts que FALTAN en el fallback estático.
 * Parser brace-aware: encuentra cada bloque `{ icaoCode: "SPXX", ... }`
 * contando llaves para no cortarse en objetos anidados (runways, etc.).
 */
import { readFileSync, writeFileSync } from 'fs'

const SEED = readFileSync('prisma/seed.ts', 'utf-8')
const STATIC = readFileSync('src/lib/aviation/peru-airports-static.ts', 'utf-8')

const existingIcao = new Set(
  [...STATIC.matchAll(/"icao":\s*"(SP[A-Z]{2})"/g)].map(m => m[1])
)
console.log('Static existing:', existingIcao.size, 'airports')

// Encuentra cada `icaoCode: "SPXX"` y parsea el objeto que lo contiene
// (hacia atrás busca `{` y hacia adelante cuenta braces hasta cerrar).
function findAirportObjects(src) {
  const results = []
  const re = /icaoCode:\s*"(SP[A-Z]{2})"/g
  let m
  while ((m = re.exec(src)) !== null) {
    const icao = m[1]
    const matchEnd = m.index + m[0].length
    // buscar el `{` de apertura hacia atrás (el más cercano antes de icaoCode)
    let openIdx = -1
    for (let i = m.index - 1; i >= 0; i--) {
      if (src[i] === '{') { openIdx = i; break }
      if (src[i] === '}') break  // salimos si encontramos cierre antes que apertura
    }
    if (openIdx < 0) continue
    // contar braces hacia adelante desde openIdx
    let depth = 0
    let closeIdx = -1
    for (let i = openIdx; i < src.length; i++) {
      const ch = src[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { closeIdx = i; break }
      }
    }
    if (closeIdx < 0) continue
    const body = src.slice(openIdx, closeIdx + 1)
    results.push({ icao, body })
  }
  return results
}

const all = findAirportObjects(SEED)
console.log('Total airport objects in seed.ts:', all.length)

// dedupe por icao (puede aparecer en múltiples createMany)
const byIcao = new Map()
for (const a of all) {
  if (!byIcao.has(a.icao)) byIcao.set(a.icao, a)
}
console.log('Unique airports in seed.ts:', byIcao.size)

const missing = [...byIcao.values()].filter(a => !existingIcao.has(a.icao))
console.log('Missing airports:', missing.length)
console.log(missing.map(a => a.icao).sort().join(', '))

// ─── Helpers de extracción ──────────────────────────────────────
function getField(body, key) {
  // captura string: `key: "value"` (value puede tener comillas escapadas \")
  const r = new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'm')
  const mm = body.match(r)
  return mm ? mm[1].replace(/\\"/g, '"') : ''
}

function dmsToDecimal(dms) {
  if (!dms) return null
  // Normalizar: º (U+00BA) → ° (U+00B0), \" → ", '' → '
  const cleaned = dms.replace(/\\"/g, '"').replace(/''/g, "'").replace(/º/g, '°')
  // DD°MM'SS.ss"H
  let mm = cleaned.match(/(\d+)°(\d+)'([\d.]+)["']?\s*([NSEW])/i)
  if (mm) {
    const d = parseFloat(mm[1])
    const min = parseFloat(mm[2])
    const sec = parseFloat(mm[3])
    let dec = d + min / 60 + sec / 3600
    if (/[SW]/i.test(mm[4])) dec = -dec
    return dec
  }
  // DD°MM'H (sin segundos)
  mm = cleaned.match(/(\d+)°(\d+)["']?\s*([NSEW])/i)
  if (mm) {
    const d = parseFloat(mm[1])
    const min = parseFloat(mm[2])
    let dec = d + min / 60
    if (/[SW]/i.test(mm[3])) dec = -dec
    return dec
  }
  // DD° (solo grados)
  mm = cleaned.match(/(\d+(?:\.\d+)?)°\s*([NSEW])/i)
  if (mm) {
    let dec = parseFloat(mm[1])
    if (/[SW]/i.test(mm[2])) dec = -dec
    return dec
  }
  // decimal puro con signo
  mm = cleaned.match(/^(-?\d+(?:\.\d+)?)$/)
  if (mm) return parseFloat(mm[1])
  return null
}

function elevFtFromStr(s) {
  if (!s) return null
  // Captura el número (entero o decimal) inmediatamente antes de "ft"
  const m = s.match(/(\d+(?:\.\d+)?)\s*ft/i)
  return m ? Math.round(parseFloat(m[1])) : null
}

function inferCert(name) {
  return /INTERNACIONAL/i.test(name) ? 'INTERNACIONAL' : 'NACIONAL'
}

// ─── Genera entradas TS ─────────────────────────────────────────
const seen = new Set()
const lines = []
const report = []
for (const b of missing) {
  if (seen.has(b.icao)) continue
  seen.add(b.icao)
  const icao = b.icao
  const name = getField(b.body, 'name')
  const city = getField(b.body, 'city')
  const dept = getField(b.body, 'department') || getField(b.body, 'region')
  const arpLat = getField(b.body, 'arpLatitude')
  const arpLon = getField(b.body, 'arpLongitude')
  const elevStr = getField(b.body, 'elevation')
  const authorizedTraffic = getField(b.body, 'authorizedTraffic')

  const lat = dmsToDecimal(arpLat)
  const lng = dmsToDecimal(arpLon)
  const elevFt = elevFtFromStr(elevStr)
  const cert = inferCert(name)

  report.push({
    icao, name, city, dept, arpLat, arpLon, lat, lng, elevStr, elevFt, cert, authorizedTraffic
  })

  const entry = {
    icao,
    name: name || '(sin nombre)',
    city: city || '',
    dept: dept || '',
    lat: lat ?? 0,
    lng: lng ?? 0,
    elev: elevFt ?? 0,
    cert,
  }
  lines.push(`  {
    "icao": "${entry.icao}",
    "name": "${entry.name}",
    "city": "${entry.city}",
    "dept": "${entry.dept}",
    "lat": ${entry.lat},
    "lng": ${entry.lng},
    "elev": ${entry.elev},
    "cert": "${entry.cert}"
  }`)
}

// Reporte legible
console.log('\n=== MISSING AIRPORTS REPORT ===')
for (const r of report) {
  const ok = r.lat != null && r.lng != null && r.elevFt != null
  console.log(`${ok ? '✓' : '✗'} ${r.icao}: ${r.name} | ${r.city}, ${r.dept} | lat=${r.lat} lon=${r.lng} elev=${r.elevStr} (${r.elevFt}ft) | cert=${r.cert} | traf=${r.authorizedTraffic}`)
}

const newEntries = lines.join(',\n') + ',\n'
writeFileSync('/tmp/missing-airports-entries.txt', newEntries)
console.log(`\n=== ${lines.length} entries written to /tmp/missing-airports-entries.txt ===`)
