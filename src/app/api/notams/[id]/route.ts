import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by notamId first (e.g., A0234/25), then by database id
    const notam = await db.notam.findFirst({
      where: {
        OR: [
          { notamId: id },
          { id },
        ],
      },
      include: {
        airport: {
          select: { id: true, icaoCode: true, name: true, city: true },
        },
      },
    })

    if (!notam) {
      return NextResponse.json(
        { error: 'NOTAM not found' },
        { status: 404 }
      )
    }

    // Find related NOTAMs (same scope, airport, or replaces)
    const relatedNotams = await db.notam.findMany({
      where: {
        OR: [
          { replacesId: notam.notamId },
          { notamId: notam.replacesId },
          { airportId: notam.airportId, scope: notam.scope },
        ],
        id: { not: notam.id },
      },
      include: {
        airport: {
          select: { icaoCode: true, name: true },
        },
      },
      take: 10,
      orderBy: { effectiveFrom: 'desc' },
    })

    return NextResponse.json({
      ...notam,
      relatedNotams,
    })
  } catch (error) {
    console.error('Error fetching NOTAM detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NOTAM' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if NOTAM exists
    const existing = await db.notam.findFirst({
      where: {
        OR: [{ notamId: id }, { id }],
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: `NOTAM with id "${id}" not found` },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'type', 'replacesId', 'fir', 'effectiveFrom', 'effectiveTo',
      'isPermanent', 'scope', 'subject', 'condition', 'text',
      'coordinates', 'lat', 'lon', 'radius', 'lowerLimit', 'upperLimit',
      'airportId', 'priority', 'source', 'verified',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'effectiveFrom' || field === 'effectiveTo') {
          if (body[field]) {
            const parsed = new Date(body[field])
            if (isNaN(parsed.getTime())) {
              return NextResponse.json(
                { error: `Invalid ${field} date` },
                { status: 400 }
              )
            }
            updateData[field] = parsed
          } else {
            updateData[field] = null
          }
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const notam = await db.notam.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        airport: {
          select: { id: true, icaoCode: true, name: true, city: true },
        },
      },
    })

    return NextResponse.json(notam)
  } catch (error: unknown) {
    console.error('Error updating NOTAM:', error)

    // Handle unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A NOTAM with this ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update NOTAM' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if NOTAM exists (by notamId or database id)
    const existing = await db.notam.findFirst({
      where: {
        OR: [{ notamId: id }, { id }],
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: `NOTAM with id "${id}" not found` },
        { status: 404 }
      )
    }

    await db.notam.delete({ where: { id: existing.id } })

    return NextResponse.json({ message: 'NOTAM deleted successfully' })
  } catch (error) {
    console.error('Error deleting NOTAM:', error)
    return NextResponse.json(
      { error: 'Failed to delete NOTAM' },
      { status: 500 }
    )
  }
}
