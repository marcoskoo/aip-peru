/**
 * Worldwide aviation data accessor (server-side only).
 *
 * Loads compact JSON datasets produced by:
 *  - scripts/process-world-aviation.mjs (airports, navaids, summary)
 *  - scripts/generate-world-airways.mjs (airways, extra waypoints)
 *
 * Source data: OurAirports (CC0) + curated public aviation reference.
 *
 * Provides viewport-filtered queries so the interactive map can render
 * worldwide airports/navaids/airways/waypoints without loading everything
 * at once.
 */
// Use static JSON imports instead of readFileSync so the data is bundled
// into the serverless output and works on Vercel (no filesystem access).
import worldAirportsData from "./world/world-airports.json";
import worldNavaidsData from "./world/world-navaids.json";
import worldAirwaysData from "./world/world-airways.json";
import worldWaypointsExtraData from "./world/world-waypoints-extra.json";

// Type definitions for compact JSON format
export interface WorldAirport {
  i: string;   // ICAO code
  n: string;   // name
  c: string;   // ISO country
  t: string;   // type: large_airport | medium_airport | small_airport | heliport | seaplane_base | closed
  la: number;  // latitude
  lo: number;  // longitude
  e: number | null; // elevation ft
  iata: string | null;
  city: string | null;
}

export interface WorldNavaid {
  i: string;   // ident
  n: string;   // name
  t: string;   // type: VOR | VOR/DME | VORTAC | TACAN | NDB | DME
  f: string;   // frequency
  c: string;   // ISO country
  la: number;
  lo: number;
  e: number | null;
}

// Compact airway format (saved by generate-world-airways.mjs)
export interface WorldAirwayCompact {
  designator: string;
  type: "CONVENTIONAL" | "RNAV";
  level: "LOWER" | "UPPER" | "BOTH";
  segments: { from: string; to: string; distance: number; bearing: number }[];
}

export interface WorldWaypointExtra {
  id: string;
  lat: number;
  lon: number;
  country: string;
  region: string;
  description: string;
  transfer?: boolean;
  notif?: boolean;
}

// Data is imported at module load time (bundled by Next.js for serverless)
function loadAirports(): WorldAirport[] {
  return worldAirportsData as WorldAirport[];
}

function loadNavaids(): WorldNavaid[] {
  return worldNavaidsData as WorldNavaid[];
}

function loadAirways(): WorldAirwayCompact[] {
  return worldAirwaysData as WorldAirwayCompact[];
}

function loadExtraWaypoints(): WorldWaypointExtra[] {
  return worldWaypointsExtraData as WorldWaypointExtra[];
}

export interface BBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Get airports within a bounding box.
 * Optionally filter by type.
 */
export function getAirportsInBBox(
  bbox: BBox,
  opts: { includeSmall?: boolean; includeHeliports?: boolean } = {}
): WorldAirport[] {
  const all = loadAirports();
  const { includeSmall = false, includeHeliports = false } = opts;
  const result: WorldAirport[] = [];
  for (const a of all) {
    if (a.la < bbox.minLat || a.la > bbox.maxLat) continue;
    if (a.lo < bbox.minLon || a.lo > bbox.maxLon) continue;
    if (a.t === "small_airport" && !includeSmall) continue;
    if (a.t === "heliport" && !includeHeliports) continue;
    if (a.t === "closed") continue;
    result.push(a);
  }
  return result;
}

/**
 * Get navaids within a bounding box.
 */
export function getNavaidsInBBox(bbox: BBox): WorldNavaid[] {
  const all = loadNavaids();
  const result: WorldNavaid[] = [];
  for (const n of all) {
    if (n.la < bbox.minLat || n.la > bbox.maxLat) continue;
    if (n.lo < bbox.minLon || n.lo > bbox.maxLon) continue;
    result.push(n);
  }
  return result;
}

/**
 * Get total counts (for stats display).
 */
export function getWorldCounts() {
  return {
    airports: loadAirports().length,
    navaids: loadNavaids().length,
    airways: loadAirways().length,
    waypoints: loadExtraWaypoints().length,
    countries: new Set([...loadAirports().map(a => a.c), ...loadNavaids().map(n => n.c)]).size,
  };
}

/**
 * Search airports by ICAO, IATA, name, or city (case-insensitive).
 * Returns top N matches.
 */
