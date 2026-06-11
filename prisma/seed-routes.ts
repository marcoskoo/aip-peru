import { db } from '../src/lib/db';

// ─── Haversine distance (NM) and bearing (degrees true) ────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // NM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ─── Coordinate lookup: existing navaids + waypoints + new waypoints ──
// These are real coordinates for Peruvian navaids and waypoints
const coords: Record<string, { lat: number; lon: number }> = {
  // Existing navaids (from database)
  LIM:   { lat: -12.0086, lon: -77.1228 },  // Lima VOR
  PSO:   { lat: -13.7333, lon: -76.2167 },   // Pisco VOR
  AQP:   { lat: -16.3419, lon: -71.5833 },   // Arequipa VOR
  IQT:   { lat: -3.7858,  lon: -73.3058 },   // Iquitos VOR
  PCL:   { lat: -8.3781,  lon: -74.5725 },   // Pucallpa VOR
  CUZ:   { lat: -13.5358, lon: -71.9425 },   // Cusco VOR
  JUL:   { lat: -16.5092, lon: -70.1542 },   // Juliaca VOR
  CIX:   { lat: -6.7858,  lon: -79.8225 },   // Chiclayo VOR
  TBP:   { lat: -3.55,    lon: -80.3833 },   // Tumbes VOR
  TCQ:   { lat: -18.0647, lon: -70.2997 },   // Tacna VOR
  URA:   { lat: -5.2067,  lon: -80.6167 },   // Piura VOR
  PEM:   { lat: -12.5983, lon: -69.1967 },   // Puerto Maldonado VOR

  // Existing waypoints (from database)
  ESKAL: { lat: -9.85,    lon: -77.1167 },
  ISKAR: { lat: -10.2167, lon: -77.0833 },
  MODON: { lat: -8.9167,  lon: -77.0333 },
  LORNI: { lat: -11.75,   lon: -77.0833 },
  PIRAT: { lat: -10.5833, lon: -77.15 },
  LOLES: { lat: -17.9,    lon: -69.7833 },
  SELVA: { lat: -9.5217,  lon: -72.1856 },
  TALARA:{ lat: -4.5667,  lon: -81.25 },
  VATES: { lat: -7.7033,  lon: -78.3656 },
  GAVIL: { lat: -11.2542, lon: -76.5872 },
  ESEDI: { lat: -11.38,   lon: -76.4403 },
  MILAX: { lat: -8.9731,  lon: -76.9531 },
  KAMPA: { lat: -3.725,   lon: -73.2217 },
  BORAS: { lat: -3.8455,  lon: -73.4023 },
  MITOS: { lat: -3.6769,  lon: -73.1534 },
  PABAM: { lat: -3.4128,  lon: -75.5594 },
  GATUK: { lat: -12.3531, lon: -76.255 },
  LODOX: { lat: -12.4169, lon: -76.09 },
  IBISA: { lat: -13.0333, lon: -76.5333 },
  ILMAR: { lat: -14.2747, lon: -76.5133 },
  PISCO: { lat: -13.7333, lon: -76.2167 },

  // ─── New waypoints to create ────────────────────────────────────
  ANA:   { lat: -7.27,    lon: -75.03 },     // Contamana
  TGM:   { lat: -9.15,    lon: -75.95 },      // Tingo María
  HUZ:   { lat: -9.88,    lon: -76.22 },      // Huánuco
  ILO:   { lat: -17.09,   lon: -70.66 },      // Ilo
  JAU:   { lat: -11.78,   lon: -75.50 },      // Jauja
  TRU:   { lat: -8.09,    lon: -79.10 },       // Trujillo VOR
  PIU:   { lat: -5.21,    lon: -80.62 },       // Piura (near URA)
  DESAD: { lat: -17.00,   lon: -70.30 },       // DESAD waypoint (near Juliaca)
  TAL:   { lat: -4.57,    lon: -81.25 },       // Talara (same as TALARA)
  TUM:   { lat: -3.55,    lon: -80.3833 },     // Tumbes (same as TBP)
  TAC:   { lat: -18.06,   lon: -70.30 },       // Tacna (near TCQ)
  SUST:  { lat: -6.95,    lon: -76.45 },       // Sutilveni (Amazon)
  MNO:   { lat: -10.12,   lon: -76.70 },       // Minas (highlands)
};

