import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')?.trim() || ''
    const limit = parseInt(searchParams.get('limit')?.trim() || '50', 10)

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
  } catch (error) {
    console.error('Error fetching abbreviations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch abbreviations' },
      { status: 500 }
    )
  }
}
