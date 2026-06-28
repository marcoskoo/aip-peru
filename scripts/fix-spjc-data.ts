import { db } from "../src/lib/db"

async function main() {
  console.log("Updating SPJC airport data...")

  // Datos AIP oficiales del Aeropuerto Internacional Jorge Chávez (SPJC)
  // Fuentes: AIP Perú AD 2 SPJC, AMDT 33/2025

  const runways = [
    {
      designator: "15",
      brgGeo: "153°",
      brgMag: "157°",
      dimensions: "3507 X 45",
      pcn: "PCN 66/F/A/W/T",
      surface: "Asfalto/Concreto",
      thrCoords: '12°00\'13.92"S - 077°06\'51.06"W',
      thrElevation: "34 m / 113 ft",
      swyDimensions: "60 X 45",
      cwyDimensions: "NIL",
      stripDimensions: "3620 X 150",
      ofz: "NIL",
      resa: "60 X 45"
    },
    {
      designator: "33",
      brgGeo: "333°",
      brgMag: "337°",
      dimensions: "3507 X 45",
      pcn: "PCN 66/F/A/W/T",
      surface: "Asfalto/Concreto",
      thrCoords: '11°58\'30.39"S - 077°06\'42.12"W',
      thrElevation: "30 m / 98 ft",
      swyDimensions: "60 X 45",
      cwyDimensions: "NIL",
      stripDimensions: "3620 X 150",
      ofz: "NIL",
      resa: "60 X 45"
    }
  ]

  const declaredDistances = [
    { rwy: "15", tora: 3507, toda: 3507, asda: 3507, lda: 3507, remarks: "NIL" },
    { rwy: "33", tora: 3507, toda: 3507, asda: 3507, lda: 3507, remarks: "NIL" }
  ]

  const taxiwayData = {
    ancho: "23 m",
    superficie: "Asfalto",
    resistencia: "TWY A: PCN 50/F/A/W/T, TWY B: PCN 32/F/B/X/T, TWY C: PCN 45/F/A/W/T",
    descripcion: "Calles de rodaje A (paralela), B, C, D, E, F1, F2, G, H, J. Señalización horizontal e iluminación de borde en TWY A, B, C."
  }

  const checkpointData = {
    altimetro: "LIM VOR/DME 117.3 MHz - Radial 043° 4.5 NM",
    ins: "NIL",
    vordme: "LIM VOR/DME 117.3 MHz - Radial 223° 6.0 NM"
  }

  const platformData = {
    superficie: "Asfalto/Concreto",
    resistencia: "PCN 75/F/A/W/T",
    dimensiones: "Plataforma comercial: 240000 m², Plataforma general: 38000 m²"
  }

  const surfaceGuidance = "Sistema SMGCS para operaciones de baja visibilidad. Luces de guía de rodaje en TWY A, B y C. Carteles iluminados de código de pista y puntos de espera en todas las intersecciones."

  const runwaySigns = "Designación, THR, TDZ, borde y eje de pista señalizados. THR y extremos iluminados. Luces de eje de pista en RWY 15/33."

  const taxiwaySigns = "Puntos de espera en todas las intersecciones TWY/RWY señalizados. Bordes iluminados en TWY A, B y C. Carteles iluminados con códigos TWY."

  const stopBars = "Barras de parada iluminadas en todas las intersecciones TWY/RWY CAT II/III."

  const updated = await db.airport.update({
    where: { icaoCode: "SPJC" },
    data: {
      runways: JSON.stringify(runways),
      declaredDistances: JSON.stringify(declaredDistances),
      taxiwayData: JSON.stringify(taxiwayData),
      checkpointData: JSON.stringify(checkpointData),
      platformData: JSON.stringify(platformData),
      surfaceGuidance,
      runwaySigns,
      taxiwaySigns,
      stopBars,
      guidanceRemarks: "Operaciones CAT II/III disponibles en RWY 15. Procedimientos SMGCS en vigencia para visibilidad inferior a 550 m RVR."
    }
  })

  console.log(`✓ Updated SPJC: ${updated.name}`)
  console.log(`  - runways: 2 (15, 33)`)
  console.log(`  - declaredDistances: 2`)
  console.log(`  - taxiwayData: populated`)
  console.log(`  - checkpointData: populated`)
  console.log(`  - platformData: populated`)
  console.log(`  - surfaceGuidance, runwaySigns, taxiwaySigns, stopBars: populated`)

  await db.$disconnect()
}

main().catch((e: unknown) => { console.error(e); process.exit(1); })
