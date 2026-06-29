#!/usr/bin/env node
/**
 * Extract WAYPOINTS, ROUTES, ROUTES_LOW, ROUTES_RNAV from the AIP Perú
 * HTML file and emit a TypeScript module with PERUVIAN_WAYPOINTS and
 * PERUVIAN_AIRWAYS that can be used as a static fallback.
 *
 * Usage:  node extract-airways.mjs
 */
import fs from "node:fs";

const HTML_PATH = "/home/z/my-project/upload/aip-peru-v20-dragfix.html";
const OUT_PATH = "/home/z/my-project/src/lib/aviation/peru-airways-static.ts";

const html = fs.readFileSync(HTML_PATH, "utf8");
const lines = html.split("\n");

// ─── Helpers ─────────────────────────────────────────────────────────
function findVarLine(name) {
  const re = new RegExp(`^var\\s+${name}\\s*=`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i;
  }
  return -1;
}

/** Haversine distance in NM */
function gcDistNM(a, b) {
  const R = 3440.065;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

/** Initial bearing in degrees true */
function bearingDeg(a, b) {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360);
}

/** Reverse bearing (back azimuth) */
function reverseBearing(b) {
  return (b + 180) % 360;
}

/** Parse FL string ("FL250" → 250, "FL080" → 80, "UNL"/"" → undefined) */
function parseFL(s) {
  if (s == null) return undefined;
  if (typeof s !== "string") s = String(s);
  const m = s.match(/FL\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

/** Quick & safe eval of a JS array literal */
function evalArray(src) {
  return new Function(`return (${src});`)();
}

// ─── Extract WAYPOINTS (single line, JSON-style) ─────────────────────
const wpLineIdx = findVarLine("WAYPOINTS");
const wpLine = lines[wpLineIdx];
const wpSrc = wpLine.replace(/^var\s+WAYPOINTS\s*=\s*/, "").replace(/;\s*$/, "");
const WAYPOINTS = evalArray(wpSrc);
console.log(`WAYPOINTS: ${WAYPOINTS.length} entries`);

// ─── Extract ROUTES (single line) ────────────────────────────────────
const rLineIdx = findVarLine("ROUTES");
const rLine = lines[rLineIdx];
const rSrc = rLine.replace(/^var\s+ROUTES\s*=\s*/, "").replace(/;\s*$/, "");
const ROUTES = evalArray(rSrc);
console.log(`ROUTES: ${ROUTES.length} segments`);

// ─── Extract ROUTES_LOW (single line) ────────────────────────────────
const rlLineIdx = findVarLine("ROUTES_LOW");
const rlLine = lines[rlLineIdx];
const rlSrc = rlLine.replace(/^var\s+ROUTES_LOW\s*=\s*/, "").replace(/;\s*$/, "");
const ROUTES_LOW = evalArray(rlSrc);
console.log(`ROUTES_LOW: ${ROUTES_LOW.length} segments`);

// ─── Extract ROUTES_RNAV (multi-line, until closing ];) ──────────────
const rrStart = findVarLine("ROUTES_RNAV");
let rrEnd = rrStart;
for (let i = rrStart + 1; i < lines.length; i++) {
  if (/\];\s*$/.test(lines[i])) {
    rrEnd = i;
    break;
  }
}
const rrSrc = lines
  .slice(rrStart, rrEnd + 1)
  .join("\n")
  .replace(/^var\s+ROUTES_RNAV\s*=\s*/, "")
  .replace(/;\s*$/, "");
const ROUTES_RNAV = evalArray(rrSrc);
console.log(`ROUTES_RNAV: ${ROUTES_RNAV.length} airways`);

// ─── Transform WAYPOINTS → Waypoint[] ────────────────────────────────
const waypointMap = new Map();
for (const w of WAYPOINTS) {
  waypointMap.set(w.id, {
    id: w.id,
    name: w.id,
    type: w.type === "ICAO" ? "WAYPOINT" : (w.type || "WAYPOINT"),
    lat: w.lat,
    lon: w.lng,
    description: w.rmk || undefined,
  });
}

// Also collect waypoints referenced by RNAV routes (their pts have lat/lng
// already and the segment from/to use these descriptive ids verbatim, so
// we need them in the waypoints list to allow coordLookup resolution).
for (const entry of ROUTES_RNAV) {
  for (const pt of entry.pts || []) {
    const id = String(pt.id);
    if (!waypointMap.has(id) && typeof pt.lat === "number" && typeof pt.lng === "number") {
      waypointMap.set(id, {
        id,
        name: id,
        type: "WAYPOINT",
        lat: pt.lat,
        lon: pt.lng,
        description: `RNAV point on ${entry.id}`,
      });
    }
  }
}

const waypoints = Array.from(waypointMap.values());

// ─── Transform ROUTES + ROUTES_LOW → Airway[] (conventional) ─────────
function groupConvSegments(segments) {
  const map = new Map();
  for (const s of segments) {
    if (!map.has(s.id)) {
      map.set(s.id, {
        designator: s.id,
        type: "CONVENTIONAL",
        level: "BOTH",
        segments: [],
      });
    }
    const airway = map.get(s.id);
    airway.segments.push({
      from: s.from,
      to: s.to,
      distance: s.dist,
      bearing: s.trk_o,
      trackTrue: s.trk_o,
      reverseTrack: s.trk_r,
      minFL: parseFL(s.lower),
      maxFL: parseFL(s.upper),
      level: s.cls,
    });
  }
  // Derive level per airway from min/max FL across its segments
  for (const aw of map.values()) {
    const mins = aw.segments.map((s) => s.minFL).filter((v) => v != null);
    const maxs = aw.segments.map((s) => s.maxFL).filter((v) => v != null);
    const minFL = mins.length ? Math.min(...mins) : undefined;
    const maxFL = maxs.length ? Math.max(...maxs) : undefined;
    if (minFL != null && maxFL != null) {
      // Upper routes (UV…) typically have lower=FL250 and upper=UNL
      if (minFL >= 250) aw.level = "UPPER";
      else if (maxFL <= 245) aw.level = "LOWER";
      else aw.level = "BOTH";
    }
  }
  return Array.from(map.values());
}

const convAirways = groupConvSegments([...ROUTES, ...ROUTES_LOW]);
console.log(`Conventional airways: ${convAirways.length}`);

// ─── Transform ROUTES_RNAV → Airway[] (rnav) ────────────────────────
const rnavAirways = ROUTES_RNAV.map((entry) => {
  const pts = entry.pts || [];
  const segments = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dist = gcDistNM({ lat: a.lat, lon: a.lng }, { lat: b.lat, lon: b.lng });
    const brg = bearingDeg({ lat: a.lat, lon: a.lng }, { lat: b.lat, lon: b.lng });
    segments.push({
      from: String(a.id),
      to: String(b.id),
      distance: dist,
      bearing: brg,
      trackTrue: brg,
      reverseTrack: reverseBearing(brg),
      level: undefined,
    });
  }
  return {
    designator: String(entry.id),
    type: "RNAV",
    level: "BOTH",
    segments,
  };
}).filter((aw) => aw.segments.length > 0);
console.log(`RNAV airways: ${rnavAirways.length}`);

