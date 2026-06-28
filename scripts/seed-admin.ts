/**
 * Seed the initial admin user.
 *
 * Usage:
 *   bun run scripts/seed-admin.ts
 *
 * Creates (or updates) the admin user `mkoo` with the default password.
 * The password can be changed later from the Admin panel.
 */

import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

const DEFAULT_USERNAME = 'mkoo'
const DEFAULT_PASSWORD = 'Mk/06612'
const DEFAULT_DISPLAY_NAME = 'Administrador'

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const user = await db.adminUser.upsert({
    where: { username: DEFAULT_USERNAME },
    update: {}, // don't overwrite the password if the user already exists
    create: {
      username: DEFAULT_USERNAME,
      passwordHash,
      displayName: DEFAULT_DISPLAY_NAME,
    },
  })

  console.log(`✓ Admin user seeded: ${user.username} (${user.displayName})`)
  console.log(`  Password: ${DEFAULT_PASSWORD}`)
  console.log(`  → Cámbiala desde el panel de Administración.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
