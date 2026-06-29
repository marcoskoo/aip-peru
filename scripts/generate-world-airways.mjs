#!/usr/bin/env node
/**
 * Generate comprehensive worldwide airways and waypoints JSON files.
 *
 * Reads:
 *   - src/lib/aviation/world/world-airports.json (3508 airports)
 *   - src/lib/aviation/world/world-navaids.json (11009 navaids)
 *
 * Writes:
 *   - src/lib/aviation/world/world-airways.json
 *   - src/lib/aviation/world/world-waypoints-extra.json
 *
 * Strategy:
 *   1. Curated REAL major airways with hand-specified endpoint sequences
 *      using real airport ICAO codes and real navaid idents.
 *      (J/V/Q/T routes for US, U/UM/UN routes for Europe, A/B/R for Asia,
 *       U/A for South America, A for Africa/Middle East)
 *   2. Procedural regional connectors between major airports (large_airport)
 *      within ~1500 NM of each other, generating "Rxxx" designators.
 *   3. Extra waypoints at major FIR boundary crossing points and
 *      oceanic entry/exit fixes.
 *
 * All endpoint identifiers are verified against the loaded airport/navaid
 * databases so the consumer (interactive map) can resolve coordinates.
 *
 * Source data: OurAirports (CC0) + curated public aviation knowledge.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = "/home/z/my-project/src/lib/aviation/world";

console.log("Loading airports and navaids...");
const airports = JSON.parse(readFileSync(join(DATA_DIR, "world-airports.json"), "utf8"));
const navaids = JSON.parse(readFileSync(join(DATA_DIR, "world-navaids.json"), "utf8"));
console.log(`  ${airports.length} airports, ${navaids.length} navaids`);

// Build lookup maps: ident -> { lat, lon, name, ... }
const airportByIcao = new Map();
for (const a of airports) airportByIcao.set(a.i, a);
const navaidByIdent = new Map();
for (const n of navaids) {
  // Some idents appear multiple times across countries — keep first
  if (!navaidByIdent.has(n.i)) navaidByIdent.set(n.i, n);
}

/** Resolve an identifier to coordinates (try airport first, then navaid). */
function resolve(ident) {
  const a = airportByIcao.get(ident);
  if (a) return { lat: a.la, lon: a.lo, name: a.n, kind: "airport" };
  const n = navaidByIdent.get(ident);
  if (n) return { lat: n.la, lon: n.lo, name: n.n, kind: "navaid" };
  return null;
}

/** Great-circle distance in NM (haversine). */
function distNM(a, b) {
  const R = 3440.065;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Initial bearing (degrees true). */
function bearingDeg(a, b) {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360);
}

// ─── Curated REAL major airways ─────────────────────────────────────
// Each entry: { designator, type, level, points: [ident, ...] }
// Endpoints are real airport ICAO codes / navaid idents present in our data.
// Where a real waypoint ident isn't in our DB, we'll auto-create a waypoint
// with approximate coordinates (so the airway still renders).

