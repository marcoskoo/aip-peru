import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { staticDesignatedAuthorities, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET() {
  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const authorities = await db.designatedAuthority.findMany({
        orderBy: { orderIndex: 'asc' },
      })

      // Group by category
      const grouped = authorities.reduce(
        (acc, auth) => {
          const key = auth.category
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(auth)
          return acc
        },
        {} as Record<string, typeof authorities>
      )

      return NextResponse.json(grouped)
    }
  } catch (error) {
    console.warn('[/api/authorities] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const sorted = [...staticDesignatedAuthorities].sort(
    (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0)
  )
  const grouped = sorted.reduce(
    (acc, auth) => {
      const key = String(auth.category)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(auth)
      return acc
    },
    {} as Record<string, typeof sorted>
  )

  return NextResponse.json(grouped)
}
