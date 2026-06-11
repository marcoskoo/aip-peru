import { readFileSync } from "fs"
import { join } from "path"
import { db } from "@/lib/db"

const airwaysData = JSON.parse(
  readFileSync(join(process.cwd(), "public/data/airways-data.json"), "utf-8")
)

async function main() {
  console.log("Seeding aeronautical data...")

  // 1. Seed Waypoints
  const existingWaypoints = await db.waypoint.count()
  if (existingWaypoints === 0) {
    console.log(`Seeding ${airwaysData.waypoints.length} waypoints...`)
    for (const wp of airwaysData.waypoints) {
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
    }
    console.log("Waypoints seeded.")
  } else {
    console.log(`Waypoints already exist (${existingWaypoints}), skipping.`)
  }

  // 2. Seed Navaids
  const existingNavaids = await db.navaid.count()
  if (existingNavaids === 0) {
    console.log(`Seeding ${airwaysData.navaids.length} navaids...`)
    for (const nv of airwaysData.navaids) {
      await db.navaid.create({
        data: {
          id: nv.id,
          name: nv.name,
          type: nv.type,
          frequency: nv.frequency,
          lat: nv.lat,
          lon: nv.lon,
          elevation: nv.elevation ?? null,
        },
      })
    }
    console.log("Navaids seeded.")
  } else {
    console.log(`Navaids already exist (${existingNavaids}), skipping.`)
  }

  // 3. Seed Airways (conventional + RNAV)
  const existingAirways = await db.airway.count()
  if (existingAirways === 0) {
    const allAirways = [
      ...airwaysData.airways.conventional,
      ...airwaysData.airways.rnav,
    ]
    console.log(`Seeding ${allAirways.length} airways...`)
    for (const aw of allAirways) {
      await db.airway.create({
        data: {
          designator: aw.designator,
          type: aw.type,
          level: aw.level,
          segments: {
            create: aw.segments.map((seg, idx) => ({
              orderIndex: idx,
              fromPoint: seg.from,
              toPoint: seg.to,
              distance: seg.distance,
              bearing: seg.bearing,
              minFL: seg.minFL ?? null,
              maxFL: seg.maxFL ?? null,
              trackTrue: seg.trackTrue ?? null,
              reverseTrack: seg.reverseTrack ?? null,
            })),
          },
        },
      })
    }
    console.log("Airways seeded.")
  } else {
    console.log(`Airways already exist (${existingAirways}), skipping.`)
  }

  // 4. Seed FIR Boundaries
  const existingFIR = await db.fIRBoundary.count()
  if (existingFIR === 0) {
    const firEntries = Object.entries(airwaysData.firBoundaries)
    console.log(`Seeding ${firEntries.length} FIR boundaries...`)
    for (const [id, fir] of firEntries) {
      await db.fIRBoundary.create({
        data: {
          id,
          name: fir.name,
          type: fir.type || "FIR",
          centerLat: fir.center.lat,
          centerLon: fir.center.lon,
          polygon: JSON.stringify(fir.polygon),
        },
      })
    }
    console.log("FIR boundaries seeded.")
  } else {
    console.log(`FIR boundaries already exist (${existingFIR}), skipping.`)
  }

  // 5. Seed Adjacent FIRs
  const existingAdjFIR = await db.adjacentFIR.count()
  if (existingAdjFIR === 0) {
    console.log(`Seeding ${airwaysData.adjacentFirs.length} adjacent FIRs...`)
    const colors: Record<string, string> = {
      SEGU: "#f97316",
      SKED: "#eab308",
      SBAM: "#22c55e",
      SLLP: "#a855f7",
      SCEZ: "#ef4444",
    }
    for (const fir of airwaysData.adjacentFirs) {
      await db.adjacentFIR.create({
        data: {
          icao: fir.icao,
          name: fir.name,
          country: fir.country,
          borderPoints: fir.borderPoints ? JSON.stringify(fir.borderPoints) : null,
          color: colors[fir.icao] || null,
        },
      })
    }
    console.log("Adjacent FIRs seeded.")
  } else {
    console.log(`Adjacent FIRs already exist (${existingAdjFIR}), skipping.`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
