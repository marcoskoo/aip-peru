import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticNationalRegulations, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')?.trim() || ''
  const category = searchParams.get('category')?.trim() || ''

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const where: Record<string, unknown> = {}

      if (type) {
        where.type = type
      }

      if (category) {
        where.category = { contains: category }
      }

      const regulations = await db.nationalRegulation.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
      })

      return NextResponse.json(regulations)
    }
  } catch (error) {
    console.warn('[/api/regulations] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const cl = category.toLowerCase()
  const filtered = staticNationalRegulations.filter((r) => {
    if (type && r.type !== type) return false
    if (cl && !String(r.category || '').toLowerCase().includes(cl)) return false
    return true
  }).sort((a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0))

  return NextResponse.json(filtered)
}
