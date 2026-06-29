// Generate comprehensive static data files from AIP-extracted JSON.
// Output: src/lib/aviation/peru-airways-static.ts (waypoints + airways)
//         src/lib/aviation/peru-navaids-intl-static.ts
//         src/lib/aviation/peru-fir-transfers.ts
//         src/lib/aviation/peru-airspace.ts
//         src/lib/aviation/peru-sidstar.ts
import fs from "node:fs"

const read = (p) => JSON.parse(fs.readFileSync(`scripts/aip-out/${p}.json`, "utf8"))
const WP = read("WAYPOINTS")            // 96 — basic AIP waypoints (lat,lng,type,notif,fir,rmk)
const NV = read("NAVAIDS")              // 29 — Peruvian navaids
const NVI = read("NAVAIDS_INTL")        // 11 — adjacent-country navaids
const RH = read("ROUTES")               // 50 — high conventional airways (segments)
const RL = read("ROUTES_LOW")           // 76 — low conventional airways (segments)
const RR = read("ROUTES_RNAV")          // 32 — RNAV airways (with pts: [{id,lat,lng}])
const FT = read("FIR_TRANSFERS")        // 5  — FIR transfer sectors
const FB = read("FIR_BOUNDS")           // 5  — FIR boundary polygons
const FN = read("FIR_NEIGHBORS")        // 3  — neighbor freq strings
const AS = read("AIRSPACE")             // 8  — airspace classes
const ATC = read("ATC_SECTORS")         // 11 — ATC sectors
const TMA = read("TMA_SECTORS")         // 9  — TMA/CTR polygons
const FR = read("FREQS")                // 3  — frequency list (small)
const SS = read("SIDSTAR")              // 62 — SID/STAR
const RESTR = read("RESTR")             // 5  — restricted airspace
const OBS = read("OBSTACLES")           // 7  — obstacles

// ─── Build the comprehensive waypoint set ────────────────────────────
// Start with the 96 AIP waypoints (have lat/lng), then add waypoints
// found only in ROUTES_RNAV's pts array (extract name from "NAME …" form).
const wpMap = new Map() // id → {id, name, lat, lon, description, transfer, notif, fir}

// 1) Seed with the 96 AIP waypoints
for (const w of WP) {
  wpMap.set(w.id, {
    id: w.id,
    name: w.id,
    type: "WAYPOINT",
    lat: w.lat,
    lon: w.lng,
    description: w.rmk || "",
    notif: !!w.notif,
    transfer: false,
    fir: Array.isArray(w.fir) ? w.fir : [],
  })
}

// 2) Add waypoints from RNAV routes (each pt has id like "KONTA 54 NM" and lat/lng)
const rnavaWaypointNames = new Set()
for (const r of RR) {
  for (const p of r.pts) {
    // Extract first 5-letter word (RNAV waypoint names are 5 letters)
    const m = p.id.match(/^([A-Z]{5})\b/)
    if (!m) continue
    const name = m[1]
    rnavaWaypointNames.add(name)
    if (!wpMap.has(name)) {
      wpMap.set(name, {
        id: name,
        name,
        type: "WAYPOINT",
        lat: p.lat,
        lon: p.lng,
        description: `RNAV ${r.id}`,
        notif: false,
        transfer: false,
        fir: [],
      })
    } else {
      // Augment description with RNAV route
      const ex = wpMap.get(name)
      if (ex.description && !ex.description.includes(`RNAV ${r.id}`)) {
        ex.description = `${ex.description} RNAV ${r.id}`.trim()
      } else if (!ex.description) {
        ex.description = `RNAV ${r.id}`
      }
    }
  }
}

// 3) Mark transfer points (from FIR_TRANSFERS)
const transferPointIds = new Set()
for (const t of FT) {
  for (const pId of t.pts || []) {
    transferPointIds.add(pId)
    if (wpMap.has(pId)) {
      wpMap.get(pId).transfer = true
      wpMap.get(pId).notif = true // transfer points are compulsory reporting points
    } else {
      // Some transfer points may not have coords; we still register them as known
      // names but with null coords. They'll be filtered out of the map rendering.
      wpMap.set(pId, {
        id: pId, name: pId, type: "WAYPOINT",
        lat: null, lon: null,
        description: `Punto de transferencia ${t.fir_from}→${t.fir_to}`,
        notif: true, transfer: true, fir: [t.fir_from, t.fir_to],
      })
    }
  }
}

