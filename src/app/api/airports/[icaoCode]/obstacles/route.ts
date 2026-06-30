import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  staticAirports,
  staticObstacles,
  prismaLikelyAvailable,
} from '@/lib/static-data'

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
          select: { id: true, icaoCode: true },
        })

        if (airport) {
          const obstacles = await db.obstacle.findMany({
            where: { airportId: airport.id },
            orderBy: { runwayArea: 'asc' },
          })

          return NextResponse.json({
            airportIcaoCode: airport.icaoCode,
            obstacles,
          })
        }
        // If airport not found in DB, fall through to static fallback
      }
    } catch (error) {
      console.warn(
        `[api/airports/${code}/obstacles] Prisma failed, using static fallback:`,
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

    const airportId = staticAirport.id as string
    const obstacles = staticObstacles
      .filter((o) => o.airportId === airportId)
      .sort((a, b) => {
        const ra = String(a.runwayArea ?? '')
        const rb = String(b.runwayArea ?? '')
        return ra.localeCompare(rb)
      })

    return NextResponse.json({
      airportIcaoCode: code,
      obstacles,
    })
  } catch (error) {
    console.error('Error fetching obstacles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch obstacles' },
      { status: 500 }
    )
  }
}
