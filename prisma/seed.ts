import { db } from '../src/lib/db';

async function main() {
  // Clear existing data
  await db.obstacle.deleteMany();
  await db.radioNavAid.deleteMany();
  await db.communication.deleteMany();
  await db.airport.deleteMany();

  const airports = [
    {
      icaoCode: "SPCL",
      name: "AEROPUERTO INTERNACIONAL CAP. FAP DAVID ARMANDO ABENSUR RENGIFO",
      city: "PUCALLPA",
      region: "UCAYALI",
      department: "UCAYALI",
      province: "CRNL. PORTILLO",
      district: "CALLERIA",
      arpLatitude: "08º22'40.59\"S",
      arpLongitude: "074°34'27.48\"W",
      elevation: "157 m / 516 ft",
      temperature: "33.6° C (SET)",
      geoidalUndulation: "NIL",
      magneticDeclination: "4°W (JAN 2015)",
      annualChange: "0°10' W",
      distanceFromCity: "5 km al SW",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Av. Aeropuerto S/N altura km 5.5 Carretera Federico Basadre - Yarinacocha - Coronel Portillo - Ucayali",
      phone: "(061) 577329",
      fax: "(061) 594782",
      aftn: "SPCLYDYX",
      email: "aeropuerto.depucallpa@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "h24",
        aduana: "1200 - 0600",
        inmigracion: "1200 - 0600",
        serviciosMedicos: "NIL",
        oficinaAIS: "h24",
        oficinaARO: "h24",
        oficinaMET: "h24",
        ats: "h24",
        combustible: "1200 - 0600 y fuera de hora O/R",
        despacho: "1200 - 0600",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares. Servicios Especializados Aeroportuarios (SEAS)",
      fuelTypes: "AVGAS, Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "Camión cisterna", capacidad: "4500 gal" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y ómnibuses desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD. Hospitales en la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "02 vehículos contraincendios",
      aircraftRemovalCapacity: "NIL",
      rescueRemarks: "NIL",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 49/F/C/X/T" }),
      taxiwayData: JSON.stringify({ ancho: "23 m", superficie: "Asfalto", resistencia: "TWY A: PCN 34/F/C/X/T, TWY B: PCN 32/F/B/X/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "205° 1.0 NM letrero en RWY 02" }),
      platformRemarks: "Coeficiente de fricción (rozamiento): 0.67",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, borde, eje de pista señalados. THR, borde y extremos iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados solo TWY B.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA/SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "02",
          brgGeo: "020°",
          brgMag: "024°",
          dimensions: "2800 X 45",
          pcn: "PCN 46/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "08°23'23.41\"S - 074°34'43.15\"W",
          thrElevation: "157.250 m / 516 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2920 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "20",
          brgGeo: "200°",
          brgMag: "204°",
          dimensions: "2800 X 45",
          pcn: "PCN 46/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "08°21'57.76\"S - 074°34'11.80\"W",
          thrElevation: "157.250 m / 516 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2920 X 150",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "02", tora: 2800, toda: 2800, asda: 2860, lda: 2800, remarks: "NIL" },
        { rwy: "20", tora: 2800, toda: 2800, asda: 2860, lda: 2800, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPHI",
      name: "AEROPUERTO INTERNACIONAL CAPITÁN FAP JOSÉ ABELARDO QUIÑONES GONZALES",
      city: "CHICLAYO",
      region: "LAMBAYEQUE",
      department: "LAMBAYEQUE",
      province: "CHICLAYO",
      district: "CHICLAYO",
      arpLatitude: "06º47'14.92\"S",
      arpLongitude: "079°49'41.16\"W",
      elevation: "30 m / 97 ft",
      temperature: "31.3°C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "2°W (JAN 2020)",
      annualChange: "0°10' W",
      distanceFromCity: "1 km SE",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Av. Fitzcarral S/N Chiclayo - Perú",
      phone: "(074) 236040 - (074) 236016",
      fax: "NIL",
      aftn: "SPHIYDYX",
      email: "aeropuerto.dechiclayo@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "Katia Elespuru - Gerente de Aeropuerto 979088333 - (074) 236040 mail: katia.elespuru@adp.com.pe",
      operatingHours: JSON.stringify({
        administracion: "h24",
        aduana: "h24",
        inmigracion: "h24",
        serviciosMedicos: "Horario de acuerdo a lo establecido por la DIRESA",
        oficinaAIS: "h24",
        oficinaARO: "h24",
        oficinaMET: "h24",
        ats: "h24",
        combustible: "1200 - 0300 y O/R",
        despacho: "h24",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares. Servicios Especializados Aeroportuarios (SEAS)",
      fuelTypes: "Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "29000 gal" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "Servicio de abastecimiento de combustible h24",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y omnibuses desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD. Hospitales en la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 8",
      rescueEquipment: "03 vehículos contraincendios",
      aircraftRemovalCapacity: "Hasta 80 t (Empresa externa)",
      rescueRemarks: "Katia Elespuru - Gerente de Aeropuerto 979088333 - (074)236040 mail: katia.elespuru@adp.com.pe",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 85 R/B/W/T" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 61 F/A/X/T" },
        { nombre: "BRAVO", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 92 F/A/X/T" },
        { nombre: "BRAVO 1", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 61 F/A/X/T" },
        { nombre: "CHARLIE", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 61 F/A/X/T" },
        { nombre: "DELTA/DELTA 1", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 75 F/A/X/T / PCN 82 F/A/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "No aplicable, situado en superficie con diferente nivel de altitud" }),
      platformRemarks: "Coeficiente de fricción (rozamiento): 0.72",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma. Guía visual de estacionamiento.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes THR y extremos de RWY iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "NO AVBL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA/SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, observaciones e informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR/ARO",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "19",
          brgGeo: "187°",
          brgMag: "189°",
          dimensions: "2500 X 45",
          pcn: "PCN 85 R/A/W/T",
          surface: "Asfalto",
          thrCoords: "06°46'34.57\"S - 079°49'36.02\"W",
          thrElevation: "30 m / 97 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2640 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "01",
          brgGeo: "007°",
          brgMag: "009°",
          dimensions: "2500 X 45",
          pcn: "PCN 85 R/A/W/T",
          surface: "Asfalto",
          thrCoords: "06°47'55.27\"S - 079°49'46.30\"W",
          thrElevation: "29 m / 94 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2640 X 150",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "19", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" },
        { rwy: "01", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPJL",
      name: "AEROPUERTO INTERNACIONAL INCA MANCO CÁPAC",
      city: "JULIACA",
      region: "PUNO",
      department: "PUNO",
      province: "SAN ROMÁN",
      district: "JULIACA",
      arpLatitude: "15°28'00.69\"S",
      arpLongitude: "070°09'28.38\"W",
      elevation: "3826 m / 12552 ft",
      temperature: "19.8° C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "6°W (JAN 2015)",
      annualChange: "0°11'W",
      distanceFromCity: "5 km al NW",
      administrationType: "AD Aeropuertos Andinos del Perú S.A. - AAP",
      address: "Av. Aviación S/N - Juliaca - Perú",
      phone: "(051) 328226",
      fax: "NIL",
      aftn: "SPJLYDYX",
      email: "jb.jul@aap.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "1200 - 0000",
        aduana: "1200 - 0000",
        inmigracion: "O/R",
        serviciosMedicos: "1200 - 0000",
        oficinaAIS: "1200 - 0000",
        oficinaARO: "1200 - 0000",
        oficinaMET: "1200 - 0000",
        ats: "1200 - 0000",
        combustible: "NO AVBL",
        despacho: "1200 - 0000",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "1100 - 0000. Fuera de estas horas: O/R"
      }),
      cargoHandlingFacilities: "01 Montacarga de 2 L",
      fuelTypes: "NIL",
      lubricantTypes: "NO AVBL",
      refuelingFacilities: "NIL",
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y ómnibuses desde y hacia la ciudad",
      medicalFacilities: "En el AD y la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "Equipo primeros auxilios, Equipo mercancías peligrosas y dos (02) vehículos",
      aircraftRemovalCapacity: "Hasta 30 t (Empresa externa)",
      rescueRemarks: "941831956 - (051) 328226 Jefe de Base mail: jb.jul@aap.com.pe",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 46/F/C/X/T" }),
      taxiwayData: JSON.stringify({ ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 46/F/C/X/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "118° 0.7 NM en RWY 30, 289° 1.5 NM en RWY 12, letreros no instalados" }),
      platformRemarks: "NIL",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY/RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes, THR y extremos iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "1100 - 2400 O/R",
      metForecastOffice: "SPJC/OMA/AFTN",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR/APP",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "12",
          brgGeo: "112°",
          brgMag: "118°",
          dimensions: "4200 X 45",
          pcn: "PCN 46/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "15°27'35.13\"S - 070°10'33.68\"W",
          thrElevation: "3825.95 m / 12552.34 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "4320 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "30",
          brgGeo: "292°",
          brgMag: "298°",
          dimensions: "4200 X 45",
          pcn: "PCN 46/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "15°28'26.24\"S - 070°08'23.08\"W",
          thrElevation: "3824.086 m / 12546.21 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "4320 X 150",
          ofz: "NIL",
          resa: "90 m x 90 m"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "12", tora: 4200, toda: 4200, asda: 4260, lda: 4200, remarks: "NIL" },
        { rwy: "30", tora: 4200, toda: 4200, asda: 4260, lda: 4200, remarks: "RESA: 90 m x 90 m" }
      ])
    },
    {
      icaoCode: "SPQT",
      name: "AEROPUERTO INTERNACIONAL CORONEL FAP FRANCISCO SECADA VIGNETTA",
      city: "IQUITOS",
      region: "LORETO",
      department: "LORETO",
      province: "MAYNAS",
      district: "SAN JUAN BAUTISTA",
      arpLatitude: "03°47'05.06\"S",
      arpLongitude: "073°18'31.70\"W",
      elevation: "93 m / 306 ft",
      temperature: "32.9° C (OCT)",
      geoidalUndulation: "NIL",
      magneticDeclination: "7°W (JAN 2020)",
      annualChange: "0°10' W",
      distanceFromCity: "7 km al SW",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Av. Abelardo Quiñones km 6 S/N Iquitos - Perú",
      phone: "(065) 228151 / (065) 228444",
      fax: "NIL",
      aftn: "SPQTYDYX",
      email: "aeropuerto.deiquitos@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "h24",
        aduana: "h24",
        inmigracion: "h24",
        serviciosMedicos: "h24",
        oficinaAIS: "h24",
        oficinaARO: "h24",
        oficinaMET: "h24",
        ats: "h24",
        combustible: "h24",
        despacho: "h24",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares. Servicios Especializados Aeroportuarios proporcionados por compañías particulares.",
      fuelTypes: "Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "Camiones cisternas", capacidad: "52000 gal" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y ómnibuses desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD. Hospitales en la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En el AD y la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 8",
      rescueEquipment: "03 vehículos contraincendios",
      aircraftRemovalCapacity: "Hasta 110 t (Empresa externa)",
      rescueRemarks: "965601727 - (065)228151 Gerente de Aeropuerto aeropuerto.deiquitos@adp.com.pe",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 59 R/B/W/T" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "22.5 m", superficie: "Concreto", resistencia: "PCN 61 R/B/W/T" },
        { nombre: "BRAVO", ancho: "22.5 m", superficie: "Concreto", resistencia: "PCN 60 R/C/W/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "Plataforma, ELEV 309 ft", ins: "NIL", vordme: "060° 1.4 NM letrero en RWY 24" }),
      platformRemarks: "Coeficiente de fricción (rozamiento): 0.59",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY, RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes, THR y extremos iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "OMA",
      metHours: "h24",
      metForecastOffice: "OMA / SPQT - SPJC",
      metValidity: "24 horas",
      metLandingForecast: "TREND",
      metTrendInterval: "Cada hora",
      metBriefing: "Sí",
      metConsultation: "Consulta personal",
      metDocumentation: "Mapas, Pronósticos, Observaciones e Informes MET (Productos WAFS)",
      metLanguage: "ES",
      metCharts: "Mapas, Cartas, Imágenes MET de satélite e información MET codificada",
      metSupplementary: "Terminal AMHS CADAS, Banco de Datos alterno OPMET, Internet",
      metAtsDependencies: "TWR/ARO",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "06",
          brgGeo: "057°",
          brgMag: "064°",
          dimensions: "2500 X 45",
          pcn: "PCN 61 R/C/W/T",
          surface: "Concreto",
          thrCoords: "03°47'27.41\"S - 073°19'05.57\"W",
          thrElevation: "93 m / 306 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2500 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "24",
          brgGeo: "237°",
          brgMag: "244°",
          dimensions: "2500 X 45",
          pcn: "PCN 61 R/C/W/T",
          surface: "Concreto",
          thrCoords: "03°46'42.71\"S - 073°17'57.83\"W",
          thrElevation: "90 m / 295 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2500 X 150",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "06", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" },
        { rwy: "24", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPQU",
      name: "AEROPUERTO INTERNACIONAL ALFREDO RODRÍGUEZ BALLÓN",
      city: "AREQUIPA",
      region: "AREQUIPA",
      department: "AREQUIPA",
      province: "AREQUIPA",
      district: "CAYMA",
      arpLatitude: "16°20'26.08\"S",
      arpLongitude: "071°34'14.89\"W",
      elevation: "2560.5 m / 8400 ft",
      temperature: "22.3° C (OCT)",
      geoidalUndulation: "NIL",
      magneticDeclination: "6°W (JAN 2020)",
      annualChange: "0°13'W",
      distanceFromCity: "8 km al NW",
      administrationType: "AD Aeropuertos Andinos del Perú S.A. - AAP",
      address: "Av. Aviación S/N Zamácola, Distrito de Cerro Colorado - Arequipa - Perú",
      phone: "(054) 344834",
      fax: "NIL",
      aftn: "SPQUYDYX",
      email: "atencionalcliente@aap.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "1100 - 0300",
        aduana: "1100 - 0300",
        inmigracion: "1100 - 0300",
        serviciosMedicos: "1100 - 0300",
        oficinaAIS: "1100 - 0300",
        oficinaARO: "1100 - 0300",
        oficinaMET: "h24",
        ats: "1100 - 0300",
        combustible: "1130 - 0230 y O/R",
        despacho: "1100 - 0300",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "01 Montacarga de 25 t de capacidad. 01 Carreta. No se dispone de personal para manipuleo de carga.",
      fuelTypes: "Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "Sin restricción" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "Sí",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis desde y hacia la ciudad",
      medicalFacilities: "En el aeropuerto y en la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En el AD y la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "Equipo de primeros auxilios, Equipos de mercancías peligrosas y 02 vehículos",
      aircraftRemovalCapacity: "Hasta 77 t (Empresa externa)",
      rescueRemarks: "942174403 / 054-344834 Jefe de Operaciones seg.aqp@aap.com.pe",
      platformData: JSON.stringify({ superficie: "Asfalto y concreto", resistencia: "PCN 43/R/B/X/T (rígido), PCN 39/F/B/X/T (flexible)" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 39/F/B/X/T" },
        { nombre: "BRAVO", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 39/F/B/X/T" },
        { nombre: "BRAVO 1", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 39/F/B/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "No aplicable, situado fuera de las inmediaciones del aeropuerto con diferente nivel de altitud" }),
      platformRemarks: "TWY ALFA cerrada",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes THR y extremo iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "OMA",
      metHours: "1100 - 2300",
      metForecastOffice: "OMA / SPQU-SPJC",
      metValidity: "24 horas",
      metLandingForecast: "TREND",
      metTrendInterval: "Cada hora",
      metBriefing: "Si",
      metConsultation: "Consulta personal",
      metDocumentation: "Mapas, Pronóstico, Observaciones e Informes MET (Productos WAFS)",
      metLanguage: "ES",
      metCharts: "Mapas, Cartas, Imágenes MET de Satélite e información MET Codificada",
      metSupplementary: "Terminal AMHS CADAS, Banco de Datos alterno OPMET, Internet",
      metAtsDependencies: "TWR / APP / ARO",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "10",
          brgGeo: "093°",
          brgMag: "099°",
          dimensions: "2980 X 45",
          pcn: "PCN 39/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "16°20'23.42\"S - 071°35'04.99\"W",
          thrElevation: "2521 m / 8270 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3100 X 150",
          ofz: "NIL",
          resa: "NIL",
          dthr: "NIL"
        },
        {
          designator: "28",
          brgGeo: "273°",
          brgMag: "279°",
          dimensions: "2980 X 45",
          pcn: "PCN 39/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "16°20'28.74\"S - 071°33'24.79\"W",
          thrElevation: "2560 m / 8400 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3100 X 150",
          ofz: "NIL",
          resa: "NIL",
          dthr: "DTHR 28 = 450 m. Coordenadas: 16°20'27.95\"S - 071°33'39.86\"W"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "10", tora: 2980, toda: 2980, asda: 3040, lda: 2980, remarks: "NIL" },
        { rwy: "28", tora: 2980, toda: 2980, asda: 3040, lda: 2530, remarks: "DTHR 450 m" }
      ])
    },
    {
      icaoCode: "SPRU",
      name: "AEROPUERTO INTERNACIONAL CAPITÁN FAP CARLOS MARTÍNEZ DE PINILLOS",
      city: "TRUJILLO",
      region: "LA LIBERTAD",
      department: "LA LIBERTAD",
      province: "TRUJILLO",
      district: "HUANCHACO",
      arpLatitude: "08°04'54.15\"S",
      arpLongitude: "079°06'31.13\"W",
      elevation: "39 m / 128 ft",
      temperature: "26.5° C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "1°W (JAN 2015)",
      annualChange: "0°10'W",
      distanceFromCity: "11 km al NW",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Av. Aviación S/N - Huanchaco - Trujillo - Perú",
      phone: "(044) 464324 - (044) 464131",
      fax: "(044) 464324",
      aftn: "SPRUYDYX",
      email: "aeropuerto.detrujillo@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "h24",
        aduana: "1300 - 0200",
        inmigracion: "1300 - 0200",
        serviciosMedicos: "NIL",
        oficinaAIS: "h24",
        oficinaARO: "h24",
        oficinaMET: "h24",
        ats: "h24",
        combustible: "1200 - 0200 y O/R",
        despacho: "1200 - 0200",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares. Servicios Especializados Aeroportuarios proporcionados por compañías particulares.",
      fuelTypes: "AVGAS / Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "31466 gal (Turbo A1) / 11134 gal (100LL)" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD. Hospitales en la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "02 vehículos contraincendios",
      aircraftRemovalCapacity: "Hasta 40 t (Empresa externa)",
      rescueRemarks: "Gerente de Aeropuerto 949627935 - (044) 464324",
      platformData: JSON.stringify({ superficie: "Asfalto y concreto", resistencia: "PCN 52/R/B/W/T" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "23.0 m", superficie: "Asfalto", resistencia: "PCN 72 F/C/X/T" },
        { nombre: "BRAVO", ancho: "23.0 m", superficie: "Asfalto", resistencia: "PCN 60 F/B/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "023° 1.2 NM no instalado en proceso de implementación" }),
      platformRemarks: "Coeficiente de fricción (rozamiento): 0.74",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes THR y extremo iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA / SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "02",
          brgGeo: "017°",
          brgMag: "018°",
          dimensions: "3000 X 45",
          pcn: "PCN 52/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "08°05'40.77\"S - 079°06'45.69\"W",
          thrElevation: "14 m / 46 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3150 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "20",
          brgGeo: "197°",
          brgMag: "198°",
          dimensions: "3000 X 45",
          pcn: "PCN 52/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "08°04'07.53\"S - 079°06'16.56\"W",
          thrElevation: "39 m / 128 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3150 X 150",
          ofz: "NIL",
          resa: "NIL",
          dthr: "DTHR 600 m. Coordenadas: 08°04'25.99\"S - 079°06'22.33\"W"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "02", tora: 3000, toda: 3000, asda: 3060, lda: 3000, remarks: "NIL" },
        { rwy: "20", tora: 3000, toda: 3000, asda: 3060, lda: 2400, remarks: "DTHR 600 m" }
      ])
    },
    {
      icaoCode: "SPSO",
      name: "AEROPUERTO INTERNACIONAL DE PISCO",
      city: "PISCO",
      region: "ICA",
      department: "ICA",
      province: "PISCO",
      district: "SAN ANDRÉS",
      arpLatitude: "13°44'41.28\"S",
      arpLongitude: "076°13'13.48\"W",
      elevation: "12 m / 40 ft",
      temperature: "28.9° C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "2°W (JAN 2020)",
      annualChange: "0°12'W",
      distanceFromCity: "4 km al SW",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Calle Ica s/n, San Andrés - Pisco - Perú",
      phone: "01-5133800 Anexo: 55303",
      fax: "NIL",
      aftn: "SPSOYDYX",
      email: "aeropuerto.depisco@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "h24",
        aduana: "O/R",
        inmigracion: "O/R",
        serviciosMedicos: "Horario de acuerdo a lo establecido por la DIRESA",
        oficinaAIS: "h24",
        oficinaARO: "h24",
        oficinaMET: "h24",
        ats: "h24",
        combustible: "1200 - 0400 y O/R",
        despacho: "h24",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares (SEAS)",
      fuelTypes: "AVGAS 100LL / Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En Plataforma Sur", capacidad: "6481 gal (AVGAS 100LL) / 20868 gal (Turbo A1)" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En la ciudad",
      transport: "Taxis desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD y hospitales en la ciudad",
      bankingPost: "En la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "02 vehículos contraincendios",
      aircraftRemovalCapacity: "Hasta 20 t (Empresa externa)",
      rescueRemarks: "Gerente de Aeropuerto Teléfono: 956660797 - 5133800 anexo 55303 mail: ricardo.velez@adp.com.pe",
      platformData: JSON.stringify([
        { nombre: "NUEVO (NORTE)", superficie: "Concreto", resistencia: "PCN 62/R/B/W/T", ancho: "145.56 m", largo: "361.36 m" },
        { nombre: "ANTIGUA (SUR)", superficie: "Concreto", resistencia: "PCN 55 R/B/W/T", ancho: "55 m", largo: "90.91 m" }
      ]),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "57 R/C/W/T" },
        { nombre: "ALFA 1", ancho: "23 m", superficie: "Asfalto", resistencia: "52 F/B/X/T" },
        { nombre: "BRAVO", ancho: "23 m", superficie: "Asfalto", resistencia: "51 R/C/W/T" },
        { nombre: "CHARLIE", ancho: "23 m", superficie: "Asfalto", resistencia: "54 F/B/X/T" },
        { nombre: "DELTA", ancho: "23 m", superficie: "Asfalto", resistencia: "51 F/B/Y/T" },
        { nombre: "ECHO", ancho: "23 m", superficie: "Asfalto", resistencia: "54 F/A/Y/T" },
        { nombre: "ECHO 1", ancho: "23 m", superficie: "Asfalto", resistencia: "49 F/B/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "249° 0.9 NM en intersección ECHO y CHARLIE, 235° 0.5 NM en intersección ECHO y DELTA" }),
      platformRemarks: "PEA 01A, Salida Autónoma de Aeronaves",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados. Bordes, THR y extremos iluminados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados. Bordes iluminados.",
      stopBars: "Calle de rodaje ALFA y calle de rodaje BRAVO",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA / SPJC",
      metValidity: "24 horas",
      metLandingForecast: "MET REPORT y TAF",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, observaciones e informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR / ARO",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "04",
          brgGeo: "040°",
          brgMag: "042°",
          dimensions: "3020 X 45",
          pcn: "PCN 51 F/B/X/T; RWY restante 300 m PCN 59 R/B/W/T",
          surface: "Asfalto",
          thrCoords: "13°45'19.18\"S - 076°13'45.50\"W",
          thrElevation: "3 m / 11 ft",
          swyDimensions: "100 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3020 X 300",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "22",
          brgGeo: "220°",
          brgMag: "222°",
          dimensions: "3020 X 45",
          pcn: "PCN 59 R/B/W/T; RWY restante 2720 m PCN 51 F/B/X/T",
          surface: "Asfalto",
          thrCoords: "13°44'03.38\"S - 076°12'41.46\"W",
          thrElevation: "12 m / 40 ft",
          swyDimensions: "190 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3020 X 300",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "04", tora: 3020, toda: 3020, asda: 3120, lda: 3020, remarks: "NIL" },
        { rwy: "22", tora: 3020, toda: 3020, asda: 3210, lda: 3020, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPTN",
      name: "AEROPUERTO INTERNACIONAL CORONEL FAP CARLOS CIRIANI SANTA ROSA",
      city: "TACNA",
      region: "TACNA",
      department: "TACNA",
      province: "TACNA",
      district: "TACNA",
      arpLatitude: "18°03'11.84\"S",
      arpLongitude: "070°16'32.96\"W",
      elevation: "469 m / 1,538 ft",
      temperature: "28.9°C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "5° W (JAN 2015)",
      annualChange: "0°11'W",
      distanceFromCity: "5 km",
      administrationType: "AD Aeropuertos Andinos del Perú S.A. - AAP",
      address: "Carretera Panamericana Sur Km 5 Valle Parachico, Tacna, Tacna - Perú",
      phone: "(052) 570072",
      fax: "NIL",
      aftn: "SPTNYDYX",
      email: "NIL",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "1100 - 0300",
        aduana: "Aduana de acuerdo al itinerario de los vuelos y O/R",
        inmigracion: "O/R",
        serviciosMedicos: "En la ciudad",
        oficinaAIS: "1100 - 0300",
        oficinaARO: "1100 - 0300",
        oficinaMET: "h24",
        ats: "1100 - 0300 y O/R",
        combustible: "1000 - 0200 Lun. A Sab. y O/R; Domingos O/R",
        despacho: "1100 - 0300 y O/R",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "NIL",
      fuelTypes: "Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "01 tanque grande de 23211 gal y 01 tanque chico de 9713 gal. Total: 32924 gal" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y ómnibuses desde y hacia la ciudad",
      medicalFacilities: "En la ciudad",
      bankingPost: "En la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "Equipos de primeros auxilios, equipo mercancías peligrosas y 02 vehículos",
      aircraftRemovalCapacity: "Hasta 25 t (Empresa externa)",
      rescueRemarks: "969598457 / 052-570072 Jefe de Base jb.tcq@aap.com.pe",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 39/R/A/X/T" }),
      taxiwayData: JSON.stringify({ ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 39/F/A/X/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "020° 0.9 NM SEÑALIZADO Letrero en THR RWY 20" }),
      platformRemarks: "NIL",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma. Guía de estacionamiento proa hacia adentro.",
      runwaySigns: "Designación, THR, TDZ, borde, eje de pista señalados. THR, bordes y extremos iluminados.",
      taxiwaySigns: "Señales de puntos de espera en todas las intersecciones entre TWY/RWY. Bordes iluminados.",
      stopBars: "NIL",
      guidanceRemarks: "Señalización vertical luminosa en el área de maniobras en servicio.",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA/SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, observaciones e informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "02",
          brgGeo: "019°",
          brgMag: "023°",
          dimensions: "2500 X 45",
          pcn: "PCN 39/F/A/X/T",
          surface: "Asfalto",
          thrCoords: "18°03'50.17\"S - 070°16'47.13\"W",
          thrElevation: "419 m / 1375 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "214",
          stripDimensions: "2620 X 150",
          ofz: "NIL",
          resa: "90 m. x 90 m."
        },
        {
          designator: "20",
          brgGeo: "199°",
          brgMag: "203°",
          dimensions: "2500 X 45",
          pcn: "PCN 39/F/A/X/T",
          surface: "Asfalto",
          thrCoords: "18°02'33.49\"S - 070°16'18.78\"W",
          thrElevation: "469 m / 1538 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "220",
          stripDimensions: "2620 X 150",
          ofz: "NIL",
          resa: "90 m. x 90 m."
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "02", tora: 2500, toda: 2714, asda: 2560, lda: 2500, remarks: "RESA: 90 m x 90 m" },
        { rwy: "20", tora: 2500, toda: 2720, asda: 2560, lda: 2500, remarks: "RESA: 90 m x 90 m" }
      ])
    },
    {
      icaoCode: "SPYL",
      name: "AEROPUERTO INTERNACIONAL CAPITÁN FAP VÍCTOR MONTES",
      city: "TALARA",
      region: "PIURA",
      department: "PIURA",
      province: "TALARA",
      district: "PARIÑAS",
      arpLatitude: "04º34'35.80\"S",
      arpLongitude: "081°15'14.61\"W",
      elevation: "86 m / 282 ft",
      temperature: "32.6°C (MAR)",
      geoidalUndulation: "NIL",
      magneticDeclination: "1° W (JAN 2020)",
      annualChange: "0°9' W",
      distanceFromCity: "2.5 km SE",
      administrationType: "AD Aeropuertos del Perú S.A. - ADP",
      address: "Aeropuerto de Talara - Alta Pariñas S/N - Perú",
      phone: "(073) 385510",
      fax: "(073) 385070",
      aftn: "SPYLYDYX",
      email: "aeropuerto.detalara@adp.com.pe",
      authorizedTraffic: "VFR / IFR",
      remarks: "CLSD SUN",
      operatingHours: JSON.stringify({
        administracion: "1300 - 2100 y O/R con 24 h de anticipación previa autorización. CLSD SUN",
        aduana: "O/R",
        inmigracion: "O/R",
        serviciosMedicos: "NIL",
        oficinaAIS: "1300 - 2100",
        oficinaARO: "1300 - 2100",
        oficinaMET: "1300 - 2100",
        ats: "1300 - 2100",
        combustible: "1300 - 2100 y O/R",
        despacho: "1300 - 2100",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "1300 - 2100"
      }),
      cargoHandlingFacilities: "Proporcionada por compañías particulares. Servicios Especializados Aeroportuarios proporcionados por compañías particulares.",
      fuelTypes: "AVGAS",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "NIL" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En la ciudad",
      transport: "Taxis desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD. Hospitales en la ciudad",
      bankingPost: "En la ciudad",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "02 vehículos contraincendios",
      aircraftRemovalCapacity: "NIL",
      rescueRemarks: "NIL",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 40/R/B/W/T" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "18.0 m", superficie: "Asfalto", resistencia: "PCN 37/F/C/X/T" },
        { nombre: "BRAVO", ancho: "18.0 m", superficie: "Asfalto", resistencia: "PCN 36/F/C/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "345° NM INSTALADO, letrero en THR RWY 17" }),
      platformRemarks: "Coeficiente de fricción (rozamiento): 0.67",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma. Guía visual de estacionamiento proa hacia adentro.",
      runwaySigns: "Designación, THR, TDZ, borde y eje de pista señalados. Bordes THR y extremos iluminados. REDL RWY 17/35 instaladas.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados y bordes. Luces de borde de calle de rodaje ALFA y BRAVO instaladas.",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "1300 - 2100",
      metForecastOffice: "OMA / SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "AFIS",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "17",
          brgGeo: "170°",
          brgMag: "171°",
          dimensions: "2460 X 45",
          pcn: "PCN 39/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "04°33'56.60\"S - 081°15'21.44\"W",
          thrElevation: "84 m / 277 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2580 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "35",
          brgGeo: "350°",
          brgMag: "351°",
          dimensions: "2460 X 45",
          pcn: "PCN 39/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "04°35'14.99\"S - 081°15'07.77\"W",
          thrElevation: "86 m / 282 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2580 X 150",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "17", tora: 2460, toda: 2460, asda: 2520, lda: 2460, remarks: "NIL" },
        { rwy: "35", tora: 2460, toda: 2460, asda: 2520, lda: 2460, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPZO",
      name: "AEROPUERTO INTERNACIONAL TENIENTE FAP ALEJANDRO VELASCO ASTETE",
      city: "CUSCO",
      region: "CUSCO",
      department: "CUSCO",
      province: "CUSCO",
      district: "SAN SEBASTIÁN",
      arpLatitude: "13°32'08.60\"S",
      arpLongitude: "071°56'19.61\"W",
      elevation: "3,310 m / 10,860 ft",
      temperature: "21.6° C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "5°W (JAN 2015)",
      annualChange: "0°10.4' W",
      distanceFromCity: "5 km al SE",
      administrationType: "AD CORPAC S.A.",
      address: "Av. Alejandro Velasco Astete S/N - Cusco - Perú",
      phone: "(084) 222601",
      fax: "(084) 222601",
      aftn: "SPZOYDYX",
      email: "NIL",
      authorizedTraffic: "VFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "1330 - 2130",
        aduana: "1000 - 2300",
        inmigracion: "1200 - 1700 O/R",
        serviciosMedicos: "1100 - 2300",
        oficinaAIS: "1100 - 2300",
        oficinaARO: "1100 - 2300",
        oficinaMET: "h24",
        ats: "1100 - 2300",
        combustible: "1100 - 2200",
        despacho: "NIL",
        seguridad: "h24",
        descongelamiento: "NIL",
        com: "h24"
      }),
      cargoHandlingFacilities: "01 Montacarga de 6000 kg, 06 Tractores, 05 Fajas transportadoras, 06 Generadores eléctricos, 01 Arrancador neumático, 05 Pay mover, 01 Carro de agua potable, 01 Carro de baño, 49 Carretas, 18 Escaleras manuales, 03 Barras de remolque A319/A320/A321, 02 Barras B737, 01 Barra BAe-145/6, Multiheads varios, 81 personal",
      fuelTypes: "Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: JSON.stringify({ tipo: "En plataforma", capacidad: "80000 gal" }),
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En el AD y la ciudad",
      transport: "Taxis y ómnibuses desde y hacia la ciudad",
      medicalFacilities: "En el AD y la ciudad",
      bankingPost: "En el AD y la ciudad",
      tourismOffice: "En el AD y la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "Equipo de primeros auxilios. Equipo de mercancías peligrosas y dos (02) vehículos contra incendios.",
      aircraftRemovalCapacity: "Hasta 20 t (Empresa externa)",
      rescueRemarks: "Jefe de Seguridad 978470399 - (084) 222611 mail: gpinto@corpac.gob.pe",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 49/R/C/X/T (45,682 m² para 11 posiciones de ACFT)" }),
      taxiwayData: JSON.stringify({ nombre: "ALFA, BRAVO, CHARLIE Y DELTA", ancho: "22.50 m", superficie: "Asfalto", resistencia: "PCN 45/F/C/X/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "No aplicable, situado en superficie con diferente nivel de altitud sobre el terreno" }),
      platformRemarks: "NIL",
      surfaceGuidance: "Señales de guía de rodaje en todas las intersecciones entre TWY y RWY y en todos los puntos de espera. Líneas de guía en la plataforma.",
      runwaySigns: "Designación, THR, TDZ, eje y borde de pista señalados.",
      taxiwaySigns: "Puntos de espera en todas las intersecciones TWY/RWY, señalados.",
      stopBars: "NIL",
      guidanceRemarks: "WDI",
      metOffice: "EMA",
      metHours: "h24",
      metForecastOffice: "OMA / SPJC",
      metValidity: "24 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "10",
          brgGeo: "093°",
          brgMag: "099°",
          dimensions: "3400 X 45",
          pcn: "PCN 45/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "13°31'56.93\"S - 071°55'48.37\"W",
          thrElevation: "3240 m / 10630 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3520 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "28",
          brgGeo: "273°",
          brgMag: "279°",
          dimensions: "3400 X 45",
          pcn: "PCN 45/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "13°32'39.87\"S - 071°53'29.08\"W",
          thrElevation: "3310 m / 10860 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "3520 X 150",
          ofz: "NIL",
          resa: "NIL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "10", tora: 3400, toda: 3400, asda: 3460, lda: 3400, remarks: "NIL" },
        { rwy: "28", tora: 3400, toda: 3400, asda: 3460, lda: 3400, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPUR",
      name: "CAPITÁN FAP GUILLERMO CONCHA IBERICO",
      city: "PIURA",
      region: "PIURA",
      department: "PIURA",
      arpLatitude: "05°12'20.7\"S",
      arpLongitude: "080°36'59\"W",
      elevation: "35 m / 116 ft",
      temperature: "34.2°C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "2 km E",
      administrationType: "AEROPUERTOS DEL PERÚ S.A. - ADP",
      aftn: "SPURYSYX",
      authorizedTraffic: "VFR / IFR",
      remarks: "Pernocte no disponible. Coeficiente fricción 0.69. Prohibido virajes en pista. Nueva edificación 150 ft a 970 m Sur extremo Pista 19. Árboles al NW umbral Pista 01. Obstáculo 30 m altura 1340 m Umbral Pista 19. Antena iluminada 372 ft COORD: 05°10'35''S - 080°37'06''W. ATZ: círculo 6 NM radio centro VOR URA, GND/1700 ft AMSL. Peligro aviario.",
      operatingHours: JSON.stringify({
        oficinaAIS: "1200-0200",
        oficinaARO: "1200-0200",
        oficinaMET: "h24",
        ats: "1200-0200 y O/R",
        combustible: "1200-0200 y O/R",
        seguridad: "1200-0200 y O/R",
        com: "h24"
      }),
      fireCategory: "CAT 7",
      fuelTypes: "Turbo A1",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 45 R/B/W/T" }),
      taxiwayData: JSON.stringify({ ancho: "23 m", superficie: "Asfalto", resistencia: "TWY A-A1: PCN 41 F/C/X/T, TWY B-C: PCN 40 F/C/X/T" }),
      runways: JSON.stringify([
        {
          designator: "01",
          brgGeo: "010°",
          brgMag: "010°",
          dimensions: "2500 X 45",
          pcn: "PCN 40 F/B/X/T",
          surface: "Asfalto",
          thrCoords: "05°13'00.5''S - 080°37'07.7''W",
          thrElevation: "51.36 ft / 15.65 m",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "NIL",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.3%",
          papi: "PAPI 3° RWY 01 Elevation 51.36 ft / 15.65 m",
          lights: "RTHL/REDL/RENL"
        },
        {
          designator: "19",
          brgGeo: "190°",
          brgMag: "190°",
          dimensions: "2500 X 45",
          pcn: "PCN 40 F/B/X/T",
          surface: "Asfalto",
          thrCoords: "05°11'41.0''S - 080°36'50.3''W",
          thrElevation: "56.40 ft / 17.19 m",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "NIL",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.3%",
          papi: "PAPI 3° RWY 19 Elevation 56.40 ft / 17.19 m",
          lights: "SALS/RTHL/REDL/RENL"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "01", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" },
        { rwy: "19", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPHY",
      name: "ANDAHUAYLAS",
      city: "ANDAHUAYLAS",
      region: "APURIMAC",
      department: "APURIMAC",
      arpLatitude: "13°42'31.75\"S",
      arpLongitude: "073°21'5.60\"W",
      elevation: "3565 m / 11706 ft",
      temperature: "17°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "17.5 km N",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Zona FIZ: Círculo 20 DME centro VOR AND, GND/FL200. Sólo operaciones diurnas VMC. APAPI restricción no mayor 3 NM THR 03.",
      operatingHours: JSON.stringify({
        oficinaMET: "1000-2300",
        ats: "1100-2300",
        seguridad: "1100-2300",
        com: "1000-2300"
      }),
      fireCategory: "CAT 6",
      fuelTypes: "NIL",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 28/F/C/X/T" }),
      taxiwayData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 28/F/C/X/T" }),
      runways: JSON.stringify([
        {
          designator: "03",
          brgGeo: "030°",
          brgMag: "030°",
          dimensions: "2500 X 45",
          pcn: "PCN 28/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "13°43'06.38''S - 073°21'27.17''W",
          thrElevation: "11627 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2620 X 130",
          ofz: "NIL",
          resa: "90 X 90",
          slope: "0.963%",
          papi: "APAPI 3° RWY 03 Elev 47.05 ft / 14.34 m"
        },
        {
          designator: "21",
          brgGeo: "210°",
          brgMag: "210°",
          dimensions: "2500 X 45",
          pcn: "PCN 28/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "13°41'57.43''S - 073°20'43.09''W",
          thrElevation: "11706 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2620 X 130",
          ofz: "NIL",
          resa: "90 X 90",
          slope: "0.963%",
          papi: "PAPI 3° RWY 21 Elev 62.50 ft / 19.05 m",
          dthr: "DTHR 21: 13°42'03.40''S - 073°20'46.90''W, 11699 ft, Dist desplazada 216.3 m"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "03", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" },
        { rwy: "21", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPAS",
      name: "ANDOAS",
      city: "ANDOAS",
      region: "LORETO",
      department: "LORETO",
      arpLatitude: "02°47'45.99\"S",
      arpLongitude: "076°27'59.75\"W",
      elevation: "222 m / 728 ft",
      temperature: "32.8°C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "1.5 km del campamento",
      administrationType: "PACIFIC STRATUS ENERGY DEL PERÚ S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Privado. AFIS. Horario según necesidad del explotador. Plataforma 114.5 m x 55 m. No se permite aterrizaje/despegue helicópteros en PEA durante operaciones.",
      operatingHours: JSON.stringify({
        combustible: "HJ",
        seguridad: "HJ",
        com: "HJ"
      }),
      fireCategory: "CAT 6",
      fuelTypes: "AVGAS, Turbo A1",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "NIL" }),
      runways: JSON.stringify([
        {
          designator: "12",
          brgGeo: "120°",
          brgMag: "120°",
          dimensions: "2057 X 45",
          pcn: "PCN 27 F/D/X/T",
          surface: "Asfalto",
          thrCoords: "02°47'29.79''S - 076°28'28.91''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "NIL",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.35%",
          papi: "ALS / PAPI 3° doble barra de ala RWY 12",
          lights: "RTHL RWY 12/30, REDL"
        },
        {
          designator: "30",
          brgGeo: "300°",
          brgMag: "300°",
          dimensions: "2057 X 45",
          pcn: "PCN 27 F/D/X/T",
          surface: "Asfalto",
          thrCoords: "02°48'02.20''S - 076°27'30.60''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "NIL",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.35%",
          lights: "RTHL RWY 12/30, REDL, WDI ambas RWY 12/30"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "12", tora: 2057, toda: 2057, asda: 2117, lda: 2057, remarks: "NIL" },
        { rwy: "30", tora: 2057, toda: 2057, asda: 2117, lda: 2057, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPHZ",
      name: "COMANDANTE FAP GERMÁN ARIAS GRAZIANI",
      city: "ANTA HUARAZ",
      region: "ANCASH",
      department: "ANCASH",
      arpLatitude: "09°21'38\"S",
      arpLongitude: "077°35'38\"W",
      elevation: "2748 m / 9015.2 ft",
      temperature: "24.2° C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "28 km de la ciudad de Huaraz",
      administrationType: "AEROPUERTOS DEL PERÚ S.A. - ADP",
      aftn: "SPHZYSYX",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Plataforma 200 m x 80 m al NE de pista. Calle rodaje perpendicular 27 m x 23 m. Transponder código 2000.",
      operatingHours: JSON.stringify({
        administracion: "1300-2100 UTC",
        oficinaMET: "1300-2100 UTC",
        ats: "1300-2100 UTC",
        com: "1300-2100 UTC",
        notas: "CLSD SUN"
      }),
      fireCategory: "CAT A5",
      fuelTypes: "NIL",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 490/F/D/X/T" }),
      taxiwayData: JSON.stringify({ nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 490/F/D/X/T" }),
      runways: JSON.stringify([
        {
          designator: "16",
          brgGeo: "160°",
          brgMag: "160°",
          dimensions: "2900 X 30",
          pcn: "PCN 420/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "09°20'08.01''S - 077°36'07.68''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "3020 X 80",
          ofz: "NIL",
          resa: "90 X 60",
          slope: "+1.435%"
        },
        {
          designator: "34",
          brgGeo: "340°",
          brgMag: "340°",
          dimensions: "2900 X 30",
          pcn: "PCN 420/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "09°21'37.77''S - 077°35'38.47''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "3020 X 80",
          ofz: "NIL",
          resa: "90 X 60",
          slope: "+1.435%",
          papi: "APAPI 3° RWY 34",
          dthr: "DTHR RWY 34: 09°21'26.937''S - 077°35'41.991''W (350M)"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "16", tora: 2900, toda: 2900, asda: 2900, lda: 2900, remarks: "NIL" },
        { rwy: "34", tora: 2900, toda: 2900, asda: 2900, lda: 2900, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPAY",
      name: "ATALAYA",
      city: "ATALAYA",
      region: "UCAYALI",
      department: "UCAYALI",
      arpLatitude: "10°43'43\"S",
      arpLongitude: "073°45'58\"W",
      elevation: "579 m / 1900 ft",
      temperature: "32.7° C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "2 km",
      administrationType: "CORPAC S.A.",
      aftn: "SPAYYSYX",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Peligro aviario RWY 04. Deterioro capa asfáltica RWY 22. AFIS sin visualización de pista. Postes cemento 8 m a 150 m umbral RWY 22.",
      operatingHours: JSON.stringify({
        administracion: "HJ",
        oficinaMET: "1300-2100 UTC",
        ats: "1300-2100 UTC",
        com: "1300-2100 UTC"
      }),
      fireCategory: "CAT A3",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "04",
          brgGeo: "040°",
          brgMag: "040°",
          dimensions: "1500 X 30",
          pcn: "PCN 27/F/A/X/T",
          surface: "Asfalto",
          thrCoords: "NIL",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "1620 X 150",
          ofz: "NIL",
          resa: "NIL"
        },
        {
          designator: "22",
          brgGeo: "220°",
          brgMag: "220°",
          dimensions: "1500 X 30",
          pcn: "PCN 27/F/A/X/T",
          surface: "Asfalto",
          thrCoords: "NIL",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "1620 X 150",
          ofz: "NIL",
          resa: "NIL",
          papi: "PAPI 3° RWY 22, Elev 29.38 ft"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "04", tora: 1500, toda: 1500, asda: 1500, lda: 1500, remarks: "NIL" },
        { rwy: "22", tora: 1500, toda: 1500, asda: 1500, lda: 1500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPHO",
      name: "CORONEL FAP ALFREDO MENDÍVIL DUARTE",
      city: "AYACUCHO",
      region: "AYACUCHO",
      department: "AYACUCHO",
      arpLatitude: "13°09'17\"S",
      arpLongitude: "074°12'16\"W",
      elevation: "2743 m / 8999.32 ft",
      temperature: "27.1° C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "3.4 km NE",
      administrationType: "Aeropuertos Andinos del Perú S.A.",
      aftn: "SPHOZTZX",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Jet A1 requiere coordinación con HERCO. Operadores vuelos no regulares coordinar FPL 24h antes a aypcoordinacionesfpl@aap.com.pe",
      operatingHours: JSON.stringify({
        administracion: "1100-2300 UTC",
        oficinaAIS: "1000-2300 UTC",
        oficinaARO: "1000-2300 UTC",
        oficinaMET: "1000-2300 UTC",
        ats: "1000-2300 UTC",
        combustible: "1100-2300 UTC",
        com: "1000-2300 UTC"
      }),
      fireCategory: "CAT A5",
      fuelTypes: "AVGAS 100, JET A1",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 52/F/B/X/T" }),
      taxiwayData: JSON.stringify({ ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 52/F/B/X/T" }),
      runways: JSON.stringify([
        {
          designator: "02",
          brgGeo: "020°",
          brgMag: "020°",
          dimensions: "2800 X 45",
          pcn: "PCN 52/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "13°09'59.11''S - 074°12'33.74''W",
          thrElevation: "2736 M / 8976 FT",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2920 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.256%",
          remarks: "TKOF RWY 02 sin restricciones, LDG RWY 02 No disponible"
        },
        {
          designator: "20",
          brgGeo: "200°",
          brgMag: "200°",
          dimensions: "2800 X 45",
          pcn: "PCN 52/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "13°08'34.96''S - 074°11'58.00''W",
          thrElevation: "2743 M / 8999 FT",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2920 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.256%",
          papi: "PAPI Left side/2.8° RWY 20, Elev 49.78 ft",
          remarks: "TKOF RWY 20 No disponible, LDG RWY 20 NPA y Visual"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "02", tora: 2800, toda: 2800, asda: 2800, lda: 2800, remarks: "NIL" },
        { rwy: "20", tora: 2800, toda: 2800, asda: 2800, lda: 2800, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPJR",
      name: "MAYOR GENERAL FAP ARMANDO REVOREDO IGLESIAS",
      city: "CAJAMARCA",
      region: "CAJAMARCA",
      department: "CAJAMARCA",
      arpLatitude: "07°08'21\"S",
      arpLongitude: "078°29'22\"W",
      elevation: "2697 m / 8848 ft",
      temperature: "21.9° C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "3.5 km SE",
      administrationType: "AEROPUERTOS DEL PERÚ S.A. - ADP",
      aftn: "SPJRZTZX",
      authorizedTraffic: "IFR/VFR",
      remarks: "Uso Público. ATZ: círculo 4 NM centro ARP, GND/13000 ft AMSL, Clase D. Despegue turbohélice hasta 15 min antes puesta sol. Solo IFR bajo RNAV RNP-AR ceiling 1200 ft VIS 5 km. MSA 16000 ft RDO 25 NM THR 34. Pernocte no disponible. RNP RWY34 (AR) suspendido. Viraje en pista no permitido para medianas o superiores.",
      operatingHours: JSON.stringify({
        administracion: "1100-2300 UTC",
        oficinaAIS: "1100-2300 UTC",
        oficinaARO: "1100-2300 UTC",
        oficinaMET: "1100-2300 UTC",
        ats: "1100-2300 UTC",
        seguridad: "1100-2300 UTC",
        com: "1100-2300 UTC"
      }),
      fireCategory: "CAT A7",
      fuelTypes: "NIL",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 480/F/D/X/T" }),
      taxiwayData: JSON.stringify({ nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 500/F/D/X/T" }),
      runways: JSON.stringify([
        {
          designator: "16",
          brgGeo: "160°",
          brgMag: "160°",
          dimensions: "2500 X 45",
          pcn: "PCN 440/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "07°07'43.44''S - 078°29'38.28''W",
          thrElevation: "8848 FT",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2620 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "+1.907%"
        },
        {
          designator: "34",
          brgGeo: "340°",
          brgMag: "340°",
          dimensions: "2500 X 45",
          pcn: "PCN 440/F/C/X/T",
          surface: "Asfalto",
          thrCoords: "07°08'58.41''S - 078°29'06.71''W",
          thrElevation: "8758 FT",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2620 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "+1.907%",
          papi: "PAPI 3° RWY 34, Elev 45.17 ft"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "16", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" },
        { rwy: "34", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPPY",
      name: "CHACHAPOYAS",
      city: "CHACHAPOYAS",
      region: "AMAZONAS",
      department: "AMAZONAS",
      arpLatitude: "06°12'07\"S",
      arpLongitude: "077°51'22\"W",
      elevation: "2540 m / 8333 ft",
      temperature: "20.9° C",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "5 km N",
      administrationType: "AEROPUERTOS DEL PERÚ S.A.- ADP",
      aftn: "SPPYYSYX",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Calle rodaje perpendicular 380 m Umbral RWY 31, 105 m x 23 m. Plataforma SE de pista 380 m Umbral RWY 31, 100 m x 80 m.",
      operatingHours: JSON.stringify({
        administracion: "1300-2100 UTC",
        oficinaARO: "1300-2100 UTC",
        oficinaMET: "1300-2100 UTC",
        ats: "1300-2100 UTC O/R",
        com: "1300-2100 UTC O/R",
        notas: "CLSD SUN"
      }),
      fireCategory: "CAT A5",
      fuelTypes: "NIL",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 270/F/C/X/T" }),
      taxiwayData: JSON.stringify({ nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 270/F/C/X/T" }),
      runways: JSON.stringify([
        {
          designator: "13",
          brgGeo: "130°",
          brgMag: "130°",
          dimensions: "1980 X 30",
          pcn: "PCN 260/F/D/X/T",
          surface: "Asfalto",
          thrCoords: "06°11'45.70''S - 077°51'45.40''W",
          thrElevation: "8302 FT",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2100 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.86%",
          papi: "APAPI 3° RWY 13, Elev 33.42 ft"
        },
        {
          designator: "31",
          brgGeo: "310°",
          brgMag: "310°",
          dimensions: "1980 X 30",
          pcn: "PCN 260/F/D/X/T",
          surface: "Asfalto",
          thrCoords: "06°12'29.00''S - 077°50'57.80''W",
          thrElevation: "8358 FT",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2100 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.86%",
          remarks: "LDG/TKOF ambas Visual"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "13", tora: 1980, toda: 1980, asda: 2040, lda: 1980, remarks: "NIL" },
        { rwy: "31", tora: 1980, toda: 1980, asda: 2040, lda: 1980, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPEO",
      name: "TENIENTE FAP JAIME A. DE MONTREUIL MORALES",
      city: "CHIMBOTE",
      region: "ANCASH",
      department: "ANCASH",
      arpLatitude: "09°09'04.2\"S",
      arpLongitude: "078°31'25.8\"W",
      elevation: "21 m / 69 ft",
      temperature: "27.9°C (FEB)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "12 km SE",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios AFIS/FIS/ALRS/COM/MET/AIS/ARO. Zona CHIMBOTE FIZ: Círculo 22 NM radio centro VOR BTE, GND/FL065. Despegues VFR solo diurnas. Peligro aviario RWY 01. Pistola de señales inutilizable. Obstáculo antena 30m a 496m Umbral RWY 19 y 25m a 570m Umbral RWY 19. LDG: RWY 19 Aproximación de no precisión / RWY 01 Aproximación visual. TKOF: RWY 19/01.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2100",
        ats: "1300-2100 y O/R",
        seguridad: "1300-2100 y O/R",
        com: "1300-2100",
        notas: "Aeródromo opera L-S, cerrado domingos"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "01",
          brgGeo: "010°",
          brgMag: "010°",
          dimensions: "1800 X 30",
          pcn: "PCN 21 F/A/Y/U",
          surface: "Asfalto",
          thrCoords: "09°09'28.1''S - 078°31'29.3''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2100 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.89%"
        },
        {
          designator: "19",
          brgGeo: "190°",
          brgMag: "190°",
          dimensions: "1800 X 30",
          pcn: "PCN 21 F/A/Y/U",
          surface: "Asfalto",
          thrCoords: "09°08'30.1''S - 078°31'20.7''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2100 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.89%",
          papi: "PAPI 3° RWY 19",
          wdi: "WDI RWY 19"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "01", tora: 1800, toda: 1800, asda: 1860, lda: 1800, remarks: "NIL" },
        { rwy: "19", tora: 1800, toda: 1800, asda: 1860, lda: 1800, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPNC",
      name: "ALFÉREZ FAP DAVID FIGUEROA FERNANDINI",
      city: "HUÁNUCO",
      region: "HUÁNUCO",
      department: "HUÁNUCO",
      province: "HUÁNUCO",
      district: "HUÁNUCO",
      arpLatitude: "09°52'43.25\"S",
      arpLongitude: "076°12'16.45\"W",
      elevation: "1850 m / 6070 ft",
      temperature: "28°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "6 km NE",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios FIS/AFIS/COM/MET/AIS/ARO/ALRS. Solo operaciones diurnas y VFR. Opera L-D 1400/2200. Precaución vuelos militares sin COM. DTHR RWY 07 = 300 m. Márgenes laterales 7.5 m. Virajes después del aterrizaje prohibidos. Orientación pista: 068°/248°. Calle rodaje: perpendicular a 1190 m del THR RWY 07, 60.5 m x 18 m. Plataforma: 120 m x 60 m lado norte.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2200",
        oficinaARO: "1300-2200",
        oficinaAIS: "1300-2200",
        ats: "1400-2200",
        seguridad: "1400-2200",
        com: "1300-2200",
        notas: "Aeródromo opera L-D 1400/2200"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "07",
          brgGeo: "068°",
          brgMag: "068°",
          dimensions: "2500 X 30",
          pcn: "PCN 34 F/C/X/T",
          surface: "Asfalto",
          thrCoords: "09°52'58.70''S - 076°12'54.40''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2710 X 100-150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.53%",
          dthr: "DTHR 07 = 300 m"
        },
        {
          designator: "25",
          brgGeo: "248°",
          brgMag: "248°",
          dimensions: "2500 X 30",
          pcn: "PCN 34 F/C/X/T",
          surface: "Asfalto",
          thrCoords: "09°52'27.80''S - 076°11'38.50''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2710 X 100-150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.53%"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "07", tora: 2500, toda: 2500, asda: 2500, lda: 2200, remarks: "DTHR 300 m" },
        { rwy: "25", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPJE",
      name: "FERNANDO BELAÚNDE TERRY",
      city: "JAÉN",
      region: "CAJAMARCA",
      department: "CAJAMARCA",
      province: "JAÉN",
      district: "JAÉN",
      arpLatitude: "05°35'29\"S",
      arpLongitude: "078°46'17\"W",
      elevation: "755 m / 2477 ft",
      temperature: "33.8°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "17 km al N",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios AFIS/FIS/ALRS. Solo operaciones diurnas y VFR. Cerrado domingos. DTHR RWY 34 = 300 m por fisuras. Nuevas distancias declaradas: RWY 34 TORA 2100, TODA 2100, ASDA 2200, LDA 2100. RWY 16 TORA 2100, TODA 2100, ASDA 2100, LDA 2100. Desniveles en Pista 16/34. Orientación pista: 160°/340°. Plataforma: 120 m x 70 m, concreto.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2100",
        ats: "1300-2100 y O/R",
        seguridad: "1300-2100 y O/R",
        com: "1300-2100",
        notas: "Cerrado domingos"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "16",
          brgGeo: "160°",
          brgMag: "160°",
          dimensions: "2400 X 45",
          pcn: "PCN 54 F/D/X/T",
          surface: "Primeros 2100 m Asfalto",
          thrCoords: "NIL",
          thrElevation: "NIL",
          swyDimensions: "100 X 51",
          cwyDimensions: "NIL",
          stripDimensions: "2600 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.116%"
        },
        {
          designator: "34",
          brgGeo: "340°",
          brgMag: "340°",
          dimensions: "2400 X 45",
          pcn: "PCN 54 F/D/X/T",
          surface: "Primeros 2100 m Asfalto",
          thrCoords: "NIL",
          thrElevation: "54.68 ft / 16.67 m",
          swyDimensions: "100 X 51",
          cwyDimensions: "NIL",
          stripDimensions: "2600 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.116%",
          dthr: "DTHR 34 = 300 m por fisuras",
          papi: "PAPI 3° RWY 34 INOP"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "16", tora: 2100, toda: 2100, asda: 2100, lda: 2100, remarks: "DTHR RWY 34 = 300 m" },
        { rwy: "34", tora: 2100, toda: 2100, asda: 2200, lda: 2100, remarks: "DTHR 300 m por fisuras" }
      ])
    },
    {
      icaoCode: "SPJJ",
      name: "FRANCISCO CARLÉ",
      city: "JAUJA",
      region: "JUNÍN",
      department: "JUNÍN",
      province: "JAUJA",
      district: "JAUJA",
      arpLatitude: "11°47'0.20\"S",
      arpLongitude: "075°28'24.10\"W",
      elevation: "3363 m / 11034 ft",
      temperature: "21.7°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "2 km SE",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios AFIS/FIS/ALRS. Solo operaciones diurnas y VFR. AFIS sin visualización área aterrizaje y umbrales. Pistola de señales disponible. Virajes después del aterrizaje RWY 31 prohibidos. Orientación pista: 130°/310°. Calle rodaje: a 1305 m del THR RWY 31, 42.5 m x 23 m. Plataforma: 90 m x 70 m.",
      operatingHours: JSON.stringify({
        oficinaMET: "1000-2300",
        ats: "1100-2300",
        seguridad: "1100-2300",
        com: "1000-2300"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "13",
          brgGeo: "130°",
          brgMag: "130°",
          dimensions: "2810 X 45",
          pcn: "PCN 46 F/C/W/T",
          surface: "Asfalto",
          thrCoords: "11°46'32.15''S - 075°29'0.77''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 51",
          cwyDimensions: "NIL",
          stripDimensions: "2930 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.299%"
        },
        {
          designator: "31",
          brgGeo: "310°",
          brgMag: "310°",
          dimensions: "2810 X 45",
          pcn: "PCN 46 F/C/W/T",
          surface: "Asfalto",
          thrCoords: "11°47'28.20''S - 075°27'47.42''W",
          thrElevation: "45.67 ft / 13.92 m",
          swyDimensions: "60 X 51",
          cwyDimensions: "NIL",
          stripDimensions: "2930 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.299%",
          papi: "APAPI 3° RWY 31"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "13", tora: 2810, toda: 2810, asda: 2870, lda: 2810, remarks: "NIL" },
        { rwy: "31", tora: 2810, toda: 2810, asda: 2870, lda: 2810, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPJI",
      name: "JUANJUÍ",
      city: "JUANJUÍ",
      region: "SAN MARTÍN",
      department: "SAN MARTÍN",
      province: "MARISCAL CÁCERES",
      district: "JUANJUÍ",
      arpLatitude: "07°10'11\"S",
      arpLongitude: "076°43'45\"W",
      elevation: "350 m / 1148 ft",
      temperature: "33°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "1 km W",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios AFIS/FIS/ALRS. Cerrado domingos. Obstáculo: Antena 38.50 m altura, coords 07°10'09''S - 076°43'20''W. Orientación pista: 030°/210°.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2100",
        ats: "1300-2100",
        seguridad: "1300-2100",
        com: "1300-2100",
        notas: "Cerrado domingos"
      }),
      fireCategory: "CAT 1",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "03",
          brgGeo: "030°",
          brgMag: "030°",
          dimensions: "2000 X 30",
          pcn: "PCN 14 F/C/X/T",
          surface: "Terreno natural",
          thrCoords: "07°10'38.9''S - 076°44'03.7''W",
          thrElevation: "282 m / 925 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2300 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.35%"
        },
        {
          designator: "21",
          brgGeo: "210°",
          brgMag: "210°",
          dimensions: "2000 X 30",
          pcn: "PCN 14 F/C/X/T",
          surface: "Terreno natural",
          thrCoords: "07°09'31.5''S - 076°43'18.0''W",
          thrElevation: "274 m / 899 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2300 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.35%"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "03", tora: 2000, toda: 2000, asda: 2000, lda: 2000, remarks: "NIL" },
        { rwy: "21", tora: 2000, toda: 2000, asda: 2000, lda: 2000, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPMF",
      name: "MAYOR PNP NANCY FLORES PÁUCAR",
      city: "MAZAMARI",
      region: "JUNÍN",
      department: "JUNÍN",
      province: "SATIPO",
      district: "MAZAMARI",
      arpLatitude: "11°19'31.86\"S",
      arpLongitude: "074°32'08.98\"W",
      elevation: "664 m / 2180 ft",
      temperature: "32.6°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "0.5 km",
      administrationType: "POLICÍA NACIONAL DEL PERÚ - MINISTERIO DEL INTERIOR / Administrador CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Uso Público. Se brindan servicios AFIS/FIS/ALRS. Cerrado domingos. Obstáculos: Postes cemento 8m a 75m Umbral RWY 15; Antena 25m a 60m Umbral RWY 33 lado derecho. AFIS sin visualización primeros 500m Umbral RWY 15 y plataforma. Helicópteros estacionan ambos lados franja primeros 150m RWY 33. Orientación pista: 150°/330°. Plataforma: 95 m x 70 m.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2300",
        ats: "1300-2300",
        seguridad: "1300-2300",
        com: "1300-2300",
        notas: "Cerrado domingos"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "15",
          brgGeo: "150°",
          brgMag: "150°",
          dimensions: "1760 X 30",
          pcn: "PCN 34 F/C/Y/T",
          surface: "Asfalto",
          thrCoords: "11°19'06.44''S - 074°32'22.37''W",
          thrElevation: "NIL",
          swyDimensions: "40 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "1800 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "2.145%",
          papi: "PAPI 3.1° RWY 15"
        },
        {
          designator: "33",
          brgGeo: "330°",
          brgMag: "330°",
          dimensions: "1760 X 30",
          pcn: "PCN 34 F/C/Y/T",
          surface: "Asfalto",
          thrCoords: "11°19'57.28''S - 074°31'55.59''W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "1800 X 100",
          ofz: "NIL",
          resa: "NIL",
          slope: "2.145%"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "15", tora: 1760, toda: 1760, asda: 1800, lda: 1760, remarks: "NIL" },
        { rwy: "33", tora: 1760, toda: 1760, asda: 1760, lda: 1760, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPJA",
      name: "AERÓDROMO RIOJA",
      city: "RIOJA",
      region: "SAN MARTÍN",
      department: "SAN MARTÍN",
      province: "RIOJA",
      district: "RIOJA",
      arpLatitude: "06º04'04.05\"S",
      arpLongitude: "077º09'35.3\"W",
      elevation: "2707 ft",
      temperature: "29.4°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "1 km E",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Solo operaciones diurnas y en condiciones visuales. Se brindan servicios AFIS/FIS/ALRS/COM/MET/ARO/AIS/RFFS.",
      operatingHours: JSON.stringify({
        ats: "HJ",
        com: "HJ",
        notas: "Solo operaciones diurnas"
      }),
      fireCategory: "NIL",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "16",
          brgGeo: "160°",
          brgMag: "NIL",
          dimensions: "1880 X 30",
          pcn: "PCN F/C/X/T",
          surface: "Asfalto",
          thrCoords: "06°03'34.4''S - 077°09'42.8''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2000 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.296%",
          papi: "PAPI 3° RWY 16"
        },
        {
          designator: "34",
          brgGeo: "340°",
          brgMag: "NIL",
          dimensions: "1880 X 30",
          pcn: "PCN F/C/X/T",
          surface: "Asfalto",
          thrCoords: "06°04'33.7''S - 077°09'27.8''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2000 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.296%"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "16", tora: 1880, toda: 1880, asda: 1880, lda: 1880, remarks: "NIL" },
        { rwy: "34", tora: 1880, toda: 1880, asda: 1880, lda: 1880, remarks: "NIL" }
      ]),
      taxiwayData: JSON.stringify({ tipo: "Perpendicular", distancia: "637 m del umbral RWY 16", dimensiones: "120 m x 23 m", superficie: "Asfalto" }),
      platformData: JSON.stringify({ ubicacion: "Suroeste de pista", distancia: "587 m del umbral RWY 16", dimensiones: "100 m x 60 m", superficie: "Concreto" })
    },
    {
      icaoCode: "SPST",
      name: "AEROPUERTO NACIONAL CADETE FAP GUILLERMO DEL CASTILLO PAREDES",
      city: "TARAPOTO",
      region: "SAN MARTÍN",
      department: "SAN MARTÍN",
      province: "SAN MARTÍN",
      district: "TARAPOTO",
      arpLatitude: "06º30'31.5\"S",
      arpLongitude: "076°22'23.7\"W",
      elevation: "264 m / 868 ft",
      temperature: "33.4°C (NOV)",
      geoidalUndulation: "NIL",
      magneticDeclination: "4°W (JAN 2020)",
      annualChange: "0°10' W",
      distanceFromCity: "2.7 km SW",
      administrationType: "Aeropuertos del Perú S.A. - ADP",
      address: "Av. Aviación 662, Tarapoto - San Martín",
      phone: "NIL",
      fax: "NIL",
      aftn: "NIL",
      email: "NIL",
      authorizedTraffic: "VFR / IFR",
      remarks: "NIL",
      operatingHours: JSON.stringify({
        administracion: "1200-2359 y O/R",
        aduana: "NIL",
        inmigracion: "NIL",
        serviciosMedicos: "NIL",
        oficinaAIS: "1200-2359 y O/R",
        oficinaARO: "1200-2359 y O/R",
        oficinaMET: "1200-2359 y O/R",
        ats: "1200-2359 y O/R",
        combustible: "1200-2359 y O/R",
        despacho: "NIL",
        seguridad: "NIL",
        descongelamiento: "NIL",
        com: "1200-2359 y O/R"
      }),
      cargoHandlingFacilities: "Cargo by SEAS/particular",
      fuelTypes: "AVGAS Turbo A1",
      lubricantTypes: "NIL",
      refuelingFacilities: "NIL",
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "NIL",
      restaurants: "NIL",
      transport: "NIL",
      medicalFacilities: "NIL",
      bankingPost: "NIL",
      tourismOffice: "NIL",
      passengerRemarks: "NIL",
      fireCategory: "CAT 7",
      rescueEquipment: "NIL",
      aircraftRemovalCapacity: "NIL",
      rescueRemarks: "NIL",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 44 R/B/W/T" }),
      taxiwayData: JSON.stringify([
        { nombre: "ALFA", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 40 F/C/X/T" },
        { nombre: "BRAVO", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 25 F/C/X/T" },
        { nombre: "PARALELA 1", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 45 F/B/X/T" },
        { nombre: "PARALELA 2", ancho: "23 m", superficie: "Asfalto", resistencia: "PCN 36 F/B/X/T" }
      ]),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "NIL" }),
      platformRemarks: "Coeficiente de fricción: 0.85",
      surfaceGuidance: "NIL",
      runwaySigns: "NIL",
      taxiwaySigns: "NIL",
      stopBars: "NIL",
      metOffice: "EMA",
      metHours: "1300-0100, O/R fuera de horario",
      metForecastOffice: "OMA/SPJC",
      metValidity: "6 y 12 horas",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "Sí",
      metConsultation: "Personal",
      metDocumentation: "Pronóstico Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "Mapas meteorológicos",
      metSupplementary: "Terminal AMHS CADAS/Banco datos/Internet",
      metAtsDependencies: "TWR",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "17",
          brgGeo: "169.8°",
          brgMag: "174°",
          dimensions: "2600 X 45",
          pcn: "PCN 41 F/B/X/T",
          surface: "Asfalto",
          thrCoords: "06°29'49.82''S - 076°22'31.17''W",
          thrElevation: "866 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2720 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.904%",
          dthr: "DTHR 350 m"
        },
        {
          designator: "35",
          brgGeo: "349.8°",
          brgMag: "354°",
          dimensions: "2600 X 45",
          pcn: "PCN 41 F/B/X/T",
          surface: "Asfalto",
          thrCoords: "06°31'13.14''S - 076°22'16.20''W",
          thrElevation: "789 ft",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2720 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.904%"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "17", tora: 2600, toda: 2600, asda: 2600, lda: 2250, remarks: "DTHR 350 m" },
        { rwy: "35", tora: 2600, toda: 2600, asda: 2600, lda: 2600, remarks: "NIL" }
      ])
    },
    {
      icaoCode: "SPGM",
      name: "AERÓDROMO TINGO MARÍA",
      city: "TINGO MARÍA",
      region: "HUÁNUCO",
      department: "HUÁNUCO",
      province: "LEONCIO PRADO",
      district: "RUPA-RUPA",
      arpLatitude: "09º17'22.8\"S",
      arpLongitude: "076º00'18.2\"W",
      elevation: "2146 ft",
      temperature: "30.9°C (SEP)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "0.9 km",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Solo operaciones diurnas y condiciones visuales. Primeros 300 m de Pista 19 no disponibles. Peligro aviario Pista 19. Aeronaves que operen en Tocache (SPCH) y Palmas del Espino (SPPN) coordinarán en frecuencia 126.9 MHz.",
      operatingHours: JSON.stringify({
        oficinaMET: "1300-2100",
        ats: "1300-2100",
        com: "1300-2100",
        notas: "Lunes a Sábado, cerrado domingos"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "19",
          brgGeo: "190°",
          brgMag: "NIL",
          dimensions: "2100 X 30",
          pcn: "PCN 14 F/D/X/U",
          surface: "Grava",
          thrCoords: "09°16'47.9''S - 076°00'14.8''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2190 X 120",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.47%",
          papi: "APAPI 3° RWY 19",
          restrictions: "LDG RWY 19 visual approach only"
        },
        {
          designator: "01",
          brgGeo: "010°",
          brgMag: "NIL",
          dimensions: "2100 X 30",
          pcn: "PCN 14 F/D/X/U",
          surface: "Grava",
          thrCoords: "09°17'55.6''S - 076°00'21.5''W",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "2190 X 120",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.47%",
          restrictions: "TKOF RWY 01 sin restricciones"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "19", tora: 1800, toda: 1860, asda: 1860, lda: 1800, remarks: "Primeros 300 m no disponibles" },
        { rwy: "01", tora: 1800, toda: 1800, asda: 1800, lda: 1800, remarks: "NIL" }
      ]),
      platformData: JSON.stringify({ ubicacion: "Adyacente a pista", distancia: "160 m del umbral RWY 01", dimensiones: "90 m x 50 m" })
    },
    {
      icaoCode: "SPMS",
      name: "AERÓDROMO MOISÉS BENZAQUEN RENGIFO",
      city: "YURIMAGUAS",
      region: "LORETO",
      department: "LORETO",
      province: "ALTO AMAZONAS",
      district: "YURIMAGUAS",
      arpLatitude: "05º53'37\"S",
      arpLongitude: "076º07'05\"W",
      elevation: "587 ft",
      temperature: "33.2°C (SEP)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "1 km W",
      administrationType: "CORPAC S.A.",
      authorizedTraffic: "VFR",
      remarks: "Solo operaciones diurnas y condiciones visuales. Aterrizajes Pista 09, despegues Pista 27. Peligro aviario Pista 09.",
      operatingHours: JSON.stringify({
        oficinaMET: "1200-2300",
        ats: "1200-2300",
        com: "1200-2300",
        notas: "Solo operaciones diurnas"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "09",
          brgGeo: "090°",
          brgMag: "NIL",
          dimensions: "1800 X 30",
          pcn: "PCN 20 F/C/Y/U",
          surface: "Asfalto",
          thrCoords: "NIL",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "1920 X 80",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.8%",
          papi: "APAPI 2.8° RWY 09",
          restrictions: "LDG RWY 09"
        },
        {
          designator: "27",
          brgGeo: "270°",
          brgMag: "NIL",
          dimensions: "1800 X 30",
          pcn: "PCN 20 F/C/Y/U",
          surface: "Asfalto",
          thrCoords: "NIL",
          thrElevation: "NIL",
          swyDimensions: "60 X 30",
          cwyDimensions: "NIL",
          stripDimensions: "1920 X 80",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.8%",
          restrictions: "TKOF RWY 27"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "09", tora: 1800, toda: 1800, asda: 1800, lda: 1800, remarks: "NIL" },
        { rwy: "27", tora: 1800, toda: 1800, asda: 1800, lda: 1800, remarks: "NIL" }
      ]),
      taxiwayData: JSON.stringify([
        { tipo: "Perpendicular", distancia: "22 m umbral RWY 27", dimensiones: "52 m x 23 m" },
        { tipo: "Perpendicular", distancia: "105 m umbral RWY 27", dimensiones: "52 m x 23 m" }
      ]),
      platformData: JSON.stringify({ ubicacion: "Lado Sur de pista, cercana umbral RWY 27", dimensiones: "135 m x 40 m" })
    },
    // === SPTU - PUERTO MALDONADO / PADRE ALDAMIZ ===
    {
      icaoCode: "SPTU",
      name: "AEROPUERTO INTERNACIONAL PADRE ALDAMIZ",
      city: "PUERTO MALDONADO",
      region: "MADRE DE DIOS",
      department: "MADRE DE DIOS",
      province: "TAMBOPATA",
      district: "PUERTO MALDONADO",
      arpLatitude: "12°36'49.79\"S",
      arpLongitude: "069°13'43.24\"W",
      elevation: "201 m / 659 ft",
      temperature: "33.1°C (OCT)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "7 km W",
      administrationType: "AEROPUERTOS ANDINOS DEL PERÚ S.A. - AAP",
      authorizedTraffic: "IFR / VFR",
      remarks: "Debido a proximidad del terminal de pasajeros con la plataforma, las aeronaves iniciarán rodaje utilizando mínima potencia. Peligro aviario en las pistas 01/19. Operadores de vuelos no regulares coordinar 24h antes de ETD con AAP: pemcoordinacionesfpl@aap.com.pe",
      operatingHours: JSON.stringify({
        aisAro: "1100 - 2300",
        comMet: "1100 - 2300",
        combustible: "1100 - 2300 y O/R",
        sei: "CAT 5, 1100 - 2300 y O/R"
      }),
      fireCategory: "CAT 5",
      fuelTypes: "AVGAS / Turbo Jet A1",
      runways: JSON.stringify([
        {
          designator: "01",
          brgGeo: "001°",
          brgMag: "NIL",
          dimensions: "3500 X 45",
          pcn: "PCN 69 R/C/X/T",
          surface: "Concreto",
          thrCoords: "12°37'46.71\"S - 069°13'45.67\"W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "3620 X 150",
          ofz: "NIL",
          resa: "90 X 90",
          slope: "0.072%",
          papi: "PAPI 3° RWY 01, Elev 16.83 m / 55.22 ft",
          restrictions: "LDG RWY 01"
        },
        {
          designator: "19",
          brgGeo: "190°",
          brgMag: "NIL",
          dimensions: "3500 X 45",
          pcn: "PCN 69 R/C/X/T",
          surface: "Concreto",
          thrCoords: "12°35'52.87\"S - 069°13'40.82\"W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "3620 X 150",
          ofz: "NIL",
          resa: "90 X 90",
          slope: "0.072%",
          papi: "PAPI 3° RWY 19, Elev 17.26 m / 56.62 ft",
          restrictions: "TKOF RWY 19"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "01", tora: 3500, toda: 3500, asda: 3500, lda: 3500, remarks: "NIL" },
        { rwy: "19", tora: 3500, toda: 3500, asda: 3500, lda: 3500, remarks: "NIL" }
      ]),
      taxiwayData: JSON.stringify({ tipo: "Perpendicular", ubicacion: "Lado izquierdo sentido 19-01, a 560 m del THR 19", dimensiones: "625 m x 24 m", superficie: "Concreto" }),
      platformData: JSON.stringify({ dimensiones: "204 m x 90 m", superficie: "Concreto" })
    },
    // === SPLO - ILO / GENERAL JORGE FERNÁNDEZ MALDONADO SOLARI ===
    {
      icaoCode: "SPLO",
      name: "AEROPUERTO GENERAL JORGE FERNÁNDEZ MALDONADO SOLARI",
      city: "ILO",
      region: "MOQUEGUA",
      department: "MOQUEGUA",
      province: "ILO",
      district: "ILO",
      arpLatitude: "17°41'42\"S",
      arpLongitude: "071°20'38\"W",
      elevation: "22 m / 72 ft",
      temperature: "27.8°C",
      geoidalUndulation: "NIL",
      magneticDeclination: "5°W (2020)",
      annualChange: "0°12'W",
      distanceFromCity: "8 km",
      administrationType: "CORPAC S.A.",
      address: "Carretera Costanera Sur km 7 y 8, Pampa de Palos",
      phone: "(053) 495021 / 978470281",
      fax: "(053) 495021",
      aftn: "SPLOYDYX",
      email: "csotomayor@corpac.gob.pe",
      authorizedTraffic: "IFR / VFR",
      remarks: "Uso: Público. Terreno elevado al Este del Aeródromo, circular por el sector Sur. Debido a la altura de la dependencia AFIS, no se dispone de visualización adecuada de la superficie de la Pista 12/30. Pilotos precaución al despegue y aterrizaje.",
      operatingHours: JSON.stringify({
        administracion: "1300-2100 (UTC)",
        aduanaInmigracion: "NIL",
        serviciosMedicos: "NIL",
        oficinaAIS: "1300-2100 (UTC) O/R",
        oficinaARO: "1300-2100 (UTC) O/R",
        oficinaMET: "1300-2100 (UTC) O/R",
        ats: "1300-2100 (UTC) O/R",
        combustible: "NIL",
        despacho: "NIL",
        seguridad: "NIL",
        descongelamiento: "NIL",
        com: "1300-2100 (UTC) CLSD SUN"
      }),
      cargoHandlingFacilities: "NIL",
      fuelTypes: "NIL",
      lubricantTypes: "NIL",
      refuelingFacilities: "NIL",
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "NIL",
      hotels: "En la ciudad",
      restaurants: "En la ciudad",
      transport: "En la ciudad",
      medicalFacilities: "En la ciudad",
      bankingPost: "NIL",
      tourismOffice: "En la ciudad",
      passengerRemarks: "NIL",
      fireCategory: "CAT A3",
      rescueEquipment: "NIL",
      aircraftRemovalCapacity: "NIL",
      rescueRemarks: "1300-2100 (UTC)",
      platformData: JSON.stringify({ superficie: "Concreto", resistencia: "PCN 49/R/B/X/T" }),
      taxiwayData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 49/F/B/X/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "NIL" }),
      platformRemarks: "NIL",
      surfaceGuidance: "Señalización vertical en puestos de estacionamiento (3). Líneas de estacionamiento en puestos 2 y 3. Señalización horizontal y vertical.",
      runwaySigns: "NIL",
      taxiwaySigns: "NIL",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "1300-2100 (UTC) O/R",
      metForecastOffice: "NIL",
      metValidity: "NIL",
      metLandingForecast: "NIL",
      metTrendInterval: "NIL",
      metBriefing: "NIL",
      metConsultation: "NIL",
      metDocumentation: "NIL",
      metLanguage: "ES",
      metCharts: "NIL",
      metSupplementary: "NIL",
      metAtsDependencies: "ILO AFIS",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "12",
          brgGeo: "115°",
          brgMag: "NIL",
          dimensions: "2500 X 45",
          pcn: "PCN 49/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "17°41'25.00\"S - 071°21'16.80\"W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2820 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.008%"
        },
        {
          designator: "30",
          brgGeo: "295°",
          brgMag: "NIL",
          dimensions: "2500 X 45",
          pcn: "PCN 49/F/B/X/T",
          surface: "Asfalto",
          thrCoords: "17°41'59.20\"S - 071°19'59.50\"W",
          thrElevation: "NIL",
          swyDimensions: "NIL",
          cwyDimensions: "NIL",
          stripDimensions: "2820 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "+0.008%",
          papi: "PAPI 3° RWY 30, Elev 47.62 ft"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "12", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" },
        { rwy: "30", tora: 2500, toda: 2500, asda: 2500, lda: 2500, remarks: "NIL" }
      ])
    },
    // === SPZA - NASCA / MARÍA REICHE NEUMAN ===
    {
      icaoCode: "SPZA",
      name: "AEROPUERTO NACIONAL MARÍA REICHE NEUMAN",
      city: "NASCA",
      region: "ICA",
      department: "ICA",
      province: "NASCA",
      district: "VISTA ALEGRE",
      arpLatitude: "14°51'14.90\"S",
      arpLongitude: "074°57'42.38\"W",
      elevation: "552 m / 1813 ft",
      temperature: "34.6°C (MAR)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "4 km SW",
      administrationType: "CORPAC S.A.",
      address: "Carretera Panamericana Sur Km 452, Vista Alegre, Nasca",
      phone: "056-522801",
      aftn: "NIL",
      email: "lgamboa@corpac.gob.pe",
      authorizedTraffic: "VFR",
      remarks: "Vuelos turísticos Líneas de Nazca y Palpa con procedimientos especiales. Pistola de señales fuera de servicio. Solo operaciones diurnas VFR. Intervalo mínimo 6 min entre despegues.",
      operatingHours: JSON.stringify({
        administracion: "1330 - 2130",
        aduanaInmigracion: "NIL",
        serviciosMedicos: "1100 - 2300",
        oficinaAIS: "1400 - 2200",
        oficinaARO: "1400 - 2200",
        oficinaMET: "1400 - 2200",
        ats: "1400 - 2200",
        combustible: "Cada 10 días",
        despacho: "1100 - 2300",
        seguridad: "H24",
        descongelamiento: "NIL",
        com: "1400 - 2200"
      }),
      cargoHandlingFacilities: "NIL",
      fuelTypes: "AVGAS 100LL y TURBO JET A1",
      lubricantTypes: "NIL",
      refuelingFacilities: "PEA 16 y 17",
      deIcingFacilities: "NIL",
      hangarSpace: "NIL",
      repairFacilities: "NIL",
      scaleRemarks: "OMA 093 Peregrimo Hawk (Part)",
      hotels: "En la ciudad",
      restaurants: "En la ciudad",
      transport: "Taxis desde y hacia la ciudad",
      medicalFacilities: "Primeros auxilios en el AD y hospitales en la ciudad",
      bankingPost: "En la ciudad",
      tourismOffice: "En la ciudad / En el aeropuerto",
      passengerRemarks: "NIL",
      fireCategory: "CAT 4",
      rescueEquipment: "02 vehículos contraincendios",
      aircraftRemovalCapacity: "NIL",
      rescueRemarks: "1400 - 2200",
      platformData: JSON.stringify({ superficie: "Asfalto", resistencia: "PCN 9/F/A/Y/T", ancho: "24.54 m", largo: "446.75 m", observacion: "Obligatorio para embarque y desembarque de pasajeros" }),
      taxiwayData: JSON.stringify({ designadores: "A, B, C, D, E", ancho: "11 m", largo: "1000 m", superficie: "Asfalto", resistencia: "PCN 9/F/A/Y/T" }),
      checkpointData: JSON.stringify({ altimetro: "NIL", ins: "NIL", vordme: "NIL" }),
      platformRemarks: "Nueva área de maniobras en uso",
      surfaceGuidance: "Señalizado por línea continua amarilla, que bordea la aeronave generando línea de protección a su alrededor. Uso de señales ID en puestos de aeronaves.",
      runwaySigns: "NIL",
      taxiwaySigns: "NIL",
      stopBars: "NIL",
      guidanceRemarks: "NIL",
      metOffice: "EMA",
      metHours: "1400 - 2200",
      metForecastOffice: "OMA/SPQU",
      metValidity: "1030 - 2300",
      metLandingForecast: "NO AVBL",
      metTrendInterval: "NO AVBL",
      metBriefing: "NO AVBL",
      metConsultation: "Consulta personal",
      metDocumentation: "Pronóstico, Observaciones e Informes MET",
      metLanguage: "ES",
      metCharts: "NO AVBL",
      metSupplementary: "Terminal AMHS CADAS",
      metAtsDependencies: "TWR/AIS",
      metAdditionalInfo: "NIL",
      runways: JSON.stringify([
        {
          designator: "07",
          brgGeo: "065°",
          brgMag: "NIL",
          dimensions: "1000 X 18",
          pcn: "PCN 9/F/A/Y/T",
          surface: "Asfalto",
          thrCoords: "14°51'21.58\"S - 074°57'57.64\"W",
          thrElevation: "1770 ft / 539.5 m",
          swyDimensions: "30 X 18",
          cwyDimensions: "NIL",
          stripDimensions: "1080 X 80",
          ofz: "NIL",
          resa: "NIL",
          slope: "1.304%"
        },
        {
          designator: "25",
          brgGeo: "245°",
          brgMag: "NIL",
          dimensions: "1000 X 18",
          pcn: "PCN 9/F/A/Y/T",
          surface: "Asfalto",
          thrCoords: "14°51'08.21\"S - 074°57'27.13\"W",
          thrElevation: "1813 ft / 552.5 m",
          swyDimensions: "30 X 18",
          cwyDimensions: "NIL",
          stripDimensions: "1080 X 80",
          ofz: "NIL",
          resa: "NIL",
          slope: "1.304%",
          papi: "APAPI 3° RWY 25 (no disponible a más de 0.8 NM debido a obstáculo)"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "07", tora: 1000, toda: 1000, asda: 1030, lda: 1000, remarks: "NIL" },
        { rwy: "25", tora: 1000, toda: 1000, asda: 1030, lda: 1000, remarks: "NIL" }
      ])
    },
    // === SPME - TUMBES / CAPITÁN FAP PEDRO CANGA RODRÍGUEZ ===
    {
      icaoCode: "SPME",
      name: "AEROPUERTO CAPITÁN FAP PEDRO CANGA RODRÍGUEZ",
      city: "TUMBES",
      region: "TUMBES",
      department: "TUMBES",
      province: "TUMBES",
      district: "TUMBES",
      arpLatitude: "03°33'08.15\"S",
      arpLongitude: "080°22'51.85\"W",
      elevation: "35 m / 115 ft",
      temperature: "31.6°C (MAR)",
      geoidalUndulation: "NIL",
      magneticDeclination: "NIL",
      annualChange: "NIL",
      distanceFromCity: "8.5 km NE",
      administrationType: "AEROPUERTOS DEL PERÚ S.A. - ADP",
      authorizedTraffic: "IFR / VFR",
      remarks: "ATZ: Círculo de 5 NM de radio con centro en VOR BES, GND / 1500 ft AMSL. Para operaciones nocturnas solicitar con 3 horas de anticipación. Aeronaves harán viraje de 180° en plataforma de viraje en Pista 14/32. Mínima potencia en plataforma. Coeficiente de fricción: 0.76. Peligro aviario Pista 14/32.",
      operatingHours: JSON.stringify({
        comMet: "1200 - 0300",
        aisAro: "1500 - 0300",
        sei: "CAT 7, 1500 - 0300"
      }),
      fireCategory: "CAT 7",
      fuelTypes: "NIL",
      runways: JSON.stringify([
        {
          designator: "14",
          brgGeo: "142°",
          brgMag: "NIL",
          dimensions: "2500 X 45",
          pcn: "PCN 47 F/C/X/T",
          surface: "Asfalto",
          thrCoords: "03°32'36.3\"S - 080°23'17.1\"W",
          thrElevation: "24 m / 78 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2800 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.453%",
          papi: "PAPI 3° RWY 14, Elev 15.03 m / 49.30 ft",
          restrictions: "LDG RWY 14 Aproximación Visual"
        },
        {
          designator: "32",
          brgGeo: "322°",
          brgMag: "NIL",
          dimensions: "2500 X 45",
          pcn: "PCN 47 F/C/X/T",
          surface: "Asfalto",
          thrCoords: "03°33'40\"S - 080°22'26.6\"W",
          thrElevation: "35 m / 115 ft",
          swyDimensions: "60 X 45",
          cwyDimensions: "NIL",
          stripDimensions: "2800 X 150",
          ofz: "NIL",
          resa: "NIL",
          slope: "0.453%",
          papi: "PAPI 3° RWY 32, Elev 17.68 m / 58.02 ft",
          restrictions: "LDG RWY 32 Aproximación NPA y Visual"
        }
      ]),
      declaredDistances: JSON.stringify([
        { rwy: "14", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" },
        { rwy: "32", tora: 2500, toda: 2500, asda: 2560, lda: 2500, remarks: "NIL" }
      ]),
      taxiwayData: JSON.stringify({ tipo: "Perpendicular", ubicacion: "A 911.5 m del umbral de Pista 14", dimensiones: "77.5 m x 18 m", superficie: "Asfalto" }),
      platformData: JSON.stringify({ ubicacion: "Sureste de la pista", dimensiones: "160 m x 80 m", superficie: "Asfalto" })
    }
  ];

  for (const airport of airports) {
    await db.airport.create({ data: airport });
  }

  // Add obstacles for Cusco (SPZO) - the most detailed data
  const spzoAirport = await db.airport.findUnique({ where: { icaoCode: "SPZO" } });
  if (spzoAirport) {
    const obstacles = [
      { runwayArea: "RWY 28 approach", obstacleType: "Árbol", elevation: "3329.48 m / 10923.4908 ft", coordinates: "13°32'03.85\"S / 071°55'20.03\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Árbol", elevation: "3326.75 m / 10914.5341 ft", coordinates: "13°32'04.69\"S / 071°55'12.41\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Edificio", elevation: "3337.17 m / 10948.7205 ft", coordinates: "13°32'21.67\"S / 071°55'10.18\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Antena", elevation: "3346.61 m / 10979.6916 ft", coordinates: "13°32'23.27\"S / 071°55'10.84\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Antena", elevation: "3354.57 m / 11005.8071 ft", coordinates: "13°32'26.32\"S / 071°55'10.34\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Alta Tensión", elevation: "3363.23 m / 11034.2192 ft", coordinates: "13°32'43.74\"S / 071°54'24.05\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Alta Tensión", elevation: "3368.94 m / 11052.9527 ft", coordinates: "13°32'45.02\"S / 071°54'24.06\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Antena", elevation: "3438.45 m / 11281.0039 ft", coordinates: "13°33'17.57\"S / 071°50'56.28\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Torre de Control ATC", elevation: "3369.60 m / 11055.1181 ft", coordinates: "13°32'17.29\"S / 071°56'36.74\"W" },
      { runwayArea: "RWY 28 approach", obstacleType: "Estatua de Cóndor", elevation: "3397.70 m / 11147.3097 ft", coordinates: "13°31'41.29\"S / 071°56'23.40\"W" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spzoAirport.id } });
    }
  }

  // Add obstacles for Chiclayo (SPHI)
  const sphiAirport = await db.airport.findUnique({ where: { icaoCode: "SPHI" } });
  if (sphiAirport) {
    const obstacles = [
      { runwayArea: "RWY 19 approach", obstacleType: "Pared de bloque de concreto", elevation: "31 m / 96 ft", markingLighting: "NIL" },
      { runwayArea: "RWY 19 approach", obstacleType: "Antena y equipo militar", elevation: "15 m / 49 ft", markingLighting: "NIL" },
      { runwayArea: "RWY 01 approach", obstacleType: "Poste de barrera de contención", elevation: "33.5 m / 110 ft", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: sphiAirport.id } });
    }
  }

  // Add obstacles for Pisco (SPSO)
  const spsoAirport = await db.airport.findUnique({ where: { icaoCode: "SPSO" } });
  if (spsoAirport) {
    const obstacles = [
      { runwayArea: "RWY 04 approach", obstacleType: "Barrera de Contención", elevation: "3.60 m", markingLighting: "NIL" },
      { runwayArea: "RWY 22 approach", obstacleType: "Edificio", elevation: "10 m / 33 ft", markingLighting: "LGTD" },
      { runwayArea: "RWY 22 approach", obstacleType: "Antena", elevation: "30 m / 98 ft", markingLighting: "LGTD" },
      { runwayArea: "RWY 22 approach", obstacleType: "Líneas de Transmisión", elevation: "10 m / 33 ft", markingLighting: "LGTD" },
      { runwayArea: "RWY 22 approach", obstacleType: "Hangares", elevation: "20 m / 66 ft", markingLighting: "LGTD" },
      { runwayArea: "RWY 22 approach", obstacleType: "Antena", elevation: "14 m / 46 ft", markingLighting: "LGTD" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spsoAirport.id } });
    }
  }

  // Add obstacles for Trujillo (SPRU)
  const spruAirport = await db.airport.findUnique({ where: { icaoCode: "SPRU" } });
  if (spruAirport) {
    const obstacles = [
      { runwayArea: "RWY 20 approach", obstacleType: "Antena", elevation: "50 m / 164 ft", coordinates: "08°04'58\"S / 079°07'09\"W", markingLighting: "NO LGTD" },
      { runwayArea: "RWY 20 approach", obstacleType: "Obstáculo", elevation: "75 m", coordinates: "08°04'34\"S / 079°06'57\"W", markingLighting: "LGTD" },
      { runwayArea: "RWY 20 approach", obstacleType: "Obstáculo", elevation: "142 m a 3NM al NE del THR RWY 20", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spruAirport.id } });
    }
  }

  // Add obstacles for Arequipa (SPQU)
  const spquAirport = await db.airport.findUnique({ where: { icaoCode: "SPQU" } });
  if (spquAirport) {
    const obstacles = [
      { runwayArea: "RWY 10 approach", obstacleType: "Mástil", elevation: "18 m altura a 350 m lado R a 127 m del eje de la RWY", markingLighting: "NIL" },
      { runwayArea: "RWY 28 approach", obstacleType: "Mástil", elevation: "12 m altura a 450 m lado R a 115 m del eje de la RWY", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spquAirport.id } });
    }
  }

  // Add obstacles for Tacna (SPTN)
  const sptnAirport = await db.airport.findUnique({ where: { icaoCode: "SPTN" } });
  if (sptnAirport) {
    const obstacles = [
      { runwayArea: "RWY 02 approach", obstacleType: "Tanque de agua", elevation: "800 m - THR 02", markingLighting: "30 m. altura" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: sptnAirport.id } });
    }
  }

  // Add obstacles for Juliaca (SPJL)
  const spjlAirport = await db.airport.findUnique({ where: { icaoCode: "SPJL" } });
  if (spjlAirport) {
    const obstacles = [
      { runwayArea: "RWY 12 approach", obstacleType: "Obstáculo de 10 m alt. a 2.027 km del THR 12", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spjlAirport.id } });
    }
  }

  // Add communications for SPUR - PIURA
  const spurAirport = await db.airport.findUnique({ where: { icaoCode: "SPUR" } });
  if (spurAirport) {
    const comms = [
      { service: "APP/TWR", callsign: "PIURA TORRE", frequency: "118.4 MHz", hours: "1200-0200 y O/R" },
      { service: "ATIS", callsign: "PIURA", frequency: "132.9 MHz", hours: "1200-0200 y O/R" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1200-0200 y O/R" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spurAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "URA", frequency: "117.7 MHz CH 124X", coordinates: "05°12'35.66''S - 080°36'58.43''W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: spurAirport.id } });
    }
  }

  // Add communications for SPHY - ANDAHUAYLAS
  const sphyAirport = await db.airport.findUnique({ where: { icaoCode: "SPHY" } });
  if (sphyAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "ANDAHUAYLAS INFO DE AD", frequency: "126.9 MHz", hours: "1100-2300" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1100-2300" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sphyAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "AND", frequency: "114.3 MHz / CH 90X", coordinates: "13°42'51''S - 073°22'40''W", remarks: "H24" },
      { type: "ILS/LOC", identifier: "IAND", frequency: "109.7 MHz", coordinates: "13°43'14.690''S - 073°21'32.484''W", remarks: "H24" },
      { type: "ILS GP/DME", identifier: "IAND GP/DME", frequency: "333.2 MHz / CH 34X", coordinates: "13°42'13.841''S - 073°20'56.528''W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: sphyAirport.id } });
    }
  }

  // Add communications for SPAS - ANDOAS
  const spasAirport = await db.airport.findUnique({ where: { icaoCode: "SPAS" } });
  if (spasAirport) {
    const comms = [
      { service: "AFIS", callsign: "ANDOAS INFO DE AD", frequency: "118.2 MHz", hours: "HJ" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spasAirport.id } });
    }
    const navAids = [
      { type: "NDB", identifier: "OAS", frequency: "360 kHz", coordinates: "02°48'25''S - 076°27'18''W", remarks: "HJ" },
      { type: "VOR/DME", identifier: "OAS", frequency: "116.8 MHz / CH115x", coordinates: "02°47'22''S - 076°28'39''W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: spasAirport.id } });
    }
  }

  // Add communications for SPHZ - ANTA HUARAZ
  const sphzAirport = await db.airport.findUnique({ where: { icaoCode: "SPHZ" } });
  if (sphzAirport) {
    const comms = [
      { service: "AFIS", callsign: "ANTA INFO DE AD", frequency: "118.300 MHz", hours: "1300-2100 UTC O/R" },
      { service: "FIS", callsign: "ANTA INFO DE AD", frequency: "126.900 MHz", hours: "1300-2100 UTC O/R" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sphzAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications for SPAY - ATALAYA
  const spayAirport = await db.airport.findUnique({ where: { icaoCode: "SPAY" } });
  if (spayAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "ATALAYA INFO DE AD", frequency: "126.900 MHz", hours: "1300-2100 UTC" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spayAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications for SPHO - AYACUCHO
  const sphoAirport = await db.airport.findUnique({ where: { icaoCode: "SPHO" } });
  if (sphoAirport) {
    const comms = [
      { service: "FIS", callsign: "AYACUCHO TORRE", frequency: "126.900 MHz", hours: "1000-2300" },
      { service: "TWR", callsign: "AYACUCHO TORRE", frequency: "118.100 MHz", hours: "1000-2300" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sphoAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications for SPJR - CAJAMARCA
  const spjrAirport = await db.airport.findUnique({ where: { icaoCode: "SPJR" } });
  if (spjrAirport) {
    const comms = [
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.500 MHz", hours: "1100-2300 UTC" },
      { service: "TWR", callsign: "CAJAMARCA TORRE", frequency: "120.100 MHz", hours: "1100-2300 UTC" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spjrAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications for SPPY - CHACHAPOYAS
  const sppyAirport = await db.airport.findUnique({ where: { icaoCode: "SPPY" } });
  if (sppyAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "CHACHAPOYAS INFO DE AD", frequency: "126.900 MHz", hours: "1300-2100 UTC" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sppyAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "POY", frequency: "115.100 MHz CH 98X", coordinates: "06°12'02.0''S - 077°51'35.0''W", remarks: "H24 (3° W)" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: sppyAirport.id } });
    }
  }

  // Add communications for SPEO - CHIMBOTE
  const speoAirport = await db.airport.findUnique({ where: { icaoCode: "SPEO" } });
  if (speoAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "CHIMBOTE INFO DE AD", frequency: "118.1 MHz", hours: "1300-2100 y O/R" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: speoAirport.id } });
    }
    const navAids = [
      { type: "VOR", identifier: "BTE", frequency: "112.5 MHz", coordinates: "09°08'51''S - 078°31'19''W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: speoAirport.id } });
    }
    const obstacles = [
      { runwayArea: "RWY 19 approach", obstacleType: "Antena", elevation: "30 m de altura", coordinates: "496 m del Umbral RWY 19", markingLighting: "NIL" },
      { runwayArea: "RWY 19 approach", obstacleType: "Antena", elevation: "25 m de altura", coordinates: "570 m del Umbral RWY 19", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: speoAirport.id } });
    }
  }

  // Add communications for SPNC - HUÁNUCO
  const spncAirport = await db.airport.findUnique({ where: { icaoCode: "SPNC" } });
  if (spncAirport) {
    const comms = [
      { service: "AFIS/FIS", callsign: "HUÁNUCO INFO DE AD", frequency: "126.9 MHz", hours: "1400-2200" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1400-2200" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spncAirport.id } });
    }
  }

  // Add communications for SPJE - JAÉN
  const spjeAirport = await db.airport.findUnique({ where: { icaoCode: "SPJE" } });
  if (spjeAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "JAÉN INFO DE AD", frequency: "126.9 MHz", hours: "1300-2100 y O/R" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1300-2100 y O/R" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spjeAirport.id } });
    }
  }

  // Add communications for SPJJ - JAUJA
  const spjjAirport = await db.airport.findUnique({ where: { icaoCode: "SPJJ" } });
  if (spjjAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "JAUJA INFO DE AD", frequency: "126.9 MHz", hours: "1100-2300" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spjjAirport.id } });
    }
  }

  // Add communications for SPJI - JUANJUÍ
  const spjiAirport = await db.airport.findUnique({ where: { icaoCode: "SPJI" } });
  if (spjiAirport) {
    const comms = [
      { service: "FIS/AFIS", callsign: "JUANJUI INFO DE AD", frequency: "118.1 MHz", hours: "1300-2100" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spjiAirport.id } });
    }
  }

  // Add communications for SPMF - MAZAMARI
  const spmfAirport = await db.airport.findUnique({ where: { icaoCode: "SPMF" } });
  if (spmfAirport) {
    const comms = [
      { service: "AFIS", callsign: "MAZAMARI INFO DE AD", frequency: "118.3 MHz", hours: "1300-2300" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spmfAirport.id } });
    }
  }

  // Add obstacles for SPNC - HUÁNUCO
  if (spncAirport) {
    const obstacles = [
      { runwayArea: "Área del aeródromo", obstacleType: "Cerros", elevation: "Atraviesan superficie limitadora de obstáculos", markingLighting: "NIL" },
      { runwayArea: "Norte del AD", obstacleType: "Torres metálicas alta tensión", elevation: "35 m de alto a 1.5 km al norte", markingLighting: "NIL" },
      { runwayArea: "Oeste del AD", obstacleType: "Torres metálicas alta tensión", elevation: "35 m de alto a 3 km al oeste", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spncAirport.id } });
    }
  }

  // Add obstacles for SPJI - JUANJUÍ
  if (spjiAirport) {
    const obstacles = [
      { runwayArea: "Área del aeródromo", obstacleType: "Antena", elevation: "38.50 m de altura", coordinates: "07°10'09''S - 076°43'20''W", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spjiAirport.id } });
    }
  }

  // Add obstacles for SPMF - MAZAMARI
  if (spmfAirport) {
    const obstacles = [
      { runwayArea: "RWY 15 approach", obstacleType: "Postes de cemento energizados", elevation: "8 m de alto a 75 m del Umbral RWY 15", markingLighting: "NIL" },
      { runwayArea: "RWY 33 approach", obstacleType: "Antena", elevation: "25 m de altura a 60 m del Umbral RWY 33", coordinates: "90 m del eje de RWY 33", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spmfAirport.id } });
    }
  }

  // Add obstacles for SPJA - RIOJA
  const spjaAirport = await db.airport.findUnique({ where: { icaoCode: "SPJA" } });
  if (spjaAirport) {
    const obstacles = [
      { runwayArea: "RWY 16 approach", obstacleType: "Torre de alta tensión", elevation: "155 m del eje de Pista 16, lado derecho", markingLighting: "LGTD" },
      { runwayArea: "RWY 16 approach", obstacleType: "Torre metálica", elevation: "50 m al Oeste", markingLighting: "NIL" },
      { runwayArea: "RWY 34 approach", obstacleType: "Obstáculo", elevation: "330 m del eje, lado izquierdo Pista 34", markingLighting: "NIL" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spjaAirport.id } });
    }
  }

  // Add obstacles for SPST - TARAPOTO
  const spstAirport = await db.airport.findUnique({ where: { icaoCode: "SPST" } });
  if (spstAirport) {
    const obstacles = [
      { runwayArea: "RWY 17 approach", obstacleType: "Poste de concreto energía eléctrica", elevation: "11 m", markingLighting: "NIL", coordinates: "135 m del THR de RWY 17" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spstAirport.id } });
    }
  }

  // Add obstacles for SPMS - YURIMAGUAS
  const spmsAirport = await db.airport.findUnique({ where: { icaoCode: "SPMS" } });
  if (spmsAirport) {
    const obstacles = [
      { runwayArea: "RWY 09 approach", obstacleType: "Obstáculo por edificación", elevation: "2.5 m altura", markingLighting: "NIL", coordinates: "54.5 m lado izquierdo eje Pista 09" },
      { runwayArea: "RWY 09 approach", obstacleType: "Estación gasolina", markingLighting: "NIL", coordinates: "420 m Pista 09 y 70.5 m lado izquierdo eje Pista 09" },
      { runwayArea: "RWY 27 approach", obstacleType: "Antenas", markingLighting: "NIL", coordinates: "Ambos lados aproximación Pista 27" },
      { runwayArea: "Plataforma", obstacleType: "Estación AVGAS", elevation: "11 m", markingLighting: "NIL", coordinates: "Lado Este plataforma" },
      { runwayArea: "RWY 27 approach", obstacleType: "Cúpula iglesia", elevation: "40 m alto aprox.", markingLighting: "NIL", coordinates: "600 m umbral Pista 27, lado este" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spmsAirport.id } });
    }
  }

  // Add communications for SPJA - RIOJA
  if (spjaAirport) {
    const comms = [
      { service: "AFIS", callsign: "RIOJA INFO DE AD", frequency: "126.9 MHz", hours: "HJ" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spjaAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications and radio nav aids for SPST - TARAPOTO
  if (spstAirport) {
    const comms = [
      { service: "APP/TWR", callsign: "TARAPOTO TORRE", frequency: "118.4 MHz", hours: "1200-2359 y O/R" },
      { service: "ATIS", callsign: "AEROPUERTO TARAPOTO", frequency: "130.85 MHz", hours: "1200-2359 y O/R" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1200-2359 y O/R" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spstAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "TAP", frequency: "115.5 MHz CH 102X", coordinates: "06°39'29.2''S - 076°21'04.4''W", remarks: "H24" },
      { type: "LOC/DME", identifier: "IGDP", frequency: "109.7 MHz CH 34X", coordinates: "06°29'47''S - 076°22'32''W", remarks: "H24, RWY 35" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: spstAirport.id } });
    }
  }

  // Add communications for SPGM - TINGO MARÍA
  const spgmAirport = await db.airport.findUnique({ where: { icaoCode: "SPGM" } });
  if (spgmAirport) {
    const comms = [
      { service: "AFIS", callsign: "TINGO MARÍA INFO DE AD", frequency: "118.7 MHz", hours: "1300-2100" },
      { service: "FIS", callsign: "TINGO MARÍA INFO DE AD", frequency: "126.9 MHz", hours: "1300-2100" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spgmAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications for SPMS - YURIMAGUAS
  if (spmsAirport) {
    const comms = [
      { service: "AFIS", callsign: "YURIMAGUAS INFO DE AD", frequency: "118.1 MHz", hours: "1200-2300" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1200-2300" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spmsAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications and radio nav aids for SPTU - PUERTO MALDONADO
  const sptuAirport = await db.airport.findUnique({ where: { icaoCode: "SPTU" } });
  if (sptuAirport) {
    const comms = [
      { service: "FIS", callsign: "PUERTO MALDONADO TORRE", frequency: "126.9 MHz", hours: "1100 - 2300 y O/R" },
      { service: "APP/TWR", callsign: "PUERTO MALDONADO TORRE", frequency: "118.5 MHz", hours: "1100 - 2300 y O/R" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "H24" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sptuAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "PDO", frequency: "116.1 MHz CH 108X", coordinates: "12°36'30\"S - 069°13'38\"W", remarks: "H24" },
      { type: "ILS CAT I LOC", identifier: "IPJA", frequency: "109.7 MHz", coordinates: "12°35'41.6838\"S - 069°13'40.788\"W", remarks: "1100 - 2300 y O/R" },
      { type: "ILS GP/DME", identifier: "IPJA GP/DME", frequency: "333.2 MHz CH 34X", coordinates: "12°37'35.4389\"S - 069°13'40.8466\"W", remarks: "1100 - 2300 y O/R" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: sptuAirport.id } });
    }
  }

  // Add communications and radio nav aids for SPLO - ILO
  const sploAirport = await db.airport.findUnique({ where: { icaoCode: "SPLO" } });
  if (sploAirport) {
    const comms = [
      { service: "AFIS", callsign: "ILO INFO DE AD", frequency: "126.9 MHz", hours: "1300-2100 (UTC) O/R" },
      { service: "FIS", callsign: "ILO INFO DE AD", frequency: "126.9 MHz", hours: "1300-2100 (UTC) O/R" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "H24" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: sploAirport.id } });
    }
    const navAids = [
      { type: "VOR", identifier: "ILO", frequency: "112.5 MHz", coordinates: "17°41'28.1\"S - 071°21'02.3\"W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: sploAirport.id } });
    }
  }

  // Add communications, obstacles for SPZA - NASCA
  const spzaAirport = await db.airport.findUnique({ where: { icaoCode: "SPZA" } });
  if (spzaAirport) {
    const comms = [
      { service: "TWR/FIS", callsign: "NASCA TORRE", frequency: "118.1 MHz", hours: "1400 - 2200", remarks: "Cobertura limitada" },
      { service: "SMC", callsign: "NASCA CONTROL SUPERFICIE", frequency: "121.9 MHz", hours: "1400 - 2200" },
      { service: "ATIS", callsign: "AEROPUERTO DE NASCA", frequency: "132.5 MHz", hours: "1400 - 2200" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "1400 - 2200", remarks: "Cobertura limitada" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spzaAirport.id } });
    }
    const obstacles = [
      { runwayArea: "RWY 25 approach", obstacleType: "Vivienda", elevation: "570 m", markingLighting: "NIL", coordinates: "A 50 m de THR 25" },
      { runwayArea: "RWY 25 approach", obstacleType: "Árboles", elevation: "7 m", markingLighting: "NIL", coordinates: "Entre 70 y 200 m de distancia prolongación de la RWY" },
      { runwayArea: "RWY 25 approach", obstacleType: "Antena", elevation: "1985 ft / 605.03 m", markingLighting: "No señalizado", coordinates: "14°50'45\"S - 074°56'38\"W" },
      { runwayArea: "RWY 25 approach", obstacleType: "Antena (cerro Portachuelo)", elevation: "2180 ft / 664.46 m", markingLighting: "No señalizado", coordinates: "14°52'44\"S - 074°59'14\"W" },
      { runwayArea: "RWY 07 approach", obstacleType: "Vivienda", elevation: "2 m", markingLighting: "NIL", coordinates: "En prolongación RWY a 80 m desde el THR" },
      { runwayArea: "RWY 07 approach", obstacleType: "Montículo", elevation: "3 m", markingLighting: "NIL", coordinates: "A 150 m de THR" },
    ];
    for (const obs of obstacles) {
      await db.obstacle.create({ data: { ...obs, airportId: spzaAirport.id } });
    }
    // RadioNavAids: NIL
  }

  // Add communications and radio nav aids for SPME - TUMBES
  const spmeAirport = await db.airport.findUnique({ where: { icaoCode: "SPME" } });
  if (spmeAirport) {
    const comms = [
      { service: "APP/TWR", callsign: "TUMBES TORRE", frequency: "126.8 MHz", hours: "1500 - 0300" },
      { service: "EMERGENCIA", callsign: "EMERGENCIA", frequency: "121.5 MHz", hours: "H24" },
    ];
    for (const comm of comms) {
      await db.communication.create({ data: { ...comm, airportId: spmeAirport.id } });
    }
    const navAids = [
      { type: "VOR/DME", identifier: "BES", frequency: "112.9 MHz CH 76X", coordinates: "03°32'39.86\"S - 080°23'20.65\"W", remarks: "H24" },
    ];
    for (const navAid of navAids) {
      await db.radioNavAid.create({ data: { ...navAid, airportId: spmeAirport.id } });
    }
  }

  console.log("Seed completed successfully!");
  console.log(`Created ${airports.length} airports`);
  const obstacleCount = await db.obstacle.count();
  console.log(`Created ${obstacleCount} obstacles`);
  const commCount = await db.communication.count();
  console.log(`Created ${commCount} communications`);
  const navAidCount = await db.radioNavAid.count();
  console.log(`Created ${navAidCount} radio navigation aids`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
