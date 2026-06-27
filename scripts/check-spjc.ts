import { db } from '../src/lib/db'

async function main() {
  const a = await db.airport.findUnique({
    where: { icaoCode: 'SPJC' },
    select: { platformData: true, taxiwayData: true, checkpointData: true, runways: true, platformRemarks: true }
  })
  console.log('SPJC platformData:', a?.platformData)
  console.log('\nSPJC taxiwayData:', a?.taxiwayData)
  console.log('\nSPJC checkpointData:', a?.checkpointData?.substring(0, 200))
  console.log('\nSPJC platformRemarks:', a?.platformRemarks)
}
main().catch(console.error).finally(() => process.exit(0))
