import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding scalable aeronautical data...\n')

  // ─── Fetch airport IDs ─────────────────────────────────────────
  const airports = await prisma.airport.findMany({
    select: { id: true, icaoCode: true },
  })
  const airportMap = new Map<string, string>()
  for (const a of airports) {
    airportMap.set(a.icaoCode, a.id)
  }
  console.log(`✈️  Found ${airports.length} airports in database\n`)

  // ─── Helper: date offsets ──────────────────────────────────────
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000)

  // ════════════════════════════════════════════════════════════════
  // 1. NOTAMs — NO SE SIEMBRAN DATOS FICTICIOS
  // ════════════════════════════════════════════════════════════════
  //
  // Los NOTAMs deben ser REALES y presentarse en formato crudo OACI,
  // sin interpretación del sistema. La fuente primaria es la API pública
  // de la FAA USNS (https://notams.aim.faa.gov/notamSearch/search) que
  // devuelve NOTAMs OACI completos para FIR SPIM y todos los aeropuertos
  // peruanos.
  //
  // La base de datos se usa solo como suplemento para NOTAMs reales
  // ingresados manualmente por un administrador (p.ej. pegados desde
  // correos de AIS Perú vía /api/spim-briefing/ingest).
  //
  // Ver: src/lib/aviation/faa-notams.ts
  //      src/app/api/notams/route.ts
  const notams: never[] = []

  // ════════════════════════════════════════════════════════════════
  // 2. Airspace Restrictions (18 zones)
  // ════════════════════════════════════════════════════════════════

  const airspaceRestrictions = [
    // ── Prohibited Areas ─────────────────────────────────────────
    {
      designator: 'PSP-01',
      name: 'ZONA PROHIBIDA PALACIO DE GOBIERNO',
      type: 'PROHIBITED',
      status: 'ACTIVO',
      centerLat: -12.0475,
      centerLon: -77.0325,
      lowerLimit: 'GND',
      upperLimit: 'FL200',
      lowerLimitFt: 0,
      upperLimitFt: 20000,
      radius: 2,
      restrictions: 'PROHIBIDO TODO VUELO. AUTORIZACIÓN ESPECIAL DIRCORA.',
      operatingHours: 'H24',
      authority: 'DIRCORA / MININTER',
      remarks: 'Área de seguridad Palacio de Gobierno de Perú',
      color: '#FF0000',
    },
    {
      designator: 'PSP-02',
      name: 'ZONA PROHIBIDA CONGRESO',
      type: 'PROHIBITED',
      status: 'ACTIVO',
      centerLat: -12.0525,
      centerLon: -77.0380,
      lowerLimit: 'GND',
      upperLimit: 'FL100',
      lowerLimitFt: 0,
      upperLimitFt: 10000,
      radius: 1.5,
      restrictions: 'PROHIBIDO TODO VUELO. AUTORIZACIÓN ESPECIAL DIRCORA.',
      operatingHours: 'H24',
      authority: 'DIRCORA / MININTER',
      remarks: 'Área de seguridad Congreso de la República',
      color: '#FF0000',
    },
    {
      designator: 'PSP-03',
      name: 'ZONA PROHIBIDA BASE NAVAL CALLAO',
      type: 'PROHIBITED',
      status: 'ACTIVO',
      centerLat: -12.0560,
      centerLon: -77.1480,
      lowerLimit: 'GND',
      upperLimit: 'FL150',
      lowerLimitFt: 0,
      upperLimitFt: 15000,
      radius: 3,
      restrictions: 'PROHIBIDO TODO VUELO SIN AUTORIZACIÓN MARINA DE GUERRA.',
      operatingHours: 'H24',
      authority: 'MARINA DE GUERRA / DIRCORA',
      remarks: 'Base Naval del Callao - Prohibida sobrevolar',
      color: '#FF0000',
    },

    // ── Restricted Areas ─────────────────────────────────────────
    {
      designator: 'RSP-01',
      name: 'ZONA RESTRINGIDA GOBIERNO LIMA',
      type: 'RESTRICTED',
      status: 'ACTIVO',
      centerLat: -12.0500,
      centerLon: -77.0350,
      lowerLimit: 'GND',
      upperLimit: 'FL200',
      lowerLimitFt: 0,
      upperLimitFt: 20000,
      radius: 5,
      restrictions: 'RESTRINGIDO. VUELO SUJETO A AUTORIZACIÓN DIRCORA.',
      operatingHours: 'H24',
      authority: 'DIRCORA',
      remarks: 'Zona de seguridad gubernamental de Lima',
      color: '#FF6600',
    },
    {
      designator: 'RSP-02',
      name: 'ZONA RESTRINGIDA FUERZA AEREA LA JOYA',
      type: 'RESTRICTED',
      status: 'ACTIVO',
      centerLat: -16.6800,
      centerLon: -71.8300,
      lowerLimit: 'GND',
      upperLimit: 'FL250',
      lowerLimitFt: 0,
      upperLimitFt: 25000,
      radius: 15,
      restrictions: 'RESTRINGIDO. ACTIVIDAD MILITAR FAP. AUTORIZACIÓN REQUERIDA.',
      operatingHours: 'H24',
      authority: 'FUERZA AEREA DEL PERU / DIRCORA',
      remarks: 'Base Aérea La Joya - Arequipa. Actividad militar frecuente.',
      color: '#FF6600',
    },
    {
      designator: 'RSP-03',
      name: 'ZONA RESTRINGIDA FUERZA AEREA VITOR',
      type: 'RESTRICTED',
      status: 'ACTIVO',
      centerLat: -16.9500,
      centerLon: -72.0000,
      lowerLimit: 'GND',
      upperLimit: 'FL180',
      lowerLimitFt: 0,
      upperLimitFt: 18000,
      radius: 10,
      restrictions: 'RESTRINGIDO. ZONA DE ENTRENAMIENTO MILITAR.',
      operatingHours: 'SR-SS',
      authority: 'FUERZA AEREA DEL PERU / DIRCORA',
      remarks: 'Campo de tiro Vitor - Arequipa',
      color: '#FF6600',
    },
    {
      designator: 'RSP-04',
      name: 'ZONA RESTRINGIDA BASE AEREA LAS PALMAS',
      type: 'RESTRICTED',
      status: 'ACTIVO',
      centerLat: -12.0500,
      centerLon: -77.0333,
      lowerLimit: 'GND',
      upperLimit: 'FL150',
      lowerLimitFt: 0,
      upperLimitFt: 15000,
      radius: 4,
      restrictions: 'RESTRINGIDO. OPERACIONES MILITARES FAP.',
      operatingHours: 'H24',
      authority: 'FUERZA AEREA DEL PERU / DIRCORA',
      remarks: 'Base Aérea Las Palmas - Surco, Lima',
      color: '#FF6600',
    },
    {
      designator: 'RSP-05',
      name: 'ZONA RESTRINGIDA CENTRO NUCLEAR HUARANGAL',
      type: 'RESTRICTED',
      status: 'ACTIVO',
      centerLat: -12.2833,
      centerLon: -76.8333,
      lowerLimit: 'GND',
      upperLimit: 'FL100',
      lowerLimitFt: 0,
      upperLimitFt: 10000,
      radius: 3,
      restrictions: 'RESTRINGIDO. PROHIBIDO SOBREVUELO SIN AUTORIZACIÓN IPEN.',
      operatingHours: 'H24',
      authority: 'IPEN / DIRCORA',
      remarks: 'Centro Nuclear Oscar Miro Quesada - Huarangal',
      color: '#FF6600',
    },

    // ── Danger Areas ─────────────────────────────────────────────
    {
      designator: 'DSP-01',
      name: 'ZONA DE PELIGRO PARACAS',
      type: 'DANGER',
      status: 'ACTIVO',
      centerLat: -13.8500,
      centerLon: -76.2667,
      lowerLimit: 'GND',
      upperLimit: 'FL050',
      lowerLimitFt: 0,
      upperLimitFt: 5000,
      radius: 8,
      restrictions: 'PELIGRO. ACTIVIDAD DE ARTIFICIOS Y PRUEBAS MILITARES.',
      operatingHours: 'SR-SS',
      authority: 'MARINA DE GUERRA / DIRCORA',
      remarks: 'Base Naval Paracas - Pruebas de artificios',
      color: '#FFCC00',
    },
    {
      designator: 'DSP-02',
      name: 'ZONA DE PELIGRO PUNTA LOBOS',
      type: 'DANGER',
      status: 'ACTIVO',
      centerLat: -13.0000,
      centerLon: -76.5000,
      lowerLimit: 'GND',
      upperLimit: 'FL250',
      lowerLimitFt: 0,
      upperLimitFt: 25000,
      radius: 12,
      restrictions: 'PELIGRO. LANZAMIENTO DE COHETES Y ACTIVIDAD ESPACIAL.',
      operatingHours: 'NOTAM',
      authority: 'CONIDA / DIRCORA',
      remarks: 'Centro de lanzamiento Punta Lobos - Actividad espacial',
      color: '#FFCC00',
    },
    {
      designator: 'DSP-03',
      name: 'ZONA DE PELIGRO LA JOYA',
      type: 'DANGER',
      status: 'ACTIVO',
      centerLat: -16.7300,
      centerLon: -71.7800,
      lowerLimit: 'SFC',
      upperLimit: 'FL550',
      lowerLimitFt: 0,
      upperLimitFt: 55000,
      radius: 20,
      restrictions: 'PELIGRO. CAMPO DE TIRO Y BOMBARDEO ACTIVO.',
      operatingHours: 'NOTAM',
      authority: 'FUERZA AEREA DEL PERU / DIRCORA',
      remarks: 'Campo de tiro y bombardeo La Joya - Arequipa',
      color: '#FFCC00',
    },
    {
      designator: 'DSP-04',
      name: 'ZONA DE PELIGRO CERRO VERDE',
      type: 'DANGER',
      status: 'ACTIVO',
      centerLat: -16.5333,
      centerLon: -71.6167,
      lowerLimit: 'SFC',
      upperLimit: 'FL200',
      lowerLimitFt: 0,
      upperLimitFt: 20000,
      radius: 6,
      restrictions: 'PELIGRO. ACTIVIDAD MINERA EXPLOSIVOS.',
      operatingHours: 'H24',
      authority: 'MINEM / DIRCORA',
      remarks: 'Zona minera Cerro Verde - voladuras frecuentes',
      color: '#FFCC00',
    },

    // ── TMA / CTA / CTR ──────────────────────────────────────────
    {
      designator: 'TMA LIMA',
      name: 'TMA LIMA',
      type: 'TMA',
      status: 'ACTIVO',
      centerLat: -12.0033,
      centerLon: -77.1133,
      lowerLimit: 'FL045',
      upperLimit: 'FL245',
      lowerLimitFt: 4500,
      upperLimitFt: 24500,
      polygon: JSON.stringify([
        { lat: -11.5, lon: -77.5 },
        { lat: -11.5, lon: -76.5 },
        { lat: -12.0, lon: -76.2 },
        { lat: -12.8, lon: -76.5 },
        { lat: -12.8, lon: -77.5 },
        { lat: -12.0, lon: -78.0 },
      ]),
      radius: null,
      restrictions: 'ÁREA DE CONTROL TERMINAL. CONTACTO APP LIMA REQUERIDO.',
      operatingHours: 'H24',
      authority: 'CORPAC',
      remarks: 'Terminal Control Area Lima - Clase C',
      color: '#0066FF',
    },
    {
      designator: 'CTR LIMA',
      name: 'CTR LIMA',
      type: 'CTR',
      status: 'ACTIVO',
      centerLat: -12.0033,
      centerLon: -77.1133,
      lowerLimit: 'GND',
      upperLimit: 'FL045',
      lowerLimitFt: 0,
      upperLimitFt: 4500,
      polygon: JSON.stringify([
        { lat: -11.9, lon: -77.2 },
        { lat: -11.9, lon: -77.0 },
        { lat: -12.1, lon: -77.0 },
        { lat: -12.1, lon: -77.2 },
      ]),
      radius: null,
      restrictions: 'ZONA DE CONTROL. AUTORIZACIÓN ATC REQUERIDA.',
      operatingHours: 'H24',
      authority: 'CORPAC',
      remarks: 'Control Zone Lima - Clase C',
      color: '#0099FF',
    },
    {
      designator: 'TMA CUSCO',
      name: 'TMA CUSCO',
      type: 'TMA',
      status: 'ACTIVO',
      centerLat: -13.5372,
      centerLon: -71.9467,
      lowerLimit: 'FL085',
      upperLimit: 'FL245',
      lowerLimitFt: 8500,
      upperLimitFt: 24500,
      polygon: JSON.stringify([
        { lat: -13.0, lon: -72.5 },
        { lat: -13.0, lon: -71.3 },
        { lat: -14.0, lon: -71.3 },
        { lat: -14.0, lon: -72.5 },
      ]),
      radius: null,
      restrictions: 'ÁREA DE CONTROL TERMINAL. CONTACTO APP CUSCO REQUERIDO.',
      operatingHours: 'SR-SS',
      authority: 'CORPAC',
      remarks: 'Terminal Control Area Cusco - Clase D',
      color: '#0066FF',
    },
    {
      designator: 'CTR CUSCO',
      name: 'CTR CUSCO',
      type: 'CTR',
      status: 'ACTIVO',
      centerLat: -13.5372,
      centerLon: -71.9467,
      lowerLimit: 'GND',
      upperLimit: 'FL085',
      lowerLimitFt: 0,
      upperLimitFt: 8500,
      polygon: JSON.stringify([
        { lat: -13.45, lon: -72.05 },
        { lat: -13.45, lon: -71.85 },
        { lat: -13.63, lon: -71.85 },
        { lat: -13.63, lon: -72.05 },
      ]),
      radius: null,
      restrictions: 'ZONA DE CONTROL. AUTORIZACIÓN ATC REQUERIDA.',
      operatingHours: 'SR-SS',
      authority: 'CORPAC',
      remarks: 'Control Zone Cusco - Clase D',
      color: '#0099FF',
    },
    {
      designator: 'CTA AREQUIPA',
      name: 'CTA AREQUIPA',
      type: 'CTA',
      status: 'ACTIVO',
      centerLat: -16.3433,
      centerLon: -71.5833,
      lowerLimit: 'FL065',
      upperLimit: 'FL245',
      lowerLimitFt: 6500,
      upperLimitFt: 24500,
      polygon: JSON.stringify([
        { lat: -15.8, lon: -72.2 },
        { lat: -15.8, lon: -71.0 },
        { lat: -16.8, lon: -71.0 },
        { lat: -16.8, lon: -72.2 },
      ]),
      radius: null,
      restrictions: 'ÁREA DE CONTROL. CONTACTO APP AREQUIPA REQUERIDO.',
      operatingHours: 'H24',
      authority: 'CORPAC',
      remarks: 'Control Area Arequipa - Clase D',
      color: '#0066CC',
    },
  ]

  // ════════════════════════════════════════════════════════════════
  // 3. Supplements (10 entries)
  // ════════════════════════════════════════════════════════════════

  const supplements = [
    {
      supNumber: 'SUP 001/2025',
      title: 'CAMBIO DE FRECUENCIA TWR AEROPUERTO JORGE CHAVEZ',
      category: 'AD',
      effectiveFrom: daysAgo(5),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Se informa que a partir de la fecha la frecuencia de TWR del Aeropuerto Internacional Jorge Chávez cambia de 118.3 MHz a 118.5 MHz de forma permanente. Pilotos deben verificar frecuencia en cartas actualizadas.',
      airportId: airportMap.get('SPJC') ?? null,
      fileUrl: '/supplements/SUP-001-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 002/2025',
      title: 'NUEVA CARTA SID RWY 16 SPJC',
      category: 'AD',
      effectiveFrom: daysAgo(3),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Publicación de nueva carta SID RWY 16 para Aeropuerto Internacional Jorge Chávez. Procedimiento ISKAR 1A modificado con nuevo waypoint de salida. Cancela procedimiento anterior.',
      airportId: airportMap.get('SPJC') ?? null,
      fileUrl: '/supplements/SUP-002-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 003/2025',
      title: 'MODIFICACION AEROVIA UB673',
      category: 'ENR',
      effectiveFrom: daysAgo(2),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Modificación de la aerovía UB673 entre waypoints LIM y CUZ. Nuevo recorrido ajustado por restricción de espacio aéreo. Nivel mínimo de vuelo FL180 entre ISKAR y CUZ.',
      airportId: null,
      fileUrl: '/supplements/SUP-003-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 004/2025',
      title: 'NUEVO WAYPOINT ESKAL',
      category: 'ENR',
      effectiveFrom: daysAgo(1),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Se establece nuevo waypoint ESKAL en posición 10°00\'00.00"S / 076°30\'00.00"W para uso en procedimientos SID/STAR del TMA Lima. El waypoint será utilizado en las cartas actualizadas.',
      airportId: null,
      fileUrl: '/supplements/SUP-004-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 005/2025',
      title: 'CLAUSURA TEMPORAL AD SPSO',
      category: 'AD',
      effectiveFrom: daysAgo(0),
      effectiveTo: daysFromNow(15),
      isPermanent: false,
      description:
        'Clausura temporal del Aeropuerto de Pisco por trabajos de mantenimiento en pista de aterrizaje. Se espera reapertura en 15 días. Tráfico desviado a SPJC.',
      airportId: airportMap.get('SPSO') ?? null,
      fileUrl: '/supplements/SUP-005-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 006/2025',
      title: 'ACTUALIZACION DATOS AD SPQU',
      category: 'AD',
      effectiveFrom: daysAgo(4),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Actualización de datos del Aeropuerto Internacional Rodríguez Ballón de Arequipa. Modificación de elevación de umbral RWY 11 y datos de PAPI. Nueva elevación de umbral: 2562 m.',
      airportId: airportMap.get('SPQU') ?? null,
      fileUrl: '/supplements/SUP-006-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 007/2025',
      title: 'NUEVA FRECUENCIA APP SPZO',
      category: 'AD',
      effectiveFrom: daysAgo(2),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Se establece nueva frecuencia de aproximación del Aeropuerto Internacional Alejandro Velasco Astete de Cusco: 119.3 MHz (anterior 120.5 MHz). Modificación permanente.',
      airportId: airportMap.get('SPZO') ?? null,
      fileUrl: '/supplements/SUP-007-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 008/2025',
      title: 'RESTRICCION ESPACIO AEREO LIMA',
      category: 'ENR',
      effectiveFrom: daysAgo(1),
      effectiveTo: daysFromNow(30),
      isPermanent: false,
      description:
        'Restricción temporal del espacio aéreo en el TMA Lima por actividades de Estado. Área restringida 10 NM radio SPJC FL050-FL200. Coordinar con Lima ACC para autorizaciones.',
      airportId: null,
      fileUrl: '/supplements/SUP-008-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 009/2025',
      title: 'MODIFICACION PROCEDIMIENTO ILS RWY 16 SPJC',
      category: 'AD',
      effectiveFrom: daysAgo(0),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Modificación del procedimiento ILS RWY 16 del Aeropuerto Internacional Jorge Chávez. Nuevas alturas de paso en FAF y MAPt. DA cambiada a 200 ft. Cancela procedimiento anterior.',
      airportId: airportMap.get('SPJC') ?? null,
      fileUrl: '/supplements/SUP-009-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
    {
      supNumber: 'SUP 010/2025',
      title: 'NUEVOS DATOS PLATAFORMA AD SPCL',
      category: 'AD',
      effectiveFrom: daysAgo(3),
      effectiveTo: null,
      isPermanent: true,
      description:
        'Actualización de datos de plataforma del Aeropuerto Internacional Cap. FAP David Abensur Rengifo de Pucallpa. Nuevas posiciones de estacionamiento y datos de TWY A extendida.',
      airportId: airportMap.get('SPCL') ?? null,
      fileUrl: '/supplements/SUP-010-2025.pdf',
      status: 'VIGENTE',
      publishedBy: 'CORPAC AIS',
    },
  ]

  // ════════════════════════════════════════════════════════════════
  // SEED: Insert all data
  // ════════════════════════════════════════════════════════════════

  // ── NOTAMs ─────────────────────────────────────────────────────
  console.log('📝 Seeding NOTAMs...')
  let notamCount = 0
  for (const notam of notams) {
    try {
      await prisma.notam.upsert({
        where: { notamId: notam.notamId },
        update: notam,
        create: notam,
      })
      notamCount++
    } catch (e: any) {
      console.error(`  ❌ Error seeding NOTAM ${notam.notamId}: ${e.message}`)
    }
  }
  console.log(`  ✅ Seeded ${notamCount} NOTAMs\n`)

  // ── Airspace Restrictions ──────────────────────────────────────
  console.log('🛡️  Seeding Airspace Restrictions...')
  let airspaceCount = 0
  for (const ar of airspaceRestrictions) {
    try {
      await prisma.airspaceRestriction.upsert({
        where: { designator: ar.designator },
        update: ar,
        create: ar,
      })
      airspaceCount++
    } catch (e: any) {
      console.error(`  ❌ Error seeding ${ar.designator}: ${e.message}`)
    }
  }
  console.log(`  ✅ Seeded ${airspaceCount} Airspace Restrictions\n`)

  // ── Supplements ────────────────────────────────────────────────
  console.log('📄 Seeding Supplements...')
  let supCount = 0
  for (const sup of supplements) {
    try {
      // Upsert by supNumber (not unique in schema, so use create with skipDuplicates approach)
      const existing = await prisma.supplement.findFirst({
        where: { supNumber: sup.supNumber },
      })
      if (existing) {
        await prisma.supplement.update({
          where: { id: existing.id },
          data: sup,
        })
      } else {
        await prisma.supplement.create({ data: sup })
      }
      supCount++
    } catch (e: any) {
      console.error(`  ❌ Error seeding ${sup.supNumber}: ${e.message}`)
    }
  }
  console.log(`  ✅ Seeded ${supCount} Supplements\n`)

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════')
  console.log('📊 SEED SUMMARY')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  NOTAMs:                ${notamCount}`)
  console.log(`  Airspace Restrictions: ${airspaceCount}`)
  console.log(`  Supplements:           ${supCount}`)
  console.log('═══════════════════════════════════════════════════')

  // ── Breakdown by type ──────────────────────────────────────────
  const notamByScope = await prisma.notam.groupBy({ by: ['scope'], _count: true })
  const notamByPriority = await prisma.notam.groupBy({ by: ['priority'], _count: true })
  const airspaceByType = await prisma.airspaceRestriction.groupBy({ by: ['type'], _count: true })
  const supByCategory = await prisma.supplement.groupBy({ by: ['category'], _count: true })

  console.log('\n📝 NOTAMs by Scope:')
  for (const s of notamByScope) {
    console.log(`  ${s.scope}: ${s._count}`)
  }
  console.log('\n📝 NOTAMs by Priority:')
  for (const p of notamByPriority) {
    console.log(`  ${p.priority}: ${p._count}`)
  }
  console.log('\n🛡️  Airspace Restrictions by Type:')
  for (const t of airspaceByType) {
    console.log(`  ${t.type}: ${t._count}`)
  }
  console.log('\n📄 Supplements by Category:')
  for (const c of supByCategory) {
    console.log(`  ${c.category}: ${c._count}`)
  }

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
