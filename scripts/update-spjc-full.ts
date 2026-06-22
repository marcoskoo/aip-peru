import { db } from '@/lib/db'

// Datos oficiales extraídos del PDF AD_2_SPJC-LIMA.pdf (AIP Perú, AMDT 30/22)
// Secciones: AD 2 SPJC 10 (Obstáculos), AD 2 SPJC 7 (Servicios ATS),
// AD 2 SPJC 6 (Plataforma), AD 2 SPJC 3.2 (Combustibles)
async function main() {
  const airport = await db.airport.findUnique({ where: { icaoCode: 'SPJC' } })
  if (!airport) {
    console.log('✗ SPJC no existe. Ejecuta primero scripts/seed-spjc.ts')
    process.exit(1)
  }

  console.log(`SPJC id: ${airport.id}`)
  console.log('')

  // ─── 1. OBSTÁCULOS (39 obstáculos del PDF) ───────────────────────────
  console.log('─ 1. OBSTÁCULOS ─')
  const existingObstacles = await db.obstacle.count({ where: { airportId: airport.id } })
  if (existingObstacles > 0) {
    console.log(`  Ya existen ${existingObstacles} obstáculos, eliminando...`)
    await db.obstacle.deleteMany({ where: { airportId: airport.id } })
  }

  const obstacles = [
    // RWY 16 (área de aproximación y despegue)
    { runwayArea: 'RWY 16', obstacleType: 'Edificio', elevation: '26.15 m / 85.80 ft', markingLighting: 'LGT', coordinates: "12°02'49.58\"S / 077°05'52.15\"W", remarks: 'NIL' },
    { runwayArea: 'RWY 16', obstacleType: 'Cerro La Regla', elevation: '106.68 m / 350 ft', markingLighting: 'LGT U/S', coordinates: "11°59'29\"S / 077°07'12\"W", remarks: 'NIL' },
    { runwayArea: 'RWY 16', obstacleType: 'Antena de Telecomunicación', elevation: '45.47 m / 149.18 ft', markingLighting: 'NIL', coordinates: "11°59'39.477\"S / 077°07'24.837\"W", remarks: 'NIL' },
    // RWY 34 (área de aproximación y despegue) - 36 obstáculos
    { runwayArea: 'RWY 34', obstacleType: 'Pozo de agua', elevation: '74.94 m / 245.87 ft', markingLighting: 'NIL', coordinates: "12°03'22.717\"S / 077°06'11.865\"W", remarks: 'Calle 2B Mz K Lote 23 Ciudad del Pescador, distrito Bellavista.' },
    { runwayArea: 'RWY 34', obstacleType: 'Pozo de agua', elevation: '74.7 m / 245.08 ft', markingLighting: 'NIL', coordinates: "12°03'33.648\"S / 077°06'22.132\"W", remarks: 'Pque José Olaya, Ciudad del Pescador, Bellavista (alt.cdra 12 Av. Insurgentes con Calle Juan Velasco).' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '78.09 m / 256.2 ft', markingLighting: 'NIL', coordinates: "12°04'15.548\"S / 077°05'55.781\"W", remarks: 'Av. Elmer Faucett 243, Urbanización Maranga, distrito de San Miguel.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '73.15 m / 239.99 ft', markingLighting: 'NIL', coordinates: "12°04'16.229\"S / 077°05'56.019\"W", remarks: 'Av. Elmer Faucett 233 - 235 - 237, Urbanización Maranga, distrito de San Miguel.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '82.95 m / 272.15 ft', markingLighting: 'NIL', coordinates: "12°04'10.978\"S / 077°05'32.708\"W", remarks: 'Av. Precursores 440 - 460 Torre A y B, Condomin. Jardines de Maranga, San Miguel.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '79.47 m / 260.73 ft', markingLighting: 'NIL', coordinates: "12°02'49.912\"S / 077°06'48.772\"W", remarks: 'Av. Argentina 3093, distrito del Callao (en playa de estacionamiento de C. C. Minka).' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '67.95 m / 222.93 ft', markingLighting: 'NIL', coordinates: "12°02'58.367\"S / 077°06'15.138\"W", remarks: 'Calle Jaspampa A2, Urbanización Pedro Ruiz Gallo, distrito Callao.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '81.48 m / 267.32 ft', markingLighting: 'NIL', coordinates: "12°02'50.201\"S / 077°05'52.151\"W", remarks: 'Calle Jaspampa A2, Urbanización Pedro Ruiz Gallo, distrito Callao.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '68.28 m / 224.02 ft', markingLighting: 'NIL', coordinates: "12°02'41.97\"S / 077°05'54.475\"W", remarks: 'Av. Elmer Faucett cuadra 6, distrito de Carmen de la Legua Reynoso.' },
    { runwayArea: 'RWY 34', obstacleType: 'Pozo de agua', elevation: '67.57 m / 221.69 ft', markingLighting: 'NIL', coordinates: "12°02'36.607\"S / 077°06'2.366\"W", remarks: 'Parque Lajan, Urbanización Dulanto, distrito Callao.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '82.66 m / 271.19 ft', markingLighting: 'NIL', coordinates: "12°02'38.758\"S / 077°05'57.491\"W", remarks: 'Av. Elmer Faucett S/N (Colegio Politécnico Nacional del Callao), distrito Callao.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '72.3 m / 237.2 ft', markingLighting: 'NIL', coordinates: "12°02'43.441\"S / 077°05'57.891\"W", remarks: 'Av. La Chalaca Mz. E Lote 14, Urbanización Dulanto, distrito Callao.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '98.74 m / 323.95 ft', markingLighting: 'NIL', coordinates: "12°04'34.598\"S / 077°05'47.35\"W", remarks: 'Avenida La Marina cuadra nro. 30 - distrito de San Miguel.' },
    { runwayArea: 'RWY 34', obstacleType: 'Antena de Telecomunicación', elevation: '78.99 m / 259.15 ft', markingLighting: 'NIL', coordinates: "12°04'18.056\"S / 077°06'36.512\"W", remarks: 'Av. La Marina cuadra nro. 30 - distrito de San Miguel.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '48.6 m / 159.45 ft', markingLighting: 'NIL', coordinates: "12°02'31.105\"S / 077°06'13.741\"W", remarks: 'Bloque en Mz. 5L con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '48.82 m / 160.17 ft', markingLighting: 'NIL', coordinates: "12°02'31.046\"S / 077°06'13.788\"W", remarks: 'Bloque en Mz. 6L con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '51.02 m / 167.39 ft', markingLighting: 'NIL', coordinates: "12°02'33.311\"S / 077°06'07.813\"W", remarks: 'Fachada de mayólica color guinda, frente a colegio César Vallejo en el Jirón Tumbes.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '51.17 m / 167.88 ft', markingLighting: 'NIL', coordinates: "12°02'33.411\"S / 077°06'07.804\"W", remarks: 'Fachada de mayólica color guinda, frente a colegio César Vallejo en el Jirón Tumbes.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.24 m / 154.99 ft', markingLighting: 'NIL', coordinates: "12°02'30.945\"S / 077°06'16.694\"W", remarks: 'Bloque Calle 01 AAHH Todos Unidos.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.68 m / 156.43 ft', markingLighting: 'NIL', coordinates: "12°02'30.237\"S / 077°06'14.695\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '44.51 m / 146.03 ft', markingLighting: 'NIL', coordinates: "12°02'26.15\"S / 077°06'16.251\"W", remarks: 'Terreno Elevado en la Av. Morales Duarez Frente AA.HH Todos Unidos.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.31 m / 155.22 ft', markingLighting: 'NIL', coordinates: "12°02'30.819\"S / 077°06'16.701\"W", remarks: 'Bloque Calle 01 AAHH Todos Unidos.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '46.91 m / 153.9 ft', markingLighting: 'NIL', coordinates: "12°02'30.653\"S / 077°06'16.665\"W", remarks: 'Bloque Calle 01 AAHH Todos Unidos.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.05 m / 154.36 ft', markingLighting: 'NIL', coordinates: "12°02'31.137\"S / 077°06'16.865\"W", remarks: 'Bloque Calle 01 AAHH Todos Unidos.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '48.58 m / 159.38 ft', markingLighting: 'NIL', coordinates: "12°02'30.504\"S / 077°06'14.809\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '48.53 m / 159.22 ft', markingLighting: 'NIL', coordinates: "12°02'30.233\"S / 077°06'14.82\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.76 m / 156.69 ft', markingLighting: 'NIL', coordinates: "12°02'30.134\"S / 077°06'14.848\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.83 m / 156.92 ft', markingLighting: 'NIL', coordinates: "12°02'30.147\"S / 077°06'14.734\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.87 m / 157.05 ft', markingLighting: 'NIL', coordinates: "12°02'31.141\"S / 077°06'14.666\"W", remarks: 'Bloque Pasaje Palpa con Morales Duarez.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '47.95 m / 157.32 ft', markingLighting: 'NIL', coordinates: "12°02'31.231\"S / 077°06'14.626\"W", remarks: 'Bloque Pasaje Palpa.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '49.99 m / 164.01 ft', markingLighting: 'NIL', coordinates: "12°02'31.961\"S / 077°06'14.577\"W", remarks: 'Bloque 2da cuadra frente al mercado.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '48.69 m / 159.74 ft', markingLighting: 'NIL', coordinates: "12°02'32.571\"S / 077°06'13.591\"W", remarks: 'Fachada color blanco a media cuadra del Pasaje Palpa.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '50.84 m / 166.8 ft', markingLighting: 'NIL', coordinates: "12°02'35.015\"S / 077°06'12.236\"W", remarks: 'Bloque 2da cuadra frente al mercado.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '49.62 m / 162.8 ft', markingLighting: 'NIL', coordinates: "12°02'33.716\"S / 077°06'12.496\"W", remarks: 'Bloque 3ra cuadra frente al mercado.' },
    { runwayArea: 'RWY 34', obstacleType: 'Edificio', elevation: '50.08 m / 164.3 ft', markingLighting: 'NIL', coordinates: "12°02'33.583\"S / 077°06'12.337\"W", remarks: 'Bloque 3ra cuadra frente al mercado.' },
    { runwayArea: 'RWY 34', obstacleType: 'Pozo de agua', elevation: '71.93 m / 235.99 ft', markingLighting: 'NIL', coordinates: "12°03'08.411\"S / 077°06'0.966\"W", remarks: 'Parque Castilla.' },
    { runwayArea: 'RWY 34', obstacleType: 'Publicidad', elevation: '74.09 m / 243.08 ft', markingLighting: 'NIL', coordinates: "12°03'08.535\"S / 077°05'52.557\"W", remarks: 'Av. Pablo de Olavide y Av. Elmer Faucett.' },
    { runwayArea: 'RWY 34', obstacleType: 'Publicidad', elevation: '69.6 m / 228.35 ft', markingLighting: 'NIL', coordinates: "12°02'56.404\"S / 077°05'54.363\"W", remarks: 'Av. Elmer Faucett y Av. Argentina.' },
    { runwayArea: 'RWY 34', obstacleType: 'Publicidad', elevation: '69.88 m / 229.27 ft', markingLighting: 'NIL', coordinates: "12°02'56.405\"S / 077°05'54.187\"W", remarks: 'Av. Elmer Faucett y Av. Argentina.' },
  ]

  for (const obs of obstacles) {
    await db.obstacle.create({
      data: { airportId: airport.id, ...obs },
    })
  }
  console.log(`  ✓ ${obstacles.length} obstáculos creados (3 RWY 16 + 36 RWY 34)`)
  console.log('')

  // ─── 2. COMUNICACIONES ATS (13 servicios del PDF) ──────────────────
  console.log('─ 2. COMUNICACIONES ATS ─')
  const existingComms = await db.communication.count({ where: { airportId: airport.id } })
  if (existingComms > 0) {
    console.log(`  Ya existen ${existingComms} comunicaciones, eliminando...`)
    await db.communication.deleteMany({ where: { airportId: airport.id } })
  }

  const communications = [
    { service: 'APP', callsign: 'LIMA RADAR', frequency: '119.7 MHz', hours: 'h24', remarks: 'ALTERNA 126.6 MHz' },
    { service: 'RADAR', callsign: 'NOR - UNO RADAR', frequency: '119.5 MHz', hours: 'h24', remarks: 'ALTERNA 133.9 MHz' },
    { service: 'RADAR', callsign: 'SUR - UNO RADAR', frequency: '135.0 MHz', hours: 'h24', remarks: 'ALTERNA 119.1 MHz' },
    { service: 'ACC', callsign: 'NOR - DOS RADAR', frequency: '128.1 MHz', hours: 'h24', remarks: 'ALTERNA 124.3 MHz' },
    { service: 'ACC', callsign: 'ORIENTE RADAR', frequency: '128.5 MHz', hours: 'h24', remarks: 'ALTERNA 133.1 MHz' },
    { service: 'ACC', callsign: 'SUR - DOS RADAR', frequency: '128.8 MHz', hours: 'h24', remarks: 'ALTERNA 124.75 MHz' },
    { service: 'G/A/G', callsign: 'LIMA RADIO', frequency: '6649 KHz / 10024 KHz', hours: 'h24', remarks: 'NIL' },
    { service: 'TWR', callsign: 'LIMA TORRE', frequency: '118.1 MHz', hours: 'h24', remarks: 'ALTERNA 126.9 MHz' },
    { service: 'SMC', callsign: 'LIMA SUPERFICIE', frequency: '121.9 MHz', hours: 'h24', remarks: 'ALTERNA 127.3 MHz' },
    { service: 'SMC', callsign: 'LIMA AUTORIZACIÓN', frequency: '118.5 MHz', hours: 'h24', remarks: 'NIL' },
    { service: 'ATIS', callsign: 'Aeropuerto Jorge Chávez Lima - Callao', frequency: '127.9 MHz', hours: 'h24', remarks: 'Información MET para ARR/DEP' },
    { service: 'EMERGENCIA', callsign: 'NIL', frequency: '121.5 MHz', hours: 'h24', remarks: 'NIL' },
  ]

  for (const c of communications) {
    await db.communication.create({
      data: { airportId: airport.id, ...c },
    })
  }
  console.log(`  ✓ ${communications.length} comunicaciones ATS creadas`)
  console.log('')

  // ─── 3. ACTUALIZAR CAMPOS DE PLATAFORMA Y SERVICIOS EN AIRPORT ─────
  console.log('─ 3. PLATAFORMA Y SERVICIOS (campos Airport) ─')

  // Plataforma y calles de rodaje (sección AD 2 SPJC 9 del PDF)
  const platformData = JSON.stringify({
    pavimento: 'Concreto',
    dimensiones: 'Plataforma principal con posiciones de contacto',
    posicionesContacto: 'Sistema visual de guía de atraque (ADS)',
    descripcion: 'Plataforma provista con sistema ADS para guía visual de atraque en posiciones de contacto',
  })

  const taxiwayData = JSON.stringify({
    ancho: '23 m aprox',
    superficie: 'Asfalto/Concreto',
    resistencia: 'TWY A: PCN 56/R/A/W/T, TWY B: PCN 65/R/C/W/U',
    calles: 'A, C, D, G y F (con luces de eje)',
    lucesBorde: 'Todas las TWY',
    lucesEje: 'Calles A, C, D, G y F',
    leadOn: 'Calle ALFA Pista 16',
    stopBars: 'Barras de parada en punto de espera RWY 16 y RWY 34',
    observaciones: 'Tiempo de conmutación fuente auxiliar: 2 s (pista) / 15 s (resto)',
  })

  const checkpointData = JSON.stringify({
    descripcion: 'Puntos de verificación de altimetría provistos',
    emplazamientoAnemometro: '390 m de THR 16 y THR 34, LGTD',
  })

  const surfaceGuidance = JSON.stringify({
    usoSenales: 'Señales de guía de rodaje en todas las intersecciones TWY/RWY y puntos de espera',
    lineasGuia: 'Líneas de guía en plataforma',
    guiaVisual: 'Sistema visual de guía de atraque (ADS) en posiciones de contacto',
  })

  // Servicios de escala (sección AD 2 SPJC 4)
  const cargoHandlingFacilities =
    'Todas las instalaciones modernas que permiten manipular cargas sin limitaciones, proporcionado por compañías particulares (SEAS - Servicios Especializados Aeroportuarios).'

  const refuelingFacilities = JSON.stringify({
    instalacion: 'En plataforma',
    capacidad: 'Sin limitaciones',
    combustibles: 'Turbo A1, 100LL',
    operador: 'Compañías particulares',
  })

  // Espacios aéreos ATS (sección AD 2 SPJC 17 del PDF)
  const platformRemarks =
    'ATZ: Círculo de 5 NM radio centrado ARP (1500 ft AMSL). CTR: 5 NM a cada lado del eje de pista (3000 ft AMSL), excluye zona SPR91 Las Palmas. Clasificación D. Altitud de transición: 10000 ft. Idiomas: ES/EN.'

  // Pasajeros (sección AD 2 SPJC 5)
  const hotels =
    '01 hotel con capacidad de 192 habitaciones frente al terminal (alojamiento, restaurante, cafetería, spa, bar, sala de reuniones)'
  const restaurants =
    'Locales de comidas y bebidas en: Patio de comidas (2do Nivel del Terminal), Salidas Internacionales, Salidas Nacionales y Mezzanine'
  const transport =
    'Empresas de transporte terrestre en llegadas nacionales e internacionales: Taxi ejecutivo (VIP), Taxi regular, rent a car y Bus'
  const medicalFacilities = 'Primeros auxilios en el AD y hospitales en la ciudad'
  const bankingPost =
    '01 Oficina bancaria y 06 puestos de cambio de divisas. Oficina de correo en mezzanine norte'
  const tourismOffice = 'En el AD y la ciudad'

  // Hangares y mantenimiento
  const hangarSpace = 'NIL (aviones visitantes)'
  const repairFacilities = 'Servicio proporcionado por compañías particulares'
  const deIcingFacilities = 'NIL'

  // Información meteorológica (sección AD 2 SPJC 11 del PDF)
  const metOffice = 'SPJC OMA/OVM'
  const metDocumentation =
    'Mapas, Pronóstico, observaciones e informes MET (productos WAFS)'
  const metSupplementary =
    'Banco de datos OPMET IMS CADAS, terminal AMHS CADAS, Banco de Datos alterno OPMET WAFS, Internet'
  const metAdditionalInfo = 'NIL'

  const updated = await db.airport.update({
    where: { icaoCode: 'SPJC' },
    data: {
      // Plataforma
      platformData,
      taxiwayData,
      checkpointData,
      platformRemarks,
      surfaceGuidance,
      runwaySigns:
        'Designación, THR, TDZ, eje y borde de pista. Bordes THR, eje para RWY 16 y extremos iluminados',
      taxiwaySigns: 'Puntos de espera en todas las intersecciones TWY/RWY, bordes iluminados',
      stopBars: 'Barras de parada en punto de espera RWY 16 y RWY 34',
      guidanceRemarks: 'Ver Manual AD',

      // Servicios de escala
      cargoHandlingFacilities,
      fuelTypes: 'Turbo A1, 100LL',
      lubricantTypes: 'NIL',
      refuelingFacilities,
      deIcingFacilities,
      hangarSpace,
      repairFacilities,
      scaleRemarks: 'NIL',

      // Pasajeros
      hotels,
      restaurants,
      transport,
      medicalFacilities,
      bankingPost,
      tourismOffice,
      passengerRemarks: 'NIL',

      // Meteorológica
      metOffice,
      metHours: 'h24',
      metForecastOffice: 'OMA/SPJC',
      metValidity: '24 h',
      metLandingForecast: 'TREND',
      metTrendInterval: 'Cada hora',
      metBriefing: 'Sí',
      metConsultation: 'Consulta personal',
      metDocumentation,
      metLanguage: 'ES/EN',
      metCharts: 'Mapas, Cartas, Imágenes, MET de Satélites e Información MET codificada',
      metSupplementary,
      metAtsDependencies: 'ACC APP y TWR',
      metAdditionalInfo,
    },
  })

  console.log('  ✓ Campos de Plataforma actualizados (platformData, taxiwayData, etc.)')
  console.log('  ✓ Campos de Servicios actualizados (combustibles, hangares, reparación)')
  console.log('  ✓ Campos de Pasajeros actualizados (hoteles, restaurantes, transporte)')
  console.log('  ✓ Campos Meteorológicos actualizados (OMA, briefing, documentación)')
  console.log('')
  console.log('═ RESUMEN FINAL ═')
  console.log(`  Aeropuerto: ${updated.icaoCode} - ${updated.name}`)
  console.log(`  Obstáculos: ${obstacles.length} registrados`)
  console.log(`  Comunicaciones ATS: ${communications.length} frecuencias`)
  console.log('  Plataforma: datos completos con TWY A/C/D/G/F')
  console.log('  Servicios: combustibles, hangares, reparación, pasajeros, MET')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
