#!/usr/bin/env node
/**
 * Process OurAirports worldwide CSV data into compact JSON for the AIP Perú map.
 *
 * Strategy:
 *  - Airports: keep LARGE airports + medium with scheduled service (worldwide, ~6k)
 *    Plus ALL Peruvian airports (always include).
 *  - Navaids: keep all VOR/DME/NDB/TACAN worldwide (~11k) but compact format.
 *  - Helipads/seaplane bases: only include if in Peru.
 *
 * Output:
 *  - src/lib/aviation/world-airports.json
 *  - src/lib/aviation/world-navaids.json
 *  - src/lib/aviation/world-summary.json (country code -> counts)
 *
 * Source data is CC0 (OurAirports). See: https://ourairports.com/data/
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parse } from "csv-parse/sync";

const OUT_DIR = "/home/z/my-project/src/lib/aviation/world";

mkdirSync(OUT_DIR, { recursive: true });

// ---------- Airports ----------
console.log("Loading airports.csv...");
const airportsRaw = readFileSync("/home/z/my-project/data/aviation/airports.csv", "utf8");
const airports = parse(airportsRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });
console.log(`  total: ${airports.length} rows`);

// Filter: keep large+medium airports with ICAO code, plus Peruvian airports
const worldAirports = [];
const peruvianAirportsSet = new Set();
for (const a of airports) {
  const type = a.type;
  const icao = (a.icao_code || a.gps_code || a.ident || "").trim();
  if (!icao) continue;
  const lat = parseFloat(a.latitude_deg);
  const lon = parseFloat(a.longitude_deg);
  if (!isFinite(lat) || !isFinite(lon)) continue;
  const country = (a.iso_country || "").toUpperCase();
  const isPeru = country === "PE";

  // Keep: large_airport, medium_airport with scheduled service, OR any Peruvian airport
  if (type === "large_airport" ||
      (type === "medium_airport" && a.scheduled_service === "yes") ||
      isPeru) {
    worldAirports.push({
      i: icao,                          // ICAO
      n: a.name,                        // name
      c: country,                       // country ISO
      t: type,                          // type
      la: round(lat, 4),
      lo: round(lon, 4),
      e: a.elevation_ft ? parseInt(a.elevation_ft, 10) : null,
      iata: a.iata_code || null,
      city: a.municipality || null,
    });
    if (isPeru) peruvianAirportsSet.add(icao);
  }
}
console.log(`  filtered: ${worldAirports.length} world airports (${peruvianAirportsSet.size} PE)`);

// ---------- Navaids ----------
console.log("Loading navaids.csv...");
const navaidsRaw = readFileSync("/home/z/my-project/data/aviation/navaids.csv", "utf8");
const navaids = parse(navaidsRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });
console.log(`  total: ${navaids.length} rows`);

const worldNavaids = [];
for (const n of navaids) {
  const ident = (n.ident || "").trim();
  if (!ident) continue;
  const lat = parseFloat(n.latitude_deg);
  const lon = parseFloat(n.longitude_deg);
  if (!isFinite(lat) || !isFinite(lon)) continue;
  const type = (n.type || "").toUpperCase();
  // Compact frequency: VOR uses MHz, NDB uses kHz
  let freq = "";
  const fkhz = parseInt(n.frequency_khz, 10);
  if (isFinite(fkhz) && fkhz > 0) {
    if (type === "NDB") {
      freq = `${fkhz} kHz`;
    } else {
      freq = `${(fkhz / 1000).toFixed(2)} MHz`;
    }
  }
  worldNavaids.push({
    i: ident,
    n: n.name,
    t: type,                         // VOR, VOR/DME, VORTAC, TACAN, NDB, DME
    f: freq,
    c: (n.iso_country || "").toUpperCase(),
    la: round(lat, 4),
    lo: round(lon, 4),
    e: n.elevation_ft ? parseInt(n.elevation_ft, 10) : null,
  });
}
console.log(`  filtered: ${worldNavaids.length} world navaids`);

// ---------- Summary by country ----------
const summary = {};
for (const a of worldAirports) {
  summary[a.c] = summary[a.c] || { airports: 0, navaids: 0 };
  summary[a.c].airports++;
}
for (const n of worldNavaids) {
  summary[n.c] = summary[n.c] || { airports: 0, navaids: 0 };
  summary[n.c].navaids++;
}

// ---------- Write outputs ----------
writeFileSync(`${OUT_DIR}/world-airports.json`, JSON.stringify(worldAirports));
writeFileSync(`${OUT_DIR}/world-navaids.json`, JSON.stringify(worldNavaids));
writeFileSync(`${OUT_DIR}/world-summary.json`, JSON.stringify(summary, null, 2));

console.log("\n✅ Done.");
console.log(`  Wrote: ${OUT_DIR}/world-airports.json (${worldAirports.length} airports)`);
console.log(`  Wrote: ${OUT_DIR}/world-navaids.json (${worldNavaids.length} navaids)`);
console.log(`  Wrote: ${OUT_DIR}/world-summary.json (${Object.keys(summary).length} countries)`);

function round(v, p) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