// ─── Helper: compute segment data ──────────────────────────────────
interface SegmentDef {
  from: string;
  to: string;
  minFL: number;
  maxFL: number;
}

function computeSegment(seg: SegmentDef) {
  const from = coords[seg.from];
  const to = coords[seg.to];
  if (!from) throw new Error(`Unknown waypoint: ${seg.from}`);
  if (!to) throw new Error(`Unknown waypoint: ${seg.to}`);
  const dist = haversine(from.lat, from.lon, to.lat, to.lon);
  const brg = bearing(from.lat, from.lon, to.lat, to.lon);
  const revBrg = (brg + 180) % 360;
  return {
    fromPoint: seg.from,
    toPoint: seg.to,
    distance: Math.round(dist * 10) / 10,
    bearing: Math.round(brg * 10) / 10,
    trackTrue: Math.round(brg * 10) / 10,
    reverseTrack: Math.round(revBrg * 10) / 10,
    minFL: seg.minFL,
    maxFL: seg.maxFL,
  };
}

// ─── New airways definitions ───────────────────────────────────────
const newConventionalAirways = [
  {
    designator: 'W50',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'IQT', to: 'ANA', minFL: 45, maxFL: 245 },
      { from: 'ANA', to: 'PCL', minFL: 45, maxFL: 245 },
      { from: 'PCL', to: 'TGM', minFL: 45, maxFL: 245 },
      { from: 'TGM', to: 'HUZ', minFL: 45, maxFL: 245 },
    ],
  },
  {
    designator: 'W86',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'LIM', to: 'PSO', minFL: 45, maxFL: 245 },
      { from: 'PSO', to: 'AQP', minFL: 45, maxFL: 245 },
      { from: 'AQP', to: 'ILO', minFL: 45, maxFL: 245 },
    ],
  },
  {
    designator: 'W10',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'LIM', to: 'HUZ', minFL: 45, maxFL: 245 },
      { from: 'HUZ', to: 'PCL', minFL: 45, maxFL: 245 },
      { from: 'PCL', to: 'IQT', minFL: 45, maxFL: 245 },
    ],
  },
  {
    designator: 'G584',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'TRU', to: 'PIU', minFL: 45, maxFL: 245 },
      { from: 'PIU', to: 'TAL', minFL: 45, maxFL: 245 },
      { from: 'TAL', to: 'TUM', minFL: 45, maxFL: 245 },
    ],
  },
  {
    designator: 'W60',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'AQP', to: 'ILO', minFL: 45, maxFL: 245 },
      { from: 'ILO', to: 'TAC', minFL: 45, maxFL: 245 },
    ],
  },
  {
    designator: 'A206',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'LIM', to: 'JAU', minFL: 95, maxFL: 245 },
      { from: 'JAU', to: 'HUZ', minFL: 95, maxFL: 245 },
    ],
  },
  {
    designator: 'W76',
    type: 'CONVENTIONAL' as const,
    level: 'LOWER' as const,
    segments: [
      { from: 'LIM', to: 'PSO', minFL: 45, maxFL: 245 },
      { from: 'PSO', to: 'AQP', minFL: 45, maxFL: 245 },
    ],
  },
];

