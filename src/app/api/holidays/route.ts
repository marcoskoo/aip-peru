import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const holidays = await db.publicHoliday.findMany({
      orderBy: [
        { month: 'asc' },
        { day: 'asc' },
      ],
    })

    return NextResponse.json(holidays)
  } catch (error) {
    console.error('Error fetching public holidays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public holidays' },
      { status: 500 }
    )
  }
}
