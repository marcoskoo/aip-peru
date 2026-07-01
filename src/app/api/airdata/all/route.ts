import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  staticAirways,
  staticNavaids,
  staticWaypoints,
  staticFIRBoundaries,
  staticAdjacentFIRs,
  prismaLikelyAvailable,
} from '@/lib/static-data'

// ─── Static formatters (mirror the Prisma response shape) ──────────────

function formatStaticFirBoundaries(
  firs: Record<string, unknown>[]
): Record<string, {
  name: string
  type: string
  center: { lat: number; lon: number }
  polygon: Array<{ lat: number; lon: number }>
}> {
  const map: Record<string, {
    name: string
    type: string
    center: { lat: number; lon: number }
    polygon: Array<{ lat: number; lon: number }>
  }> = {}
  for (const fir of firs) {
    const id = String(fir.id)
    let polygon: Array<{ lat: number; lon: number }> = []
    if (typeof fir.polygon === 'string' && fir.polygon.trim() !== '') {
      try {
        polygon = JSON.parse(fir.polygon)
      } catch {
        polygon = []
      }
    } else if (Array.isArray(fir.polygon)) {
      polygon = fir.polygon as Array<{ lat: number; lon: number }>
    }
    map[id] = {
      name: String(fir.name ?? ''),
      type: String(fir.type ?? 'FIR'),
      center: {
        lat: Number(fir.centerLat ?? 0),
        lon: Number(fir.centerLon ?? 0),
      },
      polygon,
    }
  }
  return map
}

function formatStaticAdjacentFirs(firs: Record<string, unknown>[]) {
  return firs.map((fir) => {
    let borderPoints: unknown[] = []
    if (typeof fir.borderPoints === 'string' && fir.borderPoints.trim() !== '') {
      try {
        borderPoints = JSON.parse(fir.borderPoints)
      } catch {
        borderPoints = []
      }
    } else if (Array.isArray(fir.borderPoints)) {
      borderPoints = fir.borderPoints
    }
    return {
      icao: fir.icao,
      name: fir.name,
      country: fir.country,
      borderPoints,
      color: fir.color,
    }
  })
}

function formatStaticNavaids(navaids: Record<string, unknown>[]) {
  return navaids.map((nav) => ({
    id: nav.id,
    name: nav.name,
    type: nav.type,
    frequency: nav.frequency,
    lat: nav.lat,
    lon: nav.lon,
    elevation: nav.elevation,
  }))
}

function formatStaticWaypoints(waypoints: Record<string, unknown>[]) {
  return waypoints.map((wp) => ({
    id: wp.id,
    name: wp.name,
    type: wp.type,
    lat: wp.lat,
    lon: wp.lon,
    description: wp.description,
  }))
}

function formatStaticAirways(airways: Record<string, unknown>[]) {
  // Static airways do not carry segments (they're stored as a separate
  // relation in Prisma). We expose the designator/type/level and an empty
  // segments array so the frontend shape matches.
  const conventional = airways
    .filter((aw) => aw.type === 'CONVENTIONAL')
    .map((aw) => ({
      designator: aw.designator,
      type: aw.type,
      level: aw.level,
      segments: [],
    }))
  const rnav = airways
    .filter((aw) => aw.type === 'RNAV')
    .map((aw) => ({
      designator: aw.designator,
      type: aw.type,
      level: aw.level,
      segments: [],
    }))
  return { conventional, rnav }
}

