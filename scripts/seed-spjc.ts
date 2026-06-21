import { db } from '@/lib/db'

// Datos del Aeropuerto Internacional Jorge Chávez (SPJC) - Lima, Perú
// Información basada en la publicación AIP oficial y conocimiento público del aeródromo.
async function main() {
  const existing = await db.airport.findUnique({ where: { icaoCode: 'SPJC' } })
  if (existing) {
    console.log('SPJC ya existe, saltando creación.')
    return
  }

  // Contar aeropuertos para asignar orderIndex razonable
  const total = await db.airport.count()
  console.log(`Total aeropuertos antes: ${total}`)

  const spjc = await db.airport.create({
    data: {
      icaoCode: 'SPJC',
      name: 'AEROPUERTO INTERNACIONAL JORGE CHÁVEZ',
      city: 'LIMA / CALLAO',
      region: 'LIMA',
      department: 'LIMA',
      province: 'CALLAO',
      district: 'CALLAO',
      country: 'PERÚ',

      // Datos geográficos y administrativos
      arpLatitude: "12°00'13.92\"S",
      arpLongitude: "077°06'51.06\"W",
      elevation: '34 m / 113 ft',
      temperature: '28.0° C (SET)',
      geoidalUndulation: '-32.7 m',
      magneticDeclination: '1°E (JAN 2025)',
      annualChange: "0°06' E",

      distanceFromCity: '10 km al NO del centro de Lima',
      administrationType: 'LIMA AIRPORT PARTNERS S.R.L. - LAP',
      address: 'Av. Elmer Faucett s/n, Callao',
      phone: '(511) 517-3100',
      fax: '(511) 517-3500',
      aftn: 'SPJCYAYX',
      email: 'info@lap.com.pe',
      authorizedTraffic: 'VFR / IFR',
      category: 'INTERNACIONAL',
      remarks: 'NIL',

      // Horas de operación (JSON simplificado)
      operatingHours: JSON.stringify({
        administracion: 'h24',
        aduana: 'h24',
        inmigracion: 'h24',
        ats: 'h24',
        aro: 'h24',
        ais: 'h24',
        met: 'h24',
        combustible: 'h24',
        seguridad: 'h24',
      }),

      // Combustible y servicios
      fuelTypes: 'AVGAS, Turbo A1',
      lubricantTypes: 'NIL',
      refuelingFacilities: JSON.stringify({
        instalacion: 'Camión cisterna y dispensador',
        capacidad: ' proporcionado por compañía particular',
      }),

      // Categoría de bomberos
      fireCategory: 'CAT 9',

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

      // Datos de plataforma (JSON simplificado)
      platformData: JSON.stringify({
        pavimento: 'Asfáltico',
        dimensiones: ' provista',
      }),

      // Observaciones generales
      scaleRemarks: 'Aeropuerto principal del Perú. Hub internacional.',
      passengerRemarks: 'Servicios completos de pasajeros internacionales.',
    },
  })

  console.log('✓ SPJC creado:', spjc.icaoCode, '-', spjc.name)
  console.log('  category:', spjc.category)
  console.log('  city:', spjc.city)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
