import { db } from '@/lib/db'
async function main() {
  // SPCL es un aeropuerto internacional con pista
  const spcl = await db.airport.findUnique({ where: { icaoCode: 'SPCL' }, select: { icaoCode: true, name: true, runways: true } })
  if (!spcl) { console.log('SPCL no existe'); return }
  console.log('SPCL runways (raw):', spcl.runways)
  console.log('---')
  if (spcl.runways) {
    try {
      const parsed = JSON.parse(spcl.runways)
      console.log('SPCL runways (parsed):', JSON.stringify(parsed, null, 2))
    } catch (e) { console.log('Error parsing:', e) }
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
