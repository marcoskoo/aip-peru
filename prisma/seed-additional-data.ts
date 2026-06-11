import { db } from '../src/lib/db';

async function main() {
  console.log('Adding missing communications and navaids data...');

  // ─── COMMUNICATIONS DATA ────────────────────────────────────────
  const communicationsData: Record<string, Array<{service: string; frequency: string; callsign?: string; hours?: string; remarks?: string}>> = {
    // 10 International airports missing comms
    SPCL: [
      { service: 'TWR', frequency: '126.9 MHz', callsign: 'PUCALLPA TWR', hours: 'H24', remarks: '' },
      { service: 'APP', frequency: '118.1 MHz', callsign: 'PUCALLPA APP', hours: 'H24', remarks: '' },
      { service: 'FIS', frequency: '126.9 MHz', callsign: 'PUCALLPA FIS', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPHI: [
      { service: 'TWR', frequency: '118.3 MHz', callsign: 'CHICLAYO TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'CHICLAYO GND', hours: 'H24', remarks: '' },
      { service: 'APP', frequency: '119.1 MHz', callsign: 'CHICLAYO APP', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '127.6 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '126.9 MHz', callsign: 'CHICLAYO RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPJL: [
      { service: 'TWR', frequency: '118.1 MHz', callsign: 'JULIACA TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'APP', frequency: '119.5 MHz', callsign: 'JULIACA APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'JULIACA GND', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '132.0 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPQT: [
      { service: 'TWR', frequency: '118.5 MHz', callsign: 'IQUITOS TWR', hours: 'H24', remarks: '' },
      { service: 'APP', frequency: '124.1 MHz', callsign: 'IQUITOS APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'IQUITOS GND', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '132.3 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '126.9 MHz', callsign: 'IQUITOS RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPQU: [
      { service: 'TWR', frequency: '118.7 MHz', callsign: 'AREQUIPA TWR', hours: 'H24', remarks: '' },
      { service: 'APP', frequency: '118.7 MHz', callsign: 'AREQUIPA APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'AREQUIPA GND', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '127.8 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPRU: [
      { service: 'TWR', frequency: '118.7 MHz', callsign: 'TRUJILLO TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'APP', frequency: '119.3 MHz', callsign: 'TRUJILLO APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'TRUJILLO GND', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '132.6 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '126.9 MHz', callsign: 'TRUJILLO RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPSO: [
      { service: 'TWR', frequency: '118.3 MHz', callsign: 'PISCO TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'APP', frequency: '118.3 MHz', callsign: 'PISCO APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'PISCO GND', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '126.9 MHz', callsign: 'PISCO RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPTN: [
      { service: 'TWR', frequency: '118.4 MHz', callsign: 'TACNA TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'APP', frequency: '119.7 MHz', callsign: 'TACNA APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'TACNA GND', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '126.9 MHz', callsign: 'TACNA RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPYL: [
      { service: 'TWR', frequency: '118.5 MHz', callsign: 'TALARA TWR', hours: 'H24', remarks: 'APP/TWR' },
      { service: 'APP', frequency: '120.1 MHz', callsign: 'TALARA APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'TALARA GND', hours: 'H24', remarks: '' },
      { service: 'RDO', frequency: '119.5 MHz', callsign: 'TALARA RDO', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
    SPZO: [
      { service: 'TWR', frequency: '118.1 MHz', callsign: 'CUSCO TWR', hours: 'H24', remarks: '' },
      { service: 'APP', frequency: '120.6 MHz', callsign: 'CUSCO APP', hours: 'H24', remarks: '' },
      { service: 'GND', frequency: '121.9 MHz', callsign: 'CUSCO GND', hours: 'H24', remarks: '' },
      { service: 'ATIS', frequency: '127.0 MHz', callsign: '', hours: 'H24', remarks: '' },
      { service: 'EMERGENCIA', frequency: '121.5 MHz', callsign: '', hours: 'H24', remarks: '' },
    ],
  };

  // ─── NAVAIDS DATA ───────────────────────────────────────────────
  const navaidsData: Record<string, Array<{type: string; identifier: string; frequency: string; coordinates?: string; elevation?: string; remarks?: string}>> = {
    // International airports missing navaids
    SPCL: [
      { type: 'VOR/DME', identifier: 'PUL', frequency: '116.7 MHz', coordinates: '08°22\'39.00"S / 074°34\'29.00"W', elevation: '157 m / 515 ft', remarks: 'PUCALLPA' },
    ],
    SPHI: [
      { type: 'VOR/DME', identifier: 'CIX', frequency: '114.5 MHz', coordinates: '06°47\'24.00"S / 079°49\'34.00"W', elevation: '29 m / 95 ft', remarks: 'CHICLAYO' },
      { type: 'NDB', identifier: 'HIC', frequency: '305 kHz', coordinates: '06°47\'00"S / 079°49\'00"W', remarks: 'CHICLAYO' },
    ],
    SPJL: [
      { type: 'VOR/DME', identifier: 'JUL', frequency: '115.55 MHz', coordinates: '15°27\'30.00"S / 70°09\'00.00"W', elevation: '3826 m / 12552 ft', remarks: 'JULIACA' },
    ],
    SPQT: [
      { type: 'VOR/DME', identifier: 'IQT', frequency: '116.5 MHz', coordinates: '03°46\'50.00"S / 073°18\'21.00"W', elevation: '93 m / 306 ft', remarks: 'IQUITOS' },
    ],
    SPQU: [
      { type: 'VOR/DME', identifier: 'AQP', frequency: '113.7 MHz', coordinates: '16°20\'35.00"S / 71°34\'59.00"W', elevation: '2560 m / 8399 ft', remarks: 'AREQUIPA' },
    ],
    SPRU: [
      { type: 'VOR/DME', identifier: 'TRU', frequency: '116.3 MHz', coordinates: '08°05\'50.00"S / 079°05\'59.00"W', elevation: '30 m / 98 ft', remarks: 'TRUJILLO' },
    ],
    SPSO: [
      { type: 'VOR/DME', identifier: 'PSO', frequency: '114.3 MHz', coordinates: '13°44\'26.00"S / 076°13\'20.00"W', elevation: '12 m / 39 ft', remarks: 'PISCO' },
      { type: 'NDB', identifier: 'SCO', frequency: '355 kHz', coordinates: '13°44\'00"S / 076°13\'00"W', remarks: 'PISCO' },
    ],
    SPTN: [
      { type: 'VOR/DME', identifier: 'TCQ', frequency: '116.8 MHz', coordinates: '18°03\'35.00"S / 070°16\'59.00"W', elevation: '469 m / 1539 ft', remarks: 'TACNA' },
    ],
    SPYL: [
      { type: 'NDB', identifier: 'TYL', frequency: '370 kHz', coordinates: '04°34\'00"S / 081°15\'00"W', remarks: 'TALARA' },
    ],
    SPZO: [
      { type: 'VOR/DME', identifier: 'CUZ', frequency: '114.9 MHz', coordinates: '13°32\'00.00"S / 071°59\'00.00"W', elevation: '3310 m / 10860 ft', remarks: 'CUSCO' },
      { type: 'ILS', identifier: 'ICUZ', frequency: '109.5 MHz', coordinates: '', remarks: 'ILS CAT I RWY 28' },
    ],
    // National airports missing navaids
    SPAY: [
      { type: 'NDB', identifier: 'LAY', frequency: '295 kHz', coordinates: '10°43\'00"S / 073°45\'00"W', remarks: 'ATALAYA' },
    ],
    SPGM: [
      { type: 'NDB', identifier: 'TGM', frequency: '385 kHz', coordinates: '09°17\'00"S / 075°59\'00"W', remarks: 'TINGO MARÍA' },
    ],
    SPHO: [
      { type: 'VOR/DME', identifier: 'AYC', identifier: 'AYC', frequency: '117.5 MHz', coordinates: '13°08\'49.00"S / 074°13\'21.00"W', elevation: '2759 m / 9052 ft', remarks: 'AYACUCHO' },
    ],
    SPHZ: [
      { type: 'NDB', identifier: 'ATA', frequency: '415 kHz', coordinates: '09°22\'00"S / 077°37\'00"W', remarks: 'ANTA' },
    ],
    SPJI: [
      { type: 'NDB', identifier: 'UAN', frequency: '290 kHz', coordinates: '07°13\'00"S / 076°44\'00"W', remarks: 'JUANJUÍ' },
    ],
    SPJJ: [
      { type: 'VOR/DME', identifier: 'JAU', frequency: '114.1 MHz', coordinates: '11°47\'00"S / 075°29\'00"W', elevation: '3676 m / 12060 ft', remarks: 'JAUJA' },
    ],
    SPJR: [
      { type: 'VOR/DME', identifier: 'CJA', frequency: '115.9 MHz', coordinates: '07°08\'00"S / 078°25\'00"W', elevation: '2662 m / 8734 ft', remarks: 'CAJAMARCA' },
    ],
    SPNC: [
      { type: 'NDB', identifier: 'NUC', frequency: '310 kHz', coordinates: '09°53\'00"S / 076°13\'00"W', remarks: 'HUÁNUCO' },
    ],
    SPJE: [],
    SPMF: [],
    SPMS: [],
    SPJA: [],
    SPZA: [],
  };

  // ─── SEED COMMUNICATIONS ────────────────────────────────────────
  let commsAdded = 0;
  for (const [icaoCode, comms] of Object.entries(communicationsData)) {
    const airport = await db.airport.findUnique({ where: { icaoCode } });
    if (!airport) {
      console.log(`  Airport ${icaoCode} not found, skipping`);
      continue;
    }
    
    // Check if comms already exist
    const existingComms = await db.communication.findMany({ where: { airportId: airport.id } });
    if (existingComms.length > 0) {
      console.log(`  ${icaoCode}: already has ${existingComms.length} comms, skipping`);
      continue;
    }
    
    for (const comm of comms) {
      await db.communication.create({
        data: {
          airportId: airport.id,
          service: comm.service,
          frequency: comm.frequency,
          callsign: comm.callsign,
          hours: comm.hours,
          remarks: comm.remarks,
        },
      });
    }
    console.log(`  ${icaoCode}: Added ${comms.length} communications`);
    commsAdded += comms.length;
  }
  console.log(`\nTotal communications added: ${commsAdded}`);

  // ─── SEED NAVAIDS ───────────────────────────────────────────────
  let navaidsAdded = 0;
  for (const [icaoCode, navaids] of Object.entries(navaidsData)) {
    const airport = await db.airport.findUnique({ where: { icaoCode } });
    if (!airport) {
      console.log(`  Airport ${icaoCode} not found, skipping`);
      continue;
    }
    
    // Check if navaids already exist
    const existingNavaids = await db.radioNavAid.findMany({ where: { airportId: airport.id } });
    if (existingNavaids.length > 0) {
      console.log(`  ${icaoCode}: already has ${existingNavaids.length} navaids, skipping`);
      continue;
    }
    
    if (navaids.length === 0) {
      console.log(`  ${icaoCode}: No navaids data available`);
      continue;
    }
    
    for (const navaid of navaids) {
      await db.radioNavAid.create({
        data: {
          airportId: airport.id,
          type: navaid.type,
          identifier: navaid.identifier,
          frequency: navaid.frequency,
          coordinates: navaid.coordinates,
          elevation: navaid.elevation,
          remarks: navaid.remarks,
        },
      });
    }
    console.log(`  ${icaoCode}: Added ${navaids.length} navaids`);
    navaidsAdded += navaids.length;
  }
  console.log(`\nTotal navaids added: ${navaidsAdded}`);

  // ─── SEED OBSTACLES ─────────────────────────────────────────────
  // Add known obstacle data for major airports
  const obstaclesData: Record<string, Array<{runwayArea: string; obstacleType: string; elevation: string; markingLighting: string; coordinates: string; remarks?: string}>> = {
    SPJC: [
      { runwayArea: 'RWY 16L approach', obstacleType: 'Antena', elevation: '86 m / 282 ft', markingLighting: 'LGTD', coordinates: '12°01\'23.00"S / 077°06\'12.00"W', remarks: '' },
      { runwayArea: 'RWY 34R approach', obstacleType: 'Edificio', elevation: '58 m / 190 ft', markingLighting: 'NIL', coordinates: '12°00\'05.00"S / 077°06\'45.00"W', remarks: '' },
      { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '153 m / 502 ft', markingLighting: 'LGTD', coordinates: '12°02\'45.00"S / 077°05\'30.00"W', remarks: '' },
      { runwayArea: 'RWY 16R approach', obstacleType: 'Chimenea', elevation: '94 m / 308 ft', markingLighting: 'LGTD', coordinates: '11°59\'30.00"S / 077°08\'00.00"W', remarks: '' },
    ],
    SPQU: [
      { runwayArea: 'RWY 10 approach', obstacleType: 'Cerros', elevation: '3078 m / 10098 ft', markingLighting: 'NIL', coordinates: '16°22\'00"S / 71°32\'00"W', remarks: 'Terreno natural' },
      { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '2700 m / 8858 ft', markingLighting: 'LGTD', coordinates: '16°19\'00"S / 71°36\'00"W', remarks: '' },
    ],
    SPZO: [
      { runwayArea: 'RWY 28 approach', obstacleType: 'Cerros', elevation: '3600 m / 11811 ft', markingLighting: 'NIL', coordinates: '13°30\'00"S / 71°57\'00"W', remarks: 'Terreno natural' },
      { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '3450 m / 11319 ft', markingLighting: 'LGTD', coordinates: '13°34\'00"S / 72°00\'00"W', remarks: '' },
    ],
    SPHI: [
      { runwayArea: 'RWY 01 approach', obstacleType: 'Antena', elevation: '102 m / 335 ft', markingLighting: 'LGTD', coordinates: '06°48\'00"S / 079°48\'00"W', remarks: '' },
      { runwayArea: 'Circuit area', obstacleType: 'Edificio', elevation: '55 m / 180 ft', markingLighting: 'NIL', coordinates: '06°47\'00"S / 079°50\'00"W', remarks: '' },
    ],
    SPRU: [
      { runwayArea: 'RWY 02 approach', obstacleType: 'Antena', elevation: '78 m / 256 ft', markingLighting: 'LGTD', coordinates: '08°05\'00"S / 079°06\'00"W', remarks: '' },
      { runwayArea: 'Circuit area', obstacleType: 'Chimenea', elevation: '65 m / 213 ft', markingLighting: 'LGTD', coordinates: '08°06\'00"S / 079°05\'00"W', remarks: '' },
    ],
    SPQT: [
      { runwayArea: 'RWY 07 approach', obstacleType: 'Torre', elevation: '103 m / 338 ft', markingLighting: 'LGTD', coordinates: '03°47\'00"S / 073°19\'00"W', remarks: '' },
      { runwayArea: 'Circuit area', obstacleType: 'Árbol', elevation: '95 m / 312 ft', markingLighting: 'NIL', coordinates: '03°46\'00"S / 073°18\'00"W', remarks: '' },
    ],
    SPSO: [
      { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '52 m / 171 ft', markingLighting: 'LGTD', coordinates: '13°44\'00"S / 076°13\'00"W', remarks: '' },
    ],
    SPTN: [
      { runwayArea: 'RWY 18 approach', obstacleType: 'Cerros', elevation: '750 m / 2461 ft', markingLighting: 'NIL', coordinates: '18°05\'00"S / 070°15\'00"W', remarks: 'Terreno natural' },
    ],
    SPJL: [
      { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '3950 m / 12959 ft', markingLighting: 'LGTD', coordinates: '15°28\'00"S / 70°10\'00"W', remarks: '' },
    ],
    SPYL: [
      { runwayArea: 'Circuit area', obstacleType: 'Terreno', elevation: '85 m / 279 ft', markingLighting: 'NIL', coordinates: '04°35\'00"S / 081°14\'00"W', remarks: '' },
    ],
  };

  let obstaclesAdded = 0;
  for (const [icaoCode, obstacles] of Object.entries(obstaclesData)) {
    const airport = await db.airport.findUnique({ where: { icaoCode } });
    if (!airport) continue;
    
    const existing = await db.obstacle.findMany({ where: { airportId: airport.id } });
    if (existing.length > 0) {
      console.log(`  ${icaoCode}: already has ${existing.length} obstacles, skipping`);
      continue;
    }
    
    for (const obs of obstacles) {
      await db.obstacle.create({
        data: {
          airportId: airport.id,
          runwayArea: obs.runwayArea,
          obstacleType: obs.obstacleType,
          elevation: obs.elevation,
          markingLighting: obs.markingLighting,
          coordinates: obs.coordinates,
          remarks: obs.remarks,
        },
      });
    }
    console.log(`  ${icaoCode}: Added ${obstacles.length} obstacles`);
    obstaclesAdded += obstacles.length;
  }
  console.log(`\nTotal obstacles added: ${obstaclesAdded}`);

  await db.$disconnect();
  console.log('\nDone! Data population complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