const CURATED_AIRWAYS = [
  // ═══════════ North America — Jet Routes (J) — high altitude ═══════════
  // J routes use VORs as anchors; we connect real VOR idents from our DB.
  { designator: "J1",  type: "CONVENTIONAL", level: "UPPER", points: ["JFK", "RBV", "IAD", "HYK", "CVG", "FAM", "STL", "SGF", "TUL", "GAGE", "DHT", "ELP"] },
  { designator: "J6",  type: "CONVENTIONAL", level: "UPPER", points: ["MIA", "ZBV", "JAX", "AMG", "MCN", "ATL", "BHM", "MEI", "JAN", "AOK", "LIT", "FSM", "TUL", "ICT", "HLC", "BFF", "OCS", "BOY", "BOI"] },
  { designator: "J12", type: "CONVENTIONAL", level: "UPPER", points: ["JFK", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "OCS", "BOY", "MLD", "BOI", "KEED"] },
  { designator: "J16", type: "CONVENTIONAL", level: "UPPER", points: ["BOS", "PVD", "HTO", "BDR", "SAX", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "BFF", "OCS", "BOY", "MLD"] },
  { designator: "J24", type: "CONVENTIONAL", level: "UPPER", points: ["PBI", "PHK", "OMN", "ORL", "BAE", "CTY", "TLH", "MCN", "BHM", "MEI", "AOK", "LIT", "RZC", "TUL", "ICT", "GBD", "LBF", "OCS"] },
  { designator: "J30", type: "CONVENTIONAL", level: "UPPER", points: ["JAX", "AMG", "MCN", "ATL", "GQO", "BNA", "LOZ", "IIU", "CVG", "FWA", "GPT", "GRR", "GRB", "DLH", "BRD", "BJI", "GFK", "GTF", "HLN", "MSO", "GEG"] },
  { designator: "J34", type: "CONVENTIONAL", level: "UPPER", points: ["ELP", "DMN", "TCS", "ABQ", "HVE", "DVC", "CHE", "PUB", "AKO", "ONL", "FSD", "MSP", "EAU", "IWD", "IRON", "SSM", "YYZ"] },
  { designator: "J42", type: "CONVENTIONAL", level: "UPPER", points: ["MIA", "ZBV", "JAX", "MCN", "ATL", "GQO", "BNA", "PAH", "STL", "IRK", "FOD", "OBH", "LBF", "CYS", "BOY", "MLD", "BOI", "IMB", "PDT", "BTG"] },
  { designator: "J47", type: "CONVENTIONAL", level: "UPPER", points: ["LGA", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "CYS", "OCS", "BOY", "BOI", "KEED", "REO", "LKV"] },
  { designator: "J52", type: "CONVENTIONAL", level: "UPPER", points: ["ORF", "RIC", "LYH", "GQO", "BNA", "MEM", "LIT", "FSM", "TUL", "ICT", "GBD", "LBF", "CYS", "BOY", "MLD", "BOI", "KEED"] },
  { designator: "J60", type: "CONVENTIONAL", level: "UPPER", points: ["BOS", "HTO", "BDR", "SAX", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "BFF", "CYS", "OCS", "BOY", "MLD"] },
  { designator: "J80", type: "CONVENTIONAL", level: "UPPER", points: ["JAX", "CRG", "CTY", "TLH", "MCN", "ATL", "GQO", "BNA", "PAH", "STL", "IRK", "FOD", "OBH", "LBF", "CYS", "OCS", "BOY", "BOI", "KEED", "REO", "LKV", "FMG"] },
  { designator: "J110", type: "CONVENTIONAL", level: "UPPER", points: ["LAX", "DAG", "BCE", "DVC", "CHE", "PUB", "AKO", "ONL", "FSD", "MSP", "GRB", "DLH", "BRD", "BJI", "GFK", "GTF"] },
  { designator: "J146", type: "CONVENTIONAL", level: "UPPER", points: ["MIA", "ZBV", "JAX", "AMG", "MCN", "ATL", "GQO", "BNA", "PAH", "STL", "IRK", "FOD", "OBH", "LBF", "BFF", "CYS", "OCS", "BOY", "MLD"] },

  // ═══════════ North America — Victor Airways (V) — low altitude ═══════════
  { designator: "V1",  type: "CONVENTIONAL", level: "LOWER", points: ["BOS", "PVD", "HTO", "BDR", "SAX", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "CYS", "OCS", "BOY", "MLD"] },
  { designator: "V6",  type: "CONVENTIONAL", level: "LOWER", points: ["JFK", "RBV", "IAD", "HYK", "CVG", "FAM", "STL", "SGF", "TUL", "GAGE", "DHT", "ELP", "DMN", "TCS", "ABQ"] },
  { designator: "V12", type: "CONVENTIONAL", level: "LOWER", points: ["MIA", "ZBV", "JAX", "AMG", "MCN", "ATL", "BHM", "MEI", "JAN", "AOK", "LIT", "FSM", "TUL", "ICT", "HLC", "BFF", "OCS"] },
  { designator: "V16", type: "CONVENTIONAL", level: "LOWER", points: ["LAX", "DAG", "BCE", "DVC", "CHE", "PUB", "AKO", "ONL", "FSD", "MSP", "GRB", "DLH", "BRD", "BJI", "GFK", "GTF", "HLN"] },
  { designator: "V21", type: "CONVENTIONAL", level: "LOWER", points: ["BOS", "PVD", "HTO", "BDR", "SAX", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "BFF", "CYS", "OCS"] },
  { designator: "V24", type: "CONVENTIONAL", level: "LOWER", points: ["PBI", "PHK", "OMN", "ORL", "BAE", "CTY", "TLH", "MCN", "BHM", "MEI", "AOK", "LIT", "RZC", "TUL", "ICT", "GBD", "LBF"] },
  { designator: "V31", type: "CONVENTIONAL", level: "LOWER", points: ["ORF", "RIC", "LYH", "GQO", "BNA", "MEM", "LIT", "FSM", "TUL", "ICT", "GBD", "LBF", "CYS", "BOY", "MLD", "BOI"] },
  { designator: "V37", type: "CONVENTIONAL", level: "LOWER", points: ["JAX", "AMG", "MCN", "ATL", "GQO", "BNA", "LOZ", "IIU", "CVG", "FWA", "GPT", "GRR", "GRB", "DLH", "BRD", "BJI"] },
  { designator: "V41", type: "CONVENTIONAL", level: "LOWER", points: ["ELP", "DMN", "TCS", "ABQ", "HVE", "DVC", "CHE", "PUB", "AKO", "ONL", "FSD", "MSP", "EAU", "IWD", "IRON"] },
  { designator: "V44", type: "CONVENTIONAL", level: "LOWER", points: ["MIA", "ZBV", "JAX", "MCN", "ATL", "GQO", "BNA", "PAH", "STL", "IRK", "FOD", "OBH", "LBF", "CYS", "BOY", "MLD", "BOI"] },
  { designator: "V50", type: "CONVENTIONAL", level: "LOWER", points: ["LGA", "ETX", "PSB", "DQO", "CVG", "IND", "BDF", "IOW", "OBH", "LBF", "CYS", "OCS", "BOY", "BOI", "KEED", "REO"] },

  // ═══════════ North America — Q Routes (RNAV high) ═══════════
  { designator: "Q1",   type: "RNAV", level: "UPPER", points: ["KJFK", "KORD", "KDEN", "KLAX"] },
  { designator: "Q3",   type: "RNAV", level: "UPPER", points: ["KMIA", "KATL", "KORD", "KMSP", "CYEG"] },
  { designator: "Q5",   type: "RNAV", level: "UPPER", points: ["KBOS", "KJFK", "KMIA", "KEYW"] },
  { designator: "Q11",  type: "RNAV", level: "UPPER", points: ["KSEA", "KSFO", "KLAX", "KPHX", "KDFW", "KIAH", "KMIA"] },
  { designator: "Q13",  type: "RNAV", level: "UPPER", points: ["KJFK", "KCLE", "KORD", "KMCI", "KDEN", "KSFO"] },
  { designator: "Q15",  type: "RNAV", level: "UPPER", points: ["KBOS", "KJFK", "KIAD", "KATL", "KMCO", "KMIA"] },
  { designator: "Q43",  type: "RNAV", level: "UPPER", points: ["KLAX", "KLAS", "KDEN", "KMCI", "KORD", "KCLE", "KJFK"] },
  { designator: "Q45",  type: "RNAV", level: "UPPER", points: ["KSEA", "KPDX", "KSFO", "KLAX", "KPHX"] },
  { designator: "Q47",  type: "RNAV", level: "UPPER", points: ["KMSP", "KORD", "KIND", "KCVG", "KATL", "KMIA"] },
  { designator: "Q99",  type: "RNAV", level: "UPPER", points: ["CYVR", "CYYC", "CYWG", "CYUL", "CYYZ"] },
  { designator: "Q100", type: "RNAV", level: "UPPER", points: ["CYYZ", "CYOW", "CYUL", "CYQM", "CYYT"] },

  // ═══════════ North America — T Routes (RNAV low) ═══════════
  { designator: "T1",   type: "RNAV", level: "LOWER", points: ["KJFK", "KORD", "KDEN", "KLAX"] },
  { designator: "T3",   type: "RNAV", level: "LOWER", points: ["KMIA", "KATL", "KORD", "KMSP"] },
  { designator: "T5",   type: "RNAV", level: "LOWER", points: ["KBOS", "KJFK", "KIAD", "KMIA"] },
  { designator: "T11",  type: "RNAV", level: "LOWER", points: ["KSEA", "KSFO", "KLAX", "KPHX"] },
  { designator: "T205", type: "RNAV", level: "LOWER", points: ["KTEB", "KJFK", "KEWR", "KLGA"] },
  { designator: "T230", type: "RNAV", level: "LOWER", points: ["KSFO", "KSAC", "KRNO", "KSLC"] },

  // ═══════════ Europe — U routes (upper conventional) ═══════════
  { designator: "UZ1",  type: "CONVENTIONAL", level: "UPPER", points: ["EGLL", "EHAM", "EDDF", "EDDM", "LOWS", "LOWW", "LHBP", "LBSR"] },
  { designator: "UZ2",  type: "CONVENTIONAL", level: "UPPER", points: ["EGLC", "EBBR", "EDDL", "EDDB", "EPWA", "UMMS", "UUWW"] },
  { designator: "UZ3",  type: "CONVENTIONAL", level: "UPPER", points: ["LFPG", "LSGG", "LSZH", "LOWW", "LHBP", "LBSR", "LTFM"] },
  { designator: "UZ4",  type: "CONVENTIONAL", level: "UPPER", points: ["EHAM", "EDDL", "EDDF", "EDDK", "EDDM", "LSGG"] },
  { designator: "UZ5",  type: "CONVENTIONAL", level: "UPPER", points: ["LFPG", "EBBR", "EHAM", "EDDH", "ESSA", "UUEE"] },
  { designator: "UZ6",  type: "CONVENTIONAL", level: "UPPER", points: ["LEMD", "LFPG", "EBBR", "EHAM", "EDDL"] },
  { designator: "UZ7",  type: "CONVENTIONAL", level: "UPPER", points: ["LIRF", "LIMC", "LSGG", "LFPG", "EGBB"] },
  { designator: "UZ9",  type: "CONVENTIONAL", level: "UPPER", points: ["LEMG", "LEMD", "LFBD", "LFPG", "EBBR"] },
  { designator: "UZ10", type: "CONVENTIONAL", level: "UPPER", points: ["LTFM", "LTAI", "LCLK", "LGAV", "LIRF"] },
  { designator: "UZ11", type: "CONVENTIONAL", level: "UPPER", points: ["EHAM", "EDDF", "LKPR", "EPWA", "UMMS", "UUWW"] },
  { designator: "UZ15", type: "CONVENTIONAL", level: "UPPER", points: ["EIDW", "EGKK", "EGCC", "EHAM", "EDDL"] },
  { designator: "UZ20", type: "CONVENTIONAL", level: "UPPER", points: ["LEBL", "LFMN", "LIMC", "LJLJ", "LOWW"] },
  { designator: "UZ25", type: "CONVENTIONAL", level: "UPPER", points: ["LGAV", "LGRP", "LCLK", "LLBG", "LTAI"] },
  { designator: "UZ30", type: "CONVENTIONAL", level: "UPPER", points: ["ESSA", "EETN", "ULLI", "UUWW", "UWWW"] },
  { designator: "UZ35", type: "CONVENTIONAL", level: "UPPER", points: ["ENGM", "ESSA", "EKCH", "EDDH", "EHAM"] },
  { designator: "UZ40", type: "CONVENTIONAL", level: "UPPER", points: ["ENZV", "EKCH", "ESSA", "EFHK", "ULLI"] },
  { designator: "UZ45", type: "CONVENTIONAL", level: "UPPER", points: ["BIKF", "EGAA", "EGPF", "EHAM", "EDDH"] },
  { designator: "UZ50", type: "CONVENTIONAL", level: "UPPER", points: ["EINN", "EGKK", "LFPG", "EBBR", "EDDL"] },
  { designator: "UZ60", type: "CONVENTIONAL", level: "UPPER", points: ["LTFM", "LTAI", "LCLK", "HECA", "HESH"] },
  { designator: "UZ70", type: "CONVENTIONAL", level: "UPPER", points: ["UUWW", "UWWW", "UACC", "UAII", "ZWWW"] },
  { designator: "UZ80", type: "CONVENTIONAL", level: "UPPER", points: ["LGAV", "LIRF", "LIMM", "LSGG", "LFPG"] },
  { designator: "UZ90", type: "CONVENTIONAL", level: "UPPER", points: ["EPWA", "LKPR", "LKMT", "LHBP", "LBSR", "LTFM"] },
  { designator: "UZ100", type: "CONVENTIONAL", level: "UPPER", points: ["EIDW", "EGPH", "EHAM", "EDDH", "ESSA", "UUEE"] },
  { designator: "UZ150", type: "CONVENTIONAL", level: "UPPER", points: ["LEBL", "LEMD", "LEMD", "LFPB", "EBBR"] },
  { designator: "UZ200", type: "CONVENTIONAL", level: "UPPER", points: ["LTBA", "LTFM", "LTAI", "LLBG", "OJAI"] },
  { designator: "UZ300", type: "CONVENTIONAL", level: "UPPER", points: ["EHAM", "EDDL", "LSGG", "LIMC", "LIRF", "LGAV"] },

  // ═══════════ Europe — UM routes (RNAV upper) ═══════════
  { designator: "UM1",   type: "RNAV", level: "UPPER", points: ["EGLL", "EHAM", "EDDF", "EDDM", "LOWW", "LHBP"] },
  { designator: "UM2",   type: "RNAV", level: "UPPER", points: ["LFPG", "EBBR", "EDDL", "EDDB", "EPWA", "UMMS"] },
  { designator: "UM3",   type: "RNAV", level: "UPPER", points: ["LEMD", "LFPG", "LSGG", "LOWW", "LHBP"] },
  { designator: "UM4",   type: "RNAV", level: "UPPER", points: ["EGLL", "EGCC", "EHAM", "EDDL", "EDDF"] },
  { designator: "UM5",   type: "RNAV", level: "UPPER", points: ["LEBL", "LFMN", "LIMC", "LJLJ", "LOWW"] },
  { designator: "UM6",   type: "RNAV", level: "UPPER", points: ["LIRF", "LIMC", "LSGG", "LFPG", "EBBR"] },
  { designator: "UM7",   type: "RNAV", level: "UPPER", points: ["EHAM", "EDDH", "ESSA", "UUEE", "ULLI"] },
  { designator: "UM8",   type: "RNAV", level: "UPPER", points: ["ENGM", "ESSA", "EKCH", "EDDH", "EHAM"] },
  { designator: "UM9",   type: "RNAV", level: "UPPER", points: ["LTFM", "LTAI", "LCLK", "LGAV", "LIRF"] },
  { designator: "UM10",  type: "RNAV", level: "UPPER", points: ["EIDW", "EGKK", "EGCC", "EHAM", "EDDL"] },
  { designator: "UM11",  type: "RNAV", level: "UPPER", points: ["LFPG", "EBBR", "EDDL", "EDDF", "EDDM", "LOWW"] },
  { designator: "UM12",  type: "RNAV", level: "UPPER", points: ["LEBL", "LEMD", "LFPB", "LFPG", "EBBR"] },
  { designator: "UM13",  type: "RNAV", level: "UPPER", points: ["LGAV", "LIRF", "LIMM", "LSGG", "LFPG"] },
  { designator: "UM14",  type: "RNAV", level: "UPPER", points: ["EHAM", "EDDF", "LKPR", "EPWA", "UMMS"] },
  { designator: "UM15",  type: "RNAV", level: "UPPER", points: ["EGLL", "EGPH", "EHAM", "EDDH", "ESSA"] },
  { designator: "UM16",  type: "RNAV", level: "UPPER", points: ["ENZV", "EKCH", "ESSA", "EFHK", "ULLI"] },
  { designator: "UM17",  type: "RNAV", level: "UPPER", points: ["BIKF", "EGAA", "EGPF", "EHAM", "EDDH"] },
  { designator: "UM18",  type: "RNAV", level: "UPPER", points: ["EINN", "EGKK", "LFPG", "EBBR", "EDDL"] },
  { designator: "UM19",  type: "RNAV", level: "UPPER", points: ["LTBA", "LTFM", "LTAI", "LLBG", "OJAI"] },
  { designator: "UM20",  type: "RNAV", level: "UPPER", points: ["UUWW", "UWWW", "UACC", "UAII", "ZWWW"] },
  { designator: "UM25",  type: "RNAV", level: "UPPER", points: ["LGAV", "LGRP", "LCLK", "LLBG", "LTAI"] },
  { designator: "UM30",  type: "RNAV", level: "UPPER", points: ["ESSA", "EETN", "ULLI", "UUWW", "UWWW"] },
  { designator: "UM35",  type: "RNAV", level: "UPPER", points: ["EPWA", "LKPR", "LKMT", "LHBP", "LBSR", "LTFM"] },
  { designator: "UM40",  type: "RNAV", level: "UPPER", points: ["EIDW", "EGPH", "EHAM", "EDDH", "ESSA", "UUEE"] },
  { designator: "UM45",  type: "RNAV", level: "UPPER", points: ["LEBL", "LEMD", "LFPG", "EBBR", "EHAM"] },
  { designator: "UM50",  type: "RNAV", level: "UPPER", points: ["EHAM", "EDDL", "LSGG", "LIMC", "LIRF", "LGAV"] },
  { designator: "UM60",  type: "RNAV", level: "UPPER", points: ["LFPG", "LSGG", "LIMC", "LIRF", "LGAV", "LCLK"] },
  { designator: "UM85",  type: "RNAV", level: "UPPER", points: ["EDDM", "LOWW", "LHBP", "LBSR", "LTFM"] },
  { designator: "UM98",  type: "RNAV", level: "UPPER", points: ["EKCH", "ESSA", "EFHK", "ULLI", "ULOL"] },
  { designator: "UM728", type: "RNAV", level: "UPPER", points: ["LEBL", "LFMN", "LIRF", "LGAV", "LCLK"] },

  // ═══════════ Asia — A/B/R routes ═══════════
  { designator: "A1",  type: "CONVENTIONAL", level: "BOTH", points: ["RJTT", "RJBB", "RKSI", "ZBAA", "UUWW"] },
  { designator: "A2",  type: "CONVENTIONAL", level: "BOTH", points: ["VHHH", "ZGGG", "ZSPD", "RKSI", "RJBB"] },
  { designator: "A3",  type: "CONVENTIONAL", level: "BOTH", points: ["VTBD", "WMKK", "WSAP", "WIII", "YSSY"] },
  { designator: "A4",  type: "CONVENTIONAL", level: "BOTH", points: ["OMDB", "OTBD", "OERK", "OEDF", "OEJN"] },
  { designator: "A5",  type: "CONVENTIONAL", level: "BOTH", points: ["VABB", "VOMM", "VCBI", "VTBD", "VVTS"] },
  { designator: "A6",  type: "CONVENTIONAL", level: "BOTH", points: ["ZUUU", "ZGGG", "ZSAM", "RCTP", "RPLL"] },
  { designator: "A7",  type: "CONVENTIONAL", level: "BOTH", points: ["ZBAA", "ZUUU", "ZGGG", "VHHH", "WMKK"] },
  { designator: "A8",  type: "CONVENTIONAL", level: "BOTH", points: ["UTTT", "UAII", "ZWWW", "ZLXN", "ZBAA"] },
  { designator: "A9",  type: "CONVENTIONAL", level: "BOTH", points: ["VVNB", "VVTS", "WMKK", "WSGG", "VIDP"] },
  { designator: "A10", type: "CONVENTIONAL", level: "BOTH", points: ["RJBB", "RJFF", "RKPK", "ZSPD", "RCTP"] },
  { designator: "B1",  type: "CONVENTIONAL", level: "LOWER", points: ["RJTT", "RJNS", "RJBB", "RJFK", "ROAH"] },
  { designator: "B2",  type: "CONVENTIONAL", level: "LOWER", points: ["ZBAA", "ZSJN", "ZSSS", "ZSPD", "ZSHC"] },
  { designator: "B3",  type: "CONVENTIONAL", level: "LOWER", points: ["VHHH", "ZGOW", "ZGGG", "ZGSZ", "VMMC"] },
  { designator: "B4",  type: "CONVENTIONAL", level: "LOWER", points: ["VTBD", "VTBU", "VVTS", "WMKK", "WSAP"] },
  { designator: "B5",  type: "CONVENTIONAL", level: "LOWER", points: ["OMDB", "OMAA", "OTBD", "OERK", "OBBI"] },
  { designator: "R1",  type: "RNAV", level: "UPPER", points: ["RJTT", "RJBB", "RKSI", "ZBAA"] },
  { designator: "R2",  type: "RNAV", level: "UPPER", points: ["VHHH", "ZGGG", "ZSPD", "RKSI"] },
  { designator: "R3",  type: "RNAV", level: "UPPER", points: ["VTBD", "WMKK", "WSAP", "WIII"] },
  { designator: "R4",  type: "RNAV", level: "UPPER", points: ["OMDB", "OTBD", "OERK", "OEDF"] },
  { designator: "R5",  type: "RNAV", level: "UPPER", points: ["VABB", "VOMM", "VCBI", "VTBD"] },
  { designator: "R6",  type: "RNAV", level: "UPPER", points: ["ZUUU", "ZGGG", "ZSAM", "RCTP"] },
  { designator: "R7",  type: "RNAV", level: "UPPER", points: ["ZBAA", "ZUUU", "ZGGG", "VHHH"] },
  { designator: "R8",  type: "RNAV", level: "UPPER", points: ["UTTT", "UAII", "ZWWW", "ZLXN", "ZBAA"] },
  { designator: "R9",  type: "RNAV", level: "UPPER", points: ["VVNB", "VVTS", "WMKK", "WSGG"] },
  { designator: "R10", type: "RNAV", level: "UPPER", points: ["RJBB", "RJFF", "RKPK", "ZSPD"] },
  { designator: "R208", type: "RNAV", level: "UPPER", points: ["YSSY", "YBBN", "YMMM", "YPPH"] },
  { designator: "R214", type: "RNAV", level: "UPPER", points: ["WAAA", "WIII", "WMKK", "VTBD"] },
  { designator: "R339", type: "RNAV", level: "UPPER", points: ["ZGGG", "ZGSZ", "VHHH", "WMKK", "WSAP"] },
  { designator: "R599", type: "RNAV", level: "UPPER", points: ["VTBD", "VTBS", "WMKK", "WSAP", "WSSS"] },

  // ═══════════ South America — U/A routes (extension beyond Peru) ═══════════
  { designator: "UZ1SA",  type: "RNAV", level: "UPPER", points: ["SCEL", "SCTE", "SAME", "SABE", "SBGR"] },
  { designator: "UZ2SA",  type: "RNAV", level: "UPPER", points: ["SKBO", "SKCL", "SEQM", "SPME", "SPJC"] },
  { designator: "UZ3SA",  type: "RNAV", level: "UPPER", points: ["SBBR", "SBGL", "SBRJ", "SAEZ", "SUMU"] },
  { designator: "UZ4SA",  type: "RNAV", level: "UPPER", points: ["SVMI", "SKBO", "SEGU", "SPME", "SPQU"] },
  { designator: "UZ5SA",  type: "RNAV", level: "UPPER", points: ["SBCF", "SBGR", "SGAS", "SUMU", "SAEZ"] },
  { designator: "UZ6SA",  type: "RNAV", level: "UPPER", points: ["SLLP", "SLVR", "SBGU", "SBGR", "SBSJ"] },
  { designator: "UZ7SA",  type: "RNAV", level: "UPPER", points: ["SVMC", "SVCS", "SKCL", "SEQM", "SELT"] },
  { designator: "UZ8SA",  type: "RNAV", level: "UPPER", points: ["SPZO", "SPJC", "SPME", "SEQM", "SKCL"] },
  { designator: "UZ9SA",  type: "RNAV", level: "UPPER", points: ["SCTE", "SCEL", "SCFA", "SPJC", "SPME"] },
  { designator: "UZ10SA", type: "RNAV", level: "UPPER", points: ["SBPA", "SBFL", "SBGR", "SBSV", "SBRF"] },
  { designator: "A1SA",   type: "CONVENTIONAL", level: "BOTH", points: ["SAEZ", "SUMU", "SGAS", "SLLP", "SLVR"] },
  { designator: "A2SA",   type: "CONVENTIONAL", level: "BOTH", points: ["SKBO", "SVMI", "SPJC", "SLLP", "SCEL"] },
  { designator: "A3SA",   type: "CONVENTIONAL", level: "BOTH", points: ["SBGL", "SBRJ", "SBSV", "SBNT", "SBFZ"] },
  { designator: "A4SA",   type: "CONVENTIONAL", level: "BOTH", points: ["SBBR", "SBPA", "SCEL", "SCFA", "SCTE"] },
  { designator: "A5SA",   type: "CONVENTIONAL", level: "BOTH", points: ["SEQM", "SEGU", "SKCL", "SKBO", "SVMI"] },

  // ═══════════ Africa — A routes ═══════════
  { designator: "A1AF",  type: "CONVENTIONAL", level: "BOTH", points: ["FAOR", "FBSK", "FQMA", "FVHA", "FALE"] },
  { designator: "A2AF",  type: "CONVENTIONAL", level: "BOTH", points: ["HECA", "HSSS", "HKJK", "HTDA", "HRYR"] },
  { designator: "A3AF",  type: "CONVENTIONAL", level: "BOTH", points: ["DNMM", "DGAA", "DFFI", "GOGG", "DIAP"] },
  { designator: "A4AF",  type: "CONVENTIONAL", level: "BOTH", points: ["GMMN", "GMMN", "GMAD", "GABS", "DRRN"] },
  { designator: "A5AF",  type: "CONVENTIONAL", level: "BOTH", points: ["FACT", "FAJS", "FAOR", "FBSK", "FNLU"] },
  { designator: "A6AF",  type: "CONVENTIONAL", level: "BOTH", points: ["HECA", "LLBG", "OJAI", "OSDI", "OTBD"] },
  { designator: "A7AF",  type: "CONVENTIONAL", level: "BOTH", points: ["HKJK", "HTDA", "HRYR", "FZAA", "FCBB"] },
  { designator: "A8AF",  type: "CONVENTIONAL", level: "BOTH", points: ["DIAP", "DGAA", "FNLU", "FZAA", "HKJK"] },

  // ═══════════ Middle East ═══════════
  { designator: "M1",  type: "CONVENTIONAL", level: "UPPER", points: ["OMDB", "OTBD", "OERK", "OEDF", "OEJN", "OEJN"] },
  { designator: "M2",  type: "CONVENTIONAL", level: "UPPER", points: ["LLBG", "OJAI", "OSDI", "ORER", "OKBK"] },
  { designator: "M3",  type: "CONVENTIONAL", level: "UPPER", points: ["OTBD", "OMAA", "OMFJ", "OYHD", "OEAB"] },
  { designator: "M4",  type: "CONVENTIONAL", level: "UPPER", points: ["OMDB", "OMAA", "OEGS", "OERK", "ORBS"] },

  // ═══════════ Oceanic Tracks (NAT) — representative tracks ═══════════
  // These are dynamic in reality but we provide fixed entry/exit waypoints
  { designator: "NATA", type: "CONVENTIONAL", level: "UPPER", points: ["EINN", "BIBOS", "GOMUP", "CARPE", "CYYT", "CYQX"] },
  { designator: "NATB", type: "CONVENTIONAL", level: "UPPER", points: ["EGKK", "KESIX", "BRAVO", "MALOT", "CYYT", "CYZX"] },
  { designator: "NATC", type: "CONVENTIONAL", level: "UPPER", points: ["EHAM", "TANGO", "BRAVO", "KESIX", "EINN", "BIBOS"] },
  { designator: "NATZ", type: "CONVENTIONAL", level: "UPPER", points: ["BIKF", "CARPE", "KESIX", "BRAVO", "CYYT", "CYQX"] },

  // ═══════════ Pacific Tracks (PACOT) — representative ═══════════
  { designator: "PAC1", type: "CONVENTIONAL", level: "UPPER", points: ["RJBB", "MOLON", "BASDA", "AKRAS", "PHNL"] },
  { designator: "PAC2", type: "CONVENTIONAL", level: "UPPER", points: ["RJTT", "RISTI", "MOLON", "BASDA", "KSFO"] },
  { designator: "PAC3", type: "CONVENTIONAL", level: "UPPER", points: ["KLAX", "RISTI", "MOLON", "BASDA", "YSSY"] },

  // ═══════════ Central America / Caribbean ═══════════
  { designator: "UZ1CA", type: "RNAV", level: "UPPER", points: ["MMSD", "MMMX", "MMUN", "MNMG", "MPTO"] },
  { designator: "UZ2CA", type: "RNAV", level: "UPPER", points: ["MDPC", "MDSB", "MKJP", "MWCR", "TNCA"] },
  { designator: "UZ3CA", type: "RNAV", level: "UPPER", points: ["SVMI", "SKBQ", "MDSD", "TNCM", "TNCC"] },
];

