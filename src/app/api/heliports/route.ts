import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staticHeliports, prismaLikelyAvailable } from '@/lib/static-data'

// JSON string fields that need parsing before returning
const JSON_FIELDS = ['communications'] as const

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
 * Aplica los filtros search/type/department al listado estático (case-insensitive).
 */
function filterStaticHeliports(
  list: Record<string, unknown>[],
  search: string,
  type: string,
  department: string
): Record<string, unknown>[] {
  const s = search.trim().toLowerCase()
  const t = type.trim()
  const d = department.trim().toLowerCase()
  return list.filter((h) => {
    if (t && h.type !== t) return false
    if (d && !String(h.department || '').toLowerCase().includes(d)) return false
    if (s) {
      const hay = `${h.icaoCode || ''} ${h.name || ''} ${h.city || ''}`.toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  }).sort((a, b) => {
    const ta = String(a.type || '')
    const tb = String(b.type || '')
    if (ta !== tb) return ta.localeCompare(tb)
    return String(a.icaoCode || '').localeCompare(String(b.icaoCode || ''))
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')?.trim() || ''
  const type = searchParams.get('type')?.trim() || ''
  const department = searchParams.get('department')?.trim() || ''

  // ─── Intento con Prisma ───────────────────────────────────────────
  try {
    if (prismaLikelyAvailable()) {
      const where: Record<string, unknown> = {}

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { icaoCode: { contains: search } },
          { city: { contains: search } },
        ]
      }

      if (type) {
        where.type = type
      }

      if (department) {
        where.department = { contains: department }
      }

      const heliports = await db.heliport.findMany({
        where,
        orderBy: [{ type: 'asc' }, { icaoCode: 'asc' }],
      })

      const parsedHeliports = heliports.map((h) =>
        parseJsonFields(h as Record<string, unknown>)
      )

      return NextResponse.json(parsedHeliports)
    }
  } catch (error) {
    console.warn('[/api/heliports] Prisma failed, using static fallback:', error)
  }

  // ─── Fallback estático ────────────────────────────────────────────
  const filtered = filterStaticHeliports(staticHeliports, search, type, department)
  const parsed = filtered.map((h) => parseJsonFields(h))
  return NextResponse.json(parsed)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Stringify JSON fields for storage
    if (body.communications && typeof body.communications !== 'string') {
      body.communications = JSON.stringify(body.communications)
    }

    const heliport = await db.heliport.create({
      data: body,
    })

    const parsedHeliport = parseJsonFields(
      heliport as Record<string, unknown>
    )

    return NextResponse.json(parsedHeliport, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating heliport:', error)

    // Handle unique constraint violation (duplicate icaoCode)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A heliport with this ICAO code already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create heliport' },
      { status: 500 }
    )
  }
}
