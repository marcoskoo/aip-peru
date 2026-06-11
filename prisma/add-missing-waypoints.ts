import { readFileSync } from "fs"
import { join } from "path"
import { db } from "@/lib/db"

async function main() {
  console.log("Adding missing waypoints from AIP Peru ENR 4.4...")

  // Read the airways data (which now has all waypoints)
  const airwaysData = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/airways-data.json"), "utf-8")
  )

  // Get existing waypoint IDs from database
  const existingWaypoints = await db.waypoint.findMany({ select: { id: true } })
  const existingIds = new Set(existingWaypoints.map(w => w.id))
  console.log(`Existing waypoints in DB: ${existingIds.size}`)

  // Add missing waypoints
  let added = 0
  let updated = 0
  for (const wp of airwaysData.waypoints) {
    if (!existingIds.has(wp.id)) {
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
      added++
    } else {
      // Update coordinates for existing waypoints
      await db.waypoint.update({
        where: { id: wp.id },
        data: {
          lat: wp.lat,
          lon: wp.lon,
        },
      })
      updated++
    }
  }

  console.log(`✓ Added ${added} new waypoints`)
  console.log(`✓ Updated ${updated} existing waypoints`)
  console.log(`✓ Total waypoints in DB: ${existingIds.size + added}`)
  console.log("\n✅ All missing waypoints added to database!")
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
