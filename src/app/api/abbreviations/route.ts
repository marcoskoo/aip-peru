import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticAbbreviations, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')?.trim() || ''
  const limit = parseInt(searchParams.get('limit')?.trim() || '50', 10)

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const where: Record<string, unknown> = {}

      if (q) {
        where.OR = [
          { code: { contains: q } },
          { meaning: { contains: q } },
        ]
      }

      const abbreviations = await db.abbreviation.findMany({
        where,
        orderBy: { code: 'asc' },
        take: limit,
      })

      return NextResponse.json(abbreviations)
    }
  } catch (error) {
    console.warn('[/api/abbreviations] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const ql = q.toLowerCase()
  const filtered = staticAbbreviations.filter((a) => {
    if (!ql) return true
    const code = String(a.code || '').toLowerCase()
    const meaning = String(a.meaning || '').toLowerCase()
    return code.includes(ql) || meaning.includes(ql)
  })
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
    .slice(0, limit)

  return NextResponse.json(filtered)
}
