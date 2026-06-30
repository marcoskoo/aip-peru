import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticSupplements, staticAirports, prismaLikelyAvailable } from '@/lib/static-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const supplement = await db.supplement.findUnique({
        where: { id },
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
      if (supplement) {
        return NextResponse.json(supplement)
      }
    }
  } catch (error) {
    console.warn('[/api/supplements/id] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const record = staticSupplements.find((s) => s.id === id)
  if (!record) {
    return NextResponse.json(
      { error: `Supplement with id "${id}" not found` },
      { status: 404 }
    )
  }
  // Attach airport relation mirroring the Prisma `include` shape
  let airport: { id: string; icaoCode: string; name: string; city: string } | null = null
  const airportId = record.airportId as string | null | undefined
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
  return NextResponse.json({ ...record, airport })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if supplement exists
    const existing = await db.supplement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Supplement with id "${id}" not found` },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'supNumber', 'title', 'category', 'effectiveFrom', 'effectiveTo',
      'isPermanent', 'description', 'airportId', 'fileUrl', 'status', 'publishedBy',
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

    const supplement = await db.supplement.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(supplement)
  } catch (error) {
    console.error('Error updating supplement:', error)
    return NextResponse.json(
      { error: 'Failed to update supplement' },
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

    // Check if supplement exists
    const existing = await db.supplement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: `Supplement with id "${id}" not found` },
        { status: 404 }
      )
    }

    await db.supplement.delete({ where: { id } })

    return NextResponse.json({ message: 'Supplement deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplement:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplement' },
      { status: 500 }
    )
  }
}
