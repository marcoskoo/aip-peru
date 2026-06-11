import { db } from "@/lib/db"

// Navaid ID corrections from AIP Peru GEN 2.5
const navaidRename: Record<string, string> = {
  "LIM": "JCL",   // JORGE CHAVEZ DVOR/DME
  "PSO": "SCO",   // PISCO VOR/DME
  "AQP": "EQU",   // AREQUIPA VOR/DME
  "TBP": "BES",   // TUMBES VOR/DME
  "CIX": "CLA",   // CHICLAYO VOR/DME
  "CUZ": "ZCO",   // CUSCO VOR/DME
  "PCL": "PUL",   // PUCALLPA VOR/DME
  "TCQ": "TCA",   // TACNA VOR/DME
  "PEM": "PDO",   // PUERTO MALDONADO VOR/DME
}

// Corrected navaid data
const correctedNavaids: Record<string, { name: string; type: string; frequency: string; lat: number; lon: number; elevation: number }> = {
  "JCL": { name: "JORGE CHAVEZ", type: "DVOR/DME", frequency: "116.9 MHz", lat: -12.0106, lon: -77.1209, elevation: 33 },
  "SCO": { name: "PISCO", type: "DVOR/DME", frequency: "114.1 MHz", lat: -13.7389, lon: -76.2131, elevation: 100 },
  "EQU": { name: "AREQUIPA", type: "DVOR/DME", frequency: "113.7 MHz", lat: -16.3389, lon: -71.5975, elevation: 8405 },
  "BES": { name: "TUMBES", type: "VOR/DME", frequency: "112.9 MHz", lat: -3.5444, lon: -80.3892, elevation: 82 },
  "CLA": { name: "CHICLAYO", type: "DVOR/DME", frequency: "114.9 MHz", lat: -6.7172, lon: -79.8192, elevation: 121 },
  "ZCO": { name: "CUSCO", type: "DVOR/DME", frequency: "114.9 MHz", lat: -13.5192, lon: -72.01, elevation: 12745 },
  "PUL": { name: "PUCALLPA", type: "DVOR/DME", frequency: "116.7 MHz", lat: -8.3758, lon: -74.5722, elevation: 537 },
  "TCA": { name: "TACNA", type: "DVOR/DME", frequency: "115.1 MHz", lat: -18.0579, lon: -70.2763, elevation: 1277 },
  "PDO": { name: "PUERTO MALDONADO", type: "DVOR/DME", frequency: "116.1 MHz", lat: -12.6083, lon: -69.2272, elevation: 659 },
}

// New navaids to add
const newNavaids = [
  { id: "TRU", name: "TRUJILLO", type: "DVOR/DME", frequency: "116.3 MHz", lat: -8.0872, lon: -79.1122, elevation: 100 },
  { id: "BTE", name: "CHIMBOTE", type: "VOR", frequency: "112.5 MHz", lat: -9.1475, lon: -78.5219, elevation: 70 },
  { id: "ILO", name: "ILO", type: "VOR", frequency: "112.5 MHz", lat: -17.6911, lon: -71.3506, elevation: 72 },
  { id: "TAL", name: "TALARA", type: "VOR", frequency: "116.1 MHz", lat: -4.5806, lon: -81.2525, elevation: 282 },
  { id: "TAP", name: "TARAPOTO", type: "DVOR/DME", frequency: "115.5 MHz", lat: -6.6581, lon: -76.3673, elevation: 1664 },
  { id: "TRO", name: "TROMPETEROS", type: "DVOR/DME", frequency: "115.5 MHz", lat: -3.7997, lon: -75.0397, elevation: 427 },
  { id: "SLS", name: "SALINAS", type: "DVOR/DME", frequency: "114.7 MHz", lat: -11.2876, lon: -77.5625, elevation: 324 },
  { id: "AND", name: "ANDAHUAYLAS", type: "DVOR/DME", frequency: "114.3 MHz", lat: -13.7142, lon: -73.3778, elevation: 11997 },
  { id: "POY", name: "CHACHAPOYAS", type: "DVOR/DME", frequency: "115.1 MHz", lat: -6.2003, lon: -77.86, elevation: 8294 },
  { id: "UAS", name: "SIHUAS", type: "VOR", frequency: "113.5 MHz", lat: -16.3711, lon: -72.1336, elevation: 0 },
  { id: "URC", name: "URCOS", type: "DVOR/DME", frequency: "115.6 MHz", lat: -13.6494, lon: -71.5864, elevation: 13631 },
  { id: "ARI", name: "ARICA", type: "VOR/DME", frequency: "116.3 MHz", lat: -18.3492, lon: -70.3458, elevation: 164 },
  { id: "LPA", name: "LAS PALMAS", type: "DVOR/DME", frequency: "116.3 MHz", lat: -12.1692, lon: -77.0253, elevation: 233 },
  { id: "MLV", name: "MALVINAS", type: "DVOR/DME", frequency: "115.5 MHz", lat: -3.7764, lon: -73.2617, elevation: 350 },
  { id: "OAS", name: "ANDOAS", type: "DVOR/DME", frequency: "113.3 MHz", lat: -2.8303, lon: -76.4553, elevation: 700 },
  { id: "PZA", name: "PTO ESPERANZA", type: "VOR", frequency: "113.9 MHz", lat: -9.7691, lon: -70.7051, elevation: 800 },
]