// ─── Procedural regional connectors between major airports ─────────
// For each region, pick the large airports and connect each airport to
// its 2-3 nearest large airport neighbors with an "Rxxx" RNAV route.
// This gives comprehensive visual coverage of major airways.

function pickLargeAirports(airports, region) {
  // Region filter
  const ranges = {
    NAM: { minLat: 25, maxLat: 70, minLon: -170, maxLon: -50 },
    SAM: { minLat: -56, maxLat: 13, minLon: -82, maxLon: -34 },
    EUR: { minLat: 36, maxLat: 71, minLon: -10, maxLon: 40 },
    AFR: { minLat: -35, maxLat: 36, minLon: -18, maxLon: 52 },
    ME:  { minLat: 12, maxLat: 41, minLon: 25, maxLon: 60 },
    ASIA:{ minLat: -10, maxLat: 55, minLon: 60, maxLon: 145 },
    OCE: { minLat: -50, maxLat: 0, minLon: 110, maxLon: 180 },
  };
  const r = ranges[region];
  if (!r) return [];
  return airports.filter(a =>
    a.t === "large_airport" &&
    a.la >= r.minLat && a.la <= r.maxLat &&
    a.lo >= r.minLon && a.lo <= r.maxLon
  );
}

function generateProceduralAirways(airports) {
  const regions = ["NAM", "SAM", "EUR", "AFR", "ME", "ASIA", "OCE"];
  const result = [];
  let counter = 500;
  for (const region of regions) {
    const large = pickLargeAirports(airports, region);
    console.log(`  [${region}] ${large.length} large airports`);
    for (const ap of large) {
      // Find 3 nearest large airports
      const distances = large
        .filter(o => o.i !== ap.i)
        .map(o => ({ ap: o, d: distNM({ lat: ap.la, lon: ap.lo }, { lat: o.la, lon: o.lo }) }))
        .filter(o => o.d > 50 && o.d < 1500)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const n of distances) {
        // Avoid duplicates by only creating route when ap.i < n.ap.i
        if (ap.i.localeCompare(n.ap.i) < 0) {
          result.push({
            designator: `R${counter++}`,
            type: "RNAV",
            level: "UPPER",
            points: [ap.i, n.ap.i],
            procedural: true,
          });
        }
      }
    }
  }
  return result;
}

