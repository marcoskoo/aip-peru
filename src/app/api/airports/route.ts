import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const department = searchParams.get('department')?.trim() || ''

    // Verificación temprana de DATABASE_URL (ayuda a diagnosticar en Vercel)
    if (!process.env.DATABASE_URL) {
      console.error('[/api/airports] DATABASE_URL no está definida en el entorno')
      return NextResponse.json(
        { error: 'DATABASE_URL no configurada', hint: 'Verifica las Environment Variables en Vercel' },
        { status: 500 }
      )
    }

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { icaoCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
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
        category: true,
        arpLatitude: true,
        arpLongitude: true,
      },
      orderBy: [
        { category: 'desc' },  // INTERNACIONAL first, then NACIONAL
        { icaoCode: 'asc' },
      ],
    })

    console.log(`[/api/airports] OK ${airports.length} airports in ${Date.now() - startedAt}ms`)
    return NextResponse.json(airports)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack?.split('\n').slice(0, 3).join(' | ') : ''
    console.error('[/api/airports] ERROR:', errMsg, errStack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch airports',
        detail: errMsg,
        hint: 'Si es error de Prisma, revisa que DATABASE_URL apunte a PostgreSQL y que el schema esté pusheado'
      },
      { status: 500 }
    )
  }
}
