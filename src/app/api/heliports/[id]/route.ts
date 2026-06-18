import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// JSON string fields that need parsing before returning
const JSON_FIELDS = [
  'communications',
  'commsAts',
  'radioNavAids',
  'declaredDistances',
  'obstacles',
] as const

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

/**
 * Resolves a single heliport by its database id or, as a fallback,
 * by its ICAO code. This keeps backwards compatibility with callers
 * that previously used /api/heliports/[icaoCode].
 */
async function resolveHeliport(slug: string) {
  // First, attempt a direct lookup by id (most common path).
  const byId = await db.heliport.findUnique({ where: { id: slug } })
  if (byId) return byId

  // Fallback: treat the slug as an ICAO code (case-insensitive).
  const byIcao = await db.heliport.findUnique({
    where: { icaoCode: slug.toUpperCase() },
  })
  return byIcao
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const heliport = await resolveHeliport(id)

    if (!heliport) {
      return NextResponse.json(
        { error: `Heliport with id or ICAO code "${id}" not found` },
        { status: 404 }
      )
    }

    const parsedHeliport = parseJsonFields(
      heliport as Record<string, unknown>
    )

    return NextResponse.json(parsedHeliport)
  } catch (error) {
    console.error('Error fetching heliport:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heliport' },
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

    // Stringify JSON fields for storage
    if (body.communications && typeof body.communications !== 'string') {
      body.communications = JSON.stringify(body.communications)
    }

    const heliport = await db.heliport.update({
      where: { id },
      data: body,
    })

    const parsedHeliport = parseJsonFields(
      heliport as Record<string, unknown>
    )

    return NextResponse.json(parsedHeliport)
  } catch (error: unknown) {
    console.error('Error updating heliport:', error)

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Heliport not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update heliport' },
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

    await db.heliport.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Heliport deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting heliport:', error)

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Heliport not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete heliport' },
      { status: 500 }
    )
  }
}
