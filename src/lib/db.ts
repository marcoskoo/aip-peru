import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  // Para Neon serverless en Vercel: asegurar parámetros de pooling si no están
  let finalUrl = databaseUrl
  if (finalUrl && finalUrl.includes('neon.tech') && !finalUrl.includes('pgbouncer=true')) {
    finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 'pgbouncer=true&connect_timeout=15'
  }

  return new PrismaClient({
    datasourceUrl: finalUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
