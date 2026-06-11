import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const waypoints = await db.waypoint.findMany({
      where,
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(waypoints)
  } catch (error) {
    console.error('Error fetching waypoints:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waypoints' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, lat, lon, description } = body

    if (!id || !name || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'id, name, lat, and lon are required' },
        { status: 400 }
      )
    }

    const waypoint = await db.waypoint.create({
      data: {
        id,
        name,
        type: type || 'WAYPOINT',
        lat: parseFloat(String(lat)),
        lon: parseFloat(String(lon)),
        description: description || null,
      },
    })

    return NextResponse.json(waypoint, { status: 201 })
  } catch (error) {
    console.error('Error creating waypoint:', error)
    return NextResponse.json(
      { error: 'Failed to create waypoint' },
      { status: 500 }
    )
  }
}