// 4) Also add the 4 existing extras (ILNAM, PABOB, ASOLA, VAKUD) — read from current static
const cur = fs.readFileSync("src/lib/aviation/peru-airways-static.ts", "utf8")
const extraIds = ["ILNAM", "PABOB", "ASOLA", "VAKUD"]
for (const id of extraIds) {
  if (wpMap.has(id)) continue
  // Match a block like: { id: "ILNAM", name: "ILNAM", type: "WAYPOINT", lat: -X, lon: -Y, description: "..." }
  const re = new RegExp(`\\{\\s*id:\\s*"${id}"[^}]*\\}`, "s")
  const m = cur.match(re)
  if (m) {
    const lat = parseFloat(m[0].match(/lat:\s*(-?\d+(\.\d+)?)/)?.[1] ?? "0")
    const lon = parseFloat(m[0].match(/lon:\s*(-?\d+(\.\d+)?)/)?.[1] ?? "0")
    const desc = m[0].match(/description:\s*"([^"]*)"/)?.[1] || ""
    wpMap.set(id, { id, name: id, type: "WAYPOINT", lat, lon, description: desc, notif: false, transfer: false, fir: [] })
  }
}

// 5) Sort & filter (drop any with null coords)
const allWaypoints = [...wpMap.values()]
  .filter(w => w.lat != null && w.lon != null)
  .sort((a, b) => a.id.localeCompare(b.id))

console.log(`Total waypoints: ${allWaypoints.length} (transfer: ${allWaypoints.filter(w=>w.transfer).length}, notif: ${allWaypoints.filter(w=>w.notif).length})`)

// ─── Build the airways ────────────────────────────────────────────────
// Convert ROUTES/ROUTES_LOW (segment lists) to Airway objects grouped by id.
// ROUTES_RNAV comes as {id, type, pts:[{id,lat,lng},…]} — group by id.
const convHigh = new Map() // id → {designator, type, level, segments}
const convLow = new Map()
const rnavAirways = new Map()

function segFromRoute(r) {
  return {
    from: r.from,
    to: r.to,
    distance: r.dist,
    bearing: r.trk_o,
    trackTrue: r.trk_o,
    reverseTrack: r.trk_r,
    minFL: parseInt(String(r.lower).replace(/\D/g, "")) || 0,
    maxFL: parseInt(String(r.upper).replace(/\D/g, "")) || 0,
    level: r.cls,
  }
}

for (const r of RH) {
  if (!convHigh.has(r.id)) convHigh.set(r.id, { designator: r.id, type: "CONVENTIONAL", level: "UPPER", segments: [] })
  convHigh.get(r.id).segments.push(segFromRoute(r))
}
for (const r of RL) {
  if (!convLow.has(r.id)) convLow.set(r.id, { designator: r.id, type: "CONVENTIONAL", level: "LOWER", segments: [] })
  convLow.get(r.id).segments.push(segFromRoute(r))
}
for (const r of RR) {
  if (!rnavAirways.has(r.id)) rnavAirways.set(r.id, { designator: r.id, type: "RNAV", level: "BOTH", segments: [] })
  const aw = rnavAirways.get(r.id)
  for (let i = 0; i < r.pts.length - 1; i++) {
    const a = r.pts[i], b = r.pts[i + 1]
    const an = a.id.match(/^([A-Z]{3,5})/)?.[1] || a.id
    const bn = b.id.match(/^([A-Z]{3,5})/)?.[1] || b.id
    // Haversine distance in NM
    const R = 3440.065
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLon = ((b.lng - a.lng) * Math.PI) / 180
    const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180
    const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2
    const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h)))
    // Initial bearing
    const y = Math.sin(dLon) * Math.cos(la2)
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon)
    const brg = Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360)
    aw.segments.push({
      from: an, to: bn,
      distance: dist, bearing: brg, trackTrue: brg,
      reverseTrack: (brg + 180) % 360,
      minFL: 0, maxFL: 0, level: "RNAV",
    })
  }
}

