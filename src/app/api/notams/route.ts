import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Priority order mapping for sorting
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const scope = searchParams.get('scope')?.trim() || ''
    const priority = searchParams.get('priority')?.trim() || ''
    const fir = searchParams.get('fir')?.trim() || 'SPIM'
    const airportId = searchParams.get('airportId')?.trim() || ''
    const active = searchParams.get('active')?.trim() || ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    // Build where clause
    const where: Record<string, unknown> = { fir }

    if (search) {
      where.OR = [
        { notamId: { contains: search } },
        { text: { contains: search } },
        { subject: { contains: search } },
        { condition: { contains: search } },
      ]
    }

    if (scope) {
      where.scope = scope
    }

    if (priority) {
      where.priority = priority
    }

    if (airportId) {
      where.airportId = airportId
    }

    // Active NOTAMs filter: effectiveFrom <= now AND (effectiveTo >= now OR isPermanent = true)
    if (active === 'true') {
      const now = new Date()
      where.AND = [
        { effectiveFrom: { lte: now } },
        {
          OR: [
            { effectiveTo: { gte: now } },
            { isPermanent: true },
          ],
        },
      ]
    }

    // Get total count
    const total = await db.notam.count({ where })

    // Get active count stats (always calculated for the FIR)
    const now = new Date()
    const activeWhere = {
      fir,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: { gte: now } },
        { isPermanent: true },
      ],
    }

    const [activeTotal, activeUrgent, activeHigh] = await Promise.all([
      db.notam.count({ where: activeWhere }),
      db.notam.count({ where: { ...activeWhere, priority: 'URGENT' } }),
      db.notam.count({ where: { ...activeWhere, priority: 'HIGH' } }),
    ])

    // Include airport relation if airportId filter is set
    const includeAirport = !!airportId

    // Fetch NOTAMs
    const notams = await db.notam.findMany({
      where,
      include: {
        airport: includeAirport
          ? { select: { id: true, icaoCode: true, name: true, city: true } }
          : { select: { icaoCode: true, name: true } },
      },
      orderBy: [
        { effectiveFrom: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    // Sort by priority DESC in application code (SQLite doesn't support custom ordering)
    notams.sort((a, b) => {
      const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    })

    return NextResponse.json({
      notams,
      total,
      activeStats: {
        total: activeTotal,
        urgent: activeUrgent,
        high: activeHigh,
      },
    })
  } catch (error) {
    console.error('Error fetching NOTAMs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NOTAMs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['notamId', 'fir', 'effectiveFrom', 'subject', 'condition', 'text']
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse effectiveFrom
    const effectiveFrom = new Date(body.effectiveFrom)
    if (isNaN(effectiveFrom.getTime())) {
      return NextResponse.json(
        { error: 'Invalid effectiveFrom date' },
        { status: 400 }
      )
    }

    // Parse effectiveTo if provided
    let effectiveTo: Date | null = null
    if (body.effectiveTo) {
      effectiveTo = new Date(body.effectiveTo)
      if (isNaN(effectiveTo.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effectiveTo date' },
          { status: 400 }
        )
      }
    }

    const notam = await db.notam.create({
      data: {
        notamId: body.notamId,
        type: body.type || 'NOTAM',
        replacesId: body.replacesId || null,
        fir: body.fir,
        effectiveFrom,
        effectiveTo,
        isPermanent: body.isPermanent ?? !body.effectiveTo,
        scope: body.scope || null,
        subject: body.subject,
        condition: body.condition,
        text: body.text,
        coordinates: body.coordinates || null,
        lat: body.lat || null,
        lon: body.lon || null,
        radius: body.radius || null,
        lowerLimit: body.lowerLimit || null,
        upperLimit: body.upperLimit || null,
        airportId: body.airportId || null,
        priority: body.priority || 'MEDIUM',
        source: body.source || null,
        verified: body.verified ?? false,
      },
      include: {
        airport: body.airportId
          ? { select: { id: true, icaoCode: true, name: true, city: true } }
          : { select: { icaoCode: true, name: true } },
      },
    })

    return NextResponse.json(notam, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating NOTAM:', error)

    // Handle unique constraint violation (duplicate notamId)
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
      { error: 'Failed to create NOTAM' },
      { status: 500 }
    )
  }
}