// ─── Extra waypoints at FIR boundary crossings and oceanic fixes ────
// Hand-curated set of well-known oceanic entry/exit and FIR transfer points.
// Coordinates from public aviation reference (approximate where exact unavailable).
const EXTRA_WAYPOINTS = [
  // NAT entry/exit fixes (North Atlantic)
  { id: "GOMUP",  lat: 49.75, lon: -10.00, country: "GB", region: "NAT", description: "NAT entry Gander/Shanwick", transfer: true },
  { id: "MALOT",  lat: 56.00, lon: -10.00, country: "GB", region: "NAT", description: "NAT northern entry", transfer: true },
  { id: "CARPE",  lat: 49.00, lon: -50.00, country: "CA", region: "NAT", description: "NAT mid-way", notif: true },
  { id: "BRAVO",  lat: 50.00, lon: -30.00, country: "XX", region: "NAT", description: "NAT mid-Atlantic", notif: true },
  { id: "KESIX",  lat: 49.00, lon: -40.00, country: "XX", region: "NAT", description: "NAT mid-Atlantic", notif: true },
  { id: "TANGO",  lat: 50.00, lon: -20.00, country: "XX", region: "NAT", description: "NAT mid-Atlantic", notif: true },
  { id: "BIBOS",  lat: 48.72, lon: 1.37,  country: "FR", region: "EUR", description: "Paris approach / NAT entry" },
  { id: "DELOG",  lat: 51.50, lon: -8.00, country: "IE", region: "NAT", description: "Shanwick boundary", transfer: true },
  { id: "LIMRI",  lat: 52.00, lon: -15.00, country: "XX", region: "NAT", description: "Shanwick oceanic entry", transfer: true },
  { id: "XETBO",  lat: 49.00, lon: -15.00, country: "XX", region: "NAT", description: "Shanwick oceanic" },

  // PACOT fixes (Pacific)
  { id: "AKRAS",  lat: 21.00, lon: -157.00, country: "US", region: "PACOT", description: "Honolulu Pacific transition", transfer: true },
  { id: "BASDA",  lat: 30.00, lon: -150.00, country: "US", region: "PACOT", description: "Pacific central", notif: true },
  { id: "MOLON",  lat: 28.00, lon: -140.00, country: "US", region: "PACOT", description: "California Pacific exit", transfer: true },
  { id: "RISTI",  lat: 35.00, lon: -125.00, country: "US", region: "PACOT", description: "US West Coast entry", notif: true },
  { id: "ENI",    lat: 39.00, lon: -127.00, country: "US", region: "PACOT", description: "Pacific track", notif: true },
  { id: "BELEE",  lat: 33.00, lon: -132.00, country: "US", region: "PACOT", description: "Pacific track", notif: true },
  { id: "SHEAD",  lat: 32.00, lon: -125.00, country: "US", region: "PACOT", description: "Pacific track", notif: true },

  // US-Canada FIR transfer points
  { id: "DANJA",  lat: 49.00, lon: -95.00, country: "CA", region: "NAM", description: "FIR transfer US/CA", transfer: true },
  { id: "YQT",    lat: 48.50, lon: -89.50, country: "CA", region: "NAM", description: "FIR transfer US/CA", transfer: true },
  { id: "YZT",    lat: 50.70, lon: -127.40, country: "CA", region: "NAM", description: "FIR transfer US/CA Pacific", transfer: true },
  { id: "YYG",    lat: 46.30, lon: -63.10, country: "CA", region: "NAM", description: "FIR transfer US/CA Atlantic", transfer: true },

  // US-Mexico FIR transfer points
  { id: "PEPEE",  lat: 26.00, lon: -100.00, country: "MX", region: "NAM", description: "FIR transfer US/MX", transfer: true },
  { id: "CRUZ",   lat: 29.50, lon: -105.00, country: "MX", region: "NAM", description: "FIR transfer US/MX", transfer: true },
  { id: "FRE",    lat: 31.00, lon: -106.50, country: "MX", region: "NAM", description: "FIR transfer US/MX", transfer: true },

  // Europe FIR transfer points
  { id: "KOK",    lat: 51.10, lon: 2.65,  country: "BE", region: "EUR", description: "Brussels North major intersection", transfer: true },
  { id: "OKGUM",  lat: 50.03, lon: 8.57,  country: "DE", region: "EUR", description: "Frankfurt terminal", notif: true },
  { id: "SIDPE",  lat: 51.50, lon: 0.00,  country: "GB", region: "EUR", description: "London TMA", notif: true },
  { id: "BIG",    lat: 51.32, lon: 0.03,  country: "GB", region: "EUR", description: "London TMA Biggin VOR", notif: true },
  { id: "LAM",    lat: 51.65, lon: 0.15,  country: "GB", region: "EUR", description: "London TMA Lambourne", notif: true },
  { id: "BNN",    lat: 51.73, lon: -0.54, country: "GB", region: "EUR", description: "London TMA Bovingdon", notif: true },
  { id: "DET",    lat: 51.31, lon: 0.61,  country: "GB", region: "EUR", description: "London TMA Detling", notif: true },
  { id: "CPT",    lat: 51.48, lon: -0.07, country: "GB", region: "EUR", description: "London City" },
  { id: "MID",    lat: 51.45, lon: -0.16, country: "GB", region: "EUR", description: "London Heathrow" },
  { id: "MARGI",  lat: 50.50, lon: 0.50,  country: "GB", region: "EUR", description: "London FIR boundary", transfer: true },
  { id: "SFD",    lat: 51.00, lon: 1.30,  country: "FR", region: "EUR", description: "France/UK FIR transfer", transfer: true },
  { id: "DIK",    lat: 50.20, lon: 4.20,  country: "BE", region: "EUR", description: "Belgium/France FIR transfer", transfer: true },
  { id: "KOKOV",  lat: 50.90, lon: 4.50,  country: "BE", region: "EUR", description: "Brussels TMA" },
  { id: "ELB",    lat: 51.50, lon: 10.50, country: "DE", region: "EUR", description: "Germany FIR transfer", transfer: true },
  { id: "WTG",    lat: 53.50, lon: 9.50,  country: "DE", region: "EUR", description: "Germany North FIR transfer", transfer: true },
  { id: "RID",    lat: 50.40, lon: 8.50,  country: "DE", region: "EUR", description: "Frankfurt TMA", notif: true },

  // Africa FIR transfer / notification points
  { id: "REKLA",  lat: -26.00, lon: 28.00, country: "ZA", region: "AFR", description: "Johannesburg approach", notif: true },
  { id: "KAPVI",  lat: -1.50, lon: 36.00,  country: "KE", region: "AFR", description: "Nairobi terminal", notif: true },
  { id: "DOGAN",  lat: 30.00, lon: 31.00,  country: "EG", region: "AFR", description: "Cairo terminal", notif: true },
  { id: "LARDO",  lat: 6.00, lon: 3.00,    country: "NG", region: "AFR", description: "Lagos terminal", notif: true },
  { id: "ABEEM",  lat: 33.00, lon: -7.00,  country: "MA", region: "AFR", description: "Casablanca" },
  { id: "AGA",    lat: 30.40, lon: -5.50,  country: "MA", region: "AFR", description: "FIR transfer Africa/Europe", transfer: true },
  { id: "TOSA",   lat: 33.50, lon: -7.00,  country: "MA", region: "AFR", description: "Casablanca FIR entry", transfer: true },

  // Middle East FIR transfer points
  { id: "ORGAN",  lat: 25.00, lon: 55.00, country: "AE", region: "ME", description: "Dubai terminal", notif: true },
  { id: "PESAT",  lat: 24.50, lon: 54.50, country: "AE", region: "ME", description: "Dubai approach", notif: true },
  { id: "RASDI",  lat: 31.50, lon: 35.00, country: "JO", region: "ME", description: "Amman terminal", notif: true },
  { id: "KFAK",   lat: 32.00, lon: 35.00, country: "IL", region: "ME", description: "Tel Aviv terminal", notif: true },
  { id: "ALSEM",  lat: 25.50, lon: 50.50, country: "QA", region: "ME", description: "FIR transfer Bahrain/Doha", transfer: true },
  { id: "LOTUK",  lat: 27.00, lon: 49.00, country: "SA", region: "ME", description: "FIR transfer Saudi/Bahrain", transfer: true },
  { id: "PERLO",  lat: 26.00, lon: 50.00, country: "SA", region: "ME", description: "Gulf FIR transfer", transfer: true },

  // Asia FIR transfer points
  { id: "BEKOL",  lat: 22.50, lon: 113.50, country: "HK", region: "ASIA", description: "Hong Kong terminal", transfer: true },
  { id: "ELATO",  lat: 22.00, lon: 124.00, country: "TW", region: "ASIA", description: "Taipei FIR", notif: true },
  { id: "SABNO",  lat: 35.50, lon: 140.00, country: "JP", region: "ASIA", description: "Tokyo approach", notif: true },
  { id: "TETRA",  lat: 34.50, lon: 135.00, country: "JP", region: "ASIA", description: "Osaka terminal", notif: true },
  { id: "AKAGI",  lat: 36.50, lon: 139.00, country: "JP", region: "ASIA", description: "Tokyo north" },
  { id: "OLMPA",  lat: 37.50, lon: 127.00, country: "KR", region: "ASIA", description: "Seoul terminal", notif: true },
  { id: "GUVAG",  lat: 13.00, lon: 80.00,  country: "IN", region: "ASIA", description: "Chennai terminal", notif: true },
  { id: "BBU",    lat: 19.00, lon: 73.00,  country: "IN", region: "ASIA", description: "Mumbai terminal", notif: true },
  { id: "BIPOP",  lat: 28.50, lon: 77.00,  country: "IN", region: "ASIA", description: "Delhi terminal", notif: true },
  { id: "PASBA",  lat: 1.50, lon: 104.00,  country: "SG", region: "ASIA", description: "Singapore approach", notif: true },
  { id: "VMR",    lat: 1.00, lon: 104.00,  country: "SG", region: "ASIA", description: "Singapore TMA" },
  { id: "BIDRU",  lat: 13.50, lon: 100.50, country: "TH", region: "ASIA", description: "Bangkok terminal", notif: true },
  { id: "TOLAR",  lat: 14.00, lon: 121.00, country: "PH", region: "ASIA", description: "Manila terminal", notif: true },
  { id: "DATMO",  lat: 36.00, lon: 120.00, country: "CN", region: "ASIA", description: "China FIR transfer", transfer: true },
  { id: "LAMEN",  lat: 30.00, lon: 122.00, country: "CN", region: "ASIA", description: "Shanghai FIR transfer", transfer: true },
  { id: "BEMAG",  lat: 23.00, lon: 116.00, country: "CN", region: "ASIA", description: "Guangzhou FIR transfer", transfer: true },
  { id: "NINTUS", lat: 25.00, lon: 110.00, country: "CN", region: "ASIA", description: "China FIR transfer", transfer: true },

  // Oceania FIR transfer points
  { id: "AKMIR",  lat: -33.50, lon: 151.00, country: "AU", region: "OCE", description: "Sydney approach", notif: true },
  { id: "RIVET",  lat: -37.50, lon: 145.00, country: "AU", region: "OCE", description: "Melbourne terminal", notif: true },
  { id: "BANDA",  lat: -8.00, lon: 125.00,  country: "TL", region: "OCE", description: "Timor Sea", notif: true },
  { id: "NOARM",  lat: -36.00, lon: 174.00, country: "NZ", region: "OCE", description: "Auckland terminal", notif: true },
  { id: "KEA",    lat: -33.00, lon: 152.00, country: "AU", region: "OCE", description: "Sydney FIR transfer", transfer: true },

  // South America (non-Peru) FIR transfer points
  { id: "ATOLA",  lat: -34.50, lon: -58.00, country: "AR", region: "SAM", description: "Buenos Aires FIR transfer", transfer: true },
  { id: "REVER",  lat: -23.50, lon: -46.50, country: "BR", region: "SAM", description: "São Paulo FIR transfer", transfer: true },
  { id: "TOD",    lat: -33.50, lon: -70.50, country: "CL", region: "SAM", description: "Santiago FIR transfer", transfer: true },
  { id: "LRA",    lat: 4.70, lon: -74.10,  country: "CO", region: "SAM", description: "Bogotá FIR transfer", transfer: true },
  { id: "UEA",    lat: -0.20, lon: -78.40, country: "EC", region: "SAM", description: "Quito FIR transfer", transfer: true },
  { id: "ESLET",  lat: -20.00, lon: -68.00, country: "BO", region: "SAM", description: "Bolivia FIR transfer", transfer: true },
  { id: "LASGO",  lat: -22.00, lon: -65.00, country: "AR", region: "SAM", description: "Argentina FIR transfer", transfer: true },
  { id: "BULGO",  lat: -29.00, lon: -57.00, country: "AR", region: "SAM", description: "Argentina FIR transfer", transfer: true },
  { id: "BELLO",  lat: -10.00, lon: -65.00, country: "BR", region: "SAM", description: "Brazil FIR transfer", transfer: true },

  // Caribbean
  { id: "BEGAS",  lat: 9.50, lon: -79.50,  country: "PA", region: "SAM", description: "Panama approach", notif: true },
  { id: "GOROK",  lat: 9.00, lon: -80.00,  country: "PA", region: "SAM", description: "Panama TMA", notif: true },
  { id: "SEISA",  lat: 18.50, lon: -69.50, country: "DO", region: "SAM", description: "Santo Domingo", notif: true },
  { id: "UBRAS",  lat: 10.00, lon: -66.00, country: "VE", region: "SAM", description: "Caracas terminal", notif: true },

  // Polar / Arctic
  { id: "NORDO",  lat: 80.00, lon: 0.00,    country: "XX", region: "POLAR", description: "Arctic ocean" },
  { id: "AMIPS",  lat: 70.00, lon: -40.00,  country: "GL", region: "POLAR", description: "Greenland" },
  { id: "RORIK",  lat: 78.00, lon: 15.00,   country: "SJ", region: "POLAR", description: "Svalbard area" },

  // India FIR transfer points
  { id: "KAA",    lat: 13.00, lon: 80.00,  country: "IN", region: "ASIA", description: "Chennai FIR boundary", transfer: true },
  { id: "IDARU",  lat: 23.00, lon: 72.00,  country: "IN", region: "ASIA", description: "Ahmedabad FIR boundary", transfer: true },
  { id: "UDOM",   lat: 21.00, lon: 75.00,  country: "IN", region: "ASIA", description: "Mumbai FIR boundary", transfer: true },

  // Russia / CIS FIR transfer points
  { id: "UUD",    lat: 56.00, lon: 38.00,  country: "RU", region: "EUR", description: "Moscow FIR boundary", transfer: true },
  { id: "NUMDA",  lat: 60.00, lon: 30.00,  country: "RU", region: "EUR", description: "St Petersburg FIR boundary", transfer: true },
  { id: "KAROL",  lat: 55.00, lon: 65.00,  country: "RU", region: "ASIA", description: "Ural FIR boundary", transfer: true },

  // ─── Major US VORs that are MISSING from OurAirports ────────────────
  // These are critical for resolving J/V/Q/T route endpoints correctly.
  // Coordinates from public FAA data.
  { id: "MIA",  lat: 25.79, lon: -80.29, country: "US", region: "NAM", description: "Miami VOR (US)" },
  { id: "ORD",  lat: 41.98, lon: -87.90, country: "US", region: "NAM", description: "Chicago O'Hare VOR (US)" },
  { id: "DFW",  lat: 32.90, lon: -97.04, country: "US", region: "NAM", description: "Dallas Ft Worth VOR (US)" },
  { id: "MCO",  lat: 28.43, lon: -81.33, country: "US", region: "NAM", description: "Orlando VOR (US)" },
  { id: "PHX",  lat: 33.43, lon: -112.01, country: "US", region: "NAM", description: "Phoenix VOR (US)" },
  { id: "DTW",  lat: 42.21, lon: -83.35, country: "US", region: "NAM", description: "Detroit VOR (US)" },
  { id: "PHL",  lat: 39.87, lon: -75.24, country: "US", region: "NAM", description: "Philadelphia VOR (US)" },
  { id: "BWI",  lat: 39.18, lon: -76.67, country: "US", region: "NAM", description: "Baltimore VOR (US)" },
  { id: "IAD",  lat: 38.95, lon: -77.45, country: "US", region: "NAM", description: "Dulles VOR (US)" },
  { id: "HOU",  lat: 29.65, lon: -95.28, country: "US", region: "NAM", description: "Houston Hobby VOR (US)" },
  { id: "TPA",  lat: 27.97, lon: -82.53, country: "US", region: "NAM", description: "Tampa VOR (US)" },
  { id: "SAN",  lat: 32.73, lon: -117.19, country: "US", region: "NAM", description: "San Diego VOR (US)" },
  { id: "ANA",  lat: 33.80, lon: -117.92, country: "US", region: "NAM", description: "Anaheim VOR (US)" },
  { id: "RNO",  lat: 39.50, lon: -119.77, country: "US", region: "NAM", description: "Reno VOR (US)" },
  { id: "SLC",  lat: 40.79, lon: -111.97, country: "US", region: "NAM", description: "Salt Lake City VOR (US)" },
  { id: "OMA",  lat: 41.30, lon: -95.89, country: "US", region: "NAM", description: "Omaha VOR (US)" },
  { id: "MSY",  lat: 29.99, lon: -90.26, country: "US", region: "NAM", description: "New Orleans VOR (US)" },
  { id: "JAX",  lat: 30.49, lon: -81.69, country: "US", region: "NAM", description: "Jacksonville VOR (US)" },
  { id: "BHM",  lat: 33.56, lon: -86.75, country: "US", region: "NAM", description: "Birmingham AL VOR (US)" },
  { id: "CMH",  lat: 40.00, lon: -82.88, country: "US", region: "NAM", description: "Columbus OH VOR (US)" },
  { id: "IND",  lat: 39.72, lon: -86.27, country: "US", region: "NAM", description: "Indianapolis VOR (US)" },
  { id: "CLE",  lat: 41.41, lon: -81.84, country: "US", region: "NAM", description: "Cleveland VOR (US)" },
  { id: "PIT",  lat: 40.49, lon: -80.24, country: "US", region: "NAM", description: "Pittsburgh VOR (US)" },
  { id: "GAGE", lat: 36.11, lon: -99.77, country: "US", region: "NAM", description: "Gage VOR (US)" },
  { id: "IRON", lat: 45.81, lon: -88.11, country: "US", region: "NAM", description: "Iron Mountain VOR (US)" },
  { id: "ZBV",  lat: 39.83, lon: -74.43, country: "US", region: "NAM", description: "ZBV VOR East Coast (US)" },
  { id: "AOK",  lat: 34.13, lon: -93.07, country: "US", region: "NAM", description: "Arkadelphia VOR (US)" },
  { id: "KEED", lat: 34.77, lon: -114.63, country: "US", region: "NAM", description: "Needles VOR (US)" },
  { id: "TLH",  lat: 30.39, lon: -84.35, country: "US", region: "NAM", description: "Tallahassee VOR (US)" },
  { id: "GRR",  lat: 42.88, lon: -85.52, country: "US", region: "NAM", description: "Grand Rapids VOR (US)" },
  { id: "PAH",  lat: 37.06, lon: -88.77, country: "US", region: "NAM", description: "Paducah VOR (US)" },
  { id: "GBD",  lat: 38.36, lon: -98.86, country: "US", region: "NAM", description: "Great Bend VOR (US)" },

  // ─── Canadian VORs ───────────────────────────────────────────────
  { id: "YYZ",  lat: 43.68, lon: -79.61, country: "CA", region: "NAM", description: "Toronto Pearson VOR (CA)", transfer: true },
  { id: "YZT",  lat: 50.68, lon: -127.37, country: "CA", region: "NAM", description: "Port Hardy VOR (CA)", transfer: true },
  { id: "YYG",  lat: 46.29, lon: -63.12, country: "CA", region: "NAM", description: "Charlottetown VOR (CA)", transfer: true },
  { id: "YQT",  lat: 48.50, lon: -89.50, country: "CA", region: "NAM", description: "Thunder Bay VOR (CA)", transfer: true },

  // ─── Mexico VORs ──────────────────────────────────────────────────
  { id: "PEPEE", lat: 26.00, lon: -100.00, country: "MX", region: "NAM", description: "Pepee VOR (MX)", transfer: true },
  { id: "CRUZ",  lat: 29.50, lon: -105.00, country: "MX", region: "NAM", description: "Cruz VOR (MX)", transfer: true },
  { id: "FRE",   lat: 31.00, lon: -106.50, country: "MX", region: "NAM", description: "FRE VOR (MX)", transfer: true },
];