// ─── Write the TypeScript file ───────────────────────────────────────
function fmtNum(n) {
  if (n == null || Number.isNaN(n)) return "undefined";
  return JSON.stringify(n);
}

function fmtStr(s) {
  if (s == null) return "undefined";
  return JSON.stringify(String(s));
}

function fmtSeg(s, indent) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  const lines = [];
  lines.push(`${pad}{`);
  lines.push(`${inner}from: ${fmtStr(s.from)},`);
  lines.push(`${inner}to: ${fmtStr(s.to)},`);
  lines.push(`${inner}distance: ${fmtNum(s.distance)},`);
  lines.push(`${inner}bearing: ${fmtNum(s.bearing)},`);
  if (s.trackTrue != null) lines.push(`${inner}trackTrue: ${fmtNum(s.trackTrue)},`);
  if (s.reverseTrack != null) lines.push(`${inner}reverseTrack: ${fmtNum(s.reverseTrack)},`);
  if (s.minFL != null) lines.push(`${inner}minFL: ${fmtNum(s.minFL)},`);
  if (s.maxFL != null) lines.push(`${inner}maxFL: ${fmtNum(s.maxFL)},`);
  if (s.level != null) lines.push(`${inner}level: ${fmtStr(s.level)},`);
  lines.push(`${pad}}`);
  return lines.join("\n");
}

