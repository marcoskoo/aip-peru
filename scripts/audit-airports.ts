import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  const airports = await db.airport.findMany({
    select: {
      icaoCode: true,
      name: true,
      platformData: true,
      taxiwayData: true,
      checkpointData: true,
      platformRemarks: true,
      runways: true,
      declaredDistances: true,
      surfaceGuidance: true,
      metCharts: true,
    },
    orderBy: { icaoCode: 'asc' }
  })
  
  console.log(`Total airports: ${airports.length}`)
  console.log('\n=== AUDIT (issues only) ===\n')
  
  let issueCount = 0
  for (const a of airports) {
    const issues: string[] = []
    
    if (!a.platformData) issues.push('platformData NULL')
    else if (/provista/i.test(a.platformData)) issues.push(`platformData PLACEHOLDER`)
    
    if (!a.taxiwayData) issues.push('taxiwayData NULL')
    else if (/provista/i.test(a.taxiwayData)) issues.push(`taxiwayData PLACEHOLDER`)
    
    if (!a.checkpointData) issues.push('checkpointData NULL')
    if (!a.runways) issues.push('runways NULL')
    if (!a.surfaceGuidance) issues.push('surfaceGuidance NULL')
    
    // Check chart directory
    const chartDir = path.join(process.cwd(), 'public', 'charts', a.icaoCode)
    if (!fs.existsSync(chartDir)) {
      issues.push(`NO CHART DIR: ${chartDir}`)
    } else {
      const files = fs.readdirSync(chartDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      if (files.length === 0) issues.push('CHART DIR EMPTY')
    }
    
    if (issues.length > 0) {
      issueCount++
      console.log(`\n${a.icaoCode} (${a.name}):`)
      issues.forEach(i => console.log(`  - ${i}`))
    }
  }
  
  console.log(`\n=== SUMMARY: ${issueCount} airports with issues out of ${airports.length} ===`)
}

main().catch(console.error).finally(() => process.exit(0))