// New reporting points to add
const newReportingPoints = [
  { id: "ISBEG", name: "ISBEG", type: "REPORTING_POINT", lat: -5.7167, lon: -80.3333, description: "Punto de notificación obligatorio, aproximación Piura" },
  { id: "LATAL", name: "LATAL", type: "REPORTING_POINT", lat: -5.9833, lon: -76.2167, description: "Punto de notificación obligatorio, selva norte" },
  { id: "ENVIT", name: "ENVIT", type: "REPORTING_POINT", lat: -8.75, lon: -77.4167, description: "Punto de notificación obligatorio, costa norte de Chimbote" },
  { id: "VIGTO", name: "VIGTO", type: "REPORTING_POINT", lat: -14.8333, lon: -75.1667, description: "Punto de notificación obligatorio, costa sur" },
  { id: "OTBAS", name: "OTBAS", type: "REPORTING_POINT", lat: -11.4167, lon: -77.0, description: "Punto de notificación obligatorio, aproximación Lima sur" },
  { id: "EKLIM", name: "EKLIM", type: "REPORTING_POINT", lat: -12.25, lon: -77.0, description: "Punto de notificación obligatorio, salida Lima sur" },
  { id: "KUVIK", name: "KUVIK", type: "REPORTING_POINT", lat: -3.85, lon: -73.3, description: "Punto de notificación obligatorio, aproximación Iquitos" },
  { id: "EPMAL", name: "EPMAL", type: "REPORTING_POINT", lat: -12.65, lon: -69.3167, description: "Punto de notificación obligatorio, aproximación Pto. Maldonado" },
  { id: "EKCUS", name: "EKCUS", type: "REPORTING_POINT", lat: -13.5333, lon: -71.9333, description: "Punto de notificación obligatorio, aproximación Cusco" },
  { id: "EJAQL", name: "EJAQL", type: "REPORTING_POINT", lat: -16.35, lon: -71.5833, description: "Punto de notificación obligatorio, aproximación Arequipa" },
]

