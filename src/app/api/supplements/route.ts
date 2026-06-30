import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticSupplements, staticAirports, prismaLikelyAvailable } from '@/lib/static-data'

/**
 * Adjunta la relación `airport` (select: id, icaoCode, name, city) a cada
 * supplement usando el listado estático de aeropuertos. Devuelve el mismo
 * shape que el `include` de Prisma.
 */
function withAirport<T extends Record<string, unknown>>(sup: T): T & { airport: { id: string; icaoCode: string; name: string; city: string } | null } {
  const airportId = sup.airportId as string | null | undefined
  let airport: { id: string; icaoCode: string; name: string; city: string } | null = null
  if (airportId) {
    const found = staticAirports.find((a) => a.id === airportId)
    if (found) {
      airport = {
        id: String(found.id),
        icaoCode: String(found.icaoCode ?? ''),
        name: String(found.name ?? ''),
        city: String(found.city ?? ''),
      }
    }
  }
  return { ...sup, airport }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')?.trim() || ''
  const category = searchParams.get('category')?.trim() || ''
  const status = searchParams.get('status')?.trim() || ''
  const airportId = searchParams.get('airportId')?.trim() || ''
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      // Build where clause
      const where: Record<string, unknown> = {}

      if (search) {
        where.OR = [
          { supNumber: { contains: search } },
          { title: { contains: search } },
        ]
      }

      if (category) {
        where.category = category
      }

      if (status) {
        where.status = status
      }

      if (airportId) {
        where.airportId = airportId
      }

      // Get total count
      const total = await db.supplement.count({ where })

      const supplements = await db.supplement.findMany({
        where,
        include: {
          airport: {
            select: {
              id: true,
              icaoCode: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { effectiveFrom: 'desc' },
        take: limit,
        skip: offset,
      })

      return NextResponse.json({
        supplements,
        total,
      })
    }
  } catch (error) {
    console.warn('[/api/supplements] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const sl = search.toLowerCase()
  const filtered = staticSupplements.filter((s) => {
    if (category && s.category !== category) return false
    if (status && s.status !== status) return false
    if (airportId && s.airportId !== airportId) return false
    if (sl) {
      const hay = `${s.supNumber || ''} ${s.title || ''}`.toLowerCase()
      if (!hay.includes(sl)) return false
    }
    return true
  }).sort((a, b) => {
    const da = a.effectiveFrom ? new Date(String(a.effectiveFrom)).getTime() : 0
    const db = b.effectiveFrom ? new Date(String(b.effectiveFrom)).getTime() : 0
    return db - da
  })

  const total = filtered.length
  const sliced = filtered.slice(offset, offset + limit).map(withAirport)

  return NextResponse.json({
    supplements: sliced,
    total,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['supNumber', 'title', 'category', 'effectiveFrom']
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
    let effectiveTo = undefined
    if (body.effectiveTo) {
      effectiveTo = new Date(body.effectiveTo)
      if (isNaN(effectiveTo.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effectiveTo date' },
          { status: 400 }
        )
      }
    }

    const supplement = await db.supplement.create({
      data: {
        supNumber: body.supNumber,
        title: body.title,
        category: body.category,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        isPermanent: body.isPermanent ?? !body.effectiveTo,
        description: body.description || null,
        airportId: body.airportId || null,
        fileUrl: body.fileUrl || null,
        status: body.status || 'VIGENTE',
        publishedBy: body.publishedBy || null,
      },
      include: {
        airport: {
          select: {
            id: true,
            icaoCode: true,
            name: true,
            city: true,
          },
        },
      },
    })

    return NextResponse.json(supplement, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating supplement:', error)

    return NextResponse.json(
      { error: 'Failed to create supplement' },
      { status: 500 }
    )
  }
}
