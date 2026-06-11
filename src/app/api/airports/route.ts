import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const department = searchParams.get('department')?.trim() || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { city: { contains: search } },
        { name: { contains: search } },
        { icaoCode: { contains: search } },
      ]
    }

    if (department) {
      where.department = { contains: department }
    }

    const airports = await db.airport.findMany({
      where,
      select: {
        id: true,
        icaoCode: true,
        name: true,
        city: true,
        department: true,
        elevation: true,
        authorizedTraffic: true,
        fireCategory: true,
      },
      orderBy: { icaoCode: 'asc' },
    })

    return NextResponse.json(airports)
  } catch (error) {
    console.error('Error fetching airports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airports' },
      { status: 500 }
    )
  }
}
