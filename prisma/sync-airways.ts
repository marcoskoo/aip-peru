import { readFileSync } from "fs"
import { join } from "path"
import { db } from "@/lib/db"

const airwaysData = JSON.parse(
  readFileSync(join(process.cwd(), "public/data/airways-data.json"), "utf-8")
)

async function main() {
  // ── Before counts ──────────────────────────────────────────────
  const beforeWaypoints = await db.waypoint.count()
  const beforeNavaids = await db.navaid.count()
  const beforeAirways = await db.airway.count()
  const beforeSegments = await db.airwaySegment.count()
  const beforeRestricted = await db.restrictedArea.count()

  console.log("=== BEFORE ===")
  console.log(`Waypoints:       ${beforeWaypoints}`)
  console.log(`Navaids:         ${beforeNavaids}`)
  console.log(`Airways:         ${beforeAirways}`)
  console.log(`AirwaySegments:  ${beforeSegments}`)
  console.log(`RestrictedAreas: ${beforeRestricted}`)
  console.log()

  // ── 1. Navaids ────────────────────────────────────────────────
  console.log("-- Syncing Navaids --")
  const existingNavaids = await db.navaid.findMany({ select: { id: true, lat: true, lon: true } })
  const navaidMap = new Map(existingNavaids.map(n => [n.id, n]))

  let navaidsAdded = 0
  let navaidsUpdated = 0
  let navaidsUnchanged = 0

  for (const nav of airwaysData.navaids) {
    const existing = navaidMap.get(nav.id)
    if (!existing) {
      await db.navaid.create({
        data: {
          id: nav.id,
          name: nav.name,
          type: nav.type,
          frequency: nav.frequency,
          lat: nav.lat,
          lon: nav.lon,
          elevation: nav.elevation ?? null,
        },
      })
      navaidsAdded++
      console.log(`  + Added navaid: ${nav.id} (${nav.name})`)
    } else {
      const latDiff = Math.abs(existing.lat - nav.lat) > 0.0001
      const lonDiff = Math.abs(existing.lon - nav.lon) > 0.0001
      if (latDiff || lonDiff) {
        await db.navaid.update({
          where: { id: nav.id },
          data: {
            lat: nav.lat,
            lon: nav.lon,
            name: nav.name,
            type: nav.type,
            frequency: nav.frequency,
            elevation: nav.elevation ?? null,
          },
        })
        navaidsUpdated++
        console.log(`  ~ Updated navaid: ${nav.id} (coords changed)`)
      } else {
        navaidsUnchanged++
      }
    }
  }

  console.log(`  Added: ${navaidsAdded}, Updated: ${navaidsUpdated}, Unchanged: ${navaidsUnchanged}`)
  console.log()

  // ── 2. Waypoints ──────────────────────────────────────────────
  console.log("-- Syncing Waypoints --")
  const existingWaypoints = await db.waypoint.findMany({ select: { id: true } })
  const waypointIds = new Set(existingWaypoints.map(w => w.id))

  let wpAdded = 0
  let wpUpdated = 0

  for (const wp of airwaysData.waypoints) {
    if (!wp.lat || !wp.lon) {
      console.log(`  x Skipping waypoint with no coords: ${wp.id}`)
      continue
    }
    if (!waypointIds.has(wp.id)) {
      await db.waypoint.create({
        data: {
          id: wp.id,
          name: wp.name,
          type: wp.type,
          lat: wp.lat,
          lon: wp.lon,
          description: wp.description || null,
        },
      })
      wpAdded++
    } else {
      await db.waypoint.update({
        where: { id: wp.id },
        data: {
          lat: wp.lat,
          lon: wp.lon,
          type: wp.type,
          name: wp.name,
          description: wp.description || null,
        },
      })
      wpUpdated++
    }
  }

  console.log(`  Added: ${wpAdded}, Updated: ${wpUpdated}`)
  console.log()

  // ── 3. Airways (clean slate) ──────────────────────────────────
  console.log("-- Syncing Airways (clean slate) --")

  const deletedAirways = await db.airway.deleteMany()
  console.log(`  Deleted ${deletedAirways.count} existing airways (and their segments)`)

  const allAirways = [
    ...(airwaysData.airways.conventional || []),
    ...(airwaysData.airways.rnav || []),
  ]

  console.log(`  Inserting ${allAirways.length} airways from JSON...`)

  const seenKeys = new Set<string>()
  let airwaysInserted = 0
  let airwaysSkipped = 0
  let totalSegments = 0

  for (const aw of allAirways) {
    const uniqueKey = `${aw.designator}|${aw.type}`
    if (seenKeys.has(uniqueKey)) {
      console.log(`  Skipping duplicate airway: ${aw.designator} (${aw.type})`)
      airwaysSkipped++
      continue
    }
    seenKeys.add(uniqueKey)

    await db.airway.create({
      data: {
        designator: aw.designator,
        type: aw.type,
        level: aw.level,
        segments: {
          create: aw.segments.map((seg: any, idx: number) => ({
            orderIndex: idx,
            fromPoint: seg.from,
            toPoint: seg.to,
            distance: seg.distance ?? 0,
            bearing: seg.bearing ?? seg.trackTrue ?? 0,
            minFL: seg.minFL ?? null,
            maxFL: seg.maxFL ?? null,
            trackTrue: seg.trackTrue ?? null,
            reverseTrack: seg.reverseTrack ?? null,
          })),
        },
      },
    })

    totalSegments += aw.segments.length
    airwaysInserted++
  }

  console.log(`  Inserted: ${airwaysInserted} airways, Skipped: ${airwaysSkipped}`)
  console.log(`  Total segments: ${totalSegments}`)
  console.log()

  // ── 4. Restricted Areas ───────────────────────────────────────
  console.log("-- Syncing Restricted Areas --")
  
  // Delete all existing restricted areas
  const deletedRA = await db.restrictedArea.deleteMany()
  console.log(`  Deleted ${deletedRA.count} existing restricted areas`)

  const restrictedAreas = airwaysData.restrictedAreas || []
  let raInserted = 0
  let raSkipped = 0

  for (const area of restrictedAreas) {
    if (!area.identifier || !area.shape || !area.coordinates) {
      console.log(`  Skipping incomplete area: ${area.identifier}`)
      raSkipped++
      continue
    }

    await db.restrictedArea.create({
      data: {
        identifier: area.identifier,
        name: area.name,
        type: area.type,
        upperLimit: area.upperLimit || null,
        lowerLimit: area.lowerLimit || null,
        shape: area.shape,
        coordinates: area.coordinates,
        remarks: area.remarks || null,
      },
    })
    raInserted++
  }

  console.log(`  Inserted: ${raInserted}, Skipped: ${raSkipped}`)
  console.log()

  // ── After counts ───────────────────────────────────────────────
  const afterWaypoints = await db.waypoint.count()
  const afterNavaids = await db.navaid.count()
  const afterAirways = await db.airway.count()
  const afterSegments = await db.airwaySegment.count()
  const afterRestricted = await db.restrictedArea.count()

  console.log("=== AFTER ===")
  console.log(`Waypoints:       ${afterWaypoints}  (was ${beforeWaypoints})`)
  console.log(`Navaids:         ${afterNavaids}  (was ${beforeNavaids})`)
  console.log(`Airways:         ${afterAirways}  (was ${beforeAirways})`)
  console.log(`AirwaySegments:  ${afterSegments}  (was ${beforeSegments})`)
  console.log(`RestrictedAreas: ${afterRestricted}  (was ${beforeRestricted})`)
  console.log()

  console.log("Sync complete!")
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
