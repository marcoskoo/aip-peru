import { db } from '@/lib/db'

async function main() {
  const spjc = await db.airport.findUnique({ where: { icaoCode: 'SPJC' } })
  console.log('SPJC exists?', !!spjc)
  if (spjc) {
    console.log('name:', spjc.name, '| category:', spjc.category)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
