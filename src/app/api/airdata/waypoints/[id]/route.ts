import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const waypoint = await db.waypoint.findUnique({ where: { id } })

    if (!waypoint) {
      return NextResponse.json(
        { error: `Waypoint "${id}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(waypoint)
  } catch (error) {
    console.error('Error fetching waypoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waypoint' },
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

    const existing = await db.waypoint.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Waypoint "${id}" not found` },
        { status: 404 }
      )
    }

    const waypoint = await db.waypoint.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        lat: body.lat !== undefined ? parseFloat(String(body.lat)) : undefined,
        lon: body.lon !== undefined ? parseFloat(String(body.lon)) : undefined,
        description: body.description,
      },
    })

    return NextResponse.json(waypoint)
  } catch (error) {
    console.error('Error updating waypoint:', error)
    return NextResponse.json(
      { error: 'Failed to update waypoint' },
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

    const existing = await db.waypoint.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Waypoint "${id}" not found` },
        { status: 404 }
      )
    }

    await db.waypoint.delete({ where: { id } })

    return NextResponse.json({ message: `Waypoint "${id}" deleted` })
  } catch (error) {
    console.error('Error deleting waypoint:', error)
    return NextResponse.json(
      { error: 'Failed to delete waypoint' },
      { status: 500 }
    )
  }
}
