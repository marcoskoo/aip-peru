import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const restriction = await db.airspaceRestriction.findUnique({
      where: { id },
    })

    if (!restriction) {
      return NextResponse.json(
        { error: `Airspace restriction with id "${id}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(restriction)
  } catch (error) {
    console.error('Error fetching airspace restriction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airspace restriction' },
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

    // Check if restriction exists
    const existing = await db.airspaceRestriction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Airspace restriction with id "${id}" not found` },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'designator', 'name', 'type', 'status',
      'centerLat', 'centerLon', 'lowerLimit', 'upperLimit',
      'lowerLimitFt', 'upperLimitFt', 'polygon', 'radius',
      'restrictions', 'operatingHours', 'authority', 'remarks', 'color',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const restriction = await db.airspaceRestriction.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(restriction)
  } catch (error: unknown) {
    console.error('Error updating airspace restriction:', error)

    // Handle unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'An airspace restriction with this designator already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update airspace restriction' },
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

    // Check if restriction exists
    const existing = await db.airspaceRestriction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Airspace restriction with id "${id}" not found` },
        { status: 404 }
      )
    }

    await db.airspaceRestriction.delete({ where: { id } })

    return NextResponse.json({ message: 'Airspace restriction deleted successfully' })
  } catch (error) {
    console.error('Error deleting airspace restriction:', error)
    return NextResponse.json(
      { error: 'Failed to delete airspace restriction' },
      { status: 500 }
    )
  }
}
