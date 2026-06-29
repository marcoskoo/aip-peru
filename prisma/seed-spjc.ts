/**
 * Seed SPJC — Aeropuerto Internacional Jorge Chávez (Lima/Callao)
 * El aeropuerto más importante del Perú. Datos basados en AIP PERÚ AD 2.SPJC.
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('Seeding SPJC — Aeropuerto Internacional Jorge Chávez...')

  // Delete existing SPJC if any (idempotent)
  const existing = await db.airport.findUnique({ where: { icaoCode: 'SPJC' } })
  if (existing) {
    await db.airport.delete({ where: { id: existing.id } })
    console.log('  Deleted existing SPJC')
  }

  const runways = [
    {
      designator: '15',
      brgGeo: '154°',
      brgMag: '153°',
      dimensions: '3507 m x 45 m',
      surface: 'Asfalto / Concreto',
      pcn: '80 / R / B / W / T',
      thrElevation: '34 m / 112 ft',
      thrCoords: "12°00'00.00\"S / 77°06'51.00\"W",
      swyDimensions: '60 m',
      cwyDimensions: 'NIL',
      stripDimensions: '3627 m x 150 m',
      ofz: 'Establecida',
      resa: '60 m x 45 m',
      remarks: 'RWY 15 - PAPI left side (3.00°), ILS CAT I/II/III',
    },
    {
      designator: '33',
      brgGeo: '334°',
      brgMag: '333°',
      dimensions: '3507 m x 45 m',
      surface: 'Asfalto / Concreto',
      pcn: '80 / R / B / W / T',
      thrElevation: '34 m / 113 ft',
      thrCoords: "12°01'57.00\"S / 77°07'00.00\"W",
      swyDimensions: '60 m',
      cwyDimensions: 'NIL',
      stripDimensions: '3627 m x 150 m',
      ofz: 'Establecida',
      resa: '60 m x 45 m',
      remarks: 'RWY 33 - PAPI right side (3.00°), ILS CAT I',
    },
  ]

  const declaredDistances = [
    { rwy: '15', lda: 3507, ldaFt: 11506, tora: 3507, toraFt: 11506, toda: 3507, todaFt: 11506, asda: 3507, asdaFt: 11506 },
    { rwy: '33', lda: 3507, ldaFt: 11506, tora: 3507, toraFt: 11506, toda: 3507, todaFt: 11506, asda: 3507, asdaFt: 11506 },
  ]

  const platformData = {
    totalPositions: 64,
    positions: {
      'Main Apron': 38,
      'Remote Stands': 14,
      'Cargo Apron': 6,
      'Military Apron': 4,
      'General Aviation': 2,
    },
    dimensions: '430 m x 540 m',
    surface: 'Concreto / Asfalto',
    markings: 'Markings according to ICAO Annex 14',
    remarks: 'Plataforma principal con 38 posiciones de contacto (jet bridges)',
  }

  const taxiwaysData = [
    { designator: 'A', description: 'Parallel taxiway full length RWY 15/33' },
    { designator: 'A1', description: 'High-speed exit RWY 33 (turnoff)' },
    { designator: 'A2', description: 'High-speed exit RWY 33 (turnoff)' },
    { designator: 'A3', description: 'High-speed exit RWY 15 (turnoff)' },
    { designator: 'A4', description: 'High-speed exit RWY 15 (turnoff)' },
    { designator: 'A5', description: 'Intersection RWY 15/33 - West side' },
    { designator: 'A6', description: 'Intersection RWY 15/33 - East side' },
    { designator: 'B', description: 'Parallel taxiway East side' },
    { designator: 'B1', description: 'Connection to Main Apron' },
    { designator: 'B2', description: 'Connection to Cargo Apron' },
    { designator: 'M1', description: 'Access to Military Apron' },
    { designator: 'M2', description: 'Access to Remote Stands' },
  ]

  const operatingHours = {
    aerodrome: 'H24',
    twr: 'H24',
    app: 'H24',
    acc: 'H24',
    aoc: 'H24',
    met: 'H24',
    ais: 'H24',
    customs: 'H24',
    immigration: 'H24',
    remarks: 'Operaciones 24 horas, todos los días del año',
  }

  const metOffice = {
    name: 'Servicio Nacional de Meteorología e Hidrología del Perú (SENAMHI)',
    office: 'OMA Lima - SPJC',
    aftn: 'SPJCZPZX',
    phone: '(01) 614-1414',
    email: 'ais@corpac.gob.pe',
    hours: 'H24',
    briefing: 'Briefing meteorológico: H24 (presencial y telefónico)',
    consultation: 'Consulta de pilotos: H24',
    documentation: 'Documentación meteorológica: Cartas SIGWX, METAR/TAF, GAMET',
    language: 'Español / Inglés',
    charts: 'Cartas sinópticas, prognosis, significant weather',
    supplementary: 'Boletín meteorológico especial para vuelos transoceánicos',
    atsDependencies: 'Información MET transmitida por ATIS (127.80 MHz) y VOLMET',
    additionalInfo: 'RWY 15: ILS CAT II/III; RWY 33: ILS CAT I. Bajo visibilidad requiere LVP',
  }

  const airport = await db.airport.create({
    data: {
      icaoCode: 'SPJC',
      name: 'AEROPUERTO INTERNACIONAL JORGE CHÁVEZ',
      city: 'CALLAO',
      region: 'CALLAO',
      department: 'CALLAO',
      province: 'CALLAO',
      district: 'CALLAO',
      country: 'PERÚ',
      arpLatitude: "12°00'00.00\"S",
      arpLongitude: "77°06'51.00\"W",
      elevation: '34 m / 113 ft',
      temperature: '26.3° C (SET)',
      geoidalUndulation: 'NIL',
      magneticDeclination: '1°E (JAN 2025)',
      annualChange: '0°05\' W',
      distanceFromCity: '11 km al NO del centro de Lima',
      administrationType: 'AD Lima Airport Partners S.R.L. - LAP',
      address: 'Av. Velasco Astete S/N, Callao 07006',
      phone: '(01) 511-6000',
      fax: '(01) 511-6040',
      aftn: 'SPJCZPZX',
      email: 'info@lap.com.pe',
      authorizedTraffic: 'IFR / VFR',
      category: 'INTERNACIONAL',
      remarks: 'Principal aeropuerto internacional del Perú. Sede de operaciones de LATAM Perú, Sky Airline Perú, JetSMART Perú. Segundo aeropuerto con operaciones CAT II/III en Sudamérica.',
      operatingHours: JSON.stringify(operatingHours),
      cargoHandlingFacilities: JSON.stringify({
        available: true,
        operators: ['LAN Cargo', 'DHL Aviation', 'Fedicargo'],
        coldStorage: true,
        dangerousGoods: true,
        liveAnimals: true,
      }),
      fuelTypes: 'JET A-1, AVGAS 100LL',
      lubricantTypes: 'Aero Shell Oils',
      refuelingFacilities: JSON.stringify({
        providers: ['PRONAX', 'COPEC Perú'],
        capacity: 'JET A-1: 4.5M L / AVGAS: 50K L',
        method: 'Dispenser / Hydrant system (Main Apron)',
        hours: 'H24',
      }),
      deIcingFacilities: 'NIL',
      hangarSpace: '3 hangares privados (1 para aviación general, 2 para maintenance)',
      repairFacilities: 'Line maintenance: LATAM Tech, ATAC',
      scaleRemarks: 'Servicios completos para aviación comercial y general',
      hotels: 'Costa del Sol Wyndham Lima Airport (adjunto al terminal), Ramada by Wyndham (próximo)',
      restaurants: 'Multiple restaurantes en terminal (Zona Nacional e Internacional)',
      transport: 'Taxis corporativos, Metro de Lima (Línea 1 - próxima estación), buses, shuttles hoteler',
      medicalFacilities: 'Posta médica en terminal, ambulancia H24',
      bankingPost: 'Bancos, cajeros automáticos, casas de cambio, agencia de CORPAC S.A.',
      tourismOffice: 'PROMPERÚ - Información turística en sala de llegadas',
      passengerRemarks: 'Terminal con 2 salas (Nacional e Internacional), 2 puentes aéreos independientes',
      fireCategory: 'CAT 9',
      rescueEquipment: 'Vehículos de rescate: 4 RFFS, ambulancias, equipo de salvamento acuático',
      aircraftRemovalCapacity: 'Equipo de remoción disponible 24/7',
      rescueRemarks: 'Cumple con ICAO Annex 14 CAT 9 (elevado a CAT 10 para B747/A340)',
      platformData: JSON.stringify(platformData),
      taxiwayData: JSON.stringify(taxiwaysData),
      checkpointData: JSON.stringify({
        positions: 2,
        description: '2 puestos de control de seguridad (Nacional e Internacional)',
        equipment: 'Rayos X, detector de metales, escáner corporal',
      }),
      platformRemarks: 'Sistema SMGCS para guía de superficie en baja visibilidad',
      surfaceGuidance: JSON.stringify({
        smgcs: true,
        stopBars: true,
        centerlineLights: true,
        taxiwayEdgeLights: true,
        runwayGuardLights: true,
      }),
      runwaySigns: 'Señalización según ICAO Annex 14 Vol II (retroreflectantes)',
      taxiwaySigns: 'Señalización completa con luces de borde y eje',
      stopBars: 'Stop bars iluminados en todas las intersecciones con pista',
      guidanceRemarks: 'Sistema A-SMGCS para operaciones en baja visibilidad (LVO)',
      metOffice: JSON.stringify(metOffice),
      metHours: 'H24',
      metForecastOffice: 'OMA / SPJC - SENAMHI',
      metValidity: 'TAF: 24h (cada 6h), Trend: 2h',
      metLandingForecast: 'Trend type forecast appended to METAR',
      metTrendInterval: '2 horas',
      metBriefing: 'Briefing meteorológico disponible 24h (presencial y vía AFTN)',
      metConsultation: 'Consulta de pilotos: H24',
      metDocumentation: 'Cartas SIGWX, METAR, TAF, GAMET, AIRMET, SIGMET',
      metLanguage: 'Español / Inglés (ICAO Annex 3)',
      metCharts: 'Cartas sinópticas, prognosis, significant weather (WAFS)',
      metSupplementary: 'Boletín especial para vuelos transoceánicos, ATIS y VOLMET',
      metAtsDependencies: 'ATIS 127.80 MHz, VOLMET HF, información vía ACARS',
      metAdditionalInfo: 'Equipo automático de observación meteorológica (AWOS)',
      runways: JSON.stringify(runways),
      declaredDistances: JSON.stringify(declaredDistances),
    },
  })

  console.log(`✓ Created SPJC airport (id: ${airport.id})`)

  // Add communications
  const communications = [
    { service: 'ATIS', frequency: '127.80 MHz', callsign: 'LIMA', hours: 'H24', remarks: 'ATIS D-ATIS digital' },
    { service: 'DEL', frequency: '121.90 MHz', callsign: 'LIMA DEL', hours: 'H24', remarks: 'Clearance Delivery' },
    { service: 'GND', frequency: '121.90 MHz', callsign: 'LIMA GND', hours: 'H24', remarks: 'Ground Control' },
    { service: 'TWR', frequency: '118.30 MHz', callsign: 'LIMA TWR', hours: 'H24', remarks: 'Tower primary' },
    { service: 'TWR', frequency: '118.75 MHz', callsign: 'LIMA TWR', hours: 'H24', remarks: 'Tower secondary' },
    { service: 'APP', frequency: '119.70 MHz', callsign: 'LIMA APP', hours: 'H24', remarks: 'Approach primary' },
    { service: 'APP', frequency: '120.30 MHz', callsign: 'LIMA APP', hours: 'H24', remarks: 'Approach secondary' },
    { service: 'APP', frequency: '125.10 MHz', callsign: 'LIMA APP', hours: 'H24', remarks: 'Approach radar' },
    { service: 'CTR', frequency: '125.50 MHz', callsign: 'LIMA CTR', hours: 'H24', remarks: 'Control terminal' },
    { service: 'ACC', frequency: '128.30 MHz', callsign: 'LIMA ACC', hours: 'H24', remarks: 'Area Control Centro' },
    { service: 'ACC', frequency: '128.90 MHz', callsign: 'LIMA ACC', hours: 'H24', remarks: 'Area Control HF' },
    { service: 'EMERG', frequency: '121.50 MHz', callsign: 'EMERGENCY', hours: 'H24', remarks: 'Emergencia internacional' },
  ]
  for (const comm of communications) {
    await db.communication.create({ data: { ...comm, airportId: airport.id } })
  }
  console.log(`✓ Created ${communications.length} communications`)

  // Add radio navigation aids
  const navAids = [
    { type: 'ILS/DME', identifier: 'ILW', frequency: '110.10 MHz CH 45X', coordinates: "12°00'50.00\"S / 77°07'00.00\"W", remarks: 'ILS RWY 15' },
    { type: 'ILS/DME', identifier: 'IML', frequency: '109.50 MHz CH 35X', coordinates: "12°01'56.00\"S / 77°07'00.00\"W", remarks: 'ILS RWY 33' },
    { type: 'VOR/DME', identifier: 'LIM', frequency: '116.10 MHz', coordinates: "12°01'00.00\"S / 77°06'30.00\"W", elevation: '113 ft', remarks: 'Lima VOR/DME' },
    { type: 'NDB', identifier: 'LIM', frequency: '322 KHz', coordinates: "12°01'00.00\"S / 77°06'30.00\"W", remarks: 'Lima NDB (co-located)' },
  ]
  for (const navAid of navAids) {
    await db.radioNavAid.create({ data: { ...navAid, airportId: airport.id } })
  }
  console.log(`✓ Created ${navAids.length} radio navigation aids`)

  // Add obstacles
  const obstacles = [
    { runwayArea: 'RWY 15 approach', obstacleType: 'Edificio', elevation: '15 m / 49 ft', markingLighting: 'LGTD', coordinates: "12°00'03.00\"S / 77°06'52.00\"W", remarks: 'Terminal de pasajeros' },
    { runwayArea: 'RWY 33 approach', obstacleType: 'Antena', elevation: '34 m / 112 ft', markingLighting: 'LGTD', coordinates: "12°02'00.00\"S / 77°07'05.00\"W", remarks: 'Torre de control' },
    { runwayArea: 'Circuit area', obstacleType: 'Edificio', elevation: '45 m / 148 ft', markingLighting: 'LGTD', coordinates: "12°01'40.00\"S / 77°06'10.00\"W", remarks: 'Hotel Costa del Sol' },
  ]
  for (const obs of obstacles) {
    await db.obstacle.create({ data: { ...obs, airportId: airport.id } })
  }
  console.log(`✓ Created ${obstacles.length} obstacles`)

  console.log('\n🎉 SPJC seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