const convHighArr = [...convHigh.values()]
const convLowArr = [...convLow.values()]
const rnavArr = [...rnavAirways.values()]
console.log(`Airways — high conv: ${convHighArr.length}, low conv: ${convLowArr.length}, RNAV: ${rnavArr.length}`)

// ─── Build airspace / TMA polygons ────────────────────────────────────
const tmaPolys = TMA.filter(t => Array.isArray(t.poly) && t.poly.length >= 3).map(t => ({
  id: t.id, name: t.name, cls: t.cls, lo: t.lo, hi: t.hi,
  polygon: t.poly.map(([lat, lon]) => ({ lat, lon })),
}))

// ─── Build SID/STAR list (group by airport) ───────────────────────────
const sidstarByAd = {}
for (const s of SS) {
  if (!sidstarByAd[s.ad]) sidstarByAd[s.ad] = { SIDs: [], STARs: [] }
  if (s.type === "SID") sidstarByAd[s.ad].SIDs.push(s)
  else sidstarByAd[s.ad].STARs.push(s)
}

// ─── Emit static TS files ─────────────────────────────────────────────

const header = `/**
 * Waypoints y aerovías peruanas (estáticos) extraídos del AIP Perú v2.0.
 * Fuente: upload/aip-peru-v20-dragfix.html
 *   - WAYPOINTS       — ${WP.length} waypoints ICAO del AIP
 *   - ROUTES_RNAV     — ${RR.length} aerovías RNAV con coordenadas explícitas
 *                       (de donde se extrajeron ${rnavaWaypointNames.size} nombres
 *                       adicionales de waypoints RNAV-only)
 *   - ROUTES / ROUTES_LOW — ${RH.length}+${RL.length} segmentos de aerovías convencionales
 *   - FIR_TRANSFERS   — ${FT.length} sectores de transferencia FIR (marcados como
 *                       puntos de notificación / transferencia en el mapa)
 *
 * Generado por scripts/generate-static-data.mjs — NO editar manualmente.
 */
`

// ─── 1) peru-airways-static.ts (waypoints + airways) ──
let out = header + "\nimport type { Waypoint, Airway } from \"@/lib/types\"\n\n"
out += `export interface PeruvianWaypointExt extends Waypoint {\n  /** Punto de notificación obligatorio (compulsory reporting point) */\n  notif?: boolean\n  /** Punto de transferencia entre FIRs */\n  transfer?: boolean\n  /** FIR(es) a las que pertenece */\n  fir?: string[]\n}\n\n`
out += `export const PERUVIAN_WAYPOINTS: PeruvianWaypointExt[] = [\n`
for (const w of allWaypoints) {
  const desc = w.description ? ` description: ${JSON.stringify(w.description)},` : ""
  const notif = w.notif ? ` notif: true,` : ""
  const transfer = w.transfer ? ` transfer: true,` : ""
  const fir = w.fir && w.fir.length ? ` fir: ${JSON.stringify(w.fir)},` : ""
  out += `  { id: ${JSON.stringify(w.id)}, name: ${JSON.stringify(w.name)}, type: "WAYPOINT", lat: ${w.lat}, lon: ${w.lon},${desc}${notif}${transfer}${fir} },\n`
}
out += `]\n\n`

