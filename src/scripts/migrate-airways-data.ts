import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Use a separate Prisma client without query logging for faster migration
const db = new PrismaClient({ log: ['error', 'warn'] })

interface WaypointData {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  description?: string
}

interface NavaidData {
  id: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  elevation?: number
}

interface SegmentData {
  from: string
  to: string
  distance: number
  bearing: number
  minFL?: number
  maxFL?: number
  trackTrue?: number
  reverseTrack?: number
}

interface AirwayData {
  designator: string
  type: string
  level: string
  segments: SegmentData[]
}

interface FIRData {
  name: string
  type: string
  center: { lat: number; lon: number }
  polygon: Array<{ lat: number; lon: number }>
}

interface AdjacentFIRData {
  icao: string
  name: string
  country: string
  borderPoints: Array<{ lat: number; lon: number }>
  color?: string
}

interface AirwaysData {
  firBoundaries: Record<string, FIRData>
  adjacentFirs: AdjacentFIRData[]
  navaids: NavaidData[]
  waypoints: WaypointData[]
  airways: {
    conventional: AirwayData[]
    rnav: AirwayData[]
  }
}

async function migrate() {
  console.log('🚀 Starting airways data migration...')

  const filePath = join(process.cwd(), 'public', 'data', 'airways-data.json')
  const raw = readFileSync(filePath, 'utf-8')
  const data: AirwaysData = JSON.parse(raw)

  // 1. Migrate FIR boundaries
  console.log('\n📡 Migrating FIR boundaries...')
  for (const [id, fir] of Object.entries(data.firBoundaries)) {
    await db.fIRBoundary.upsert({
      where: { id },
      update: {
        name: fir.name,
        type: fir.type,
        centerLat: fir.center.lat,
        centerLon: fir.center.lon,
        polygon: JSON.stringify(fir.polygon),
      },
      create: {
        id,
        name: fir.name,
        type: fir.type,
        centerLat: fir.center.lat,
        centerLon: fir.center.lon,
        polygon: JSON.stringify(fir.polygon),
      },
    })
    console.log(`  ✓ FIR: ${id} (${fir.name})`)
  }

  // 2. Migrate adjacent FIRs
  console.log('\n📡 Migrating adjacent FIRs...')
  for (const fir of data.adjacentFirs) {
    await db.adjacentFIR.upsert({
      where: { icao: fir.icao },
      update: {
        name: fir.name,
        country: fir.country,
        borderPoints: JSON.stringify(fir.borderPoints),
        color: fir.color || null,
      },
      create: {
        icao: fir.icao,
        name: fir.name,
        country: fir.country,
        borderPoints: JSON.stringify(fir.borderPoints),
        color: fir.color || null,
      },
    })
    console.log(`  ✓ Adjacent FIR: ${fir.icao} (${fir.name})`)
  }

  // 3. Migrate navaids
  console.log('\n📡 Migrating navaids...')
  for (const nav of data.navaids) {
    await db.navaid.upsert({
      where: { id: nav.id },
      update: {
        name: nav.name,
        type: nav.type,
        frequency: nav.frequency,
        lat: nav.lat,
        lon: nav.lon,
        elevation: nav.elevation ?? null,
      },
      create: {
        id: nav.id,
        name: nav.name,
        type: nav.type,
        frequency: nav.frequency,
        lat: nav.lat,
        lon: nav.lon,
        elevation: nav.elevation ?? null,
      },
    })
  }
  console.log(`  ✓ ${data.navaids.length} navaids migrated`)

  // 4. Migrate waypoints
  console.log('\n📡 Migrating waypoints...')
  for (const wp of data.waypoints) {
    await db.waypoint.upsert({
      where: { id: wp.id },
      update: {
        name: wp.name,
        type: wp.type,
        lat: wp.lat,
        lon: wp.lon,
        description: wp.description || null,
      },
      create: {
        id: wp.id,
        name: wp.name,
        type: wp.type,
        lat: wp.lat,
        lon: wp.lon,
        description: wp.description || null,
      },
    })
  }
  console.log(`  ✓ ${data.waypoints.length} waypoints migrated`)

  // 5. Migrate airways + segments
  console.log('\n📡 Migrating airways...')
  const allAirways = [...data.airways.conventional, ...data.airways.rnav]
  let totalSegments = 0

  for (const aw of allAirways) {
    const existing = await db.airway.findFirst({
      where: { designator: aw.designator, type: aw.type },
    })

    if (!existing) {
      const airway = await db.airway.create({
        data: {
          designator: aw.designator,
          type: aw.type,
          level: aw.level,
        },
      })

      for (let i = 0; i < aw.segments.length; i++) {
        const seg = aw.segments[i]
        await db.airwaySegment.create({
          data: {
            airwayId: airway.id,
            orderIndex: i,
            fromPoint: seg.from,
            toPoint: seg.to,
            distance: seg.distance,
            bearing: seg.bearing,
            minFL: seg.minFL ?? null,
            maxFL: seg.maxFL ?? null,
            trackTrue: seg.trackTrue ?? null,
            reverseTrack: seg.reverseTrack ?? null,
          },
        })
        totalSegments++
      }
      console.log(`  ✓ Airway: ${aw.designator} (${aw.type}) - ${aw.segments.length} segments`)
    } else {
      console.log(`  → Airway ${aw.designator} (${aw.type}) already exists, skipping`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`  FIR Boundaries: ${Object.keys(data.firBoundaries).length}`)
  console.log(`  Adjacent FIRs: ${data.adjacentFirs.length}`)
  console.log(`  Navaids: ${data.navaids.length}`)
  console.log(`  Waypoints: ${data.waypoints.length}`)
  console.log(`  Airways: ${allAirways.length} (${data.airways.conventional.length} conventional, ${data.airways.rnav.length} RNAV)`)
  console.log(`  Total segments: ${totalSegments}`)
  console.log('='.repeat(50))
  console.log('\n✅ Migration complete!')

  await db.$disconnect()
}

migrate().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
