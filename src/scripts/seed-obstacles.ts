/**
 * Script para poblar obstáculos faltantes en la base de datos Neon.
 *
 * Ejecutar con: bun run src/scripts/seed-obstacles.ts
 *
 * Inserta los obstáculos definidos en prisma/seed-additional-data.ts y
 * prisma/seed.ts para aeropuertos que aún no tienen obstáculos
 * registrados.
 *
 * Es SEGURO de ejecutar múltiples veces — no elimina ni sobrescribe
 * obstáculos existentes. Solo inserta los faltantes.
 */

// Cargar variables de entorno desde .env manualmente (Bun no siempre
// sobrescribe las variables del sistema con las del .env)
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    let value = trimmed.substring(eqIdx + 1).trim()
    // Quitar comillas si las hay
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1)
    }
    // SOBRESCRIBIR siempre — el .env del proyecto tiene prioridad sobre
    // las variables del sistema (que pueden apuntar a una DB SQLite
    // local usada por otras herramientas)
    process.env[key] = value
  }
  console.log(`[seed-obstacles] .env cargado, DATABASE_URL empieza con: ${process.env.DATABASE_URL?.substring(0, 25)}…`)
}

// Import dinámico — esperar a que el env esté cargado antes de
// inicializar Prisma (los imports estáticos se evalúan antes que
// cualquier código, lo que rompería la carga del .env)
const { db } = await import('@/lib/db')

// ─── Datos de obstáculos ──────────────────────────────────────────
// Combinación de seed.ts y seed-additional-data.ts.
// Si un aeropuerto ya tiene obstáculos en la BD, se omite.

interface ObstacleData {
  runwayArea: string
  obstacleType: string
  elevation?: string
  markingLighting?: string
  coordinates?: string
  remarks?: string
}

