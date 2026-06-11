import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const part = searchParams.get('part')?.trim() || ''
    const subPart = searchParams.get('subPart')?.trim() || ''

    const where: Record<string, unknown> = {}

    if (part) {
      where.part = part
    }

    if (subPart) {
      where.subPart = subPart
    }

    const sections = await db.aipSection.findMany({
      where,
      select: {
        id: true,
        sectionCode: true,
        title: true,
        titleEn: true,
        part: true,
        subPart: true,
        orderIndex: true,
        lastAmendment: true,
        effectiveDate: true,
        sourceFile: true,
      },
      orderBy: [
        { part: 'asc' },
        { subPart: 'asc' },
        { orderIndex: 'asc' },
      ],
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching AIP sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AIP sections' },
      { status: 500 }
    )
  }
}
