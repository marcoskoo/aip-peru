import { db } from '../src/lib/db'
async function main() {
  const total = await db.notam.count()
  const spim = await db.notam.count({ where: { fir: 'SPIM' } })
  const now = new Date()
  const active = await db.notam.count({ where: { fir: 'SPIM', OR: [{ effectiveTo: { gte: now } }, { isPermanent: true }, { effectiveTo: null }] } })
  const sample = await db.notam.findMany({ take: 3, select: { notamId: true, fir: true, effectiveFrom: true, effectiveTo: true, isPermanent: true, airportId: true, source: true } })
  console.log('TOTAL notams in DB:', total)
  console.log('SPIM notams:', spim)
  console.log('Active SPIM notams:', active)
  console.log('Sample:', JSON.stringify(sample, null, 2))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
