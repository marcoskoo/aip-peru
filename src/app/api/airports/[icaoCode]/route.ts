import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  staticAirports,
  staticObstacles,
  staticRadioNavAids,
  staticCommunications,
  prismaLikelyAvailable,
} from '@/lib/static-data'

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
    // Only parse if it's a string; static data may already be parsed objects
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
    const code = icaoCode.toUpperCase()

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const airport = await db.airport.findUnique({
          where: { icaoCode: code },
          include: {
            obstacles: true,
            radioNavAids: true,
            communications: true,
          },
        })

        if (airport) {
          const parsedAirport = parseJsonFields(
            airport as Record<string, unknown>
          )
          return NextResponse.json(parsedAirport)
        }
        // If not found in DB, fall through to static fallback below
      }
    } catch (error) {
      console.warn(
        `[api/airports/${code}] Prisma failed, using static fallback:`,
        error
      )
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const staticAirport = staticAirports.find(
      (a) => String(a.icaoCode).toUpperCase() === code
    )

    if (!staticAirport) {
      return NextResponse.json(
        { error: `Airport with ICAO code "${icaoCode}" not found` },
        { status: 404 }
      )
    }

    // Attach related arrays (obstacles/radioNavAids/communications)
    // filtered by airportId — matches the Prisma `include` shape.
    const airportId = staticAirport.id as string
    const obstacles = staticObstacles.filter((o) => o.airportId === airportId)
    const radioNavAids = staticRadioNavAids.filter(
      (r) => r.airportId === airportId
    )
    const communications = staticCommunications.filter(
      (c) => c.airportId === airportId
    )

    const merged = {
      ...staticAirport,
      obstacles,
      radioNavAids,
      communications,
    }
    const parsedStatic = parseJsonFields(merged as Record<string, unknown>)

    return NextResponse.json(parsedStatic)
  } catch (error) {
    console.error('Error fetching airport:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airport details' },
      { status: 500 }
    )
  }
}
