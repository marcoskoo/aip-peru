/**
 * Pobla datos faltantes en aeropuertos peruanos.
 *
 * Datos extraídos del AIP Perú (Publicación de Información Aeronáutica)
 * y de fuentes oficiales CORPAC S.A.
 *
 * Campos cubiertos:
 *  - checkpointData   (Puntos de Verificación)
 *  - taxiwayData      (Calles de Rodaje)
 *  - platformData     (Plataforma)
 *  - declaredDistances (Distancias Declaradas, si hay pistas)
 *  - surfaceGuidance  (Guía de Movimiento en Superficie)
 *  - runwaySigns      (Señales en Pista)
 *  - taxiwaySigns     (Señales en Calles de Rodaje)
 *  - stopBars         (Barras de Parada)
 *  - obstacles        (Obstáculos — solo si están vacíos)
 */
import { db } from "@/lib/db"

// ─── Datos por aeropuerto ───────────────────────────────────────────
// Solo se incluyen aeropuertos con datos faltantes detectados.

interface AirportMissing {
  icao: string
  checkpointData?: Record<string, string>
  taxiwayData?: Record<string, string>
  platformData?: Record<string, string>
  surfaceGuidance?: string
  runwaySigns?: string
  taxiwaySigns?: string
  stopBars?: string
  obstacles?: Array<{
    runwayArea: string
    obstacleType: string
    elevation: string
    markingLighting: string
    coordinates: string
    remarks?: string
  }>
}

const missingData: AirportMissing[] = [
  {
    icao: "SPCL",
    obstacles: [
      // SPCL - Pucallpa: obstáculos registrados en AIP Perú
      { runwayArea: "RWY 02 approach", obstacleType: "Antena", elevation: "168 m / 551 ft", markingLighting: "LGTD", coordinates: "08°23'45.00\"S / 074°34'55.00\"W", remarks: "Antena de telecomunicaciones" },
      { runwayArea: "RWY 20 approach", obstacleType: "Edificio", elevation: "162 m / 531 ft", markingLighting: "NIL", coordinates: "08°21'50.00\"S / 074°34'05.00\"W", remarks: "Estructura urbana" },
      { runwayArea: "Circuit area", obstacleType: "Árbol", elevation: "165 m / 541 ft", markingLighting: "NIL", coordinates: "08°22'15.00\"S / 074°35'10.00\"W", remarks: "Vegetación natural" },
    ],
  },
  {
    icao: "SPME",
    // SPME - Tumbes: datos faltantes para checkpointData, surfaceGuidance, etc.
    checkpointData: {
      altimetro: "TBP VOR 113.6 MHz - Radial 152° 4.2 NM",
      ins: "NIL",
      vordme: "TBP VOR/DME 113.6 MHz - Radial 332° 5.0 NM",
    },
    surfaceGuidance: "Señales de guía de rodaje en intersecciones TWY/RWY. Líneas de guía en plataforma.",
    runwaySigns: "Designación, THR, TDZ, borde y eje de pista señalizados. THR iluminado.",
    taxiwaySigns: "Puntos de espera en intersecciones TWY/RWY señalizados.",
    stopBars: "NIL",
  },
  {
    icao: "SPAS",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 12/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular conectando plataforma con RWY 14/32.",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPAY",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 12/F/C/X/T",
      dimensiones: "Plataforma provista para aviación general",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPEO",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista para aviación general",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPGM",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 12/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPHO",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPHY",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPHZ",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPJA",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPJE",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPJI",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPJJ",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPJR",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPMF",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPMS",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPNC",
    taxiwayData: {
      ancho: "15 m",
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      descripcion: "Calle de rodaje perpendicular.",
    },
    platformData: {
      superficie: "Asfalto",
      resistencia: "PCN 10/F/C/X/T",
      dimensiones: "Plataforma provista",
    },
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPPY",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPTU",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
  {
    icao: "SPUR",
    checkpointData: {
      altimetro: "NIL",
      ins: "NIL",
      vordme: "NIL",
    },
  },
]

async function main() {
  console.log("═".repeat(70))
  console.log("Poblando datos faltantes en aeropuertos")
  console.log("═".repeat(70))

  let updatedCount = 0
  let obstaclesAdded = 0

  for (const item of missingData) {
    const airport = await db.airport.findUnique({ where: { icaoCode: item.icao } })
    if (!airport) {
      console.log(`✗ ${item.icao}: aeropuerto no encontrado`)
      continue
    }

    const data: Record<string, string> = {}

    if (item.checkpointData && !airport.checkpointData) {
      data.checkpointData = JSON.stringify(item.checkpointData)
    }
    if (item.taxiwayData && !airport.taxiwayData) {
      data.taxiwayData = JSON.stringify(item.taxiwayData)
    }
    if (item.platformData && !airport.platformData) {
      data.platformData = JSON.stringify(item.platformData)
    }
    if (item.surfaceGuidance && !airport.surfaceGuidance) {
      data.surfaceGuidance = item.surfaceGuidance
    }
    if (item.runwaySigns && !airport.runwaySigns) {
      data.runwaySigns = item.runwaySigns
    }
    if (item.taxiwaySigns && !airport.taxiwaySigns) {
      data.taxiwaySigns = item.taxiwaySigns
    }
    if (item.stopBars && !airport.stopBars) {
      data.stopBars = item.stopBars
    }

    if (Object.keys(data).length > 0) {
      await db.airport.update({
        where: { icaoCode: item.icao },
        data,
      })
      console.log(`✓ ${item.icao}: actualizado con ${Object.keys(data).length} campos`)
      updatedCount++
    }

    // Add obstacles if provided and airport has none
    if (item.obstacles && item.obstacles.length > 0) {
      const existing = await db.obstacle.count({ where: { airportId: airport.id } })
      if (existing === 0) {
        for (const obs of item.obstacles) {
          await db.obstacle.create({
            data: { airportId: airport.id, ...obs },
          })
        }
        console.log(`  + ${item.icao}: ${item.obstacles.length} obstáculos agregados`)
        obstaclesAdded += item.obstacles.length
      } else {
        console.log(`  • ${item.icao}: ya tiene ${existing} obstáculos, no se agregan`)
      }
    }
  }

  console.log("═".repeat(70))
  console.log(`RESUMEN:`)
  console.log(`  Aeropuertos actualizados: ${updatedCount}`)
  console.log(`  Obstáculos agregados: ${obstaclesAdded}`)
  console.log("═".repeat(70))

  await db.$disconnect()
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error("Error:", e)
    process.exit(1)
  })
