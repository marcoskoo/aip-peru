import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prismaLikelyAvailable } from '@/lib/static-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/notams/filters
 *
 * Devuelve los valores disponibles para los filtros de la sección NOTAMs:
 *   - qCodes:      lista de Q-codes OACI distintos con su conteo
 *   - locations:   lista de designadores de lugar (campo A) con su conteo
 *
 * Respuesta:
 *   {
 *     "qCodes":     [{ "value": "QFALC", "count": 12 }, ...],
 *     "locations":  [{ "value": "SPJC", "count": 23 }, ...]
 *   }
 *
 * Solo considera NOTAMs de la FIR indicada (default SPIM).
 *
 * En Vercel serverless (sin DB Prisma disponible) se devuelven listas
 * vacías — los NOTAMs se sirven en vivo desde la FAA y no se pueden
 * agrupar sin traerlos primero, lo cual es costoso.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const fir = searchParams.get('fir')?.trim() || 'SPIM'

    // ─── Prisma (sandbox / DB producción) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        // Agrupar por qCode (excluyendo nulls)
        const qCodeGroups = await db.notam.groupBy({
          by: ['qCode'],
          where: { fir, qCode: { not: null } },
          _count: { qCode: true },
          orderBy: { _count: { qCode: 'desc' } },
        })

        // Agrupar por locationA (excluyendo nulls)
        const locationGroups = await db.notam.groupBy({
          by: ['locationA'],
          where: { fir, locationA: { not: null } },
          _count: { locationA: true },
          orderBy: { _count: { locationA: 'desc' } },
        })

        return NextResponse.json({
          qCodes: qCodeGroups
            .filter((g) => g.qCode)
            .map((g) => ({ value: g.qCode as string, count: g._count.qCode })),
          locations: locationGroups
            .filter((g) => g.locationA)
            .map((g) => ({ value: g.locationA as string, count: g._count.locationA })),
        })
      }
    } catch (error) {
      console.warn('[api/notams/filters] Prisma failed, returning empty:', error)
    }

    // ─── Static fallback ─────────────────────────────────────────────
    // Los NOTAMs no se almacenan estáticamente (vienen de la FAA en vivo),
    // así que no hay filtros para agrupar.
    return NextResponse.json({
      qCodes: [],
      locations: [],
    })
  } catch (error) {
    console.error('Error fetching NOTAM filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NOTAM filters' },
      { status: 500 }
    )
  }
}
