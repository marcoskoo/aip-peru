import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error fetching all airdata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airdata' },
      { status: 500 }
    )
  }
}