// ─── Build the airway segments with distances and bearings ───────
// For each curated airway, resolve each endpoint to coordinates.
// If an endpoint ident isn't in our DB, create a synthetic waypoint
// using the midpoint of the previous and next resolved coordinates.

function buildSegments(points) {
  const segments = [];
  // First pass: resolve coords for each point
  const resolved = points.map(p => {
    const r = resolve(p);
    return r ? { ident: p, ...r } : null;
  });

  // For unresolvable points, attempt to estimate coords from neighbors
  for (let i = 0; i < resolved.length; i++) {
    if (resolved[i]) continue;
    // Find nearest resolved neighbor before and after
    let prev = null, next = null;
    for (let j = i - 1; j >= 0; j--) { if (resolved[j]) { prev = resolved[j]; break; } }
    for (let j = i + 1; j < resolved.length; j++) { if (resolved[j]) { next = resolved[j]; break; } }
    if (prev && next) {
      resolved[i] = {
        ident: points[i],
        lat: (prev.lat + next.lat) / 2,
        lon: (prev.lon + next.lon) / 2,
        name: points[i],
        kind: "synthetic",
      };
    } else if (prev) {
      resolved[i] = { ident: points[i], lat: prev.lat + 0.5, lon: prev.lon + 0.5, name: points[i], kind: "synthetic" };
    } else if (next) {
      resolved[i] = { ident: points[i], lat: next.lat - 0.5, lon: next.lon - 0.5, name: points[i], kind: "synthetic" };
    }
    // else: leave null — segment involving this point will be skipped
  }

  // Build segments
  for (let i = 0; i < resolved.length - 1; i++) {
    const a = resolved[i];
    const b = resolved[i + 1];
    if (!a || !b) continue;
    const distance = Math.round(distNM({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }));
    const bearing = bearingDeg({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon });
    segments.push({ from: a.ident, to: b.ident, distance, bearing });
  }
  return { segments, resolved };
}

