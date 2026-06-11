import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// JSON string fields that need parsing before returning
const JSON_FIELDS = [
  'operatingHours',
  'cargoHandlingFacilities',
  'refuelingFacilities',
  'platformData',
  'taxiwayData',
  'checkpointData',
  'surfaceGuidance',
  'metOffice',
  'runways',
  'declaredDistances',
] as const

function parseJsonFields(
  airport: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...airport }
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params

    const airport = await db.airport.findUnique({
      where: { icaoCode: icaoCode.toUpperCase() },
      include: {
        obstacles: true,
        radioNavAids: true,
        communications: true,
      },
    })

    if (!airport) {
      return NextResponse.json(
        { error: `Airport with ICAO code "${icaoCode}" not found` },
        { status: 404 }
      )
    }

    const parsedAirport = parseJsonFields(airport as Record<string, unknown>)

    return NextResponse.json(parsedAirport)
  } catch (error) {
    console.error('Error fetching airport:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airport details' },
      { status: 500 }
    )
  }
}
