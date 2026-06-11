import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sectionCode: string }> }
) {
  try {
    const { sectionCode } = await params

    const section = await db.aipSection.findUnique({
      where: { sectionCode },
    })

    if (!section) {
      return NextResponse.json(
        { error: `AIP section "${sectionCode}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error fetching AIP section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AIP section' },
      { status: 500 }
    )
  }
}