export async function GET() {
  try {
    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        // Fetch all data in parallel
        const [firBoundaries, adjacentFirs, navaids, waypoints, airways] =
          await Promise.all([
            db.fIRBoundary.findMany({ orderBy: { id: 'asc' } }),
            db.adjacentFIR.findMany({ orderBy: { icao: 'asc' } }),
            db.navaid.findMany({ orderBy: { id: 'asc' } }),
            db.waypoint.findMany({ orderBy: { id: 'asc' } }),
            db.airway.findMany({
              include: {
                segments: { orderBy: { orderIndex: 'asc' } },
              },
              orderBy: { designator: 'asc' },
            }),
          ])

        // Format FIR boundaries as map keyed by id (same as old JSON)
        const firBoundariesMap: Record<string, {
          name: string
          type: string
          center: { lat: number; lon: number }
          polygon: Array<{ lat: number; lon: number }>
        }> = {}
        for (const fir of firBoundaries) {
          firBoundariesMap[fir.id] = {
            name: fir.name,
            type: fir.type,
            center: { lat: fir.centerLat, lon: fir.centerLon },
            polygon: fir.polygon ? JSON.parse(fir.polygon) : [],
          }
        }

        // Format adjacent FIRs (parse borderPoints JSON)
        const adjacentFirsFormatted = adjacentFirs.map((fir) => ({
          icao: fir.icao,
          name: fir.name,
          country: fir.country,
          borderPoints: fir.borderPoints ? JSON.parse(fir.borderPoints) : [],
          color: fir.color,
        }))

        // Format navaids (same as old JSON)
        const navaidsFormatted = navaids.map((nav) => ({
          id: nav.id,
          name: nav.name,
          type: nav.type,
          frequency: nav.frequency,
          lat: nav.lat,
          lon: nav.lon,
          elevation: nav.elevation,
        }))

        // Format waypoints (same as old JSON)
        const waypointsFormatted = waypoints.map((wp) => ({
          id: wp.id,
          name: wp.name,
          type: wp.type,
          lat: wp.lat,
          lon: wp.lon,
          description: wp.description,
        }))

        // Split airways into conventional and RNAV (same as old JSON)
        const conventional = airways
          .filter((aw) => aw.type === 'CONVENTIONAL')
          .map((aw) => ({
            designator: aw.designator,
            type: aw.type,
            level: aw.level,
            segments: aw.segments.map((seg) => ({
              from: seg.fromPoint,
              to: seg.toPoint,
              distance: seg.distance,
              bearing: seg.bearing,
              minFL: seg.minFL,
              maxFL: seg.maxFL,
              trackTrue: seg.trackTrue,
              reverseTrack: seg.reverseTrack,
            })),
          }))

        const rnav = airways
          .filter((aw) => aw.type === 'RNAV')
          .map((aw) => ({
            designator: aw.designator,
            type: aw.type,
            level: aw.level,
            segments: aw.segments.map((seg) => ({
              from: seg.fromPoint,
              to: seg.toPoint,
              distance: seg.distance,
              bearing: seg.bearing,
              minFL: seg.minFL,
              maxFL: seg.maxFL,
              trackTrue: seg.trackTrue,
              reverseTrack: seg.reverseTrack,
            })),
          }))

        return NextResponse.json({
          firBoundaries: firBoundariesMap,
          adjacentFirs: adjacentFirsFormatted,
          navaids: navaidsFormatted,
          waypoints: waypointsFormatted,
          airways: {
            conventional,
            rnav,
          },
        })
      }
    } catch (error) {
      console.warn('[api/airdata/all] Prisma failed, using static fallback:', error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const firBoundariesMap = formatStaticFirBoundaries(staticFIRBoundaries)
    const adjacentFirsFormatted = formatStaticAdjacentFirs(staticAdjacentFIRs)
    const navaidsFormatted = formatStaticNavaids(staticNavaids)
    const waypointsFormatted = formatStaticWaypoints(staticWaypoints)
    const airwaysFormatted = formatStaticAirways(staticAirways)

    return NextResponse.json({
      firBoundaries: firBoundariesMap,
      adjacentFirs: adjacentFirsFormatted,
      navaids: navaidsFormatted,
      waypoints: waypointsFormatted,
      airways: airwaysFormatted,
    })
  } catch (error) {
    console.error('Error fetching all airdata, using static fallback:', error)
    // Static fallback — same data the interactive map uses when DB unavailable
    const { PERUVIAN_WAYPOINTS, PERUVIAN_AIRWAYS } = await import('@/lib/aviation/peru-airways-static')
    const { PERUVIAN_NAVAIDS } = await import('@/lib/aviation/peru-navaids-static')
    return NextResponse.json({
      firBoundaries: {},
      adjacentFirs: [],
      navaids: PERUVIAN_NAVAIDS.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        frequency: n.frequency,
        lat: n.lat,
        lon: n.lon,
        elevation: n.elevation,
      })),
      waypoints: PERUVIAN_WAYPOINTS,
      airways: {
        conventional: PERUVIAN_AIRWAYS.conventional,
        rnav: PERUVIAN_AIRWAYS.rnav,
      },
    })
  }
}
