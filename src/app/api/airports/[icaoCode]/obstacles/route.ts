import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params

    const airport = await db.airport.findUnique({
      where: { icaoCode: icaoCode.toUpperCase() },
      select: { id: true, icaoCode: true },
    })

    if (!airport) {
      return NextResponse.json(
        { error: `Airport with ICAO code "${icaoCode}" not found` },
        { status: 404 }
      )
    }

    const obstacles = await db.obstacle.findMany({
      where: { airportId: airport.id },
      orderBy: { runwayArea: 'asc' },
    })

    return NextResponse.json({
      airportIcaoCode: airport.icaoCode,
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
