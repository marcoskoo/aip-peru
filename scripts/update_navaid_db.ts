import { db } from "@/lib/db"

const navaidUpdates: Record<string, { newId: string; name: string; type: string; frequency: string }> = {
  LIM: { newId: "JCL", name: "JORGE CHAVEZ", type: "DVOR/DME", frequency: "113.8 MHz" },
  PSO: { newId: "SCO", name: "PISCO", type: "VOR/DME", frequency: "114.1 MHz" },
  AQP: { newId: "EQU", name: "AREQUIPA", type: "VOR/DME", frequency: "113.7 MHz" },
  TBP: { newId: "BES", name: "TUMBES", type: "VOR/DME", frequency: "112.9 MHz" },
  CIX: { newId: "CLA", name: "CHICLAYO", type: "VOR/DME", frequency: "114.9 MHz" },
  CUZ: { newId: "ZCO", name: "CUSCO", type: "VOR/DME", frequency: "114.9 MHz" },
  PCL: { newId: "PUL", name: "PUCALLPA", type: "VOR/DME", frequency: "116.7 MHz" },
  TCQ: { newId: "TCA", name: "TACNA", type: "VOR/DME", frequency: "116.8 MHz" },
  PEM: { newId: "PDO", name: "PTO MALDONADO", type: "VOR/DME", frequency: "116.1 MHz" },
}

const newNavaids = [
  { id: "BTE", name: "CHIMBOTE", type: "VOR", frequency: "112.5 MHz", lat: -7.0833, lon: -78.5, elevation: 23 },
  { id: "ILO", name: "ILO", type: "VOR", frequency: "112.5 MHz", lat: -17.6933, lon: -71.3433, elevation: 5 },
  { id: "TAP", name: "TARAPOTO", type: "VOR/DME", frequency: "115.5 MHz", lat: -6.475, lon: -76.345, elevation: 285 },
  { id: "TAL", name: "TALARA", type: "VOR", frequency: "116.5 MHz", lat: -4.5733, lon: -81.2467, elevation: 27 },
  { id: "URC", name: "URCOS", type: "VOR/DME", frequency: "115.6 MHz", lat: -13.7778, lon: -71.6667, elevation: 3123 },
  { id: "SLS", name: "SALINAS", type: "DVOR/DME", frequency: "114.7 MHz", lat: -11.9333, lon: -77.0833, elevation: 6 },
  { id: "AND", name: "ANDAHUAYLAS", type: "VOR/DME", frequency: "114.3 MHz", lat: -13.7597, lon: -73.3503, elevation: 3580 },
  { id: "LPA", name: "LAS PALMAS", type: "DVOR/DME", frequency: "116.1 MHz", lat: -12.05, lon: -77.05, elevation: 88 },
  { id: "MLV", name: "MALVINAS", type: "VOR/DME", frequency: "114.9 MHz", lat: -9.35, lon: -76.15, elevation: 350 },
  { id: "OAS", name: "ANDOAS", type: "VOR/DME", frequency: "113.7 MHz", lat: -2.8667, lon: -76.3, elevation: 185 },
  { id: "POY", name: "CHACHAPOYAS", type: "VOR/DME", frequency: "114.5 MHz", lat: -6.2031, lon: -77.8158, elevation: 2533 },
  { id: "PZA", name: "PTO ESPERANZA", type: "VOR", frequency: "113.9 MHz", lat: -10.6833, lon: -73.3333, elevation: 200 },
  { id: "SRV", name: "SANTA ROSA", type: "VOR", frequency: "115.5 MHz", lat: -8.0833, lon: -79.1, elevation: 20 },
  { id: "UAS", name: "SIHUAS", type: "VOR", frequency: "112.5 MHz", lat: -16.4333, lon: -71.6333, elevation: 3675 },
  { id: "TRO", name: "TROMPETEROS", type: "VOR/DME", frequency: "113.5 MHz", lat: -6.85, lon: -75.8833, elevation: 180 },
  { id: "ARI", name: "ARICA", type: "VOR/DME", frequency: "114.9 MHz", lat: -18.3464, lon: -70.3336, elevation: 56 },
]

