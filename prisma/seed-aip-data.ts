/**
 * AIP PERÚ Seed Script — Real Data from Official Publications
 *
 * Sources:
 *   ENR 3.1 – Lower Airspace Conventional Routes
 *   ENR 3.2 – Upper Airspace Conventional Routes
 *   ENR 3.3 – RNAV Routes (Lower)
 *   ENR 4.1 – Radio Navigation Aids
 *   ENR 4.4 – Waypoints
 *   ENR 5.1 – Airspace Restrictions (Prohibited / Restricted / Danger)
 *
 * Task ID: 2
 */

import { db } from '../src/lib/db';

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // NM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Parse a coordinate string like `02°25'05"S` or `070°35'00"W` into decimal degrees */
function parseCoord(s: string): number {
  const m = s.match(/(\d+)°(\d+)'(\d+(?:\.\d+)?)"([NSWE])/);
  if (!m) throw new Error(`Cannot parse coordinate: ${s}`);
  const [, deg, min, sec, dir] = m;
  let val = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  if (dir === 'S' || dir === 'W') val = -val;
  return Math.round(val * 100000) / 100000;
}

// ═══════════════════════════════════════════════════════════════════════
// ENR 4.1 — Navaids (REAL data)
// ═══════════════════════════════════════════════════════════════════════

interface NavaidDef {
  id: string;
  name: string;
  type: string;
  frequency: string;
  channel?: string;
  lat: number;
  lon: number;
  elevation?: number;
  hours?: string;
}

const navaids: NavaidDef[] = [
  { id: 'AND', name: 'ANDAHUAYLAS',  type: 'VOR/DME',  frequency: '114.30 MHz', channel: 'CH 90X',  lat: parseCoord(`13°42'51"S`), lon: parseCoord(`073°22'40"W`), hours: 'H24' },
  { id: 'OAS', name: 'ANDOAS',       type: 'NDB',      frequency: '360.00 KHz',                    lat: parseCoord(`02°48'25"S`), lon: parseCoord(`076°27'18"W`), hours: 'HJ' },
  { id: 'OAS', name: 'ANDOAS',       type: 'VOR/DME',  frequency: '116.80 MHz', channel: 'CH 115X', lat: parseCoord(`02°47'22"S`), lon: parseCoord(`076°28'39"W`), hours: 'H24' },
  // NOTE: OAS has both NDB and VOR/DME — we'll store the VOR/DME as the primary
  { id: 'AQP', name: 'AREQUIPA',     type: 'VOR/DME',  frequency: '113.70 MHz', channel: 'CH 84X',  lat: parseCoord(`16°20'21"S`), lon: parseCoord(`071°35'50"W`), elevation: 39, hours: 'H24' },
  { id: 'ARI', name: 'ARICA',        type: 'VOR/DME',  frequency: '116.50 MHz', channel: 'CH 112X', lat: parseCoord(`18°22'10"S`), lon: parseCoord(`070°20'47"W`), hours: 'H24' },
  { id: 'POY', name: 'CHACHAPOYAS',  type: 'VOR/DME',  frequency: '115.10 MHz', channel: 'CH 98X',  lat: parseCoord(`06°12'02"S`), lon: parseCoord(`077°51'35"W`), hours: 'H24' },
  { id: 'CLA', name: 'CHICLAYO',     type: 'VOR/DME',  frequency: '114.90 MHz', channel: 'CH 96X',  lat: parseCoord(`06°43'02"S`), lon: parseCoord(`079°49'09"W`), elevation: 121, hours: 'H24' },
  { id: 'BTE', name: 'CHIMBOTE',     type: 'VOR',      frequency: '112.50 MHz',                    lat: parseCoord(`09°08'51"S`), lon: parseCoord(`078°31'19"W`), hours: 'H24' },
  { id: 'ZCO', name: 'CUSCO',        type: 'VOR/DME',  frequency: '114.90 MHz', channel: 'CH 96X',  lat: parseCoord(`13°31'09"S`), lon: parseCoord(`072°00'36"W`), hours: 'H24' },
  { id: 'ILO', name: 'ILO',          type: 'VOR',      frequency: '112.50 MHz',                    lat: parseCoord(`17°41'28"S`), lon: parseCoord(`071°21'02"W`), hours: 'H24' },
  { id: 'IQT', name: 'IQUITOS',      type: 'VOR/DME',  frequency: '116.50 MHz', channel: 'CH 112X', lat: parseCoord(`03°47'33"S`), lon: parseCoord(`073°19'04"W`), elevation: 335, hours: 'H24' },
  { id: 'JCL', name: 'JORGE CHAVEZ', type: 'DVOR/DME', frequency: '116.90 MHz', channel: 'CH 116X', lat: parseCoord(`12°02'23"S`), lon: parseCoord(`077°06'20"W`), elevation: 115, hours: 'H24' },
  { id: 'JUL', name: 'JULIACA',      type: 'VOR/DME',  frequency: '115.50 MHz', channel: 'CH 102X', lat: parseCoord(`15°28'05"S`), lon: parseCoord(`070°09'04"W`), hours: 'H24' },
  { id: 'LPA', name: 'LAS PALMAS',   type: 'DVOR/DME', frequency: '113.30 MHz', channel: 'CH 80X',  lat: parseCoord(`12°09'21"S`), lon: parseCoord(`076°59'58"W`), hours: 'H24' },
  { id: 'LET', name: 'LETICIA',      type: 'DVOR/DME', frequency: '117.50 MHz', channel: 'CH 122X', lat: parseCoord(`04°11'42"S`), lon: parseCoord(`069°56'24"W`), elevation: 285, hours: 'H24' },
  { id: 'MLV', name: 'MALVINAS',     type: 'VOR/DME',  frequency: '117.20 MHz', channel: 'CH 119X', lat: parseCoord(`11°51'30"S`), lon: parseCoord(`072°56'16"W`), hours: 'H24' },
  { id: 'SCO', name: 'PISCO',        type: 'VOR/DME',  frequency: '114.10 MHz', channel: 'CH 88X',  lat: parseCoord(`13°44'19"S`), lon: parseCoord(`076°12'46"W`), elevation: 100, hours: 'H24' },
  { id: 'URA', name: 'PIURA',        type: 'VOR/DME',  frequency: '117.70 MHz', channel: 'CH 124X', lat: parseCoord(`05°12'36"S`), lon: parseCoord(`080°36'58"W`), hours: 'H24' },
  { id: 'PZA', name: 'PTO ESPERANZA', type: 'VOR',     frequency: '113.90 MHz',                    lat: parseCoord(`09°46'09"S`), lon: parseCoord(`070°42'18"W`), hours: 'HJ' },
  { id: 'PUL', name: 'PUCALLPA',     type: 'VOR/DME',  frequency: '116.70 MHz', channel: 'CH 114X', lat: parseCoord(`08°22'33"S`), lon: parseCoord(`074°34'20"W`), elevation: 537, hours: 'H24' },
  { id: 'PLG', name: 'PUERTO LEGUIZAMO', type: 'VOR/DME', frequency: '112.80 MHz', channel: 'CH 75X', lat: parseCoord(`00°10'43"S`), lon: parseCoord(`074°46'32"W`), elevation: 665, hours: 'H24' },
  { id: 'PDO', name: 'PUERTO MALDONADO', type: 'VOR/DME', frequency: '116.10 MHz', channel: 'CH 108X', lat: parseCoord(`12°36'28"S`), lon: parseCoord(`069°13'38"W`), hours: 'H24' },
  { id: 'SLS', name: 'SALINAS',      type: 'DVOR/DME', frequency: '114.70 MHz', channel: 'CH 94X',  lat: parseCoord(`11°17'15"S`), lon: parseCoord(`077°33'45"W`), hours: 'H24' },
  { id: 'SRV', name: 'SANTA ROSA',   type: 'VOR',      frequency: '116.60 MHz',                    lat: parseCoord(`03°26'50"S`), lon: parseCoord(`080°00'34"W`), hours: 'H24' },
  { id: 'UAS', name: 'SIHUAS',       type: 'VOR',      frequency: '113.50 MHz',                    lat: parseCoord(`16°22'16"S`), lon: parseCoord(`072°08'01"W`), hours: 'H24' },
  { id: 'TCA', name: 'TACNA',        type: 'VOR/DME',  frequency: '116.80 MHz', channel: 'CH 115X', lat: parseCoord(`18°03'28"S`), lon: parseCoord(`070°16'35"W`), elevation: 1277, hours: 'H24' },
  { id: 'TAL', name: 'TALARA',       type: 'VOR',      frequency: '116.10 MHz',                    lat: parseCoord(`04°34'49"S`), lon: parseCoord(`081°15'09"W`), hours: 'H24' },
  { id: 'TAP', name: 'TARAPOTO',     type: 'VOR/DME',  frequency: '115.50 MHz', channel: 'CH 102X', lat: parseCoord(`06°39'29"S`), lon: parseCoord(`076°21'04"W`), hours: 'H24' },
  { id: 'TRO', name: 'TROMPETEROS',  type: 'VOR/DME',  frequency: '114.80 MHz', channel: 'CH 95X',  lat: parseCoord(`03°48'10"S`), lon: parseCoord(`075°03'03"W`), hours: 'H24' },
  { id: 'TRU', name: 'TRUJILLO',     type: 'DVOR/DME', frequency: '116.30 MHz', channel: 'CH 110X', lat: parseCoord(`08°05'15"S`), lon: parseCoord(`079°06'45"W`), hours: 'H24' },
  { id: 'BES', name: 'TUMBES',       type: 'VOR/DME',  frequency: '112.90 MHz', channel: 'CH 76X',  lat: parseCoord(`03°32'40"S`), lon: parseCoord(`080°23'21"W`), hours: 'H24' },
  { id: 'URC', name: 'URCOS',        type: 'VOR/DME',  frequency: '115.60 MHz', channel: 'CH 103X', lat: parseCoord(`13°38'58"S`), lon: parseCoord(`071°35'11"W`), elevation: 14086, hours: 'H24' },
];

// For OAS, we have both NDB and VOR/DME with same ID — keep VOR/DME (later entry overwrites)
// We'll deduplicate by id, preferring the VOR/DME version
const navaidMap = new Map<string, NavaidDef>();
for (const n of navaids) {
  // If there's already an entry and the new one is VOR/DME, prefer it over NDB
  const existing = navaidMap.get(n.id);
  if (!existing || n.type.includes('VOR')) {
    navaidMap.set(n.id, n);
  }
}
const uniqueNavaids = Array.from(navaidMap.values());

// Build coordinate lookup from navaids
const navaidCoords: Record<string, { lat: number; lon: number }> = {};
for (const n of uniqueNavaids) {
  navaidCoords[n.id] = { lat: n.lat, lon: n.lon };
}

// ═══════════════════════════════════════════════════════════════════════
// ENR 4.4 — Waypoints (REAL data)
// ═══════════════════════════════════════════════════════════════════════

interface WaypointDef {
  id: string;
  name: string;
  type: string; // WAYPOINT (5-letter) or NAVAID
  lat: number;
  lon: number;
  description?: string;
}

const waypointDefs: WaypointDef[] = [
  // ─── Primary waypoints from the task specification ───────────────
  { id: 'DADIL', name: 'DADIL', type: 'WAYPOINT', lat: parseCoord(`02°25'05"S`), lon: parseCoord(`070°35'00"W`) },
  { id: 'PAPEM', name: 'PAPEM', type: 'WAYPOINT', lat: parseCoord(`03°10'41"S`), lon: parseCoord(`070°18'17"W`) },
  { id: 'ELAKO', name: 'ELAKO', type: 'WAYPOINT', lat: parseCoord(`15°55'36"S`), lon: parseCoord(`069°18'18"W`) },
  { id: 'KORBO', name: 'KORBO', type: 'WAYPOINT', lat: parseCoord(`03°01'06"S`), lon: parseCoord(`077°51'28"W`) },
  { id: 'OSUBU', name: 'OSUBU', type: 'WAYPOINT', lat: parseCoord(`03°19'44"S`), lon: parseCoord(`076°03'07"W`) },
  { id: 'PABAM', name: 'PABAM', type: 'WAYPOINT', lat: parseCoord(`03°24'13"S`), lon: parseCoord(`075°36'49"W`) },
  { id: 'ISAPA', name: 'ISAPA', type: 'WAYPOINT', lat: parseCoord(`03°39'14"S`), lon: parseCoord(`074°08'22"W`) },
  { id: 'SURIX', name: 'SURIX', type: 'WAYPOINT', lat: parseCoord(`03°53'29"S`), lon: parseCoord(`072°29'22"W`) },
  { id: 'KALOR', name: 'KALOR', type: 'WAYPOINT', lat: parseCoord(`04°05'45"S`), lon: parseCoord(`070°46'01"W`) },
  { id: 'DANKI', name: 'DANKI', type: 'WAYPOINT', lat: parseCoord(`18°18'24"S`), lon: parseCoord(`070°16'30"W`) },
  { id: 'LOLES', name: 'LOLES', type: 'WAYPOINT', lat: parseCoord(`17°54'00"S`), lon: parseCoord(`069°47'00"W`) },
  { id: 'ORALO', name: 'ORALO', type: 'WAYPOINT', lat: parseCoord(`17°17'46"S`), lon: parseCoord(`069°37'30"W`) },
  { id: 'KEBOM', name: 'KEBOM', type: 'WAYPOINT', lat: parseCoord(`08°00'00"S`), lon: parseCoord(`073°40'40"W`) },
  { id: 'PAGUR', name: 'PAGUR', type: 'WAYPOINT', lat: parseCoord(`04°28'35"S`), lon: parseCoord(`080°21'49"W`) },
  { id: 'OGTAM', name: 'OGTAM', type: 'WAYPOINT', lat: parseCoord(`06°03'09"S`), lon: parseCoord(`080°21'10"W`) },
  { id: 'KIBAN', name: 'KIBAN', type: 'WAYPOINT', lat: parseCoord(`06°53'38"S`), lon: parseCoord(`080°05'22"W`) },
  { id: 'REPIB', name: 'REPIB', type: 'WAYPOINT', lat: parseCoord(`07°32'00"S`), lon: parseCoord(`079°34'00"W`) },
  { id: 'ESMIL', name: 'ESMIL', type: 'WAYPOINT', lat: parseCoord(`08°49'11"S`), lon: parseCoord(`078°42'17"W`) },
  { id: 'ARPEN', name: 'ARPEN', type: 'WAYPOINT', lat: parseCoord(`02°23'19"S`), lon: parseCoord(`072°07'12"W`) },
  { id: 'AROTI', name: 'AROTI', type: 'WAYPOINT', lat: parseCoord(`03°39'46"S`), lon: parseCoord(`070°35'04"W`) },
  { id: 'MOXOM', name: 'MOXOM', type: 'WAYPOINT', lat: parseCoord(`03°30'03"S`), lon: parseCoord(`080°13'07"W`) },
  { id: 'DOMVO', name: 'DOMVO', type: 'WAYPOINT', lat: parseCoord(`04°15'00"S`), lon: parseCoord(`081°20'00"W`) },
  { id: 'CHIRA', name: 'CHIRA', type: 'WAYPOINT', lat: parseCoord(`04°56'07"S`), lon: parseCoord(`080°53'38"W`) },
  { id: 'ROKOL', name: 'ROKOL', type: 'WAYPOINT', lat: parseCoord(`05°58'38"S`), lon: parseCoord(`080°12'39"W`) },
  { id: 'PALOP', name: 'PALOP', type: 'WAYPOINT', lat: parseCoord(`07°27'42"S`), lon: parseCoord(`079°26'08"W`) },
  { id: 'EGASI', name: 'EGASI', type: 'WAYPOINT', lat: parseCoord(`04°12'29"S`), lon: parseCoord(`080°28'46"W`) },
  { id: 'DORAN', name: 'DORAN', type: 'WAYPOINT', lat: parseCoord(`04°11'08"S`), lon: parseCoord(`074°03'13"W`) },
  { id: 'VUKOK', name: 'VUKOK', type: 'WAYPOINT', lat: parseCoord(`05°20'36"S`), lon: parseCoord(`076°13'57"W`) },
  { id: 'ATATU', name: 'ATATU', type: 'WAYPOINT', lat: parseCoord(`10°11'49"S`), lon: parseCoord(`078°00'38"W`) },
  { id: 'KALAR', name: 'KALAR', type: 'WAYPOINT', lat: parseCoord(`11°14'45"S`), lon: parseCoord(`077°29'49"W`) },
  { id: 'ROBIG', name: 'ROBIG', type: 'WAYPOINT', lat: parseCoord(`06°41'33"S`), lon: parseCoord(`078°11'07"W`) },
  { id: 'PUPMI', name: 'PUPMI', type: 'WAYPOINT', lat: parseCoord(`06°40'48"S`), lon: parseCoord(`077°28'59"W`) },
  { id: 'LODIN', name: 'LODIN', type: 'WAYPOINT', lat: parseCoord(`07°24'26"S`), lon: parseCoord(`075°34'42"W`) },
  { id: 'BORLA', name: 'BORLA', type: 'WAYPOINT', lat: parseCoord(`07°44'14"S`), lon: parseCoord(`075°14'11"W`) },
  { id: 'RONSO', name: 'RONSO', type: 'WAYPOINT', lat: parseCoord(`04°22'04"S`), lon: parseCoord(`073°55'24"W`) },
  { id: 'IKARO', name: 'IKARO', type: 'WAYPOINT', lat: parseCoord(`06°15'25"S`), lon: parseCoord(`075°55'26"W`) },
  { id: 'UTKIK', name: 'UTKIK', type: 'WAYPOINT', lat: parseCoord(`07°02'43"S`), lon: parseCoord(`077°05'39"W`) },
  { id: 'RELOR', name: 'RELOR', type: 'WAYPOINT', lat: parseCoord(`07°14'00"S`), lon: parseCoord(`077°27'23"W`) },
  { id: 'MANPA', name: 'MANPA', type: 'WAYPOINT', lat: parseCoord(`07°35'15"S`), lon: parseCoord(`078°08'28"W`) },
  { id: 'VATES', name: 'VATES', type: 'WAYPOINT', lat: parseCoord(`07°42'12"S`), lon: parseCoord(`078°21'56"W`) },
  { id: 'TAPIR', name: 'TAPIR', type: 'WAYPOINT', lat: parseCoord(`04°36'01"S`), lon: parseCoord(`073°32'15"W`) },
  { id: 'FANES', name: 'FANES', type: 'WAYPOINT', lat: parseCoord(`07°29'16"S`), lon: parseCoord(`074°19'39"W`) },
  { id: 'TILPA', name: 'TILPA', type: 'WAYPOINT', lat: parseCoord(`13°41'52"S`), lon: parseCoord(`072°53'12"W`) },
  { id: 'ILMOX', name: 'ILMOX', type: 'WAYPOINT', lat: parseCoord(`14°35'40"S`), lon: parseCoord(`070°50'40"W`) },
  { id: 'CEMIL', name: 'CEMIL', type: 'WAYPOINT', lat: parseCoord(`13°14'23"S`), lon: parseCoord(`070°38'59"W`) },
  { id: 'ILMAR', name: 'ILMAR', type: 'WAYPOINT', lat: parseCoord(`14°16'29"S`), lon: parseCoord(`076°30'48"W`) },
  { id: 'IREMI', name: 'IREMI', type: 'WAYPOINT', lat: parseCoord(`18°21'00"S`), lon: parseCoord(`075°23'00"W`) },
  { id: 'ASOXI', name: 'ASOXI', type: 'WAYPOINT', lat: parseCoord(`12°45'38"S`), lon: parseCoord(`076°36'23"W`) },
  { id: 'ESIRA', name: 'ESIRA', type: 'WAYPOINT', lat: parseCoord(`14°54'02"S`), lon: parseCoord(`074°58'38"W`) },
  { id: 'ISOKI', name: 'ISOKI', type: 'WAYPOINT', lat: parseCoord(`16°14'37"S`), lon: parseCoord(`073°34'43"W`) },
  { id: 'MIGEB', name: 'MIGEB', type: 'WAYPOINT', lat: parseCoord(`17°13'32"S`), lon: parseCoord(`072°04'30"W`) },
  { id: 'MAJAZ', name: 'MAJAZ', type: 'WAYPOINT', lat: parseCoord(`04°32'44"S`), lon: parseCoord(`073°40'54"W`) },
  { id: 'IBARE', name: 'IBARE', type: 'WAYPOINT', lat: parseCoord(`09°17'47"S`), lon: parseCoord(`076°00'17"W`) },
  { id: 'KONTA', name: 'KONTA', type: 'WAYPOINT', lat: parseCoord(`12°06'11"S`), lon: parseCoord(`076°11'32"W`) },
  { id: 'ILPIP', name: 'ILPIP', type: 'WAYPOINT', lat: parseCoord(`12°06'49"S`), lon: parseCoord(`076°01'21"W`) },
  { id: 'LOKEB', name: 'LOKEB', type: 'WAYPOINT', lat: parseCoord(`12°08'03"S`), lon: parseCoord(`075°40'58"W`) },
  { id: 'BODET', name: 'BODET', type: 'WAYPOINT', lat: parseCoord(`12°14'07"S`), lon: parseCoord(`073°54'03"W`) },
  { id: 'ANKUG', name: 'ANKUG', type: 'WAYPOINT', lat: parseCoord(`12°23'01"S`), lon: parseCoord(`072°09'36"W`) },
  { id: 'ETEBA', name: 'ETEBA', type: 'WAYPOINT', lat: parseCoord(`12°25'46"S`), lon: parseCoord(`071°35'44"W`) },
  { id: 'ANBON', name: 'ANBON', type: 'WAYPOINT', lat: parseCoord(`12°32'48"S`), lon: parseCoord(`070°04'37"W`) },
  { id: 'ASEMO', name: 'ASEMO', type: 'WAYPOINT', lat: parseCoord(`11°41'20"S`), lon: parseCoord(`073°25'03"W`) },
  { id: 'OGNUM', name: 'OGNUM', type: 'WAYPOINT', lat: parseCoord(`11°40'25"S`), lon: parseCoord(`073°57'22"W`) },
  { id: 'MONKU', name: 'MONKU', type: 'WAYPOINT', lat: parseCoord(`11°45'43"S`), lon: parseCoord(`075°54'27"W`) },
  { id: 'ALDAL', name: 'ALDAL', type: 'WAYPOINT', lat: parseCoord(`11°46'34"S`), lon: parseCoord(`076°14'50"W`) },

  // ─── Additional waypoints from ENR 4.4 ───────────────────────────
  { id: 'KUSKU', name: 'KUSKU', type: 'WAYPOINT', lat: parseCoord(`06°01'09"S`), lon: parseCoord(`077°30'53"W`) },
  { id: 'AKSOL', name: 'AKSOL', type: 'WAYPOINT', lat: parseCoord(`13°19'48"S`), lon: parseCoord(`075°45'45"W`) },
  { id: 'ALDAX', name: 'ALDAX', type: 'WAYPOINT', lat: parseCoord(`18°21'00"S`), lon: parseCoord(`072°28'20"W`) },
  { id: 'AMERO', name: 'AMERO', type: 'WAYPOINT', lat: parseCoord(`03°24'00"S`), lon: parseCoord(`083°46'00"W`) },
  { id: 'AMVEX', name: 'AMVEX', type: 'WAYPOINT', lat: parseCoord(`10°48'02"S`), lon: parseCoord(`076°48'12"W`) },
  { id: 'ANBIS', name: 'ANBIS', type: 'WAYPOINT', lat: parseCoord(`10°13'06"S`), lon: parseCoord(`076°12'17"W`) },
  { id: 'ANDID', name: 'ANDID', type: 'WAYPOINT', lat: parseCoord(`02°25'20"S`), lon: parseCoord(`075°19'08"W`) },
  { id: 'ANPAL', name: 'ANPAL', type: 'WAYPOINT', lat: parseCoord(`03°24'00"S`), lon: parseCoord(`083°00'12"W`) },
  { id: 'ARNEL', name: 'ARNEL', type: 'WAYPOINT', lat: parseCoord(`03°24'00"S`), lon: parseCoord(`081°35'00"W`) },
  { id: 'ASBOB', name: 'ASBOB', type: 'WAYPOINT', lat: parseCoord(`09°26'31"S`), lon: parseCoord(`073°28'15"W`) },
  { id: 'ASOLA', name: 'ASOLA', type: 'WAYPOINT', lat: parseCoord(`09°47'42"S`), lon: parseCoord(`070°58'24"W`) },
  { id: 'BOBUG', name: 'BOBUG', type: 'WAYPOINT', lat: parseCoord(`08°09'22"S`), lon: parseCoord(`078°06'46"W`) },
  { id: 'COCOS', name: 'COCOS', type: 'WAYPOINT', lat: parseCoord(`08°52'35"S`), lon: parseCoord(`075°20'57"W`) },
  { id: 'DALGI', name: 'DALGI', type: 'WAYPOINT', lat: parseCoord(`09°42'27"S`), lon: parseCoord(`075°18'51"W`) },
  { id: 'DAMDU', name: 'DAMDU', type: 'WAYPOINT', lat: parseCoord(`04°30'47"S`), lon: parseCoord(`071°53'42"W`) },
  { id: 'DARKI', name: 'DARKI', type: 'WAYPOINT', lat: parseCoord(`13°27'05"S`), lon: parseCoord(`072°52'23"W`) },
  { id: 'DIKOS', name: 'DIKOS', type: 'WAYPOINT', lat: parseCoord(`14°47'59"S`), lon: parseCoord(`074°09'11"W`) },
  { id: 'DOBNI', name: 'DOBNI', type: 'WAYPOINT', lat: parseCoord(`15°43'07"S`), lon: parseCoord(`069°22'54"W`) },
  { id: 'EKUVA', name: 'EKUVA', type: 'WAYPOINT', lat: parseCoord(`13°44'00"S`), lon: parseCoord(`075°09'35"W`) },
  { id: 'ENPAP', name: 'ENPAP', type: 'WAYPOINT', lat: parseCoord(`08°29'22"S`), lon: parseCoord(`076°33'00"W`) },
  { id: 'ENSUB', name: 'ENSUB', type: 'WAYPOINT', lat: parseCoord(`08°57'23"S`), lon: parseCoord(`073°51'14"W`) },
  { id: 'ERINI', name: 'ERINI', type: 'WAYPOINT', lat: parseCoord(`09°10'25"S`), lon: parseCoord(`074°05'52"W`) },
  { id: 'ESDIN', name: 'ESDIN', type: 'WAYPOINT', lat: parseCoord(`18°21'00"S`), lon: parseCoord(`080°12'12"W`) },
  { id: 'ESKOM', name: 'ESKOM', type: 'WAYPOINT', lat: parseCoord(`10°15'07"S`), lon: parseCoord(`072°14'05"W`) },
  { id: 'ESOGO', name: 'ESOGO', type: 'WAYPOINT', lat: parseCoord(`15°04'09"S`), lon: parseCoord(`074°20'32"W`) },
  { id: 'EVLAR', name: 'EVLAR', type: 'WAYPOINT', lat: parseCoord(`16°36'37"S`), lon: parseCoord(`070°43'24"W`) },
  { id: 'EVLEP', name: 'EVLEP', type: 'WAYPOINT', lat: parseCoord(`16°33'55"S`), lon: parseCoord(`073°56'51"W`) },
  { id: 'GAVAR', name: 'GAVAR', type: 'WAYPOINT', lat: parseCoord(`16°58'21"S`), lon: parseCoord(`071°06'51"W`) },
  { id: 'GAXUN', name: 'GAXUN', type: 'WAYPOINT', lat: parseCoord(`13°06'00"S`), lon: parseCoord(`072°47'09"W`) },
  { id: 'GELVO', name: 'GELVO', type: 'WAYPOINT', lat: parseCoord(`03°48'04"S`), lon: parseCoord(`074°43'03"W`) },
  { id: 'ILMUX', name: 'ILMUX', type: 'WAYPOINT', lat: parseCoord(`02°27'43"S`), lon: parseCoord(`072°50'56"W`) },
  { id: 'ILNAM', name: 'ILNAM', type: 'WAYPOINT', lat: parseCoord(`09°31'19"S`), lon: parseCoord(`072°11'08"W`) },
  { id: 'ILROL', name: 'ILROL', type: 'WAYPOINT', lat: parseCoord(`10°30'50"S`), lon: parseCoord(`077°17'50"W`) },
  { id: 'ILVOS', name: 'ILVOS', type: 'WAYPOINT', lat: parseCoord(`10°00'00"S`), lon: parseCoord(`084°25'13"W`) },
  { id: 'IRESO', name: 'IRESO', type: 'WAYPOINT', lat: parseCoord(`11°22'29"S`), lon: parseCoord(`075°27'41"W`) },
  { id: 'ISIDI', name: 'ISIDI', type: 'WAYPOINT', lat: parseCoord(`04°41'02"S`), lon: parseCoord(`072°05'19"W`) },
  { id: 'ISLOD', name: 'ISLOD', type: 'WAYPOINT', lat: parseCoord(`17°30'21"S`), lon: parseCoord(`070°31'57"W`) },
  { id: 'ISREN', name: 'ISREN', type: 'WAYPOINT', lat: parseCoord(`09°42'12"S`), lon: parseCoord(`078°40'36"W`) },
  { id: 'ISRES', name: 'ISRES', type: 'WAYPOINT', lat: parseCoord(`06°40'19"S`), lon: parseCoord(`077°11'19"W`) },
  { id: 'ITALU', name: 'ITALU', type: 'WAYPOINT', lat: parseCoord(`05°29'56"S`), lon: parseCoord(`081°34'36"W`) },
  { id: 'ITARA', name: 'ITARA', type: 'WAYPOINT', lat: parseCoord(`12°47'39"S`), lon: parseCoord(`074°06'55"W`) },
  { id: 'KABAG', name: 'KABAG', type: 'WAYPOINT', lat: parseCoord(`02°51'28"S`), lon: parseCoord(`077°24'35"W`) },
  { id: 'KAMAK', name: 'KAMAK', type: 'WAYPOINT', lat: parseCoord(`15°43'55"S`), lon: parseCoord(`072°06'20"W`) },
  { id: 'KEVES', name: 'KEVES', type: 'WAYPOINT', lat: parseCoord(`14°40'13"S`), lon: parseCoord(`069°53'27"W`) },
  { id: 'KOKRO', name: 'KOKRO', type: 'WAYPOINT', lat: parseCoord(`03°47'52"S`), lon: parseCoord(`074°09'05"W`) },
  { id: 'KOLKA', name: 'KOLKA', type: 'WAYPOINT', lat: parseCoord(`15°40'53"S`), lon: parseCoord(`071°59'37"W`) },
  { id: 'KOMGO', name: 'KOMGO', type: 'WAYPOINT', lat: parseCoord(`10°18'23"S`), lon: parseCoord(`077°47'02"W`) },
  { id: 'KOMLA', name: 'KOMLA', type: 'WAYPOINT', lat: parseCoord(`05°15'12"S`), lon: parseCoord(`079°38'55"W`) },
  { id: 'KOMPA', name: 'KOMPA', type: 'WAYPOINT', lat: parseCoord(`16°28'30"S`), lon: parseCoord(`069°00'00"W`) },
  { id: 'KOSKO', name: 'KOSKO', type: 'WAYPOINT', lat: parseCoord(`13°32'31"S`), lon: parseCoord(`075°31'57"W`) },
  { id: 'KOTKU', name: 'KOTKU', type: 'WAYPOINT', lat: parseCoord(`06°58'32"S`), lon: parseCoord(`075°20'31"W`) },
  { id: 'KULIS', name: 'KULIS', type: 'WAYPOINT', lat: parseCoord(`13°28'38"S`), lon: parseCoord(`074°57'04"W`) },
  { id: 'KUMET', name: 'KUMET', type: 'WAYPOINT', lat: parseCoord(`03°04'59"S`), lon: parseCoord(`077°56'12"W`) },
  { id: 'LITOT', name: 'LITOT', type: 'WAYPOINT', lat: parseCoord(`14°47'36"S`), lon: parseCoord(`071°48'53"W`) },
  { id: 'LIVAT', name: 'LIVAT', type: 'WAYPOINT', lat: parseCoord(`10°43'40"S`), lon: parseCoord(`073°46'11"W`) },
  { id: 'LIXIT', name: 'LIXIT', type: 'WAYPOINT', lat: parseCoord(`13°24'53"S`), lon: parseCoord(`075°05'49"W`) },
  { id: 'LOBOT', name: 'LOBOT', type: 'WAYPOINT', lat: parseCoord(`02°56'32"S`), lon: parseCoord(`077°39'40"W`) },
  { id: 'LOMOL', name: 'LOMOL', type: 'WAYPOINT', lat: parseCoord(`12°45'03"S`), lon: parseCoord(`071°31'47"W`) },
  { id: 'LUVSO', name: 'LUVSO', type: 'WAYPOINT', lat: parseCoord(`09°29'49"S`), lon: parseCoord(`075°40'05"W`) },
  { id: 'MANDO', name: 'MANDO', type: 'WAYPOINT', lat: parseCoord(`04°13'53"S`), lon: parseCoord(`080°23'18"W`) },
  { id: 'MARBA', name: 'MARBA', type: 'WAYPOINT', lat: parseCoord(`07°08'24"S`), lon: parseCoord(`078°29'26"W`) },
  { id: 'MASPO', name: 'MASPO', type: 'WAYPOINT', lat: parseCoord(`03°04'47"S`), lon: parseCoord(`076°04'10"W`) },
  { id: 'MELIX', name: 'MELIX', type: 'WAYPOINT', lat: parseCoord(`06°30'16"S`), lon: parseCoord(`079°00'33"W`) },
  { id: 'MEXUR', name: 'MEXUR', type: 'WAYPOINT', lat: parseCoord(`13°10'04"S`), lon: parseCoord(`075°40'13"W`) },
  { id: 'MIPAS', name: 'MIPAS', type: 'WAYPOINT', lat: parseCoord(`08°14'33"S`), lon: parseCoord(`079°25'06"W`) },
  { id: 'MOXES', name: 'MOXES', type: 'WAYPOINT', lat: parseCoord(`14°16'29"S`), lon: parseCoord(`077°25'04"W`) },
  { id: 'MOXOV', name: 'MOXOV', type: 'WAYPOINT', lat: parseCoord(`07°14'28"S`), lon: parseCoord(`075°45'00"W`) },
  { id: 'MUBIN', name: 'MUBIN', type: 'WAYPOINT', lat: parseCoord(`13°24'23"S`), lon: parseCoord(`069°28'58"W`) },
  { id: 'MULMA', name: 'MULMA', type: 'WAYPOINT', lat: parseCoord(`08°50'22"S`), lon: parseCoord(`073°44'09"W`) },
  { id: 'MULON', name: 'MULON', type: 'WAYPOINT', lat: parseCoord(`05°44'22"S`), lon: parseCoord(`081°53'23"W`) },
  { id: 'NAXUS', name: 'NAXUS', type: 'WAYPOINT', lat: parseCoord(`08°01'49"S`), lon: parseCoord(`078°17'35"W`) },
  { id: 'NENER', name: 'NENER', type: 'WAYPOINT', lat: parseCoord(`08°26'52"S`), lon: parseCoord(`076°47'16"W`) },
  { id: 'NILSA', name: 'NILSA', type: 'WAYPOINT', lat: parseCoord(`09°38'49"S`), lon: parseCoord(`073°48'54"W`) },
  { id: 'NUXON', name: 'NUXON', type: 'WAYPOINT', lat: parseCoord(`15°03'51"S`), lon: parseCoord(`070°54'22"W`) },
  { id: 'NUXUM', name: 'NUXUM', type: 'WAYPOINT', lat: parseCoord(`09°08'06"S`), lon: parseCoord(`072°57'23"W`) },
  { id: 'OBLIR', name: 'OBLIR', type: 'WAYPOINT', lat: parseCoord(`14°08'42"S`), lon: parseCoord(`068°51'18"W`) },
  { id: 'OGMAS', name: 'OGMAS', type: 'WAYPOINT', lat: parseCoord(`16°23'08"S`), lon: parseCoord(`070°46'16"W`) },
  { id: 'OKASO', name: 'OKASO', type: 'WAYPOINT', lat: parseCoord(`05°08'40"S`), lon: parseCoord(`080°58'12"W`) },
  { id: 'OPKUL', name: 'OPKUL', type: 'WAYPOINT', lat: parseCoord(`15°06'34"S`), lon: parseCoord(`071°02'25"W`) },
  { id: 'OPROS', name: 'OPROS', type: 'WAYPOINT', lat: parseCoord(`11°23'41"S`), lon: parseCoord(`076°28'45"W`) },
  { id: 'OPTOP', name: 'OPTOP', type: 'WAYPOINT', lat: parseCoord(`14°04'35"S`), lon: parseCoord(`069°14'37"W`) },
  { id: 'OSORA', name: 'OSORA', type: 'WAYPOINT', lat: parseCoord(`05°42'58"S`), lon: parseCoord(`072°56'34"W`) },
  { id: 'PABOB', name: 'PABOB', type: 'WAYPOINT', lat: parseCoord(`03°24'00"S`), lon: parseCoord(`087°34'30"W`) },
  { id: 'PADIS', name: 'PADIS', type: 'WAYPOINT', lat: parseCoord(`11°11'16"S`), lon: parseCoord(`076°34'53"W`) },
  { id: 'PAKOL', name: 'PAKOL', type: 'WAYPOINT', lat: parseCoord(`12°44'42"S`), lon: parseCoord(`075°57'49"W`) },
];

// Also add navaid-referenced waypoints (for airway segments that reference navaids)
for (const n of uniqueNavaids) {
  waypointDefs.push({
    id: n.id,
    name: n.name,
    type: 'NAVAID',
    lat: n.lat,
    lon: n.lon,
    description: `${n.type} ${n.frequency}`,
  });
}

// Deduplicate waypoints by id (navaids override if same id)
const waypointMap = new Map<string, WaypointDef>();
for (const w of waypointDefs) {
  // Navaid entries override waypoint entries with same id
  const existing = waypointMap.get(w.id);
  if (!existing || w.type === 'NAVAID') {
    waypointMap.set(w.id, w);
  }
}
const uniqueWaypoints = Array.from(waypointMap.values());

// Build full coordinate lookup
const allCoords: Record<string, { lat: number; lon: number }> = {};
for (const w of uniqueWaypoints) {
  allCoords[w.id] = { lat: w.lat, lon: w.lon };
}

// ═══════════════════════════════════════════════════════════════════════
// ENR 3 — Airway Segment Definitions (REAL data)
// ═══════════════════════════════════════════════════════════════════════

interface SegDef {
  from: string;
  to: string;
  magTrack?: number;       // Magnetic track from the AIP
  revMagTrack?: number;    // Reverse magnetic track from the AIP
  distance?: number;       // NM from the AIP (if provided)
  classification?: string; // Airspace class: A, D, G, F
  widthNM?: number;        // Route width in NM
  upperLimit?: string;     // e.g. "FL240", "UNL"
  lowerLimit?: string;     // e.g. "FL080", "FL200"
  minFL?: number;          // Numeric min FL (for compatibility)
  maxFL?: number;          // Numeric max FL (for compatibility)
  minEnrouteAltitude?: string;
  remarks?: string;
}

interface AirwayDef {
  designator: string;
  type: 'CONVENTIONAL' | 'RNAV';
  level: 'LOWER' | 'UPPER';
  segments: SegDef[];
}

const airways: AirwayDef[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ENR 3.1 — Lower Airspace (CONVENTIONAL)
  // ═══════════════════════════════════════════════════════════════════
  {
    designator: 'A301',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'DADIL', to: 'PAPEM', magTrack: 169, revMagTrack: 349, distance: 48, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, remarks: 'Ruta ATS delegada a Bogotá ACC 128.8 MHz' },
    ],
  },
  {
    designator: 'A304',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'JUL', to: 'ELAKO', magTrack: 126, revMagTrack: 307, distance: 56, classification: 'D', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL200', minFL: 200, maxFL: 240, remarks: 'Juliaca TWR 118.1 MHz, FIR La Paz 128.2 MHz' },
    ],
  },
  {
    designator: 'A566',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'KORBO', to: 'OSUBU', magTrack: 104, revMagTrack: 285, distance: 110, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, remarks: 'Andoas AFIS 118.2 MHz' },
      { from: 'OSUBU', to: 'PABAM', magTrack: 105, revMagTrack: 285, distance: 27, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240 },
      { from: 'PABAM', to: 'ISAPA', magTrack: 105, revMagTrack: 286, distance: 90, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, remarks: 'Oriente radar 128.5 MHz' },
      { from: 'ISAPA', to: 'IQT', magTrack: 106, revMagTrack: 286, distance: 50, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080', remarks: 'Iquitos APP 124.1 MHz' },
      { from: 'IQT', to: 'SURIX', magTrack: 104, revMagTrack: 284, distance: 50, classification: 'D', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240 },
      { from: 'SURIX', to: 'KALOR', magTrack: 104, revMagTrack: 285, distance: 104, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240 },
      { from: 'KALOR', to: 'LET', magTrack: 106, revMagTrack: 286, distance: 50, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, remarks: 'Leticia FIS 127.5 MHz' },
    ],
  },
  {
    designator: 'A568',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'DANKI', to: 'LOLES', magTrack: 55, revMagTrack: 236, distance: 37, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL220', minFL: 220, maxFL: 240, remarks: 'Tacna TWR 118.4 MHz, Sur-dos radar 128.8 MHz' },
    ],
  },
  {
    designator: 'A573',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'ILO', to: 'ORALO', magTrack: 82, revMagTrack: 263, distance: 102, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL220', minFL: 220, maxFL: 240, remarks: 'Tacna TWR 118.4 MHz, Sur-dos radar 128.8 MHz' },
    ],
  },
  {
    designator: 'B552',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'PUL', to: 'KEBOM', magTrack: 72, revMagTrack: 253, distance: 58, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080', remarks: 'Oriente radar 128.5 MHz, Pucallpa TWR 118.1 MHz' },
    ],
  },
  {
    designator: 'G675',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'PAGUR', to: 'URA', magTrack: 201, revMagTrack: 20, distance: 46, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL100', minFL: 100, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200', remarks: 'Piura TWR 118.4 MHz' },
      { from: 'URA', to: 'OGTAM', magTrack: 164, revMagTrack: 344, distance: 53, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200' },
      { from: 'OGTAM', to: 'KIBAN', magTrack: 164, revMagTrack: 344, distance: 53, widthNM: 20, remarks: 'Chiclayo TWR 118.3 MHz' },
      { from: 'KIBAN', to: 'REPIB', magTrack: 142, revMagTrack: 322, distance: 49, widthNM: 20 },
      { from: 'REPIB', to: 'TRU', magTrack: 142, revMagTrack: 322, distance: 43, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240, minEnrouteAltitude: 'FL210' },
      { from: 'TRU', to: 'ESMIL', magTrack: 153, revMagTrack: 333, distance: 50, classification: 'D', widthNM: 20, upperLimit: 'FL200', lowerLimit: 'FL080', minFL: 80, maxFL: 200 },
      { from: 'ESMIL', to: 'BTE', magTrack: 153, revMagTrack: 333, distance: 22, widthNM: 20, remarks: 'Nor-uno 119.5 MHz, Nor-dos 128.1 MHz' },
      { from: 'BTE', to: 'SLS', magTrack: 158, revMagTrack: 338, distance: 140, widthNM: 20 },
      { from: 'SLS', to: 'JCL', magTrack: 151, revMagTrack: 331, distance: 52, widthNM: 20, remarks: 'Lima Radar 119.7 MHz' },
    ],
  },
  {
    designator: 'R567',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'ARPEN', to: 'AROTI', magTrack: 138, revMagTrack: 318, distance: 120, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL100', minFL: 100, maxFL: 240, remarks: 'Ruta ATS delegada a Bogotá ACC 128.8 MHz' },
    ],
  },
  {
    designator: 'V1',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'SRV', to: 'MOXOM', magTrack: 258, revMagTrack: 78, distance: 13, remarks: 'FIR Guayaquil, Santa Rosa APP 122.9 MHz' },
      { from: 'MOXOM', to: 'BES', magTrack: 258, revMagTrack: 78, distance: 11 },
      { from: 'BES', to: 'DOMVO', magTrack: 235, revMagTrack: 54, distance: 71, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, remarks: 'Tumbes TWR 126.8 MHz' },
      { from: 'DOMVO', to: 'TAL', magTrack: 167, revMagTrack: 347, distance: 20 },
      { from: 'TAL', to: 'CHIRA', magTrack: 136, revMagTrack: 316, distance: 30 },
      { from: 'CHIRA', to: 'URA', magTrack: 136, revMagTrack: 316, distance: 23, classification: 'D', widthNM: 20, upperLimit: 'FL200', lowerLimit: 'FL040', minFL: 40, maxFL: 200, remarks: 'Piura TWR 118.4 MHz' },
      { from: 'URA', to: 'ROKOL', magTrack: 153, revMagTrack: 334, distance: 52 },
      { from: 'ROKOL', to: 'CLA', magTrack: 154, revMagTrack: 334, distance: 50, widthNM: 20, remarks: 'Chiclayo TWR 118.3 MHz' },
      { from: 'CLA', to: 'PALOP', magTrack: 154, revMagTrack: 334, distance: 50, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240 },
      { from: 'PALOP', to: 'TRU', magTrack: 153, revMagTrack: 333, distance: 42, classification: 'D', widthNM: 20, upperLimit: 'FL200', lowerLimit: 'FL080', minFL: 80, maxFL: 200, remarks: 'Trujillo TWR 118.7 MHz' },
      { from: 'TRU', to: 'ESMIL', magTrack: 153, revMagTrack: 333, distance: 50 },
      { from: 'ESMIL', to: 'BTE', magTrack: 153, revMagTrack: 333, distance: 22, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, remarks: 'Nor-uno 119.5 MHz, Nor-dos 128.1 MHz' },
      { from: 'BTE', to: 'SLS', magTrack: 158, revMagTrack: 338, distance: 140, classification: 'D', widthNM: 20, upperLimit: 'FL200', lowerLimit: 'FL080', minFL: 80, maxFL: 200 },
    ],
  },
  {
    designator: 'V2',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'BES', to: 'EGASI', magTrack: 190, revMagTrack: 9, distance: 40, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200', remarks: 'Tumbes TWR 126.8 MHz, Piura TWR 118.4 MHz' },
      { from: 'EGASI', to: 'URA', magTrack: 190, revMagTrack: 9, distance: 60 },
    ],
  },
  {
    designator: 'V3',
    type: 'CONVENTIONAL',
    level: 'LOWER',
    segments: [
      { from: 'IQT', to: 'DORAN', magTrack: 249, revMagTrack: 68, distance: 50, classification: 'A', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080', remarks: 'Iquitos APP 124.1 MHz' },
      { from: 'DORAN', to: 'VUKOK', magTrack: 248, revMagTrack: 67, distance: 148, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL080', minFL: 80, maxFL: 240 },
      { from: 'VUKOK', to: 'POY', magTrack: 247, revMagTrack: 65, distance: 110, classification: 'G', widthNM: 20, upperLimit: 'FL240', lowerLimit: 'FL170', minFL: 170, maxFL: 240, remarks: 'Nor-dos 128.1 MHz, Oriente radar 128.5 MHz' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENR 3.2 — Upper Airspace (CONVENTIONAL)
  // ═══════════════════════════════════════════════════════════════════
  {
    designator: 'UV1',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'BES', to: 'DOMVO', magTrack: 235, revMagTrack: 54, distance: 71 },
      { from: 'DOMVO', to: 'TAL', magTrack: 167, revMagTrack: 347, distance: 20 },
      { from: 'TAL', to: 'URA', magTrack: 136, revMagTrack: 316, distance: 54 },
      { from: 'URA', to: 'CLA', magTrack: 153, revMagTrack: 334, distance: 102, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Nor-uno 119.5 MHz, Nor-dos 128.1 MHz' },
      { from: 'CLA', to: 'TRU', magTrack: 153, revMagTrack: 333, distance: 92 },
      { from: 'TRU', to: 'BTE', magTrack: 153, revMagTrack: 333, distance: 72 },
      { from: 'BTE', to: 'ATATU', magTrack: 156, revMagTrack: 336, distance: 70 },
      { from: 'ATATU', to: 'KALAR', magTrack: 156, revMagTrack: 336, distance: 70 },
      { from: 'KALAR', to: 'JCL', magTrack: 156, revMagTrack: 336, distance: 53 },
    ],
  },
  {
    designator: 'UV3',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'IQT', to: 'DORAN', magTrack: 249, revMagTrack: 68, distance: 50 },
      { from: 'DORAN', to: 'VUKOK', magTrack: 248, revMagTrack: 67, distance: 148 },
      { from: 'VUKOK', to: 'KUSKU', magTrack: 247, revMagTrack: 66, distance: 87, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Nor-dos 128.1 MHz, Oriente radar 128.5 MHz' },
      { from: 'KUSKU', to: 'POY', magTrack: 246, revMagTrack: 65, distance: 23 },
      { from: 'POY', to: 'CLA', magTrack: 258, revMagTrack: 77, distance: 121 },
    ],
  },
  {
    designator: 'UV4',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'CLA', to: 'ROBIG', magTrack: 91, revMagTrack: 272, distance: 98 },
      { from: 'ROBIG', to: 'PUPMI', magTrack: 92, revMagTrack: 272, distance: 42 },
      { from: 'PUPMI', to: 'TAP', magTrack: 92, revMagTrack: 273, distance: 68, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Nor-dos 128.1 MHz, Oriente radar 128.5 MHz' },
      { from: 'TAP', to: 'LODIN', magTrack: 138, revMagTrack: 319, distance: 64 },
      { from: 'LODIN', to: 'BORLA', magTrack: 139, revMagTrack: 319, distance: 28 },
      { from: 'BORLA', to: 'PUL', magTrack: 139, revMagTrack: 319, distance: 55 },
    ],
  },
  {
    designator: 'UV5',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'IQT', to: 'RONSO', magTrack: 234, revMagTrack: 53, distance: 50 },
      { from: 'RONSO', to: 'IKARO', magTrack: 233, revMagTrack: 51, distance: 164 },
      { from: 'IKARO', to: 'TAP', magTrack: 231, revMagTrack: 51, distance: 35, widthNM: 20, remarks: 'Nor-dos 128.1 MHz, Oriente radar 128.5 MHz' },
      { from: 'TAP', to: 'UTKIK', magTrack: 247, revMagTrack: 66, distance: 50 },
      { from: 'UTKIK', to: 'RELOR', magTrack: 246, revMagTrack: 66, distance: 24, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600 },
      { from: 'RELOR', to: 'MANPA', magTrack: 246, revMagTrack: 65, distance: 46 },
      { from: 'MANPA', to: 'VATES', magTrack: 245, revMagTrack: 65, distance: 15 },
      { from: 'VATES', to: 'TRU', magTrack: 245, revMagTrack: 65, distance: 50 },
    ],
  },
  {
    designator: 'UV9',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'IQT', to: 'TAPIR', magTrack: 202, revMagTrack: 22, distance: 50 },
      { from: 'TAPIR', to: 'FANES', magTrack: 202, revMagTrack: 21, distance: 179, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Oriente radar 128.5 MHz' },
      { from: 'FANES', to: 'PUL', magTrack: 201, revMagTrack: 21, distance: 55 },
    ],
  },
  {
    designator: 'UV10',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'ZCO', to: 'URC', magTrack: 113, revMagTrack: 294, distance: 26, remarks: 'Cusco APP 120.6 MHz' },
      { from: 'URC', to: 'CEMIL', magTrack: 72, revMagTrack: 253, distance: 60, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Sur-dos radar 128.8 MHz' },
      { from: 'CEMIL', to: 'PDO', magTrack: 73, revMagTrack: 254, distance: 91 },
    ],
  },
  {
    designator: 'UV11',
    type: 'CONVENTIONAL',
    level: 'UPPER',
    segments: [
      { from: 'AND', to: 'TILPA', magTrack: 93, revMagTrack: 273, distance: 29, remarks: 'Sur-dos radar 128.8 MHz' },
      { from: 'TILPA', to: 'URC', magTrack: 93, revMagTrack: 274, distance: 76, classification: 'A', widthNM: 20, upperLimit: 'UNL', lowerLimit: 'FL250', minFL: 250, maxFL: 600, remarks: 'Cusco APP 120.6 MHz' },
      { from: 'URC', to: 'ILMOX', magTrack: 149, revMagTrack: 329, distance: 71, remarks: 'Sur-dos radar 128.8 MHz' },
      { from: 'ILMOX', to: 'JUL', magTrack: 149, revMagTrack: 329, distance: 66 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENR 3.3 — RNAV Routes (LOWER)
  // ═══════════════════════════════════════════════════════════════════
  {
    designator: 'L302',
    type: 'RNAV',
    level: 'LOWER',
    segments: [
      { from: 'JCL', to: 'ILMAR', magTrack: 168, revMagTrack: 347, distance: 138, classification: 'A', widthNM: 10, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080', remarks: 'Sur-uno 135.0 MHz, Sur-dos 128.8 MHz, Lima radar 119.7 MHz' },
      { from: 'ILMAR', to: 'IREMI', magTrack: 167, revMagTrack: 346, distance: 252 },
    ],
  },
  {
    designator: 'L525',
    type: 'RNAV',
    level: 'LOWER',
    segments: [
      { from: 'JCL', to: 'ASOXI', magTrack: 148, revMagTrack: 328, distance: 52, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080', remarks: 'Lima radar 119.7 MHz, Pisco TWR 118.3 MHz, Sur-uno 135.0 MHz, Sur-dos 128.8 MHz' },
      { from: 'ASOXI', to: 'SCO', magTrack: 161, revMagTrack: 341, distance: 63, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL200 D FL080' },
      { from: 'SCO', to: 'ESIRA', magTrack: 137, revMagTrack: 317, distance: 100, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL130', minFL: 130, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200', remarks: 'Sur-uno 135.0 MHz, Sur-dos 128.8 MHz' },
      { from: 'ESIRA', to: 'ISOKI', magTrack: 138, revMagTrack: 318, distance: 114, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240 },
      { from: 'ISOKI', to: 'MIGEB', magTrack: 128, revMagTrack: 309, distance: 105, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240 },
      { from: 'MIGEB', to: 'ILO', magTrack: 129, revMagTrack: 311, distance: 50, classification: 'D', widthNM: 5, upperLimit: 'FL200', lowerLimit: 'FL090', minFL: 90, maxFL: 200, remarks: 'Tacna TWR 118.4 MHz' },
      { from: 'ILO', to: 'ARI', magTrack: 131, revMagTrack: 311, distance: 70, widthNM: 5 },
    ],
  },
  {
    designator: 'T216',
    type: 'RNAV',
    level: 'LOWER',
    segments: [
      { from: 'IQT', to: 'MAJAZ', magTrack: 213, revMagTrack: 32, distance: 50, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL170', minFL: 170, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200', remarks: 'Iquitos APP 124.1 MHz' },
      { from: 'MAJAZ', to: 'BORLA', magTrack: 212, revMagTrack: 31, distance: 212, classification: 'G', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL170', minFL: 170, maxFL: 240, remarks: 'Oriente radar 128.5 MHz' },
      { from: 'BORLA', to: 'IBARE', magTrack: 211, revMagTrack: 30, distance: 104, remarks: 'Unidireccional tramo Lima-IBARE AWY T325' },
    ],
  },
  {
    designator: 'T218',
    type: 'RNAV',
    level: 'LOWER',
    segments: [
      { from: 'JCL', to: 'KONTA', magTrack: 96, revMagTrack: 277, distance: 54, remarks: 'Lima radar 119.7 MHz' },
      { from: 'KONTA', to: 'ILPIP', magTrack: 97, revMagTrack: 277, distance: 10 },
      { from: 'ILPIP', to: 'LOKEB', magTrack: 97, revMagTrack: 278, distance: 20, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, remarks: 'Oriente radar 128.5 MHz' },
      { from: 'LOKEB', to: 'BODET', magTrack: 100, revMagTrack: 281, distance: 105 },
      { from: 'BODET', to: 'ANKUG', magTrack: 101, revMagTrack: 281, distance: 103, remarks: 'Sur-dos radar 128.8 MHz' },
      { from: 'ANKUG', to: 'ETEBA', magTrack: 101, revMagTrack: 282, distance: 33 },
      { from: 'ETEBA', to: 'ANBON', magTrack: 102, revMagTrack: 283, distance: 89, remarks: 'Puerto Maldonado TWR 118.5 MHz' },
      { from: 'ANBON', to: 'PDO', magTrack: 102, revMagTrack: 283, distance: 50 },
    ],
  },
  {
    designator: 'T226',
    type: 'RNAV',
    level: 'LOWER',
    segments: [
      { from: 'MLV', to: 'ASEMO', magTrack: 295, revMagTrack: 115, distance: 30, classification: 'G', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL130', minFL: 130, maxFL: 240, minEnrouteAltitude: 'FL180/F FL170', remarks: 'Malvinas ADVS 123.5 MHz' },
      { from: 'ASEMO', to: 'OGNUM', magTrack: 277, revMagTrack: 97, distance: 32, classification: 'F', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL130', minFL: 130, maxFL: 240, minEnrouteAltitude: 'FL170', remarks: 'Oriente radar 128.5 MHz' },
      { from: 'OGNUM', to: 'MONKU', magTrack: 272, revMagTrack: 91, distance: 115, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL200', minFL: 200, maxFL: 240, minEnrouteAltitude: 'FL210/G FL200', remarks: 'Oriente radar 128.5 MHz' },
      { from: 'MONKU', to: 'ALDAL', magTrack: 271, revMagTrack: 91, distance: 20, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL210', minFL: 210, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200' },
      { from: 'ALDAL', to: 'JCL', magTrack: 256, revMagTrack: 75, distance: 53, classification: 'A', widthNM: 5, upperLimit: 'FL240', lowerLimit: 'FL200', minFL: 200, maxFL: 240, minEnrouteAltitude: 'FL210/D FL200', remarks: 'Lima radar 119.7 MHz' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// ENR 5.1 — Airspace Restrictions (REAL data)
// ═══════════════════════════════════════════════════════════════════════

interface RestrictionDef {
  designator: string;
  name: string;
  type: string;
  centerLat: number;
  centerLon: number;
  lowerLimit: string;
  upperLimit: string;
  lowerLimitFt?: number;
  upperLimitFt?: number;
  radius?: number;
  polygon?: string;
  restrictions?: string;
  operatingHours?: string;
  authority?: string;
  remarks?: string;
  color?: string;
}

const restrictions: RestrictionDef[] = [
  {
    designator: 'SPP01',
    name: 'EL SALTO-TUMBES',
    type: 'PROHIBITED',
    centerLat: parseCoord(`03°30'00"S`),
    centerLon: parseCoord(`080°15'00"W`),
    lowerLimit: 'GND',
    upperLimit: '1500FT AGL',
    upperLimitFt: 1500,
    polygon: 'CIRCLE',
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent',
    color: '#FF0000',
  },
  {
    designator: 'SPP02',
    name: 'ESTERO SANTA TERESA-IQUITOS',
    type: 'PROHIBITED',
    centerLat: parseCoord(`03°45'00"S`),
    centerLon: parseCoord(`073°15'00"W`),
    lowerLimit: 'GND',
    upperLimit: '1500FT AGL',
    upperLimitFt: 1500,
    polygon: 'RECTANGLE',
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent',
    color: '#FF0000',
  },
  {
    designator: 'SPP03',
    name: 'PAMPAS DE HUARANGAL',
    type: 'PROHIBITED',
    centerLat: parseCoord(`12°15'44"S`),
    centerLon: parseCoord(`076°51'14"W`),
    lowerLimit: 'GND',
    upperLimit: '3000FT AGL',
    upperLimitFt: 3000,
    radius: 1,
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent, 20NM SE of JCL',
    color: '#FF0000',
  },
  {
    designator: 'SPP04',
    name: 'PLANTA MELCHORITA',
    type: 'PROHIBITED',
    centerLat: parseCoord(`13°14'47"S`),
    centerLon: parseCoord(`076°17'56"W`),
    lowerLimit: 'GND',
    upperLimit: '1500FT AGL',
    upperLimitFt: 1500,
    radius: 1.08, // 2KM in NM
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent, 55km N of PISCO',
    color: '#FF0000',
  },
  {
    designator: 'SPP05',
    name: 'PLANTA LA LOBERA',
    type: 'PROHIBITED',
    centerLat: parseCoord(`13°46'27"S`),
    centerLon: parseCoord(`076°13'35"W`),
    lowerLimit: 'GND',
    upperLimit: '1500FT AGL',
    upperLimitFt: 1500,
    radius: 0.54, // 1KM in NM
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent, 5km S of PISCO',
    color: '#FF0000',
  },
  {
    designator: 'SPP28',
    name: 'LIMA',
    type: 'PROHIBITED',
    centerLat: parseCoord(`12°00'55"S`),
    centerLon: parseCoord(`076°57'18"W`),
    lowerLimit: 'GND',
    upperLimit: '3000FT AMSL',
    upperLimitFt: 3000,
    radius: 2,
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent',
    color: '#FF0000',
  },
  {
    designator: 'SPP29',
    name: 'ISLA SAN LORENZO',
    type: 'PROHIBITED',
    centerLat: parseCoord(`12°03'00"S`),
    centerLon: parseCoord(`077°12'00"W`),
    lowerLimit: 'GND',
    upperLimit: '2000FT AGL',
    upperLimitFt: 2000,
    polygon: 'POLYGON',
    restrictions: 'Prohibido el vuelo de aeronaves',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent',
    color: '#FF0000',
  },
  {
    designator: 'SPP69',
    name: 'PISCO',
    type: 'RESTRICTED',
    centerLat: parseCoord(`13°50'00"S`),
    centerLon: parseCoord(`076°15'00"W`),
    lowerLimit: 'GND',
    upperLimit: '2500FT AMSL',
    upperLimitFt: 2500,
    polygon: 'POLYGON',
    restrictions: 'Reserva Natural de Paracas',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent, Reserva Natural de Paracas',
    color: '#FF8C00',
  },
  {
    designator: 'SPP72',
    name: 'PAMPAS DE LA JOYA',
    type: 'DANGER',
    centerLat: parseCoord(`16°30'00"S`),
    centerLon: parseCoord(`072°00'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'UNL',
    upperLimitFt: 99999,
    polygon: 'TRIANGLE',
    restrictions: 'Área de peligro',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanent',
    color: '#FFD700',
  },
  {
    designator: 'SPP74',
    name: 'MAZO CRUZ',
    type: 'RESTRICTED',
    centerLat: parseCoord(`16°45'00"S`),
    centerLon: parseCoord(`069°30'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'FL150',
    upperLimitFt: 15000,
    polygon: 'TRIANGLE',
    restrictions: 'Área restringida',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanent',
    color: '#FF8C00',
  },
  {
    designator: 'SPP75',
    name: 'ILAVE',
    type: 'RESTRICTED',
    centerLat: parseCoord(`16°10'00"S`),
    centerLon: parseCoord(`069°40'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'FL150',
    upperLimitFt: 15000,
    polygon: 'POLYGON',
    restrictions: 'Área restringida',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanent',
    color: '#FF8C00',
  },
  {
    designator: 'SPP78',
    name: 'LA BREA',
    type: 'DANGER',
    centerLat: parseCoord(`04°30'00"S`),
    centerLon: parseCoord(`081°00'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'UNL',
    upperLimitFt: 99999,
    polygon: 'POLYGON',
    restrictions: 'Área de peligro',
    operatingHours: 'H24',
    authority: 'PETROPERU',
    remarks: 'Permanent',
    color: '#FFD700',
  },
  {
    designator: 'SPP81',
    name: 'QUERECOTILLO',
    type: 'RESTRICTED',
    centerLat: parseCoord(`05°00'00"S`),
    centerLon: parseCoord(`080°30'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'FL070',
    upperLimitFt: 7000,
    polygon: 'POLYGON',
    restrictions: 'Área restringida',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanent',
    color: '#FF8C00',
  },
  {
    designator: 'SPP82',
    name: 'PAITA',
    type: 'RESTRICTED',
    centerLat: parseCoord(`05°05'00"S`),
    centerLon: parseCoord(`081°05'00"W`),
    lowerLimit: 'GND',
    upperLimit: 'FL080',
    upperLimitFt: 8000,
    polygon: 'POLYGON',
    restrictions: 'Polígono FAP',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanent, Polígono FAP',
    color: '#FF8C00',
  },
  {
    designator: 'SPP83',
    name: 'BAYOVAR',
    type: 'DANGER',
    centerLat: parseCoord(`05°45'00"S`),
    centerLon: parseCoord(`081°15'00"W`),
    lowerLimit: 'GND',
    upperLimit: '2000FT AGL',
    upperLimitFt: 2000,
    polygon: 'POLYGON',
    restrictions: 'Área de peligro',
    operatingHours: 'H24',
    authority: 'PETROPERU',
    remarks: 'Permanent',
    color: '#FFD700',
  },
  {
    designator: 'SPP88',
    name: 'LIMA',
    type: 'RESTRICTED',
    centerLat: parseCoord(`12°02'00"S`),
    centerLon: parseCoord(`077°00'00"W`),
    lowerLimit: 'GND',
    upperLimit: '4000FT AMSL',
    upperLimitFt: 4000,
    polygon: 'ARC',
    restrictions: 'Área restringida',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: 'Permanent',
    color: '#FF8C00',
  },
  {
    designator: 'SPP89',
    name: 'LIMA',
    type: 'RESTRICTED',
    centerLat: parseCoord(`12°03'00"S`),
    centerLon: parseCoord(`077°01'00"W`),
    lowerLimit: 'GND',
    upperLimit: '4000FT AMSL',
    upperLimitFt: 4000,
    polygon: 'ARC',
    restrictions: 'Cuartel General Ejército Peruano, Embajada EE.UU.',
    operatingHours: 'H24',
    authority: 'MINDEF',
    remarks: 'Permanent, Cuartel General Ejército Peruano, Embajada EE.UU.',
    color: '#FF8C00',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Main seed function
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AIP PERÚ Seed Script — Real Data from Official Publications');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ─── 1. Delete ALL existing airways and segments ──────────────────
  console.log('--- Step 1: Deleting ALL existing airways and segments ---');
  const delSegs = await db.airwaySegment.deleteMany({});
  console.log(`  Deleted ${delSegs.count} airway segments`);
  const delAWs = await db.airway.deleteMany({});
  console.log(`  Deleted ${delAWs.count} airways`);

  // ─── 2. Upsert Navaids ───────────────────────────────────────────
  console.log('\n--- Step 2: Upserting navaids from ENR 4.1 ---');
  for (const n of uniqueNavaids) {
    await db.navaid.upsert({
      where: { id: n.id },
      update: {
        name: n.name,
        type: n.type,
        frequency: n.frequency + (n.channel ? ` ${n.channel}` : ''),
        lat: n.lat,
        lon: n.lon,
        elevation: n.elevation,
      },
      create: {
        id: n.id,
        name: n.name,
        type: n.type,
        frequency: n.frequency + (n.channel ? ` ${n.channel}` : ''),
        lat: n.lat,
        lon: n.lon,
        elevation: n.elevation,
      },
    });
    console.log(`  Upserted navaid: ${n.id} (${n.name}) ${n.frequency}`);
  }

  // ─── 3. Upsert Waypoints ─────────────────────────────────────────
  console.log('\n--- Step 3: Upserting waypoints from ENR 4.4 ---');
  for (const w of uniqueWaypoints) {
    await db.waypoint.upsert({
      where: { id: w.id },
      update: {
        name: w.name,
        type: w.type,
        lat: w.lat,
        lon: w.lon,
        description: w.description,
      },
      create: {
        id: w.id,
        name: w.name,
        type: w.type,
        lat: w.lat,
        lon: w.lon,
        description: w.description,
      },
    });
  }
  console.log(`  Upserted ${uniqueWaypoints.length} waypoints`);

  // ─── 4. Create Airways with Segments ─────────────────────────────
  console.log('\n--- Step 4: Creating airways from ENR 3.1/3.2/3.3 ---');
  for (const aw of airways) {
    const segmentData = [];

    for (let i = 0; i < aw.segments.length; i++) {
      const seg = aw.segments[i];
      const fromCoord = allCoords[seg.from];
      const toCoord = allCoords[seg.to];

      if (!fromCoord) {
        console.error(`  ERROR: Unknown waypoint/navaid: ${seg.from} in ${aw.designator}`);
        continue;
      }
      if (!toCoord) {
        console.error(`  ERROR: Unknown waypoint/navaid: ${seg.to} in ${aw.designator}`);
        continue;
      }

      const computedDist = haversine(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon);
      const computedBearing = bearing(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon);
      const computedRevBearing = (computedBearing + 180) % 360;

      // Use AIP-provided distance if available, otherwise computed
      const dist = seg.distance ?? Math.round(computedDist * 10) / 10;
      const brg = Math.round(computedBearing * 10) / 10;

      segmentData.push({
        orderIndex: i,
        fromPoint: seg.from,
        toPoint: seg.to,
        distance: dist,
        bearing: brg,
        trackTrue: brg,
        reverseTrack: Math.round(computedRevBearing * 10) / 10,
        minFL: seg.minFL,
        maxFL: seg.maxFL,
        // New AIP fields
        magneticTrack: seg.magTrack,
        reverseMagneticTrack: seg.revMagTrack,
        classification: seg.classification,
        widthNM: seg.widthNM,
        upperLimit: seg.upperLimit,
        lowerLimit: seg.lowerLimit,
        minEnrouteAltitude: seg.minEnrouteAltitude,
        remarks: seg.remarks,
      });
    }

    const created = await db.airway.create({
      data: {
        designator: aw.designator,
        type: aw.type,
        level: aw.level,
        segments: { create: segmentData },
      },
      include: { segments: true },
    });

    console.log(`  Created airway: ${aw.designator} (${aw.type}, ${aw.level}) with ${created.segments.length} segments`);
    for (const seg of created.segments) {
      const cls = seg.classification ? ` [${seg.classification}]` : '';
      const mt = seg.magneticTrack ? ` MAG${seg.magneticTrack}°` : '';
      const w = seg.widthNM ? ` WID${seg.widthNM}NM` : '';
      const ul = seg.upperLimit ? ` ↑${seg.upperLimit}` : '';
      const ll = seg.lowerLimit ? ` ↓${seg.lowerLimit}` : '';
      console.log(`    ${seg.orderIndex}: ${seg.fromPoint} → ${seg.toPoint} ${seg.distance}NM brg=${seg.bearing}°${mt}${cls}${w}${ul}${ll}`);
    }
  }

  // ─── 5. Upsert Airspace Restrictions ─────────────────────────────
  console.log('\n--- Step 5: Upserting airspace restrictions from ENR 5.1 ---');
  for (const r of restrictions) {
    await db.airspaceRestriction.upsert({
      where: { designator: r.designator },
      update: {
        name: r.name,
        type: r.type,
        centerLat: r.centerLat,
        centerLon: r.centerLon,
        lowerLimit: r.lowerLimit,
        upperLimit: r.upperLimit,
        lowerLimitFt: r.lowerLimitFt,
        upperLimitFt: r.upperLimitFt,
        radius: r.radius,
        polygon: r.polygon,
        restrictions: r.restrictions,
        operatingHours: r.operatingHours,
        authority: r.authority,
        remarks: r.remarks,
        color: r.color,
      },
      create: {
        designator: r.designator,
        name: r.name,
        type: r.type,
        centerLat: r.centerLat,
        centerLon: r.centerLon,
        lowerLimit: r.lowerLimit,
        upperLimit: r.upperLimit,
        lowerLimitFt: r.lowerLimitFt,
        upperLimitFt: r.upperLimitFt,
        radius: r.radius,
        polygon: r.polygon,
        restrictions: r.restrictions,
        operatingHours: r.operatingHours,
        authority: r.authority,
        remarks: r.remarks,
        color: r.color,
      },
    });
    console.log(`  Upserted restriction: ${r.designator} (${r.name}) [${r.type}]`);
  }

  // ─── 6. Summary ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Seed Complete — Summary');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalWaypoints = await db.waypoint.count();
  const totalNavaids = await db.navaid.count();
  const totalAirways = await db.airway.count();
  const totalSegments = await db.airwaySegment.count();
  const totalRestrictions = await db.airspaceRestriction.count();
  const convCount = await db.airway.count({ where: { type: 'CONVENTIONAL' } });
  const rnavCount = await db.airway.count({ where: { type: 'RNAV' } });
  const lowerCount = await db.airway.count({ where: { level: 'LOWER' } });
  const upperCount = await db.airway.count({ where: { level: 'UPPER' } });

  console.log(`  Navaids:           ${totalNavaids}`);
  console.log(`  Waypoints:         ${totalWaypoints}`);
  console.log(`  Airways:           ${totalAirways} (${convCount} conventional + ${rnavCount} RNAV)`);
  console.log(`  Airway Levels:     ${lowerCount} LOWER + ${upperCount} UPPER`);
  console.log(`  Airway Segments:   ${totalSegments}`);
  console.log(`  Restrictions:      ${totalRestrictions}`);

  // List all airways
  const allAirways = await db.airway.findMany({
    select: {
      designator: true,
      type: true,
      level: true,
      segments: { select: { fromPoint: true, toPoint: true, magneticTrack: true, distance: true } },
    },
    orderBy: [{ type: 'asc' }, { designator: 'asc' }],
  });
  console.log('\nAll airways:');
  for (const aw of allAirways) {
    const route = aw.segments.map(s => s.fromPoint).concat(aw.segments.length > 0 ? [aw.segments[aw.segments.length - 1].toPoint] : []).join(' → ');
    console.log(`  ${aw.designator} (${aw.type}/${aw.level}): ${route}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
