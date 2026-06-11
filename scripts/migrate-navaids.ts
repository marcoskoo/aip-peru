/**
 * Migration script: Correct navaid identifiers to official AIP Peru ENR 4.1 data
 * 
 * Changes:
 * - Update navaid IDs (LIM→JCL, PSO→SCO, AQP→EQU, TBP→BES, CIX→CLA, CUZ→ZCO, PCL→PUL, TCQ→TCA, PEM→PDO)
 * - Update frequencies to AIP values
 * - Update coordinates to AIP values
 * - Update waypoint references (NAVAID type)
 * - Update airway segment references (fromPoint/toPoint)
 * - Add new navaids from AIP that weren't in the database
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── ID Mapping ────────────────────────────────────────────────
const ID_MAP: Record<string, string> = {
  LIM: 'JCL',
  PSO: 'SCO',
  AQP: 'EQU',
  TBP: 'BES',
  CIX: 'CLA',
  CUZ: 'ZCO',
  PCL: 'PUL',
  TCQ: 'TCA',
  PEM: 'PDO',
}

// ─── Coordinate parser ─────────────────────────────────────────
function parseCoord(latStr: string, lonStr: string): { lat: number; lon: number } {
  const latDeg = parseInt(latStr.substring(0, 2))
  const latMin = parseInt(latStr.substring(2, 4))
  const latSec = parseInt(latStr.substring(4, 6))
  const latSign = latStr.substring(6) === 'S' ? -1 : 1

  const lonDeg = parseInt(lonStr.substring(0, 3))
  const lonMin = parseInt(lonStr.substring(3, 5))
  const lonSec = parseInt(lonStr.substring(5, 7))
  const lonSign = lonStr.substring(7) === 'W' ? -1 : 1

  return {
    lat: Math.round(latSign * (latDeg + latMin / 60 + latSec / 3600) * 10000) / 10000,
    lon: Math.round(lonSign * (lonDeg + lonMin / 60 + lonSec / 3600) * 10000) / 10000,
  }
}

// ─── Updated navaid data from AIP Peru ENR 4.1 ────────────────
const NAVAID_UPDATES: Record<string, {
  newId: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  elevation: number | null
}> = {
  LIM: {
    newId: 'JCL',
    name: 'JORGE CHAVEZ',
    type: 'DVOR/DME',
    frequency: '116.90 MHz',
    ...parseCoord('120223S', '0770620W'),
    elevation: 115,
  },
  PSO: {
    newId: 'SCO',
    name: 'PISCO',
    type: 'VOR/DME',
    frequency: '114.10 MHz',
    ...parseCoord('134419S', '0761246W'),
    elevation: 100,
  },
  AQP: {
    newId: 'EQU',
    name: 'AREQUIPA',
    type: 'VOR/DME',
    frequency: '113.70 MHz',
    ...parseCoord('162021S', '0713550W'),
    elevation: 39,
  },
  URA: {
    newId: 'URA',
    name: 'PIURA',
    type: 'VOR/DME',
    frequency: '117.70 MHz',
    ...parseCoord('051236S', '0803658W'),
    elevation: null,
  },
  TBP: {
    newId: 'BES',
    name: 'TUMBES',
    type: 'VOR/DME',
    frequency: '112.90 MHz',
    ...parseCoord('033240S', '0802321W'),
    elevation: null,
  },
  CIX: {
    newId: 'CLA',
    name: 'CHICLAYO',
    type: 'VOR/DME',
    frequency: '114.90 MHz',
    ...parseCoord('064302S', '0794909W'),
    elevation: 121,
  },
  IQT: {
    newId: 'IQT',
    name: 'IQUITOS',
    type: 'VOR/DME',
    frequency: '116.50 MHz',
    ...parseCoord('034733S', '0731904W'),
    elevation: 335,
  },
  CUZ: {
    newId: 'ZCO',
    name: 'CUSCO',
    type: 'VOR/DME',
    frequency: '114.90 MHz',
    ...parseCoord('133109S', '0720036W'),
    elevation: null,
  },
  PCL: {
    newId: 'PUL',
    name: 'PUCALLPA',
    type: 'VOR/DME',
    frequency: '116.70 MHz',
    ...parseCoord('082233S', '0743420W'),
    elevation: 537,
  },
  TCQ: {
    newId: 'TCA',
    name: 'TACNA',
    type: 'VOR/DME',
    frequency: '116.80 MHz',
    ...parseCoord('180328S', '0701635W'),
    elevation: 1277,
  },
  JUL: {
    newId: 'JUL',
    name: 'JULIACA',
    type: 'VOR/DME',
    frequency: '115.50 MHz',
    ...parseCoord('152805S', '0700904W'),
    elevation: null,
  },
  PEM: {
    newId: 'PDO',
    name: 'PUERTO MALDONADO',
    type: 'VOR/DME',
    frequency: '116.10 MHz',
    ...parseCoord('123628S', '0691338W'),
    elevation: null,
  },
}

// ─── New navaids to add from AIP Peru ENR 4.1 ─────────────────
const NEW_NAVAIDS: Array<{
  id: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  elevation: number | null
}> = [
  { id: 'AND', name: 'ANDAHUAYLAS', type: 'VOR/DME', frequency: '114.30 MHz', ...parseCoord('134251S', '0732240W'), elevation: null },
  { id: 'OAS', name: 'ANDOAS', type: 'VOR/DME', frequency: '116.80 MHz', ...parseCoord('024722S', '0762839W'), elevation: null },
  { id: 'ARI', name: 'ARICA', type: 'VOR/DME', frequency: '116.50 MHz', ...parseCoord('182210S', '0702047W'), elevation: null },
  { id: 'POY', name: 'CHACHAPOYAS', type: 'VOR/DME', frequency: '115.10 MHz', ...parseCoord('061202S', '0775135W'), elevation: null },
  { id: 'BTE', name: 'CHIMBOTE', type: 'VOR', frequency: '112.50 MHz', ...parseCoord('090851S', '0783119W'), elevation: null },
  { id: 'ILO', name: 'ILO', type: 'VOR', frequency: '112.50 MHz', ...parseCoord('174128S', '0712102W'), elevation: null },
  { id: 'LPA', name: 'LAS PALMAS', type: 'DVOR/DME', frequency: '113.30 MHz', ...parseCoord('120921S', '0765958W'), elevation: null },
  { id: 'LET', name: 'LETICIA', type: 'DVOR/DME', frequency: '117.50 MHz', ...parseCoord('041142S', '0695624W'), elevation: 285 },
  { id: 'MLV', name: 'MALVINAS', type: 'VOR/DME', frequency: '117.20 MHz', ...parseCoord('115130S', '0725616W'), elevation: null },
  { id: 'PZA', name: 'PTO ESPERANZA', type: 'VOR', frequency: '113.90 MHz', ...parseCoord('094609S', '0704218W'), elevation: null },
  { id: 'PLG', name: 'PUERTO LEGUIZAMO', type: 'VOR/DME', frequency: '112.80 MHz', ...parseCoord('001043S', '0744632W'), elevation: 665 },
  { id: 'SLS', name: 'SALINAS', type: 'DVOR/DME', frequency: '114.70 MHz', ...parseCoord('111715S', '0773345W'), elevation: null },
  { id: 'SRV', name: 'SANTA ROSA', type: 'VOR', frequency: '116.60 MHz', ...parseCoord('032650S', '0800034W'), elevation: null },
  { id: 'UAS', name: 'SIHUAS', type: 'VOR', frequency: '113.50 MHz', ...parseCoord('162216S', '0720801W'), elevation: null },
  { id: 'TAL', name: 'TALARA', type: 'VOR', frequency: '116.10 MHz', ...parseCoord('043449S', '0811509W'), elevation: null },
  { id: 'TAP', name: 'TARAPOTO', type: 'VOR/DME', frequency: '115.50 MHz', ...parseCoord('063929S', '0762104W'), elevation: null },
  { id: 'TRO', name: 'TROMPETEROS', type: 'VOR/DME', frequency: '114.80 MHz', ...parseCoord('034810S', '0750303W'), elevation: null },
  { id: 'TRU', name: 'TRUJILLO', type: 'DVOR/DME', frequency: '116.30 MHz', ...parseCoord('080515S', '0790645W'), elevation: null },
  { id: 'URC', name: 'URCOS', type: 'VOR/DME', frequency: '115.60 MHz', ...parseCoord('133858S', '0713511W'), elevation: 14086 },
]

async function main() {
  console.log('🔄 Starting navaid migration...\n')

  // Step 1: Update existing navaids (create new, delete old)
  for (const [oldId, update] of Object.entries(NAVAID_UPDATES)) {
    const newId = update.newId
    const idChanged = oldId !== newId

    console.log(`📡 Navaid ${oldId}${idChanged ? ` → ${newId}` : ''}: ${update.name} ${update.type} ${update.frequency}`)

    if (idChanged) {
      await db.navaid.create({
        data: {
          id: newId,
          name: update.name,
          type: update.type,
          frequency: update.frequency,
          lat: update.lat,
          lon: update.lon,
          elevation: update.elevation,
        },
      })
      await db.navaid.delete({ where: { id: oldId } })
    } else {
      await db.navaid.update({
        where: { id: oldId },
        data: {
          name: update.name,
          type: update.type,
          frequency: update.frequency,
          lat: update.lat,
          lon: update.lon,
          elevation: update.elevation,
        },
      })
    }
  }

  // Step 2: Update waypoints that reference old navaid IDs
  console.log('\n📌 Updating waypoint references...')
  for (const [oldId, newId] of Object.entries(ID_MAP)) {
    if (oldId === newId) continue

    const oldWaypoint = await db.waypoint.findUnique({ where: { id: oldId } })
    if (oldWaypoint) {
      const existingNew = await db.waypoint.findUnique({ where: { id: newId } })
      if (existingNew) {
        await db.waypoint.update({
          where: { id: newId },
          data: {
            name: newId,
            type: 'NAVAID',
            lat: NAVAID_UPDATES[oldId]?.lat ?? oldWaypoint.lat,
            lon: NAVAID_UPDATES[oldId]?.lon ?? oldWaypoint.lon,
            description: `${NAVAID_UPDATES[oldId]?.name || oldId} VOR/DME facility`,
          },
        })
        await db.waypoint.delete({ where: { id: oldId } })
      } else {
        await db.waypoint.create({
          data: {
            id: newId,
            name: newId,
            type: 'NAVAID',
            lat: NAVAID_UPDATES[oldId]?.lat ?? oldWaypoint.lat,
            lon: NAVAID_UPDATES[oldId]?.lon ?? oldWaypoint.lon,
            description: `${NAVAID_UPDATES[oldId]?.name || oldId} VOR/DME facility`,
          },
        })
        await db.waypoint.delete({ where: { id: oldId } })
      }
      console.log(`  Waypoint ${oldId} → ${newId}`)
    }
  }

  // Step 3: Update airway segments that reference old navaid IDs
  console.log('\n🛣️ Updating airway segment references...')
  for (const [oldId, newId] of Object.entries(ID_MAP)) {
    if (oldId === newId) continue

    const fromSegments = await db.airwaySegment.findMany({ where: { fromPoint: oldId } })
    for (const seg of fromSegments) {
      await db.airwaySegment.update({
        where: { id: seg.id },
        data: { fromPoint: newId },
      })
    }

    const toSegments = await db.airwaySegment.findMany({ where: { toPoint: oldId } })
    for (const seg of toSegments) {
      await db.airwaySegment.update({
        where: { id: seg.id },
        data: { toPoint: newId },
      })
    }

    const total = fromSegments.length + toSegments.length
    if (total > 0) {
      console.log(`  ${oldId} → ${newId}: ${total} segment references updated`)
    }
  }

  // Step 4: Add new navaids from AIP
  console.log('\n✨ Adding new navaids from AIP Peru ENR 4.1...')
  for (const navaid of NEW_NAVAIDS) {
    const existing = await db.navaid.findUnique({ where: { id: navaid.id } })
    if (existing) {
      console.log(`  ⏭️  ${navaid.id} (${navaid.name}) already exists, skipping`)
      continue
    }

    await db.navaid.create({ data: navaid })
    console.log(`  ✅ Added ${navaid.id} (${navaid.name}) ${navaid.type} ${navaid.frequency}`)

    const existingWp = await db.waypoint.findUnique({ where: { id: navaid.id } })
    if (!existingWp) {
      await db.waypoint.create({
        data: {
          id: navaid.id,
          name: navaid.id,
          type: 'NAVAID',
          lat: navaid.lat,
          lon: navaid.lon,
          description: `${navaid.name} ${navaid.type} facility`,
        },
      })
    }
  }

  // Step 5: Update waypoint coordinates for navaids that didn't change ID
  console.log('\n📍 Updating waypoint coordinates for existing navaids...')
  for (const [oldId, update] of Object.entries(NAVAID_UPDATES)) {
    const newId = update.newId
    const wp = await db.waypoint.findUnique({ where: { id: newId } })
    if (wp) {
      await db.waypoint.update({
        where: { id: newId },
        data: {
          lat: update.lat,
          lon: update.lon,
          description: `${update.name} ${update.type} facility`,
        },
      })
      console.log(`  Updated coordinates for ${newId}: ${update.lat.toFixed(4)}, ${update.lon.toFixed(4)}`)
    }
  }

  // Verify
  console.log('\n📊 Final navaid count:', await db.navaid.count())
  console.log('📊 Final waypoint count:', await db.waypoint.count())
  console.log('📊 Total airway segments:', await db.airwaySegment.count())

  console.log('\n✅ Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
