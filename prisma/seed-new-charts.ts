import { db } from '../src/lib/db';

async function main() {
  console.log('Updating airports with navaid and communication data from new charts...');

  // SPJE - Jaén
  const spje = await db.airport.findUnique({ where: { icaoCode: 'SPJE' } });
  if (spje) {
    await db.communication.create({
      data: {
        airportId: spje.id,
        service: 'FIS/AFIS',
        frequency: '126.9 MHz',
        callsign: 'JAEN FIS/AFIS',
      },
    });
    console.log('  SPJE: Added communication');
  }

  // SPJI - Juanjuí
  const spji = await db.airport.findUnique({ where: { icaoCode: 'SPJI' } });
  if (spji) {
    await db.communication.createMany({
      data: [
        { airportId: spji.id, service: 'FIS', frequency: '126.9 MHz', callsign: 'JUANJUI FIS' },
        { airportId: spji.id, service: 'AFIS', frequency: '118.1 MHz', callsign: 'JUANJUI AFIS' },
      ],
    });
    console.log('  SPJI: Added communications');
  }

  // SPJJ - Jauja
  const spjj = await db.airport.findUnique({ where: { icaoCode: 'SPJJ' } });
  if (spjj) {
    await db.communication.create({
      data: {
        airportId: spjj.id,
        service: 'FIS',
        frequency: '126.9 MHz',
        callsign: 'JAUJA FIS',
      },
    });
    console.log('  SPJJ: Added communication');
  }

  // SPJR - Cajamarca
  const spjr = await db.airport.findUnique({ where: { icaoCode: 'SPJR' } });
  if (spjr) {
    await db.communication.create({
      data: {
        airportId: spjr.id,
        service: 'TWR',
        frequency: '120.1 MHz',
        callsign: 'CAJAMARCA TWR',
      },
    });
    console.log('  SPJR: Added communication');
  }

  // SPME - Tumbes
  const spme = await db.airport.findUnique({ where: { icaoCode: 'SPME' } });
  if (spme) {
    // Add navaid
    await db.radioNavAid.create({
      data: {
        airportId: spme.id,
        type: 'VOR/DME',
        identifier: 'BES',
        frequency: '112.9 MHz',
        coordinates: '03°32\'40"S - 080°23\'21"W',
      },
    });
    // Add communications
    await db.communication.createMany({
      data: [
        { airportId: spme.id, service: 'APP/TWR', frequency: '126.8 MHz', callsign: 'TUMBES TORRE' },
        { airportId: spme.id, service: 'EMERG', frequency: '121.5 MHz', callsign: '' },
      ],
    });
    console.log('  SPME: Added navaid and communications');
  }

  // SPMF - Mazamari
  const spmf = await db.airport.findUnique({ where: { icaoCode: 'SPMF' } });
  if (spmf) {
    await db.communication.create({
      data: {
        airportId: spmf.id,
        service: 'AFIS',
        frequency: '118.3 MHz',
        callsign: 'MAZAMARI AFIS',
      },
    });
    console.log('  SPMF: Added communication');
  }

  // SPMS - Yurimaguas
  const spms = await db.airport.findUnique({ where: { icaoCode: 'SPMS' } });
  if (spms) {
    await db.communication.create({
      data: {
        airportId: spms.id,
        service: 'APP/TWR',
        frequency: '118.1 MHz',
        callsign: 'YURIMAGUAS TWR',
      },
    });
    console.log('  SPMS: Added communication');
  }

  // SPPY - Chachapoyas
  const sppy = await db.airport.findUnique({ where: { icaoCode: 'SPPY' } });
  if (sppy) {
    // Add navaid
    await db.radioNavAid.create({
      data: {
        airportId: sppy.id,
        type: 'VOR/DME',
        identifier: 'POY',
        frequency: '115.1 MHz',
        coordinates: '06°12\'02"S - 077°50\'15"W',
      },
    });
    // Add communications
    await db.communication.create({
      data: {
        airportId: sppy.id,
        service: 'FIS/AFIS',
        frequency: '126.9 MHz',
        callsign: 'CHACHAPOYAS FIS/AFIS',
      },
    });
    console.log('  SPPY: Added navaid and communication');
  }

  // SPTU - Puerto Maldonado
  const sptu = await db.airport.findUnique({ where: { icaoCode: 'SPTU' } });
  if (sptu) {
    // Add navaids
    await db.radioNavAid.createMany({
      data: [
        {
          airportId: sptu.id,
          type: 'VOR/DME',
          identifier: 'PDO',
          frequency: '116.1 MHz',
          coordinates: '12°36\'30"S / 069°13\'38"W',
        },
        {
          airportId: sptu.id,
          type: 'ILS/DME',
          identifier: 'IPJA',
          frequency: '109.7 MHz',
          coordinates: '12°36\'30"S / 069°13\'38"W',
        },
      ],
    });
    // Add communications
    await db.communication.create({
      data: {
        airportId: sptu.id,
        service: 'APP/TWR',
        frequency: '118.5 MHz',
        callsign: 'MALDONADO TORRE',
      },
    });
    console.log('  SPTU: Added navaids and communication');
  }

  console.log('\nDone! All airports updated with navaid and communication data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