function fmtAirway(aw, indent) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  const segLines = aw.segments.map((s) => fmtSeg(s, indent + 2)).join(",\n");
  return [
    `${pad}{`,
    `${inner}designator: ${fmtStr(aw.designator)},`,
    `${inner}type: ${fmtStr(aw.type)},`,
    `${inner}level: ${fmtStr(aw.level)},`,
    `${inner}segments: [`,
    segLines ? `${segLines},` : ``,
    `${inner}],`,
    `${pad}}`,
  ].join("\n");
}

function fmtWaypoint(w, indent) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  const lines = [`${pad}{`];
  lines.push(`${inner}id: ${fmtStr(w.id)},`);
  lines.push(`${inner}name: ${fmtStr(w.name)},`);
  lines.push(`${inner}type: ${fmtStr(w.type)},`);
  lines.push(`${inner}lat: ${fmtNum(w.lat)},`);
  lines.push(`${inner}lon: ${fmtNum(w.lon)},`);
  if (w.description != null) lines.push(`${inner}description: ${fmtStr(w.description)},`);
  lines.push(`${pad}}`);
  return lines.join("\n");
}

const out = [];
out.push(`/**
 * Waypoints y aerovías peruanas (estáticos) extraídos del AIP Perú v2.0.
 * Fuente: upload/aip-peru-v20-dragfix.html
 *   - WAYPOINTS   (línea 838) — ${WAYPOINTS.length} waypoints ICAO
 *   - ROUTES      (línea 859) — ${ROUTES.length} segmentos de aerovías convencionales (UTA)
 *   - ROUTES_LOW  (línea 862) — ${ROUTES_LOW.length} segmentos de aerovías inferiores
 *   - ROUTES_RNAV (línea 1617) — ${ROUTES_RNAV.length} aerovías RNAV
 *
 * Usado como fallback del mapa interactivo cuando /api/airdata/all falla
 * (localmente, por mismatch Prisma postgresql/sqlite).
 *
 * Generado por scripts/extract-airways.mjs — NO editar manualmente.
 */

import type { Waypoint, Airway } from "@/lib/types"

export const PERUVIAN_WAYPOINTS: Waypoint[] = [`);
out.push(waypoints.map((w) => fmtWaypoint(w, 1)).join(",\n"));
out.push(`]

export const PERUVIAN_AIRWAYS: { conventional: Airway[]; rnav: Airway[] } = {
  conventional: [`);
out.push(convAirways.map((aw) => fmtAirway(aw, 2)).join(",\n"));
out.push(`  ],
  rnav: [`);
out.push(rnavAirways.map((aw) => fmtAirway(aw, 2)).join(",\n"));
out.push(`  ],
}
`);

fs.writeFileSync(OUT_PATH, out.join("\n"));
console.log(`\nWrote ${OUT_PATH}`);
console.log(`  Waypoints: ${waypoints.length}`);
console.log(`  Conventional airways: ${convAirways.length}`);
console.log(`  RNAV airways: ${rnavAirways.length}`);

// Show a sample for verification
console.log("\nSample waypoint:");
console.log(JSON.stringify(waypoints[0], null, 2));
console.log("\nSample conventional airway:");
console.log(JSON.stringify(convAirways[0], null, 2));
console.log("\nSample RNAV airway:");
console.log(JSON.stringify({ ...rnavAirways[0], segments: rnavAirways[0].segments.slice(0, 2) }, null, 2));
