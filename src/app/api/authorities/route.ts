import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const authorities = await db.designatedAuthority.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    // Group by category
    const grouped = authorities.reduce(
      (acc, auth) => {
        const key = auth.category
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(auth)
        return acc
      },
      {} as Record<string, typeof authorities>
    )

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Error fetching designated authorities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designated authorities' },
      { status: 500 }
    )
  }
}
