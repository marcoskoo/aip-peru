import { db } from '@/lib/db'

async function main() {
  const spcl = await db.airport.findUnique({
    where: { icaoCode: 'SPCL' },
    select: {
      icaoCode: true,
      name: true,
      runways: true,
      declaredDistances: true,
      taxiwayData: true,
      platformRemarks: true,
    },
  })
  if (!spcl) {
    console.log('SPCL no existe')
    return
  }
  console.log('=== declaredDistances (raw) ===')
  console.log(spcl.declaredDistances)
  console.log('')
  console.log('=== declaredDistances (parsed) ===')
  if (spcl.declaredDistances) {
    try {
      console.log(JSON.stringify(JSON.parse(spcl.declaredDistances), null, 2))
    } catch {
      console.log('parse error')
    }
  }
  console.log('')
  console.log('=== taxiwayData (parsed) ===')
  if (spcl.taxiwayData) {
    try {
      const parsed = JSON.parse(spcl.taxiwayData)
      console.log(JSON.stringify(parsed, null, 2).slice(0, 2000))
    } catch {
      console.log(String(spcl.taxiwayData).slice(0, 1000))
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