const OBSTACLES_DATA: Record<string, ObstacleData[]> = {
  SPJC: [
    {
      runwayArea: 'RWY 16L approach',
      obstacleType: 'Antena',
      elevation: '86 m / 282 ft',
      markingLighting: 'LGTD',
      coordinates: "12°01'23.00\"S / 077°06'12.00\"W",
    },
    {
      runwayArea: 'RWY 34R approach',
      obstacleType: 'Edificio',
      elevation: '58 m / 190 ft',
      markingLighting: 'NIL',
      coordinates: "12°00'05.00\"S / 077°06'45.00\"W",
    },
    {
      runwayArea: 'Circuit area',
      obstacleType: 'Antena',
      elevation: '153 m / 502 ft',
      markingLighting: 'LGTD',
      coordinates: "12°02'45.00\"S / 077°05'30.00\"W",
    },
    {
      runwayArea: 'RWY 16R approach',
      obstacleType: 'Chimenea',
      elevation: '94 m / 308 ft',
      markingLighting: 'LGTD',
      coordinates: "11°59'30.00\"S / 077°08'00.00\"W",
    },
  ],
  SPZO: [
    { runwayArea: 'RWY 28 approach', obstacleType: 'Árbol', elevation: '3329.48 m / 10923.4908 ft', coordinates: "13°32'03.85\"S / 071°55'20.03\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Árbol', elevation: '3326.75 m / 10914.5341 ft', coordinates: "13°32'04.69\"S / 071°55'12.41\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Edificio', elevation: '3337.17 m / 10948.7205 ft', coordinates: "13°32'21.67\"S / 071°55'10.18\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Antena', elevation: '3346.61 m / 10979.6916 ft', coordinates: "13°32'23.27\"S / 071°55'10.84\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Antena', elevation: '3354.57 m / 11005.8071 ft', coordinates: "13°32'26.32\"S / 071°55'10.34\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Alta Tensión', elevation: '3363.23 m / 11034.2192 ft', coordinates: "13°32'43.74\"S / 071°54'24.05\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Alta Tensión', elevation: '3368.94 m / 11052.9527 ft', coordinates: "13°32'45.02\"S / 071°54'24.06\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Antena', elevation: '3438.45 m / 11281.0039 ft', coordinates: "13°33'17.57\"S / 071°50'56.28\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Torre de Control ATC', elevation: '3369.60 m / 11055.1181 ft', coordinates: "13°32'17.29\"S / 071°56'36.74\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Estatua de Cóndor', elevation: '3397.70 m / 11147.3097 ft', coordinates: "13°31'41.29\"S / 071°56'23.40\"W" },
  ],
  SPHI: [
    { runwayArea: 'RWY 19 approach', obstacleType: 'Pared de bloque de concreto', elevation: '31 m / 96 ft', markingLighting: 'NIL' },
    { runwayArea: 'RWY 19 approach', obstacleType: 'Antena y equipo militar', elevation: '15 m / 49 ft', markingLighting: 'NIL' },
    { runwayArea: 'RWY 01 approach', obstacleType: 'Poste de barrera de contención', elevation: '33.5 m / 110 ft', markingLighting: 'NIL' },
  ],
  SPSO: [
    { runwayArea: 'RWY 04 approach', obstacleType: 'Barrera de Contención', elevation: '3.60 m', markingLighting: 'NIL' },
    { runwayArea: 'RWY 22 approach', obstacleType: 'Edificio', elevation: '10 m / 33 ft', markingLighting: 'LGTD' },
    { runwayArea: 'RWY 22 approach', obstacleType: 'Antena', elevation: '30 m / 98 ft', markingLighting: 'LGTD' },
    { runwayArea: 'RWY 22 approach', obstacleType: 'Líneas de Transmisión', elevation: '10 m / 33 ft', markingLighting: 'LGTD' },
    { runwayArea: 'RWY 22 approach', obstacleType: 'Hangares', elevation: '20 m / 66 ft', markingLighting: 'LGTD' },
    { runwayArea: 'RWY 22 approach', obstacleType: 'Antena', elevation: '14 m / 46 ft', markingLighting: 'LGTD' },
  ],
  SPRU: [
    { runwayArea: 'RWY 20 approach', obstacleType: 'Antena', elevation: '50 m / 164 ft', coordinates: "08°04'58\"S / 079°07'09\"W", markingLighting: 'NO LGTD' },
    { runwayArea: 'RWY 20 approach', obstacleType: 'Obstáculo', elevation: '75 m', coordinates: "08°04'34\"S / 079°06'57\"W", markingLighting: 'LGTD' },
    { runwayArea: 'RWY 20 approach', obstacleType: 'Obstáculo', elevation: '142 m a 3NM al NE del THR RWY 20', markingLighting: 'NIL' },
  ],
  SPQU: [
    { runwayArea: 'RWY 10 approach', obstacleType: 'Cerros', elevation: '3078 m / 10098 ft', markingLighting: 'NIL', coordinates: "16°22'00\"S / 71°32'00\"W", remarks: 'Terreno natural' },
    { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '2700 m / 8858 ft', markingLighting: 'LGTD', coordinates: "16°19'00\"S / 71°36'00\"W" },
    { runwayArea: 'RWY 28 approach', obstacleType: 'Mástil', elevation: '12 m altura a 450 m lado R a 115 m del eje de la RWY', markingLighting: 'NIL' },
  ],
  SPTN: [
    { runwayArea: 'RWY 02 approach', obstacleType: 'Tanque de agua', elevation: '800 m - THR 02', markingLighting: '30 m. altura' },
    { runwayArea: 'RWY 18 approach', obstacleType: 'Cerros', elevation: '750 m / 2461 ft', markingLighting: 'NIL', coordinates: "18°05'00\"S / 070°15'00\"W", remarks: 'Terreno natural' },
  ],
  SPJL: [
    { runwayArea: 'Circuit area', obstacleType: 'Antena', elevation: '3950 m / 12959 ft', markingLighting: 'LGTD', coordinates: "15°28'00\"S / 70°10'00\"W" },
    { runwayArea: 'RWY 12 approach', obstacleType: 'Obstáculo de 10 m alt. a 2.027 km del THR 12', markingLighting: 'NIL' },
  ],
  SPQT: [
    { runwayArea: 'RWY 07 approach', obstacleType: 'Torre', elevation: '103 m / 338 ft', markingLighting: 'LGTD', coordinates: "03°47'00\"S / 073°19'00\"W" },
    { runwayArea: 'Circuit area', obstacleType: 'Árbol', elevation: '95 m / 312 ft', markingLighting: 'NIL', coordinates: "03°46'00\"S / 073°18'00\"W" },
  ],
  SPEO: [
    { runwayArea: 'RWY 19 approach', obstacleType: 'Antena', elevation: '30 m de altura', coordinates: '496 m del Umbral RWY 19', markingLighting: 'NIL' },
    { runwayArea: 'RWY 19 approach', obstacleType: 'Antena', elevation: '25 m de altura', coordinates: '570 m del Umbral RWY 19', markingLighting: 'NIL' },
  ],
  SPNC: [
    { runwayArea: 'Área del aeródromo', obstacleType: 'Cerros', elevation: 'Atraviesan superficie limitadora de obstáculos', markingLighting: 'NIL' },
    { runwayArea: 'Norte del AD', obstacleType: 'Torres metálicas alta tensión', elevation: '35 m de alto a 1.5 km al norte', markingLighting: 'NIL' },
    { runwayArea: 'Oeste del AD', obstacleType: 'Torres metálicas alta tensión', elevation: '35 m de alto a 3 km al oeste', markingLighting: 'NIL' },
  ],
  SPJI: [
    { runwayArea: 'Área del aeródromo', obstacleType: 'Antena', elevation: '38.50 m de altura', coordinates: "07°10'09''S - 076°43'20''W", markingLighting: 'NIL' },
  ],
  SPMF: [
    { runwayArea: 'RWY 15 approach', obstacleType: 'Postes de cemento energizados', elevation: '8 m de alto a 75 m del Umbral RWY 15', markingLighting: 'NIL' },
    { runwayArea: 'RWY 33 approach', obstacleType: 'Antena', elevation: '25 m de altura a 60 m del Umbral RWY 33', coordinates: '90 m del eje de RWY 33', markingLighting: 'NIL' },
  ],
  SPJA: [
    { runwayArea: 'RWY 16 approach', obstacleType: 'Torre de alta tensión', elevation: '155 m del eje de Pista 16, lado derecho', markingLighting: 'LGTD' },
    { runwayArea: 'RWY 16 approach', obstacleType: 'Torre metálica', elevation: '50 m al Oeste', markingLighting: 'NIL' },
    { runwayArea: 'RWY 34 approach', obstacleType: 'Obstáculo', elevation: '330 m del eje, lado izquierdo Pista 34', markingLighting: 'NIL' },
  ],
  SPST: [
    { runwayArea: 'RWY 17 approach', obstacleType: 'Poste de concreto energía eléctrica', elevation: '11 m', markingLighting: 'NIL', coordinates: '135 m del THR de RWY 17' },
  ],
  SPMS: [
    { runwayArea: 'RWY 09 approach', obstacleType: 'Obstáculo por edificación', elevation: '2.5 m altura', markingLighting: 'NIL', coordinates: '54.5 m lado izquierdo eje Pista 09' },
    { runwayArea: 'RWY 09 approach', obstacleType: 'Estación gasolina', markingLighting: 'NIL', coordinates: '420 m Pista 09 y 70.5 m lado izquierdo eje Pista 09' },
    { runwayArea: 'RWY 27 approach', obstacleType: 'Antenas', markingLighting: 'NIL', coordinates: 'Ambos lados aproximación Pista 27' },
    { runwayArea: 'Plataforma', obstacleType: 'Estación AVGAS', elevation: '11 m', markingLighting: 'NIL', coordinates: 'Lado Este plataforma' },
    { runwayArea: 'RWY 27 approach', obstacleType: 'Cúpula iglesia', elevation: '40 m alto aprox.', markingLighting: 'NIL', coordinates: '600 m umbral Pista 27, lado este' },
  ],
  SPZA: [
    { runwayArea: 'RWY 25 approach', obstacleType: 'Vivienda', elevation: '570 m', markingLighting: 'NIL', coordinates: 'A 50 m de THR 25' },
    { runwayArea: 'RWY 25 approach', obstacleType: 'Árboles', elevation: '7 m', markingLighting: 'NIL', coordinates: 'Entre 70 y 200 m de distancia prolongación de la RWY' },
    { runwayArea: 'RWY 25 approach', obstacleType: 'Antena', elevation: '1985 ft / 605.03 m', markingLighting: 'No señalizado', coordinates: '14°50\'45"S - 074°56\'38"W' },
    { runwayArea: 'RWY 25 approach', obstacleType: 'Antena (cerro Portachuelo)', elevation: '2180 ft / 664.46 m', markingLighting: 'No señalizado', coordinates: '14°52\'44"S - 074°59\'14"W' },
    { runwayArea: 'RWY 07 approach', obstacleType: 'Vivienda', elevation: '2 m', markingLighting: 'NIL', coordinates: 'En prolongación RWY a 80 m desde el THR' },
    { runwayArea: 'RWY 07 approach', obstacleType: 'Montículo', elevation: '3 m', markingLighting: 'NIL', coordinates: 'A 150 m de THR' },
  ],
  SPYL: [
    { runwayArea: 'Circuit area', obstacleType: 'Terreno', elevation: '85 m / 279 ft', markingLighting: 'NIL', coordinates: "04°35'00\"S / 081°14'00\"W" },
  ],
}