export function searchAirports(query: string, limit = 20): WorldAirport[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const all = loadAirports();
  const results: { airport: WorldAirport; score: number }[] = [];
  for (const a of all) {
    const icao = a.i.toUpperCase();
    const iata = (a.iata || "").toUpperCase();
    const name = a.n.toUpperCase();
    const city = (a.city || "").toUpperCase();
    let score = 0;
    if (icao === q) score = 100;
    else if (iata === q) score = 95;
    else if (icao.startsWith(q)) score = 80;
    else if (iata.startsWith(q)) score = 75;
    else if (name.startsWith(q)) score = 60;
    else if (city.startsWith(q)) score = 55;
    else if (name.includes(q)) score = 40;
    else if (city.includes(q)) score = 35;
    if (score > 0) results.push({ airport: a, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.airport);
}

/**
 * Search navaids by ident or name.
 */
export function searchNavaids(query: string, limit = 20): WorldNavaid[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const all = loadNavaids();
  const results: { navaid: WorldNavaid; score: number }[] = [];
  for (const n of all) {
    const ident = n.i.toUpperCase();
    const name = n.n.toUpperCase();
    let score = 0;
    if (ident === q) score = 100;
    else if (ident.startsWith(q)) score = 80;
    else if (name.startsWith(q)) score = 60;
    else if (name.includes(q)) score = 40;
    if (score > 0) results.push({ navaid: n, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.navaid);
}

// ─── Coord resolver ────────────────────────────────────────────────────
// Resolves an airport ICAO / navaid ident / waypoint id to coordinates.
// Used to render airway polylines on the map (since airway segments only
// store endpoint idents, not coordinates).
//
// IMPORTANT: idents are NOT globally unique in OurAirports data (e.g., "BOS"
// could be Boston VOR in the US or a small navaid elsewhere). To handle
// this, we store ALL matches per ident and use "sequential nearest"
// resolution when building airway polylines: for each airway's sequence of
// idents, we pick the candidate closest to the previously resolved point.

type CoordEntry = { lat: number; lon: number; name: string; kind: string; country: string };

let _coordIndex: Map<string, CoordEntry[]> | null = null;

function getCoordIndex(): Map<string, CoordEntry[]> {
  if (_coordIndex) return _coordIndex;
  const idx = new Map<string, CoordEntry[]>();
  // Airports first (preferred for ICAO codes like KJFK, EGLL)
  for (const a of loadAirports()) {
    const arr = idx.get(a.i) || [];
    arr.push({ lat: a.la, lon: a.lo, name: a.n, kind: "airport", country: a.c });
    if (!idx.has(a.i)) idx.set(a.i, arr);
  }
  // Then navaids
  for (const n of loadNavaids()) {
    const arr = idx.get(n.i) || [];
    arr.push({ lat: n.la, lon: n.lo, name: n.n, kind: "navaid", country: n.c });
    if (!idx.has(n.i)) idx.set(n.i, arr);
  }
  // Then extra waypoints
  for (const w of loadExtraWaypoints()) {
    const arr = idx.get(w.id) || [];
    arr.push({ lat: w.lat, lon: w.lon, name: w.id, kind: "waypoint", country: w.country });
    if (!idx.has(w.id)) idx.set(w.id, arr);
  }
  _coordIndex = idx;
  return idx;
}

/**
 * Resolve an identifier to coordinates. If multiple candidates exist,
 * returns the first (use resolveIdentNearest for sequential resolution).
 */
export function resolveIdent(ident: string): CoordEntry | null {
  const arr = getCoordIndex().get(ident);
  return arr && arr.length > 0 ? arr[0] : null;
}

/**
 * Resolve an identifier to coordinates, preferring the candidate closest
 * to a reference point. Used for airway polyline construction where we
 * want idents to resolve consistently along the airway's path.
 *
 * If `preferredCountry` is provided and there's no reference point (i.e.,
 * this is the first ident in an airway), prefer candidates from that
 * country — this handles ident collisions for the first point.
 */
export function resolveIdentNearest(
  ident: string,
  ref: { lat: number; lon: number } | null,
  preferredCountry?: string
): CoordEntry | null {
  const arr = getCoordIndex().get(ident);
  if (!arr || arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  if (!ref) {
    // No reference: prefer the requested country, else first candidate
    if (preferredCountry) {
      const match = arr.find(c => c.country === preferredCountry);
      if (match) return match;
    }
    return arr[0];
  }
  // Pick the candidate closest to ref
  let best = arr[0];
  let bestD = Infinity;
  for (const c of arr) {
    const d = (c.lat - ref.lat) ** 2 + (c.lon - ref.lon) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/**
 * Infer the preferred country for an airway based on its designator.
 * Used to disambiguate the first waypoint of an airway when idents collide
 * across countries. For example, "MIA" might be Mildura (AU) or Miami VOR
 * (US) — for a J-route (US jet route), we prefer US.
 */
function inferPreferredCountry(designator: string): string | undefined {
  const d = designator.toUpperCase();
  // US: J/V/Q/T followed by digits
  if (/^[JVQT]\d/.test(d)) return "US";
  // Europe: UZ, UM, UN, UL, UP followed by digits
  if (/^U[ZMNL]\d/.test(d)) return null; // multi-country; no preference
  // Middle East: M followed by digit
  if (/^M\d/.test(d)) return "AE";
  // South America: UZxxxSA
  if (/SA$/.test(d)) return null;
  // NAT/PAC oceanic
  if (/^NAT/.test(d) || /^PAC/.test(d)) return null;
  // Asia A/B/R digit
  if (/^[ABR]\d/.test(d)) return null; // could be many countries
  return undefined;
}

// ─── Airway bbox query ──────────────────────────────────────────────────
// Returns airways that have at least one segment endpoint inside or near
// the given bounding box (with a small margin so airways crossing the
// viewport edges are included).

const MARGIN = 2; // degrees of margin around the bbox

export interface WorldAirwayResolved {
  designator: string;
  type: "CONVENTIONAL" | "RNAV";
  level: "LOWER" | "UPPER" | "BOTH";
  // Resolved segments with full coordinates (skipped if endpoint unresolvable)
  points: { ident: string; lat: number; lon: number }[];
  // Total airway distance in NM (sum of segment distances)
  totalDistance: number;
}

export function getAirwaysInBBox(bbox: BBox): WorldAirwayResolved[] {
  const all = loadAirways();
  const minLat = bbox.minLat - MARGIN;
  const maxLat = bbox.maxLat + MARGIN;
  const minLon = bbox.minLon - MARGIN;
  const maxLon = bbox.maxLon + MARGIN;
  const result: WorldAirwayResolved[] = [];

  for (const aw of all) {
    // Resolve all segment endpoints using sequential-nearest strategy:
    // each subsequent ident is resolved against the previously resolved
    // point so we get a coherent path even when idents collide across
    // countries (e.g., "BOS" in US vs "BOS" elsewhere).
    //
    // For the FIRST point, we use a country hint derived from the airway
    // designator (J/V/Q/T → US, etc.) to disambiguate.
    const preferredCountry = inferPreferredCountry(aw.designator);
    const points: { ident: string; lat: number; lon: number }[] = [];
    let totalDistance = 0;
    let touched = false;
    let prev: { lat: number; lon: number } | null = null;
    for (const seg of aw.segments) {
      const a = resolveIdentNearest(seg.from, prev, preferredCountry);
      const b = resolveIdentNearest(seg.to, a, preferredCountry);
      if (!a || !b) continue;
      totalDistance += seg.distance;
      // Check if either endpoint is in the (margin-expanded) bbox
      if (
        (a.lat >= minLat && a.lat <= maxLat && a.lon >= minLon && a.lon <= maxLon) ||
        (b.lat >= minLat && b.lat <= maxLat && b.lon >= minLon && b.lon <= maxLon)
      ) {
        touched = true;
      }
      if (points.length === 0) {
        points.push({ ident: seg.from, lat: a.lat, lon: a.lon });
      }
      // Only push the "to" if it differs from the last point
      const last = points[points.length - 1];
      if (last.ident !== seg.to) {
        points.push({ ident: seg.to, lat: b.lat, lon: b.lon });
      }
      prev = b;
    }
    if (touched && points.length >= 2) {
      result.push({
        designator: aw.designator,
        type: aw.type,
        level: aw.level,
        points,
        totalDistance,
      });
    }
  }
  return result;
}

// ─── Extra waypoints bbox query ────────────────────────────────────────
export function getExtraWaypointsInBBox(bbox: BBox): WorldWaypointExtra[] {
  const all = loadExtraWaypoints();
  return all.filter(w =>
    w.lat >= bbox.minLat && w.lat <= bbox.maxLat &&
    w.lon >= bbox.minLon && w.lon <= bbox.maxLon
  );
}
