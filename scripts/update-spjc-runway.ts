import { db } from '@/lib/db'

// Datos oficiales extraídos del PDF AD_2_SPJC-LIMA.pdf (AIP Perú, AMDT 30/22)
// Sección: CARACTERÍSTICAS FÍSICAS DE LAS PISTAS y DISTANCIAS DECLARADAS
async function main() {
  const existing = await db.airport.findUnique({ where: { icaoCode: 'SPJC' } })
  if (!existing) {
    console.log('✗ SPJC no existe en la BD. Ejecuta primero scripts/seed-spjc.ts')
    process.exit(1)
  }

  // Pistas (formato JSON, mismo que usan los otros aeropuertos)
  // Datos extraídos del PDF oficial AIP Perú AMDT 30/22
  const runways = [
    {
      designator: '16',
      brgGeo: '154° GEO',
      brgMag: '156° MAG',
      dimensions: '3508 X 45',
      pcn: 'PCN 74/R/A/X/T',
      surface: 'Concreto',
      thrCoords: '12°00\'27.44" S - 077°07\'16.86" W',
      thrElevation: '13.735 m / 45.06 ft',
      swyDimensions: '60 X 45',
      cwyDimensions: 'NIL',
      stripDimensions: '3628 X 300',
      ofz: 'NIL',
      resa: '90 m X 90 m',
      remarks: 'LDG PA CAT II y CAT IIIA/IIIB. TKOF según PROC.',
    },
    {
      designator: '34',
      brgGeo: '334° GEO',
      brgMag: '336° MAG',
      dimensions: '3508 X 45',
      pcn: 'PCN 74/R/A/X/T',
      surface: 'Concreto',
      thrCoords: '12°02\'10.12" S - 077°06\'26.23" W',
      thrElevation: '34.21 m / 112.24 ft',
      dthrCoords: '12°01\'52.47" S - 077°06\'34.93" W (DTHR 603 m)',
      dthrElevation: '29.03 m / 95.24 ft',
      swyDimensions: '60 X 45',
      cwyDimensions: 'NIL',
      stripDimensions: '3628 X 300',
      ofz: 'NIL',
      resa: '90 m X 90 m',
      remarks: 'LDG NPA. TKOF según PROC. THR desplazado 603 m.',
    },
  ]

  // Distancias declaradas (formato JSON)
  const declaredDistances = [
    { rwy: '16', tora: 3508, toda: 3508, asda: 3568, lda: 3508, remarks: 'NIL' },
    { rwy: '34', tora: 3508, toda: 3508, asda: 3568, lda: 2905, remarks: 'DTHR 603 m' },
  ]

  // Datos de plataforma/taxiway (de la sección del PDF)
  const platformData = JSON.stringify({
    pavimento: 'Concreto',
    dimensiones: 'Plataforma principal provista',
  })

  // Actualizar aeropuerto con TODOS los datos oficiales del PDF
  const updated = await db.airport.update({
    where: { icaoCode: 'SPJC' },
    data: {
      // Datos geográficos corregidos con valores oficiales del PDF
      arpLatitude: "12°01'18.79\"S",
      arpLongitude: "077°06'51.54\"W",
      elevation: '34 m / 113 ft',
      temperature: '27.1° C (FEB)',
      geoidalUndulation: '22.91 m',
      magneticDeclination: '2° W (JAN 2020)',
      annualChange: "0°12' W",
      distanceFromCity: '286° 9.5 km al NW APRX de Lima',

      // Administración corregida
      administrationType: 'Lima Airport Partners S.R.L. - LAP',
      address: 'Av. Elmer Faucett 3400, Aeropuerto Internacional Jorge Chávez - CALLAO 1 - Perú',
      phone: '(511) 5173100 - 3387',
      fax: 'NIL',
      aftn: 'SPIMYDYX',
      email: 'dutyoffice@lima-airport.com',
      authorizedTraffic: 'VFR / IFR',
      category: 'INTERNACIONAL',
      remarks: 'NIL',

      // Horas de operación (todas h24 según PDF)
      operatingHours: JSON.stringify({
        administracion: 'h24',
        aduana: 'h24',
        inmigracion: 'h24',
        serviciosMedicos: 'h24',
        ais: 'h24',
        aro: 'h24',
        met: 'h24',
        ats: 'h24',
        combustible: 'h24',
        despacho: 'h24',
        seguridad: 'h24',
        descongelamiento: 'NIL',
      }),

      // Instalaciones de escala
      cargoHandlingFacilities:
        'Todas las instalaciones modernas que permiten manipular cargas sin limitaciones, proporcionado por compañías particulares.',
      fuelTypes: 'Turbo A1, 100LL',
      lubricantTypes: 'NIL',
      refuelingFacilities: JSON.stringify({
        instalacion: 'En plataforma',
        capacidad: 'Sin limitaciones',
      }),
      deIcingFacilities: 'NIL',
      hangarSpace: 'NIL (aviones visitantes)',
      repairFacilities: 'Servicio proporcionado por compañías particulares',
      scaleRemarks: 'NIL',

      // Pasajeros
      hotels:
        '01 hotel con capacidad de 192 habitaciones frente al terminal (alojamiento, restaurante, cafetería, spa, bar, sala de reuniones)',
      restaurants:
        'Locales de comidas y bebidas en: Patio de comidas (2do Nivel del Terminal), Salidas Internacionales, Salidas Nacionales y Mezzanine',
      transport:
        'Empresas de transporte terrestre en llegadas nacionales e internacionales: Taxi ejecutivo (VIP), Taxi regular, rent a car y Bus',
      medicalFacilities: 'Primeros auxilios en el AD y hospitales en la ciudad',
      bankingPost:
        '01 Oficina bancaria y 06 puestos de cambio de divisas. Oficina de correo en mezzanine norte',
      tourismOffice: 'En el AD y la ciudad',
      passengerRemarks: 'NIL',

      // Rescate y bomberos - Categoría 9 (internacional)
      fireCategory: 'CAT 9',
      rescueEquipment: 'Equipo completo de rescate',
      aircraftRemovalCapacity: ' provisto por compañía particular',
      rescueRemarks: 'NIL',

      // Plataforma y calles de rodaje
      platformData,
      taxiwayData: JSON.stringify({
        ancho: ' provista',
        superficie: 'Asfalto/Concreto',
        resistencia: 'TWY A: PCN 56/R/A/W/T, TWY B: PCN 65/R/C/W/U',
      }),
      checkpointData: JSON.stringify({
        descripcion: 'Puntos de verificación de altimetría provistos',
      }),
      platformRemarks: 'Señales de guía de rodaje en todas las intersecciones TWY/RWY',

      // Surface movement guidance
      surfaceGuidance: JSON.stringify({
        usoSenales: 'Señales de guía de rodaje en todas las intersecciones',
        lineasGuia: 'Líneas de guía en plataforma',
      }),
      runwaySigns:
        'Designación, THR, TDZ, eje y borde de pista. Bordes THR, eje para RWY 16 y extremos iluminados',
      taxiwaySigns: 'Puntos de espera en todas las intersecciones TWY/RWY',
      stopBars: 'Barras de parada en punto de espera de RWY 16 y RWY 34',
      guidanceRemarks: 'NIL',

      // Información meteorológica
      metOffice: 'OMA SPJC',
      metHours: 'h24',
      metForecastOffice: 'OMA/SPJC',
      metValidity: '24 horas',
      metLandingForecast: 'TREND',
      metTrendInterval: 'Cada hora',
      metBriefing: 'O/R',
      metConsultation: 'O/R',
      metDocumentation: 'Proporcionada por OMA',
      metLanguage: 'Español / Inglés',
      metCharts: 'NIL',
      metSupplementary: 'SIGMET, AIRMET, NOTAM',
      metAtsDependencies: 'SPJC TWR, SPJC APP, LIMA CTL',
      metAdditionalInfo: 'NIL',

      // ★ DATOS DE PISTA (JSON) ★
      runways: JSON.stringify(runways),

      // ★ DISTANCIAS DECLARADAS (JSON) ★
      declaredDistances: JSON.stringify(declaredDistances),

      // Scale
      scaleRemarks: 'Aeropuerto principal del Perú. Hub internacional.',
      passengerRemarks: 'NIL',
    },
  })

  console.log('✓ SPJC actualizado con datos oficiales del AIP Perú (AMDT 30/22)')
  console.log('  icaoCode:', updated.icaoCode)
  console.log('  name:', updated.name)
  console.log('  elevación:', updated.elevation)
  console.log('  ARP:', updated.arpLatitude, '/', updated.arpLongitude)
  console.log('')
  console.log('★ Pistas agregadas:')
  for (const r of runways) {
    console.log(
      `  RWY ${r.designator} | ${r.dimensions} m | ${r.surface} | ${r.pcn} | THR ${r.thrElevation}`
    )
  }
  console.log('')
  console.log('★ Distancias declaradas:')
  for (const d of declaredDistances) {
    console.log(
      `  RWY ${d.rwy} | TORA ${d.tora}m | TODA ${d.toda}m | ASDA ${d.asda}m | LDA ${d.lda}m | ${d.remarks}`
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