async function main() {
  console.log("Updating navaid codes in database...")

  // 1. Update existing navaids with corrected codes
  for (const [oldId, update] of Object.entries(navaidUpdates)) {
    try {
      // Check if old navaid exists
      const existing = await db.navaid.findUnique({ where: { id: oldId } })
      if (existing) {
        // Delete the old record and create a new one with the updated ID
        await db.navaid.delete({ where: { id: oldId } })
        await db.navaid.create({
          data: {
            id: update.newId,
            name: update.name,
            type: update.type,
            frequency: update.frequency,
            lat: existing.lat,
            lon: existing.lon,
            elevation: existing.elevation,
          },
        })
        console.log(`  Updated navaid: ${oldId} → ${update.newId}`)
      } else {
        console.log(`  Navaid ${oldId} not found in DB, skipping`)
      }
    } catch (e) {
      console.error(`  Error updating ${oldId}:`, e)
    }
  }

  // 2. Add new navaids
  for (const nv of newNavaids) {
    try {
      const existing = await db.navaid.findUnique({ where: { id: nv.id } })
      if (!existing) {
        await db.navaid.create({
          data: {
            id: nv.id,
            name: nv.name,
            type: nv.type,
            frequency: nv.frequency,
            lat: nv.lat,
            lon: nv.lon,
            elevation: nv.elevation,
          },
        })
        console.log(`  Added navaid: ${nv.id}`)
      } else {
        console.log(`  Navaid ${nv.id} already exists, skipping`)
      }
    } catch (e) {
      console.error(`  Error adding ${nv.id}:`, e)
    }
  }

  // 3. Update waypoint references
  for (const [oldId, update] of Object.entries(navaidUpdates)) {
    try {
      const wp = await db.waypoint.findUnique({ where: { id: oldId } })
      if (wp) {
        await db.waypoint.delete({ where: { id: oldId } })
        await db.waypoint.create({
          data: {
            id: update.newId,
            name: update.newId,
            type: "NAVAID",
            lat: wp.lat,
            lon: wp.lon,
            description: `${update.name} ${update.type} facility`,
          },
        })
        console.log(`  Updated waypoint: ${oldId} → ${update.newId}`)
      }
    } catch (e) {
      console.error(`  Error updating waypoint ${oldId}:`, e)
    }
  }

  // 4. Add new NAVAID-type waypoints
  for (const nv of newNavaids) {
    try {
      const existing = await db.waypoint.findUnique({ where: { id: nv.id } })
      if (!existing) {
        await db.waypoint.create({
          data: {
            id: nv.id,
            name: nv.id,
            type: "NAVAID",
            lat: nv.lat,
            lon: nv.lon,
            description: `${nv.name} ${nv.type} facility`,
          },
        })
        console.log(`  Added waypoint: ${nv.id}`)
      }
    } catch (e) {
      console.error(`  Error adding waypoint ${nv.id}:`, e)
    }
  }

  // 5. Update airway segment references (fromPoint and toPoint)
  for (const [oldId, update] of Object.entries(navaidUpdates)) {
    try {
      const segments = await db.airwaySegment.findMany({
        where: { OR: [{ fromPoint: oldId }, { toPoint: oldId }] },
      })
      for (const seg of segments) {
        await db.airwaySegment.update({
          where: { id: seg.id },
          data: {
            fromPoint: seg.fromPoint === oldId ? update.newId : seg.fromPoint,
            toPoint: seg.toPoint === oldId ? update.newId : seg.toPoint,
          },
        })
      }
      if (segments.length > 0) {
        console.log(`  Updated ${segments.length} airway segments: ${oldId} → ${update.newId}`)
      }
    } catch (e) {
      console.error(`  Error updating segments for ${oldId}:`, e)
    }
  }

  // 6. Also update waypoints that used old navaid names (PSO, PISCO, etc.)
  const waypointNameUpdates: Record<string, string> = {
    PISCO: "SCO",
  }
  for (const [oldName, newId] of Object.entries(waypointNameUpdates)) {
    try {
      const wp = await db.waypoint.findUnique({ where: { id: oldName } })
      if (wp) {
        // Check if new waypoint already exists
        const existingNew = await db.waypoint.findUnique({ where: { id: newId } })
        if (!existingNew) {
          await db.waypoint.delete({ where: { id: oldName } })
          await db.waypoint.create({
            data: {
              id: newId,
              name: newId,
              type: "NAVAID",
              lat: wp.lat,
              lon: wp.lon,
              description: "PISCO VOR/DME facility",
            },
          })
          console.log(`  Updated waypoint: ${oldName} → ${newId}`)
        } else {
          await db.waypoint.delete({ where: { id: oldName } })
          console.log(`  Deleted duplicate waypoint: ${oldName} (replaced by ${newId})`)
        }
      }
    } catch (e) {
      console.error(`  Error updating waypoint ${oldName}:`, e)
    }
  }

  console.log("Database update complete!")
}

main()
  .catch((e) => {
    console.error("Migration error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
