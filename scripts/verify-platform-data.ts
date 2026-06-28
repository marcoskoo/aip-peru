/**
 * Task ID 4-a — verification
 * Re-checks the 19 airports reported in the audit and confirms:
 *   - No "provista" placeholders remain in platformData/taxiwayData
 *   - surfaceGuidance is no longer NULL
 */
import { db } from '../src/lib/db'

const AUDIT_CODES = [
  'SPAY', 'SPEO', 'SPJE', 'SPJI', 'SPJJ', 'SPMF', 'SPNC', 'SPJC', // platform placeholder
  'SPAS', 'SPGM', 'SPHO', 'SPHY', 'SPHZ', 'SPJA', 'SPJR', 'SPMS',
  'SPPY', 'SPTU', 'SPUR', // also surfaceGuidance null (SPJC already in list)
]

async function main() {
  const airports = await db.airport.findMany({
    where: { icaoCode: { in: AUDIT_CODES } },
    select: {
      icaoCode: true,
      name: true,
      platformData: true,
      taxiwayData: true,
      checkpointData: true,
      platformRemarks: true,
      surfaceGuidance: true,
    },
    orderBy: { icaoCode: 'asc' },
  })

  let provistaHits = 0
  let nullGuidanceHits = 0

  console.log('=== VERIFICATION — 19 audit airports ===\n')
  for (const a of airports) {
    const issues: string[] = []
    if (a.platformData && /provista/i.test(a.platformData)) {
      issues.push('platformData still has "provista"')
      provistaHits++
    }
    if (a.taxiwayData && /provista/i.test(a.taxiwayData)) {
      issues.push('taxiwayData still has "provista"')
      provistaHits++
    }
    if (!a.surfaceGuidance) {
      issues.push('surfaceGuidance is NULL')
      nullGuidanceHits++
    }
    const status = issues.length === 0 ? '✅ OK' : '❌ ' + issues.join(', ')
    console.log(`${a.icaoCode.padEnd(5)} ${status}`)
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Airports checked           : ${airports.length}`)
  console.log(`"provista" placeholder hits : ${provistaHits}`)
  console.log(`NULL surfaceGuidance hits   : ${nullGuidanceHits}`)

  // Also do a global sweep across ALL airports for completeness.
  const all = await db.airport.findMany({
    select: {
      icaoCode: true,
      platformData: true,
      taxiwayData: true,
      surfaceGuidance: true,
    },
  })
  let anyProvista = 0
  let anyNullGuidance = 0
  for (const a of all) {
    if (a.platformData && /provista/i.test(a.platformData)) anyProvista++
    if (a.taxiwayData && /provista/i.test(a.taxiwayData)) anyProvista++
    if (!a.surfaceGuidance) anyNullGuidance++
  }
  console.log('\n=== GLOBAL SWEEP (all airports) ===')
  console.log(`Total airports              : ${all.length}`)
  console.log(`Any "provista" placeholders : ${anyProvista}`)
  console.log(`Any NULL surfaceGuidance    : ${anyNullGuidance}`)

  // Pretty-print SPJC to confirm real data was stored.
  const spjc = await db.airport.findUnique({
    where: { icaoCode: 'SPJC' },
    select: {
      platformData: true,
      taxiwayData: true,
      checkpointData: true,
      platformRemarks: true,
      surfaceGuidance: true,
    },
  })
  console.log('\n=== SPJC stored values ===')
  console.log('platformData   :', spjc?.platformData)
  console.log('taxiwayData    :', spjc?.taxiwayData)
  console.log('checkpointData :', spjc?.checkpointData)
  console.log('platformRemarks:', spjc?.platformRemarks?.slice(0, 120) + '…')
  console.log('surfaceGuidance:', spjc?.surfaceGuidance)

  if (provistaHits === 0 && nullGuidanceHits === 0 && anyProvista === 0 && anyNullGuidance === 0) {
    console.log('\n✅ VERIFICATION PASSED — no remaining placeholders or NULLs.')
  } else {
    console.log('\n❌ VERIFICATION FAILED — see counts above.')
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('ERROR:', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
