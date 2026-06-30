import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticWaypoints, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
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
      }
    } catch (error) {
      console.warn('[api/airdata/waypoints] Prisma failed, using static fallback:', error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const s = search.toLowerCase()
    const filtered = s
      ? staticWaypoints.filter((w) => {
          const hay = `${w.id ?? ''} ${w.name ?? ''} ${w.description ?? ''}`.toLowerCase()
          return hay.includes(s)
        })
      : staticWaypoints
    const sorted = [...filtered].sort((a, b) =>
      String(a.id ?? '').localeCompare(String(b.id ?? ''))
    )
    return NextResponse.json(sorted)
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