out += `export const PERUVIAN_AIRWAYS: { conventional: Airway[]; rnav: Airway[] } = {\n`
out += `  conventional: [\n`
for (const a of [...convHighArr, ...convLowArr]) {
  out += `    {\n      designator: ${JSON.stringify(a.designator)}, type: "CONVENTIONAL", level: ${JSON.stringify(a.level)},\n      segments: [\n`
  for (const s of a.segments) {
    out += `        { from: ${JSON.stringify(s.from)}, to: ${JSON.stringify(s.to)}, distance: ${s.distance}, bearing: ${s.bearing}, trackTrue: ${s.trackTrue}, reverseTrack: ${s.reverseTrack}, minFL: ${s.minFL}, maxFL: ${s.maxFL}, level: ${JSON.stringify(s.level)} },\n`
  }
  out += `      ],\n    },\n`
}
out += `  ],\n  rnav: [\n`
for (const a of rnavArr) {
  out += `    {\n      designator: ${JSON.stringify(a.designator)}, type: "RNAV", level: ${JSON.stringify(a.level)},\n      segments: [\n`
  for (const s of a.segments) {
    out += `        { from: ${JSON.stringify(s.from)}, to: ${JSON.stringify(s.to)}, distance: ${s.distance}, bearing: ${s.bearing}, trackTrue: ${s.trackTrue}, reverseTrack: ${s.reverseTrack}, minFL: ${s.minFL}, maxFL: ${s.maxFL}, level: ${JSON.stringify(s.level)} },\n`
  }
  out += `      ],\n    },\n`
}
out += `  ],\n}\n`

fs.writeFileSync("src/lib/aviation/peru-airways-static.ts", out)
console.log("Wrote src/lib/aviation/peru-airways-static.ts (" + out.split("\n").length + " lines)")

// ─── 2) peru-navaids-intl-static.ts ──
let nvi = `/**
 * Radioayudas de países fronterizos (extraídas del AIP Perú v2.0).
 * Incluye VOR/DME de Ecuador, Colombia, Brasil, Bolivia, Chile — visibles
 * en el mapa interactivo para construcción de rutas internacionales.
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface IntlNavaid {
  id: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  country: string
  fir: string
}

export const INTERNATIONAL_NAVAIDS: IntlNavaid[] = [
`
for (const n of NVI) {
  const t = n.type === "VORDME" ? "VOR DME" : n.type === "DVORDME" ? "DVOR DME" : n.type
  nvi += `  { id: ${JSON.stringify(n.id)}, name: ${JSON.stringify(n.name)}, type: ${JSON.stringify(t)}, frequency: ${JSON.stringify(n.freq + " MHz")}, lat: ${n.lat}, lon: ${n.lng}, country: ${JSON.stringify(n.country || "")}, fir: ${JSON.stringify(n.fir || "")} },\n`
}
nvi += `]\n`
fs.writeFileSync("src/lib/aviation/peru-navaids-intl-static.ts", nvi)
console.log("Wrote src/lib/aviation/peru-navaids-intl-static.ts")

// ─── 3) peru-fir-transfers.ts ──
let ft = `/**
 * Puntos de transferencia entre FIR Lima y FIRs adyacentes (AIP Perú ENR 2.x).
 * Cada registro enumera los waypoint(s) por donde se transfiere el control
 * entre el ACC Lima y el ACC vecino, con sus frecuencias.
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface FirTransfer {
  firFrom: string
  firTo: string
  points: string[]
  accFrom: string
  accTo: string
  freqLima: string
  freqAdjacent: string
  remark: string
}

export const FIR_TRANSFERS: FirTransfer[] = [
`
for (const t of FT) {
  ft += `  {\n    firFrom: ${JSON.stringify(t.fir_from)}, firTo: ${JSON.stringify(t.fir_to)},\n    points: ${JSON.stringify(t.pts || [])},\n    accFrom: ${JSON.stringify(t.acc_from)}, accTo: ${JSON.stringify(t.acc_to)},\n    freqLima: ${JSON.stringify(t.freq_lima || "")}, freqAdjacent: ${JSON.stringify(t.freq_adj || "")},\n    remark: ${JSON.stringify(t.rmk || "")},\n  },\n`
}
ft += `]\n\n`
ft += `/** Conjunto de IDs de waypoints que son puntos de transferencia FIR. */\nexport const TRANSFER_POINT_IDS: Set<string> = new Set(\n  FIR_TRANSFERS.flatMap(t => t.points)\n)\n`
fs.writeFileSync("src/lib/aviation/peru-fir-transfers.ts", ft)
console.log("Wrote src/lib/aviation/peru-fir-transfers.ts")

