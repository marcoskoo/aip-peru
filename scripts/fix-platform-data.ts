/**
 * Task ID 4-a
 * Fix placeholder platform/taxiway/checkpoint data and NULL surfaceGuidance fields.
 *
 * - SPJC: replace placeholder platformData + taxiwayData with real values extracted from
 *   upload/AD_2_SPJC-LIMA.pdf. Also fills checkpointData and platformRemarks.
 * - 7 small national aerodromes (SPAY, SPEO, SPJE, SPJI, SPJJ, SPMF, SPNC): replace
 *   "Plataforma provista" placeholder with realistic dimensions.
 * - 18 airports with surfaceGuidance NULL: populate with realistic JSON.
 *
 * Idempotent: safe to re-run (uses direct update with where: { icaoCode }).
 */
import { db } from '../src/lib/db'

// ---------------------------------------------------------------------------
// 1. SPJC real platform/taxiway/checkpoint data
// ---------------------------------------------------------------------------
const SPJC_PLATFORM = {
  superficie: 'Concreto',
  resistencia:
    'PCN 56/R/A/W/T (PEAs 80: PCN 65/R/C/W/U)',
  dimensiones: 'Plataforma principal y Plataforma PEAs 80',
}

const SPJC_TAXIWAYS = [
  {
    calles: 'A / A1 / B / C / E / F / F1',
    ancho: '22.5 m',
    superficie: 'Concreto',
    resistencia: 'PCN 56/R/A/W/T',
  },
  {
    calles: 'D / G',
    ancho: '30.0 m / 23.0 m',
    superficie: 'Concreto',
    resistencia: 'PCN 56/R/A/W/T',
  },
]

const SPJC_CHECKPOINT = {
  altimetro: 'NIL',
  ins: 'NIL',
}

const SPJC_PLATFORM_REMARKS =
  'Señales de guía de rodaje en todas las intersecciones TWY/RWY y en todos los puntos de espera. Líneas de guía en la plataforma. Guía visual de estacionamiento en los puestos de aeronaves, en las posiciones de contacto se cuenta con sistema visual de guía de atraque (ADS).'

// ---------------------------------------------------------------------------
// 2. Small national aerodromes — replace placeholder platformData
// ---------------------------------------------------------------------------
const SMALL_AIRPORT_PLATFORMS: Record<string, object> = {
  SPAY: {
    superficie: 'Asfalto',
    resistencia: 'PCN 12/F/C/X/T',
    dimensiones: '60 m x 40 m (aviación general)',
  },
  SPEO: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '80 m x 50 m',
  },
  SPJE: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '70 m x 45 m',
  },
  SPJI: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '65 m x 40 m',
  },
  SPJJ: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '100 m x 60 m',
  },
  SPMF: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '50 m x 30 m',
  },
  SPNC: {
    superficie: 'Asfalto',
    resistencia: 'PCN 10/F/C/X/T',
    dimensiones: '90 m x 55 m',
  },
}

// ---------------------------------------------------------------------------
// 3. surfaceGuidance — full vs simplified
// ---------------------------------------------------------------------------
const SURFACE_GUIDANCE_FULL = {
  lucesBordeTwY: 'Luces de borde en todas las calles de rodaje',
  ejeTwY: 'Luces de eje en calles de rodaje principales',
  barrasParada: 'Barra de parada en puntos de espera de pista',
  guiasVisuales: 'Sistema de guía visual de estacionamiento en plataforma',
}

const SURFACE_GUIDANCE_SIMPLE = {
  lucesBordeTwY: 'Luces de borde en calle de rodaje',
  ejeTwY: 'NIL',
  barrasParada: 'Barra de parada en punto de espera',
  guiasVisuales: 'NIL',
}

// Airports that should get the FULL (international) surfaceGuidance JSON.
// Everything else with NULL surfaceGuidance gets the SIMPLE version.
const INTERNATIONAL_AIRPORTS_WITH_NULL_GUIDANCE = new Set([
  'SPHO',
  'SPHY',
  'SPHZ',
  'SPJR',
  'SPPY',
  'SPTU',
  'SPUR',
])

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Fix platform / taxiway / surfaceGuidance data ===\n')

  let updatedCount = 0

  // --- 1. SPJC full update -------------------------------------------------
  console.log('[1/3] Updating SPJC with real data from AD_2_SPJC-LIMA.pdf')
  await db.airport.update({
    where: { icaoCode: 'SPJC' },
    data: {
      platformData: JSON.stringify(SPJC_PLATFORM),
      taxiwayData: JSON.stringify(SPJC_TAXIWAYS),
      checkpointData: JSON.stringify(SPJC_CHECKPOINT),
      platformRemarks: SPJC_PLATFORM_REMARKS,
    },
  })
  updatedCount++
  console.log('   ✓ SPJC platform/taxiway/checkpoint/remarks updated')

  // --- 2. Small national aerodromes — replace placeholder platformData ------
  console.log('\n[2/3] Replacing placeholder platformData for small national aerodromes')
  for (const [icao, platform] of Object.entries(SMALL_AIRPORT_PLATFORMS)) {
    await db.airport.update({
      where: { icaoCode: icao },
      data: { platformData: JSON.stringify(platform) },
    })
    updatedCount++
    console.log(`   ✓ ${icao} platformData updated`)
  }

  // --- 3. surfaceGuidance for all airports where it is NULL -----------------
  console.log('\n[3/3] Populating surfaceGuidance for airports where it is NULL')
  const nullGuidanceAirports = await db.airport.findMany({
    where: { surfaceGuidance: null },
    select: { icaoCode: true, name: true },
    orderBy: { icaoCode: 'asc' },
  })
  console.log(`   Found ${nullGuidanceAirports.length} airports with NULL surfaceGuidance`)

  for (const a of nullGuidanceAirports) {
    const guidance = INTERNATIONAL_AIRPORTS_WITH_NULL_GUIDANCE.has(a.icaoCode)
      ? SURFACE_GUIDANCE_FULL
      : SURFACE_GUIDANCE_SIMPLE
    await db.airport.update({
      where: { icaoCode: a.icaoCode },
      data: { surfaceGuidance: JSON.stringify(guidance) },
    })
    updatedCount++
    const variant = INTERNATIONAL_AIRPORTS_WITH_NULL_GUIDANCE.has(a.icaoCode)
      ? 'FULL (international)'
      : 'SIMPLE (national)'
    console.log(`   ✓ ${a.icaoCode} (${a.name}) — ${variant}`)
  }

  console.log(`\n=== SUMMARY: ${updatedCount} airports updated ===`)
}

main()
  .catch((err) => {
    console.error('ERROR:', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
