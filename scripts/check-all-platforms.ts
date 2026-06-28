import { db } from '../src/lib/db'

async function main() {
  const airports = await db.airport.findMany({
    where: { 
      OR: [
        { icaoCode: 'SPJC' },
        { icaoCode: 'SPAY' },
        { icaoCode: 'SPEO' },
        { icaoCode: 'SPJE' },
        { icaoCode: 'SPJI' },
        { icaoCode: 'SPJJ' },
        { icaoCode: 'SPMF' },
        { icaoCode: 'SPNC' },
      ]
    },
    select: { icaoCode: true, name: true, platformData: true, taxiwayData: true, checkpointData: true, platformRemarks: true }
  })
  for (const a of airports) {
    console.log(`\n=== ${a.icaoCode} (${a.name}) ===`)
    console.log('platformData:', a.platformData)
    console.log('taxiwayData:', a.taxiwayData)
    console.log('checkpointData:', a.checkpointData)
    console.log('platformRemarks:', a.platformRemarks)
  }
}
main().catch(console.error).finally(() => process.exit(0))