// ─── 4) peru-airspace.ts ──
let as2 = `/**
 * Datos de espacio aéreo peruano (AIP Perú ENR 2.x, ENR 5.x).
 *   - TMA / CTR poligonales
 *   - Sectores ATC
 *   - Zonas restringidas/prohibidas/peligrosas
 *   - Clases de espacio aéreo (FIR/TMA/CTR)
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface TmaSector {
  id: string
  name: string
  cls: string
  lo: string
  hi: string
  polygon: { lat: number; lon: number }[]
}

export interface AtcSector {
  id: string
  name: string
  freq: string
  sec: string
  vertLo: string
  vertHi: string
  geo: string
}

export interface RestrictedAirspace {
  designator: string
  type: "P" | "R" | "D"
  name: string
  lower: string
  upper: string
  activity: string
  period: string
  entry: string
}

export const TMA_SECTORS_DATA: TmaSector[] = ${JSON.stringify(tmaPolys, null, 2)}

export const ATC_SECTORS_DATA: AtcSector[] = [
`
for (const a of ATC) {
  as2 += `  { id: ${JSON.stringify(a.id)}, name: ${JSON.stringify(a.name)}, freq: ${JSON.stringify(a.freq)}, sec: ${JSON.stringify(a.sec || "")}, vertLo: ${JSON.stringify(a.vert_lo || "")}, vertHi: ${JSON.stringify(a.vert_hi || "")}, geo: ${JSON.stringify(a.geo || "")} },\n`
}
as2 += `]\n\n`
as2 += `export const RESTRICTED_AIRSPACE: RestrictedAirspace[] = [\n`
for (const r of RESTR) {
  as2 += `  { designator: ${JSON.stringify(r.des)}, type: ${JSON.stringify(r.type)} as "P"|"R"|"D", name: ${JSON.stringify(r.name)}, lower: ${JSON.stringify(r.lower)}, upper: ${JSON.stringify(r.upper)}, activity: ${JSON.stringify(r.act || "")}, period: ${JSON.stringify(r.per || "")}, entry: ${JSON.stringify(r.ent || "")} },\n`
}
as2 += `]\n`
fs.writeFileSync("src/lib/aviation/peru-airspace.ts", as2)
console.log("Wrote src/lib/aviation/peru-airspace.ts")

// ─── 5) peru-sidstar.ts ──
let ss2 = `/**
 * Procedimientos SID/STAR por aeródromo (AIP Perú AD 2.x).
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface SidStarProc {
  ad: string
  type: "SID" | "STAR"
  ident: string
  rwy: string
  navaid: string
  trk: number
  alt: string
  dist: number
  remark: string
}

export const SIDSTAR_PROCEDURES: SidStarProc[] = [
`
for (const s of SS) {
  ss2 += `  { ad: ${JSON.stringify(s.ad)}, type: ${JSON.stringify(s.type)} as "SID"|"STAR", ident: ${JSON.stringify(s.ident)}, rwy: ${JSON.stringify(String(s.rwy || ""))}, navaid: ${JSON.stringify(s.navaid || "")}, trk: ${Number(s.trk)||0}, alt: ${JSON.stringify(s.alt || "")}, dist: ${Number(s.dist)||0}, remark: ${JSON.stringify(s.rmk || "")} },\n`
}
ss2 += `]\n\n`
ss2 += `export function getSids(ad: string): SidStarProc[] {\n  return SIDSTAR_PROCEDURES.filter(p => p.ad === ad && p.type === "SID")\n}\n\n`
ss2 += `export function getStars(ad: string): SidStarProc[] {\n  return SIDSTAR_PROCEDURES.filter(p => p.ad === ad && p.type === "STAR")\n}\n`
fs.writeFileSync("src/lib/aviation/peru-sidstar.ts", ss2)
console.log("Wrote src/lib/aviation/peru-sidstar.ts")

console.log("\nDone.")