const newRnavAirways = [
  {
    designator: 'UW20',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'LIM', to: 'ESKAL', minFL: 245, maxFL: 450 },
      { from: 'ESKAL', to: 'ISKAR', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UB432',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'AQP', to: 'ILO', minFL: 245, maxFL: 450 },
      { from: 'ILO', to: 'TCQ', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UW80',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'LIM', to: 'MODON', minFL: 245, maxFL: 450 },
      { from: 'MODON', to: 'LORNI', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UB921',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'CUZ', to: 'JUL', minFL: 245, maxFL: 450 },
      { from: 'JUL', to: 'DESAD', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UW44',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'LIM', to: 'PIRAT', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UB660',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'IQT', to: 'PCL', minFL: 245, maxFL: 450 },
    ],
  },
  {
    designator: 'UW30',
    type: 'RNAV' as const,
    level: 'UPPER' as const,
    segments: [
      { from: 'TRU', to: 'CIX', minFL: 245, maxFL: 450 },
      { from: 'CIX', to: 'PIU', minFL: 245, maxFL: 450 },
    ],
  },
];

// ─── Extensions to existing airways ────────────────────────────────
const airwayExtensions = [
  {
    designator: 'G424',
    type: 'CONVENTIONAL' as const,
    newSegments: [
      { from: 'CUZ', to: 'LOLES', minFL: 95, maxFL: 285 },  // CUZ to La Paz area
    ],
  },
  {
    designator: 'G745',
    type: 'CONVENTIONAL' as const,
    newSegments: [
      { from: 'LIM', to: 'PSO', minFL: 145, maxFL: 285 },
      { from: 'PSO', to: 'AQP', minFL: 145, maxFL: 285 },
    ],
  },
];

// ─── A301 correction: replace segments with correct highland route ──
const a301Correction = {
  designator: 'A301',
  type: 'CONVENTIONAL' as const,
  level: 'LOWER' as const,
  segments: [
    { from: 'LIM', to: 'JAU', minFL: 95, maxFL: 245 },
    { from: 'JAU', to: 'CUZ', minFL: 95, maxFL: 245 },
    { from: 'CUZ', to: 'JUL', minFL: 95, maxFL: 245 },
  ],
};

// ─── New waypoints to create ───────────────────────────────────────
const newWaypoints = [
  { id: 'ANA',   name: 'CONTAMANA',    type: 'NAVAID',   lat: -7.27,    lon: -75.03,   description: 'Contamana VOR/DME' },
  { id: 'TGM',   name: 'TINGO MARIA',  type: 'NAVAID',   lat: -9.15,    lon: -75.95,   description: 'Tingo María VOR/DME' },
  { id: 'HUZ',   name: 'HUANUCO',      type: 'NAVAID',   lat: -9.88,    lon: -76.22,   description: 'Huánuco VOR/DME' },
  { id: 'ILO',   name: 'ILO',          type: 'NAVAID',   lat: -17.09,   lon: -70.66,   description: 'Ilo VOR/DME' },
  { id: 'JAU',   name: 'JAUJA',        type: 'NAVAID',   lat: -11.78,   lon: -75.50,   description: 'Jauja VOR/DME' },
  { id: 'TRU',   name: 'TRUJILLO',     type: 'NAVAID',   lat: -8.09,    lon: -79.10,   description: 'Trujillo VOR/DME' },
  { id: 'PIU',   name: 'PIURA',        type: 'NAVAID',   lat: -5.21,    lon: -80.62,   description: 'Piura VOR/DME' },
  { id: 'DESAD', name: 'DESAD',        type: 'WAYPOINT', lat: -17.00,   lon: -70.30,   description: 'RNAV waypoint near Juliaca' },
  { id: 'TAL',   name: 'TALARA',       type: 'NAVAID',   lat: -4.57,    lon: -81.25,   description: 'Talara VOR/DME' },
  { id: 'TUM',   name: 'TUMBES',       type: 'NAVAID',   lat: -3.55,    lon: -80.3833, description: 'Tumbes VOR/DME' },
  { id: 'TAC',   name: 'TACNA',        type: 'NAVAID',   lat: -18.06,   lon: -70.30,   description: 'Tacna VOR/DME' },
];

// ─── New navaids to create ─────────────────────────────────────────
const newNavaids = [
  { id: 'ANA', name: 'CONTAMANA',   type: 'DVOR/DME', frequency: '115.3 MHz', lat: -7.27,    lon: -75.03,   elevation: 180 },
  { id: 'TGM', name: 'TINGO MARIA', type: 'DVOR/DME', frequency: '114.1 MHz', lat: -9.15,    lon: -75.95,   elevation: 660 },
  { id: 'HUZ', name: 'HUANUCO',     type: 'DVOR/DME', frequency: '116.7 MHz', lat: -9.88,    lon: -76.22,   elevation: 1894 },
  { id: 'ILO', name: 'ILO',         type: 'DVOR/DME', frequency: '112.3 MHz', lat: -17.09,   lon: -70.66,   elevation: 15 },
  { id: 'JAU', name: 'JAUJA',       type: 'DVOR/DME', frequency: '117.8 MHz', lat: -11.78,   lon: -75.50,   elevation: 3462 },
  { id: 'TRU', name: 'TRUJILLO',    type: 'DVOR/DME', frequency: '115.8 MHz', lat: -8.09,    lon: -79.10,   elevation: 98 },
  { id: 'PIU', name: 'PIURA',       type: 'DVOR/DME', frequency: '116.5 MHz', lat: -5.21,    lon: -80.62,   elevation: 55 },
  { id: 'TAL', name: 'TALARA',      type: 'DVOR/DME', frequency: '114.8 MHz', lat: -4.57,    lon: -81.25,   elevation: 81 },
  { id: 'TUM', name: 'TUMBES',      type: 'DVOR/DME', frequency: '113.5 MHz', lat: -3.55,    lon: -80.3833, elevation: 28 },
  { id: 'TAC', name: 'TACNA',       type: 'DVOR/DME', frequency: '118.2 MHz', lat: -18.06,   lon: -70.30,   elevation: 470 },
];

// ─── Main seed function ────────────────────────────────────────────
async function main() {
  console.log('=== Seeding Additional Route Data ===\n');

  // 1. Create new waypoints (skip if already exists)
  console.log('--- Creating new waypoints ---');
  for (const wp of newWaypoints) {
    const existing = await db.waypoint.findUnique({ where: { id: wp.id } });
    if (existing) {
      console.log(`  Waypoint ${wp.id} already exists, skipping.`);
    } else {
      await db.waypoint.create({ data: wp });
      console.log(`  Created waypoint: ${wp.id} (${wp.name}) at ${wp.lat}/${wp.lon}`);
    }
  }

  // 2. Create new navaids (skip if already exists)
  console.log('\n--- Creating new navaids ---');
  for (const nv of newNavaids) {
    const existing = await db.navaid.findUnique({ where: { id: nv.id } });
    if (existing) {
      console.log(`  Navaid ${nv.id} already exists, skipping.`);
    } else {
      await db.navaid.create({ data: nv });
      console.log(`  Created navaid: ${nv.id} (${nv.name}) ${nv.frequency}`);
    }
  }

  // 3. Create new conventional airways
  console.log('\n--- Creating new conventional airways ---');
  for (const aw of newConventionalAirways) {
    const existing = await db.airway.findUnique({
      where: { designator_type: { designator: aw.designator, type: aw.type } },
    });
    if (existing) {
      console.log(`  Airway ${aw.designator} (${aw.type}) already exists, skipping.`);
      continue;
    }
    const segments = aw.segments.map((seg, idx) => ({
      orderIndex: idx,
      ...computeSegment(seg),
    }));
    const created = await db.airway.create({
      data: {
        designator: aw.designator,
        type: aw.type,
        level: aw.level,
        segments: { create: segments },
      },
      include: { segments: true },
    });
    console.log(`  Created airway: ${aw.designator} (${aw.type}, ${aw.level}) with ${created.segments.length} segments`);
    for (const seg of created.segments) {
      console.log(`    ${seg.orderIndex}: ${seg.fromPoint} → ${seg.toPoint} ${seg.distance}NM brg=${seg.bearing}° FL${seg.minFL}-FL${seg.maxFL}`);
    }
  }

  // 4. Create new RNAV airways
  console.log('\n--- Creating new RNAV airways ---');
  for (const aw of newRnavAirways) {
    const existing = await db.airway.findUnique({
      where: { designator_type: { designator: aw.designator, type: aw.type } },
    });
    if (existing) {
      console.log(`  Airway ${aw.designator} (${aw.type}) already exists, skipping.`);
      continue;
    }
    const segments = aw.segments.map((seg, idx) => ({
      orderIndex: idx,
      ...computeSegment(seg),
    }));
    const created = await db.airway.create({
      data: {
        designator: aw.designator,
        type: aw.type,
        level: aw.level,
        segments: { create: segments },
      },
      include: { segments: true },
    });
    console.log(`  Created airway: ${aw.designator} (${aw.type}, ${aw.level}) with ${created.segments.length} segments`);
    for (const seg of created.segments) {
      console.log(`    ${seg.orderIndex}: ${seg.fromPoint} → ${seg.toPoint} ${seg.distance}NM brg=${seg.bearing}° FL${seg.minFL}-FL${seg.maxFL}`);
    }
  }

  // 5. Extend existing airways (G424, G745)
  console.log('\n--- Extending existing airways ---');
  for (const ext of airwayExtensions) {
    const existing = await db.airway.findUnique({
      where: { designator_type: { designator: ext.designator, type: ext.type } },
      include: { segments: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!existing) {
      console.log(`  Airway ${ext.designator} (${ext.type}) not found, skipping extension.`);
      continue;
    }
    const startIdx = existing.segments.length;
    for (let i = 0; i < ext.newSegments.length; i++) {
      const segData = computeSegment(ext.newSegments[i]);
      await db.airwaySegment.create({
        data: {
          airwayId: existing.id,
          orderIndex: startIdx + i,
          ...segData,
        },
      });
      console.log(`  Added segment to ${ext.designator}: ${segData.fromPoint} → ${segData.toPoint} ${segData.distance}NM`);
    }
  }

  // 6. Correct A301 route (replace segments)
  console.log('\n--- Correcting A301 route ---');
  const a301 = await db.airway.findUnique({
    where: { designator_type: { designator: a301Correction.designator, type: a301Correction.type } },
    include: { segments: true },
  });
  if (a301) {
    // Delete old segments
    await db.airwaySegment.deleteMany({ where: { airwayId: a301.id } });
    console.log(`  Deleted ${a301.segments.length} old segments from A301`);

    // Create new segments
    const segments = a301Correction.segments.map((seg, idx) => ({
      orderIndex: idx,
      ...computeSegment(seg),
    }));
    for (const seg of segments) {
      await db.airwaySegment.create({
        data: {
          airwayId: a301.id,
          orderIndex: seg.orderIndex,
          fromPoint: seg.fromPoint,
          toPoint: seg.toPoint,
          distance: seg.distance,
          bearing: seg.bearing,
          minFL: seg.minFL,
          maxFL: seg.maxFL,
          trackTrue: seg.trackTrue,
          reverseTrack: seg.reverseTrack,
        },
      });
      console.log(`  Added A301 segment: ${seg.fromPoint} → ${seg.toPoint} ${seg.distance}NM brg=${seg.bearing}° FL${seg.minFL}-FL${seg.maxFL}`);
    }
    console.log(`  A301 corrected: ${a301.segments.length} old → ${segments.length} new segments`);
  } else {
    // A301 doesn't exist, create it
    const segments = a301Correction.segments.map((seg, idx) => ({
      orderIndex: idx,
      ...computeSegment(seg),
    }));
    await db.airway.create({
      data: {
        designator: a301Correction.designator,
        type: a301Correction.type,
        level: a301Correction.level,
        segments: { create: segments },
      },
    });
    console.log(`  Created A301 with ${segments.length} segments`);
  }

  // 7. Summary
  console.log('\n=== Seeding Complete ===');
  const totalWaypoints = await db.waypoint.count();
  const totalNavaids = await db.navaid.count();
  const totalAirways = await db.airway.count();
  const totalSegments = await db.airwaySegment.count();
  const convCount = await db.airway.count({ where: { type: 'CONVENTIONAL' } });
  const rnavCount = await db.airway.count({ where: { type: 'RNAV' } });

  console.log(`\nDatabase Summary:`);
  console.log(`  Waypoints: ${totalWaypoints}`);
  console.log(`  Navaids: ${totalNavaids}`);
  console.log(`  Airways: ${totalAirways} (${convCount} conventional + ${rnavCount} RNAV)`);
  console.log(`  Segments: ${totalSegments}`);

  // List all airways
  const allAirways = await db.airway.findMany({
    select: { designator: true, type: true, segments: { select: { id: true } } },
    orderBy: [{ type: 'asc' }, { designator: 'asc' }],
  });
  console.log('\nAll airways:');
  for (const aw of allAirways) {
    console.log(`  ${aw.designator} (${aw.type}): ${aw.segments.length} segments`);
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