async function main() {
  console.log("Fixing navaid identifiers...")

  // 1. Update existing navaids (rename + correct data)
  for (const [oldId, newId] of Object.entries(navaidRename)) {
    const correctedData = correctedNavaids[newId]
    if (!correctedData) continue

    // Check if old navaid exists
    const existing = await db.navaid.findUnique({ where: { id: oldId } })
    if (existing) {
      // Delete old navaid first (to avoid unique constraint)
      await db.navaid.delete({ where: { id: oldId } })
      // Create with new ID and corrected data
      await db.navaid.create({
        data: {
          id: newId,
          name: correctedData.name,
          type: correctedData.type,
          frequency: correctedData.frequency,
          lat: correctedData.lat,
          lon: correctedData.lon,
          elevation: correctedData.elevation,
        },
      })
      console.log(`✓ Navaid ${oldId} → ${newId}`)
    } else {
      // Check if new ID already exists
      const existingNew = await db.navaid.findUnique({ where: { id: newId } })
      if (!existingNew) {
        await db.navaid.create({
          data: {
            id: newId,
            name: correctedData.name,
            type: correctedData.type,
            frequency: correctedData.frequency,
            lat: correctedData.lat,
            lon: correctedData.lon,
            elevation: correctedData.elevation,
          },
        })
        console.log(`✓ Created navaid ${newId}`)
      } else {
        // Update existing new ID with corrected data
        await db.navaid.update({
          where: { id: newId },
          data: {
            name: correctedData.name,
            type: correctedData.type,
            frequency: correctedData.frequency,
            lat: correctedData.lat,
            lon: correctedData.lon,
            elevation: correctedData.elevation,
          },
        })
        console.log(`✓ Updated navaid ${newId}`)
      }
    }
  }

  // 2. Update existing correct navaids (IQT, JUL, URA) with corrected data from OurAirports
  const existingCorrections: Record<string, { frequency: string; lat: number; lon: number; elevation: number }> = {
    "IQT": { frequency: "116.5 MHz", lat: -3.7923, lon: -73.3174, elevation: 335 },
    "JUL": { frequency: "115.55 MHz", lat: -15.4681, lon: -70.1511, elevation: 12552 },
    "URA": { frequency: "117.7 MHz", lat: -5.21, lon: -80.6161, elevation: 174 },
  }
  for (const [id, data] of Object.entries(existingCorrections)) {
    const existing = await db.navaid.findUnique({ where: { id } })
    if (existing) {
      await db.navaid.update({
        where: { id },
        data: {
          frequency: data.frequency,
          lat: data.lat,
          lon: data.lon,
          elevation: data.elevation,
        },
      })
      console.log(`✓ Corrected navaid ${id} data`)
    }
  }

  // 3. Add new navaids
  for (const nav of newNavaids) {
    const existing = await db.navaid.findUnique({ where: { id: nav.id } })
    if (!existing) {
      await db.navaid.create({
        data: {
          id: nav.id,
          name: nav.name,
          type: nav.type,
          frequency: nav.frequency,
          lat: nav.lat,
          lon: nav.lon,
          elevation: nav.elevation,
        },
      })
      console.log(`✓ Added new navaid ${nav.id}`)
    } else {
      await db.navaid.update({
        where: { id: nav.id },
        data: {
          name: nav.name,
          type: nav.type,
          frequency: nav.frequency,
          lat: nav.lat,
          lon: nav.lon,
          elevation: nav.elevation,
        },
      })
      console.log(`✓ Updated navaid ${nav.id}`)
    }
  }

  // 4. Update waypoints (rename navaid waypoints)
  for (const [oldId, newId] of Object.entries(navaidRename)) {
    const existingWp = await db.waypoint.findUnique({ where: { id: oldId } })
    if (existingWp) {
      const correctedData = correctedNavaids[newId]
      await db.waypoint.delete({ where: { id: oldId } })
      await db.waypoint.create({
        data: {
          id: newId,
          name: newId,
          type: "NAVAID",
          lat: correctedData?.lat ?? existingWp.lat,
          lon: correctedData?.lon ?? existingWp.lon,
          description: `${newId} ${correctedData?.type ?? ''} facility`.trim(),
        },
      })
      console.log(`✓ Waypoint ${oldId} → ${newId}`)
    }
  }

  // 5. Add new navaid waypoints
  for (const nav of newNavaids) {
    const existingWp = await db.waypoint.findUnique({ where: { id: nav.id } })
    if (!existingWp) {
      await db.waypoint.create({
        data: {
          id: nav.id,
          name: nav.id,
          type: "NAVAID",
          lat: nav.lat,
          lon: nav.lon,
          description: `${nav.name} ${nav.type} facility`,
        },
      })
      console.log(`✓ Added waypoint ${nav.id}`)
    }
  }

  // 6. Add new reporting points
  for (const rp of newReportingPoints) {
    const existingWp = await db.waypoint.findUnique({ where: { id: rp.id } })
    if (!existingWp) {
      await db.waypoint.create({
        data: {
          id: rp.id,
          name: rp.name,
          type: rp.type,
          lat: rp.lat,
          lon: rp.lon,
          description: rp.description,
        },
      })
      console.log(`✓ Added reporting point ${rp.id}`)
    }
  }

  // 7. Update airway segment references
  for (const [oldId, newId] of Object.entries(navaidRename)) {
    const updatedFrom = await db.airwaySegment.updateMany({
      where: { fromPoint: oldId },
      data: { fromPoint: newId },
    })
    const updatedTo = await db.airwaySegment.updateMany({
      where: { toPoint: oldId },
      data: { toPoint: newId },
    })
    if (updatedFrom.count > 0 || updatedTo.count > 0) {
      console.log(`✓ Updated airway segments: ${oldId}→${newId} (from=${updatedFrom.count}, to=${updatedTo.count})`)
    }
  }

  console.log("\n✅ All navaid corrections applied!")
}

main()
  .catch((e) => {
    console.error("Fix error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
