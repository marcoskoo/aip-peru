import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const type = searchParams.get('type')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const grouped = searchParams.get('grouped')?.trim() || ''

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { designator: { contains: search } },
        { name: { contains: search } },
        { authority: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const restrictions = await db.airspaceRestriction.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { designator: 'asc' },
      ],
    })

    // If grouped=true, return grouped by type for easy display
    if (grouped === 'true') {
      const groupedData: Record<string, typeof restrictions> = {}
      for (const restriction of restrictions) {
        const key = restriction.type
        if (!groupedData[key]) {
          groupedData[key] = []
        }
        groupedData[key].push(restriction)
      }

      return NextResponse.json({
        restrictions: groupedData,
        total: restrictions.length,
        types: Object.keys(groupedData),
      })
    }

    return NextResponse.json({
      restrictions,
      total: restrictions.length,
    })
  } catch (error) {
    console.error('Error fetching airspace restrictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airspace restrictions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['designator', 'name', 'type', 'centerLat', 'centerLon', 'lowerLimit', 'upperLimit']
    const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === '')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const restriction = await db.airspaceRestriction.create({
      data: {
        designator: body.designator,
        name: body.name,
        type: body.type,
        status: body.status || 'ACTIVO',
        centerLat: body.centerLat,
        centerLon: body.centerLon,
        lowerLimit: body.lowerLimit,
        upperLimit: body.upperLimit,
        lowerLimitFt: body.lowerLimitFt || null,
        upperLimitFt: body.upperLimitFt || null,
        polygon: body.polygon || null,
        radius: body.radius || null,
        restrictions: body.restrictions || null,
        operatingHours: body.operatingHours || null,
        authority: body.authority || null,
        remarks: body.remarks || null,
        color: body.color || null,
      },
    })

    return NextResponse.json(restriction, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating airspace restriction:', error)

    // Handle unique constraint violation (duplicate designator)
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
      { error: 'Failed to create airspace restriction' },
      { status: 500 }
    )
  }
}