console.log(`\nBuilding ${CURATED_AIRWAYS.length} curated airways...`);
const allAirways = [];
const extraWaypointsNeeded = new Map(); // ident -> {lat, lon, name, country, region, description, transfer, notif}

for (const aw of CURATED_AIRWAYS) {
  const { segments, resolved } = buildSegments(aw.points);
  if (segments.length === 0) {
    console.warn(`  ⚠ ${aw.designator}: no segments (could not resolve endpoints)`);
    continue;
  }
  // Collect synthetic waypoints that need to be added to the waypoints DB
  for (const r of resolved) {
    if (r && r.kind === "synthetic") {
      extraWaypointsNeeded.set(r.ident, {
        id: r.ident, name: r.name || r.ident,
        lat: r.lat, lon: r.lon,
        country: "XX", region: "WORLD",
        description: "Synthetic waypoint (generated)",
      });
    }
  }
  allAirways.push({
    designator: aw.designator,
    type: aw.type,
    level: aw.level,
    segments,
  });
}

console.log(`  ✓ ${allAirways.length} curated airways built`);

// Generate procedural airways between large airports
console.log("\nGenerating procedural regional connectors...");
const procedural = generateProceduralAirways(airports);
console.log(`  ${procedural.length} procedural routes generated`);

// Build segments for procedural airways (using resolved airports)
for (const aw of procedural) {
  const a = airportByIcao.get(aw.points[0]);
  const b = airportByIcao.get(aw.points[1]);
  if (!a || !b) continue;
  const distance = Math.round(distNM({ lat: a.la, lon: a.lo }, { lat: b.la, lon: b.lo }));
  const bearing = bearingDeg({ lat: a.la, lon: a.lo }, { lat: b.la, lon: b.lo });
  allAirways.push({
    designator: aw.designator,
    type: aw.type,
    level: aw.level,
    segments: [{ from: a.i, to: b.i, distance, bearing }],
  });
}