async function main() {
  console.log('═'.repeat(60))
  console.log('  Poblando obstáculos faltantes en la base de datos')
  console.log('═'.repeat(60))
  console.log()

  // Verificar conexión a la BD
  const airportCount = await db.airport.count()
  console.log(`✓ Conexión OK — ${airportCount} aeropuertos en la BD`)
  console.log()

  let totalAdded = 0
  let totalSkipped = 0
  let totalNotFound = 0

  for (const [icaoCode, obstacles] of Object.entries(OBSTACLES_DATA)) {
    const airport = await db.airport.findUnique({
      where: { icaoCode },
      select: { id: true, icaoCode: true, name: true },
    })

    if (!airport) {
      console.log(`⚠️  ${icaoCode}: aeropuerto NO encontrado en la BD — omitido`)
      totalNotFound++
      continue
    }

    const existing = await db.obstacle.findMany({
      where: { airportId: airport.id },
      select: { id: true },
    })

    if (existing.length > 0) {
      console.log(`↩️  ${icaoCode}: ya tiene ${existing.length} obstáculo(s) — omitido`)
      totalSkipped++
      continue
    }

    for (const obs of obstacles) {
      await db.obstacle.create({
        data: {
          airportId: airport.id,
          runwayArea: obs.runwayArea,
          obstacleType: obs.obstacleType,
          elevation: obs.elevation,
          markingLighting: obs.markingLighting,
          coordinates: obs.coordinates,
          remarks: obs.remarks,
        },
      })
    }
    console.log(`✅ ${icaoCode}: ${obstacles.length} obstáculo(s) insertado(s) — ${airport.name.substring(0, 50)}…`)
    totalAdded += obstacles.length
  }

  console.log()
  console.log('═'.repeat(60))
  console.log('  RESUMEN')
  console.log('═'.repeat(60))
  console.log(`  ✅ Obstáculos insertados: ${totalAdded}`)
  console.log(`  ↩️  Aeropuertos omitidos (ya tenían datos): ${totalSkipped}`)
  console.log(`  ⚠️  Aeropuertos no encontrados: ${totalNotFound}`)
  console.log()

  const finalCount = await db.obstacle.count()
  console.log(`  Total de obstáculos en la BD: ${finalCount}`)
  console.log('═'.repeat(60))

  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ Error fatal:', e)
  process.exit(1)
})
