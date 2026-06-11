import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const JSON_FIELDS = ['commsAts', 'radioNavAids', 'declaredDistances', 'obstacles'] as const

function parseJsonFields(heliport: Record<string, unknown>): Record<string, unknown> {
  const result = { ...heliport }
  for (const field of JSON_FIELDS) {
    const value = result[field]
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        result[field] = JSON.parse(value)
      } catch {
        // Keep original string if parsing fails
      }
    }
  }
  return result
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params

    const heliport = await db.heliport.findUnique({
      where: { icaoCode: icaoCode.toUpperCase() },
    })

    if (!heliport) {
      return NextResponse.json(
        { error: `Heliport with ICAO code "${icaoCode}" not found` },
        { status: 404 }
      )
    }

    const parsedHeliport = parseJsonFields(heliport as Record<string, unknown>)

    return NextResponse.json(parsedHeliport)
  } catch (error) {
    console.error('Error fetching heliport:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heliport details' },
      { status: 500 }
    )
  }
}
