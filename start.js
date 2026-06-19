/**
 * Production start wrapper for Z.ai deploy.
 *
 * Next.js standalone mode generates .next/standalone/server.js but does NOT
 * load .env files automatically. This wrapper loads environment variables
 * from .env before starting the standalone server, so DATABASE_URL and
 * other secrets are available to Prisma and the API routes.
 *
 * Important: We use override: true so the .env file takes precedence over
 * any stale DATABASE_URL that might exist in the OS environment (e.g.
 * a local SQLite path from a previous dev setup).
 *
 * Usage:  node start.js   (or via `bun run start`)
 */
const { config } = require('dotenv');
const { resolve } = require('path');

// Load .env from the project root with override=true so the file's values
// always win over any pre-existing OS environment variables.
config({ path: resolve(__dirname, '.env'), override: true });

// Safety check: make sure DATABASE_URL is a valid PostgreSQL connection string
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('[start.js] ERROR: DATABASE_URL is not a valid PostgreSQL URL.');
  console.error('[start.js] Current value:', dbUrl ? dbUrl.substring(0, 40) + '...' : '(empty)');
  console.error('[start.js] Make sure .env exists in the project root with:');
  console.error('[start.js]   DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require');
  process.exit(1);
}

// Start the Next.js standalone server
require('./.next/standalone/server.js');
