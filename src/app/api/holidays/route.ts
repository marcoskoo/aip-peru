import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { staticPublicHolidays, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET() {
  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const holidays = await db.publicHoliday.findMany({
        orderBy: [
          { month: 'asc' },
          { day: 'asc' },
        ],
      })

      return NextResponse.json(holidays)
    }
  } catch (error) {
    console.warn('[/api/holidays] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const sorted = [...staticPublicHolidays].sort((a, b) => {
    const ma = Number(a.month ?? 0)
    const mb = Number(b.month ?? 0)
    if (ma !== mb) return ma - mb
    return Number(a.day ?? 0) - Number(b.day ?? 0)
  })

  return NextResponse.json(sorted)
}
