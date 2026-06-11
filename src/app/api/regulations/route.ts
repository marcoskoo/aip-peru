import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''

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
  } catch (error) {
    console.error('Error fetching national regulations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch national regulations' },
      { status: 500 }
    )
  }
}
