/**
 * Production start wrapper for Z.ai deploy.
 *
 * Next.js standalone mode generates .next/standalone/server.js but does NOT
 * load .env files automatically. This wrapper loads environment variables
 * from .env (if present) before starting the standalone server.
 *
 * If .env doesn't exist (e.g. on Z.ai deploy where secrets are injected
 * via the platform's environment variables), it falls back to whatever
 * DATABASE_URL the OS provides.
 *
 * Usage:  node start.js   (or via `bun run start`)
 */
const { config } = require('dotenv');
const { resolve } = require('path');
const { existsSync } = require('fs');

// Try to load .env from several locations, with override=true so the
// file's values always win over any pre-existing OS environment variables
// (e.g. a stale SQLite DATABASE_URL from a dev setup).
const envPaths = [
  resolve(__dirname, '.env'),
  resolve(__dirname, '.next/standalone/.env'),
];

let loaded = false;
for (const p of envPaths) {
  if (existsSync(p)) {
    config({ path: p, override: true });
    loaded = true;
    console.log(`[start.js] Loaded env from ${p}`);
    break;
  }
}

if (!loaded) {
  console.log('[start.js] No .env file found — relying on OS environment variables.');
}

// Log DATABASE_URL status (without revealing the actual value)
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('[start.js] DATABASE_URL is a valid PostgreSQL connection string ✓');
} else if (dbUrl) {
  console.warn('[start.js] WARNING: DATABASE_URL is not PostgreSQL:', dbUrl.substring(0, 30) + '...');
} else {
  console.warn('[start.js] WARNING: DATABASE_URL is not set. API routes will fail.');
  console.warn('[start.js] Set DATABASE_URL in .env or as an environment variable.');
}

// Start the Next.js standalone server
require('./.next/standalone/server.js');
