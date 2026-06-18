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

/**
 * POST - Create a new AIP section
 * Accepts JSON with: sectionCode, title, titleEn?, part, subPart, orderIndex, content, contentEn?
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.sectionCode || !body.title || !body.part || !body.subPart) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionCode, title, part, subPart' },
        { status: 400 }
      )
    }

    // Check if section with this code already exists
    const existing = await db.aipSection.findUnique({
      where: { sectionCode: body.sectionCode },
    })

    if (existing) {
      return NextResponse.json(
        { error: `A section with code "${body.sectionCode}" already exists` },
        { status: 409 }
      )
    }

    const section = await db.aipSection.create({
      data: {
        sectionCode: body.sectionCode,
        title: body.title,
        titleEn: body.titleEn || null,
        part: body.part,
        subPart: String(body.subPart),
        orderIndex: body.orderIndex ?? 0,
        content: body.content || '',
        contentEn: body.contentEn || null,
        lastAmendment: body.lastAmendment || null,
        effectiveDate: body.effectiveDate || null,
        sourceFile: body.sourceFile || null,
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error('Error creating AIP section:', error)
    return NextResponse.json(
      { error: 'Failed to create AIP section' },
      { status: 500 }
    )
  }
}