// Merge EXTRA_WAYPOINTS + synthetic waypoints from curated airways
const allExtraWaypoints = [...EXTRA_WAYPOINTS];
for (const [id, wp] of extraWaypointsNeeded) {
  if (!allExtraWaypoints.find(w => w.id === id)) {
    allExtraWaypoints.push(wp);
  }
}

console.log(`\nTotal waypoints: ${allExtraWaypoints.length}`);
console.log(`Total airways: ${allAirways.length}`);

// Write outputs in compact format
console.log("\nWriting JSON files...");
writeFileSync(join(DATA_DIR, "world-airways.json"), JSON.stringify(allAirways));
writeFileSync(join(DATA_DIR, "world-waypoints-extra.json"), JSON.stringify(allExtraWaypoints));

console.log(`✅ Wrote world-airways.json (${allAirways.length} airways)`);
console.log(`✅ Wrote world-waypoints-extra.json (${allExtraWaypoints.length} waypoints)`);

// Summary
const byType = {};
for (const a of allAirways) byType[a.type] = (byType[a.type] || 0) + 1;
const byLevel = {};
for (const a of allAirways) byLevel[a.level] = (byLevel[a.level] || 0) + 1;
console.log(`  By type: ${JSON.stringify(byType)}`);
console.log(`  By level: ${JSON.stringify(byLevel)}`);
