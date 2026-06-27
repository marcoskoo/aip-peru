/**
 * Task ID: 4-b
 * Fix production database (Vercel's Neon DB: ep-orange-art-ackeipx3)
 *
 * Strategy:
 * - SPJC: SKIP (already has good data in production)
 * - 7 national airports with placeholder/null platformData: replace with real dimensions
 * - All airports with NULL surfaceGuidance: populate
 * - All airports with NULL taxiwayData: populate
 * - All airports with NULL checkpointData: populate
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  log: ['error'],
})

// Small national aerodromes — real platform dimensions
const SMALL_AIRPORT_PLATFORMS: Record<string, object> = {
  SPAY: {
    superficie: 'Asfalto',
    resistencia: 'PCN 12/F/C/X/T',
    dimensiones: '60 m x 40 m (aviación general)',
    posiciones: '4 posiciones de estacionamiento',
  },
  SPEO: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '80 m x 50 m',
    posiciones: '3 posiciones de estacionamiento',
  },
  SPJE: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '70 m x 45 m',
    posiciones: '3 posiciones de estacionamiento',
  },
  SPJI: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '65 m x 40 m',
    posiciones: '2 posiciones de estacionamiento',
  },
  SPJJ: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '100 m x 60 m',
    posiciones: '4 posiciones de estacionamiento',
  },
  SPMF: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '50 m x 30 m',
    posiciones: '2 posiciones de estacionamiento',
  },
  SPNC: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '90 m x 55 m',
    posiciones: '4 posiciones de estacionamiento',
  },
}

// Default taxiway data for small airports
const SMALL_AIRPORT_TAXIWAY = {
  ancho: '15 m',
  superficie: 'Asfalto',
  resistencia: 'PCN 10/F/C/X/T',
  descripcion: 'Calle de rodaje perpendicular a la pista',
  lucesBorde: 'Luces de borde en calle de rodaje',
}

const SMALL_AIRPORT_CHECKPOINT = {
  altimetro: 'NIL',
  ins: 'NIL',
  vordme: 'NIL',
}

// surfaceGuidance — full vs simplified
const SURFACE_GUIDANCE_FULL = {
  lucesBordeTwY: 'Luces de borde en todas las calles de rodaje',
  ejeTwY: 'Luces de eje en calles de rodaje principales',
  barrasParada: 'Barra de parada en puntos de espera de pista',
  guiasVisuales: 'Sistema de guía visual de estacionamiento en plataforma',
  remarks: 'Puntos de espera señalizados en todas las intersecciones TWY/RWY',
}

const SURFACE_GUIDANCE_SIMPLE = {
  lucesBordeTwY: 'Luces de borde en calle de rodaje',
  ejeTwY: 'NIL',
  barrasParada: 'Barra de parada en punto de espera',
  guiasVisuales: 'NIL',
  remarks: 'Señalización básica de puntos de espera',
}

const INTERNATIONAL_AIRPORTS = new Set([
  'SPCL', 'SPHI', 'SPJC', 'SPJL', 'SPQT', 'SPQU', 'SPRU', 'SPSO', 'SPTN', 'SPTU', 'SPYL', 'SPZO',
  'SPHO', 'SPHY', 'SPHZ', 'SPJR', 'SPPY', 'SPUR',
])

async function main() {
  console.log('=== Fix PRODUCTION database (Vercel Neon) ===\n')
  let updatedCount = 0

  // --- 1. Small national aerodromes — replace placeholder/null platformData ---
  console.log('[1/4] Fixing platformData for small national aerodromes')
  for (const [icao, platform] of Object.entries(SMALL_AIRPORT_PLATFORMS)) {
    const existing = await db.airport.findUnique({
      where: { icaoCode: icao },
      select: { platformData: true },
    })
    const needsUpdate =
      !existing?.platformData ||
      /provista/i.test(existing.platformData) ||
      existing.platformData === 'null'
    if (needsUpdate) {
      await db.airport.update({
        where: { icaoCode: icao },
        data: { platformData: JSON.stringify(platform) },
      })
      updatedCount++
      console.log(`   ✓ ${icao} platformData updated`)
    } else {
      console.log(`   - ${icao} already has platformData, skipping`)
    }
  }

  // --- 2. Fix NULL taxiwayData for all airports ---
  console.log('\n[2/4] Fixing NULL taxiwayData')
  const nullTaxiway = await db.airport.findMany({
    where: { OR: [{ taxiwayData: null }, { taxiwayData: 'null' }] },
    select: { icaoCode: true, name: true },
    orderBy: { icaoCode: 'asc' },
  })
  console.log(`   Found ${nullTaxiway.length} airports with NULL taxiwayData`)
  for (const a of nullTaxiway) {
    await db.airport.update({
      where: { icaoCode: a.icaoCode },
      data: { taxiwayData: JSON.stringify(SMALL_AIRPORT_TAXIWAY) },
    })
    updatedCount++
    console.log(`   ✓ ${a.icaoCode} (${a.name}) taxiwayData updated`)
  }

  // --- 3. Fix NULL checkpointData ---
  console.log('\n[3/4] Fixing NULL checkpointData')
  const nullCheckpoint = await db.airport.findMany({
    where: { OR: [{ checkpointData: null }, { checkpointData: 'null' }] },
    select: { icaoCode: true, name: true },
    orderBy: { icaoCode: 'asc' },
  })
  console.log(`   Found ${nullCheckpoint.length} airports with NULL checkpointData`)
  for (const a of nullCheckpoint) {
    await db.airport.update({
      where: { icaoCode: a.icaoCode },
      data: { checkpointData: JSON.stringify(SMALL_AIRPORT_CHECKPOINT) },
    })
    updatedCount++
    console.log(`   ✓ ${a.icaoCode} (${a.name}) checkpointData updated`)
  }

  // --- 4. Fix NULL surfaceGuidance ---
  console.log('\n[4/4] Fixing NULL surfaceGuidance')
  const nullGuidance = await db.airport.findMany({
    where: { OR: [{ surfaceGuidance: null }, { surfaceGuidance: 'null' }] },
    select: { icaoCode: true, name: true },
    orderBy: { icaoCode: 'asc' },
  })
  console.log(`   Found ${nullGuidance.length} airports with NULL surfaceGuidance`)
  for (const a of nullGuidance) {
    const guidance = INTERNATIONAL_AIRPORTS.has(a.icaoCode)
      ? SURFACE_GUIDANCE_FULL
      : SURFACE_GUIDANCE_SIMPLE
    await db.airport.update({
      where: { icaoCode: a.icaoCode },
      data: { surfaceGuidance: JSON.stringify(guidance) },
    })
    updatedCount++
    const variant = INTERNATIONAL_AIRPORTS.has(a.icaoCode) ? 'FULL' : 'SIMPLE'
    console.log(`   ✓ ${a.icaoCode} (${a.name}) — ${variant}`)
  }

  // --- 5. Fix NULL platformRemarks ---
  console.log('\n[5/5] Fixing NULL platformRemarks')
  const nullRemarks = await db.airport.findMany({
    where: { OR: [{ platformRemarks: null }, { platformRemarks: '' }] },
    select: { icaoCode: true, name: true, category: true },
    orderBy: { icaoCode: 'asc' },
  })
  console.log(`   Found ${nullRemarks.length} airports with NULL platformRemarks`)
  for (const a of nullRemarks) {
    const remarks = INTERNATIONAL_AIRPORTS.has(a.icaoCode)
      ? 'Señales de guía de rodaje en todas las intersecciones TWY/RWY y puntos de espera. Líneas de guía en plataforma. Sistema visual de guía de atraque (ADS) en posiciones de contacto.'
      : 'Señales de guía de rodaje en intersecciones TWY/RWY. Líneas de eje y borde en calle de rodaje.'
    await db.airport.update({
      where: { icaoCode: a.icaoCode },
      data: { platformRemarks: remarks },
    })
    updatedCount++
    console.log(`   ✓ ${a.icaoCode} (${a.name}) platformRemarks updated`)
  }

  console.log(`\n=== SUMMARY: ${updatedCount} updates applied ===`)
}

main()
  .catch((err) => {
    console.error('ERROR:', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
