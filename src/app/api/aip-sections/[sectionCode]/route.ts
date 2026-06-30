import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticAipSections, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sectionCode: string }> }
) {
  const { sectionCode } = await params

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const section = await db.aipSection.findUnique({
        where: { sectionCode },
      })
      if (section) {
        return NextResponse.json(section)
      }
    }
  } catch (error) {
    console.warn('[/api/aip-sections/sectionCode] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const record = staticAipSections.find((s) => s.sectionCode === sectionCode)
  if (!record) {
    return NextResponse.json(
      { error: `AIP section "${sectionCode}" not found` },
      { status: 404 }
    )
  }
  return NextResponse.json(record)
}

/**
 * PUT - Update an existing AIP section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sectionCode: string }> }
) {
  try {
    const { sectionCode } = await params
    const body = await request.json()

    const existing = await db.aipSection.findUnique({
      where: { sectionCode },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `AIP section "${sectionCode}" not found` },
        { status: 404 }
      )
    }

    const updated = await db.aipSection.update({
      where: { sectionCode },
      data: {
        title: body.title ?? existing.title,
        titleEn: body.titleEn ?? existing.titleEn,
        part: body.part ?? existing.part,
        subPart: body.subPart != null ? String(body.subPart) : existing.subPart,
        orderIndex: body.orderIndex ?? existing.orderIndex,
        content: body.content ?? existing.content,
        contentEn: body.contentEn ?? existing.contentEn,
        lastAmendment: body.lastAmendment ?? existing.lastAmendment,
        effectiveDate: body.effectiveDate ?? existing.effectiveDate,
        sourceFile: body.sourceFile ?? existing.sourceFile,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating AIP section:', error)
    return NextResponse.json(
      { error: 'Failed to update AIP section' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove an AIP section
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sectionCode: string }> }
) {
  try {
    const { sectionCode } = await params

    const existing = await db.aipSection.findUnique({
      where: { sectionCode },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `AIP section "${sectionCode}" not found` },
        { status: 404 }
      )
    }

    await db.aipSection.delete({
      where: { sectionCode },
    })

    return NextResponse.json({ message: 'AIP section deleted successfully' })
  } catch (error) {
    console.error('Error deleting AIP section:', error)
    return NextResponse.json(
      { error: 'Failed to delete AIP section' },
      { status: 500 }
    )
  }
}
