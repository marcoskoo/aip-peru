import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// JSON string fields that need parsing before returning
const JSON_FIELDS = ['communications'] as const

function parseJsonFields(
  heliport: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...heliport }
  for (const field of JSON_FIELDS) {
    const value = result[field]
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        result[field] = JSON.parse(value)
      } catch {
        // If parsing fails, keep the original string value
      }
    }
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const type = searchParams.get('type')?.trim() || ''
    const department = searchParams.get('department')?.trim() || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { icaoCode: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (department) {
      where.department = { contains: department }
    }

    const heliports = await db.heliport.findMany({
      where,
      orderBy: [{ type: 'asc' }, { icaoCode: 'asc' }],
    })

    const parsedHeliports = heliports.map((h) =>
      parseJsonFields(h as Record<string, unknown>)
    )

    return NextResponse.json(parsedHeliports)
  } catch (error) {
    console.error('Error fetching heliports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heliports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Stringify JSON fields for storage
    if (body.communications && typeof body.communications !== 'string') {
      body.communications = JSON.stringify(body.communications)
    }

    const heliport = await db.heliport.create({
      data: body,
    })

    const parsedHeliport = parseJsonFields(
      heliport as Record<string, unknown>
    )

    return NextResponse.json(parsedHeliport, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating heliport:', error)

    // Handle unique constraint violation (duplicate icaoCode)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A heliport with this ICAO code already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create heliport' },
      { status: 500 }
    )
  }
}
