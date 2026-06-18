import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/aip-sections/upload
 *
 * Accepts multipart/form-data with:
 *   - files: one or more .md files (required)
 *
 * Each .md file may contain YAML frontmatter delimited by --- at the top:
 *   ---
 *   sectionCode: ENR_3.1
 *   title: Rutas ATS Convencionales
 *   titleEn: Conventional ATS Routes
 *   part: ENR
 *   subPart: "3.1"
 *   orderIndex: 31
 *   lastAmendment: AMDT 33/2025
 *   effectiveDate: 30 JUL 2025
 *   ---
 *   # Content in Markdown...
 *
 * If no frontmatter is present, the sectionCode is derived from the filename
 * (without extension) and the title from the first H1 heading.
 *
 * Returns: { uploaded: [...], errors: [...] }
 */

interface ParsedFrontmatter {
  sectionCode?: string
  title?: string
  titleEn?: string
  part?: string
  subPart?: string
  orderIndex?: number
  lastAmendment?: string
  effectiveDate?: string
  contentEn?: string
}

function parseFrontmatter(raw: string): { frontmatter: ParsedFrontmatter; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!fmMatch) {
    return { frontmatter: {}, body: raw }
  }

  const yamlBlock = fmMatch[1]
  const body = fmMatch[2]
  const frontmatter: ParsedFrontmatter = {}

  // Simple YAML parser (key: value pairs, supports quoted values)
  for (const line of yamlBlock.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z_]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    let value = m[2].trim()
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key === 'orderIndex') {
      const n = parseInt(value, 10)
      if (!isNaN(n)) frontmatter.orderIndex = n
    } else if (key === 'sectionCode') {
      frontmatter.sectionCode = value
    } else if (key === 'title') {
      frontmatter.title = value
    } else if (key === 'titleEn') {
      frontmatter.titleEn = value
    } else if (key === 'part') {
      frontmatter.part = value.toUpperCase()
    } else if (key === 'subPart') {
      frontmatter.subPart = value
    } else if (key === 'lastAmendment') {
      frontmatter.lastAmendment = value
    } else if (key === 'effectiveDate') {
      frontmatter.effectiveDate = value
    } else if (key === 'contentEn') {
      frontmatter.contentEn = value
    }
  }

  return { frontmatter, body }
}

function deriveSectionCode(filename: string): string {
  // "ENR_3.1-rutas.md" -> "ENR_3.1"
  // "gen-1.1.md" -> "GEN_1.1"
  const base = filename.replace(/\.md$/i, '').replace(/\.markdown$/i, '').replace(/^[^a-zA-Z]*/, '')
  const normalized = base
    .replace(/[-\s]/g, '_')
    .toUpperCase()
    .replace(/^([A-Z]+)[-_]?(\d+(?:\.\d+)?)$/, '$1_$2')
  return normalized
}

function deriveTitle(body: string, fallback: string): string {
  const h1 = body.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  return fallback
}

function derivePart(sectionCode: string): string {
  const m = sectionCode.match(/^([A-Z]+)/)
  return m ? m[1] : 'GEN'
}

function deriveSubPart(sectionCode: string): string {
  const m = sectionCode.match(/_([^_]+)$/)
  return m ? m[1] : '1'
}

interface UploadResult {
  file: string
  sectionCode: string
  title: string
  status: 'created' | 'updated' | 'error'
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files')

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided. Use field name "files" with .md files.' },
        { status: 400 }
      )
    }

    const results: UploadResult[] = []

    for (const file of files) {
      if (!(file instanceof File)) {
        results.push({
          file: 'unknown',
          sectionCode: '',
          title: '',
          status: 'error',
          error: 'Not a valid file',
        })
        continue
      }

      const filename = file.name

      // Validate extension
      if (!filename.toLowerCase().endsWith('.md') && !filename.toLowerCase().endsWith('.markdown')) {
        results.push({
          file: filename,
          sectionCode: '',
          title: '',
          status: 'error',
          error: 'Only .md or .markdown files are allowed',
        })
        continue
      }

      try {
        const rawContent = await file.text()
        const { frontmatter, body } = parseFrontmatter(rawContent)

        const sectionCode = frontmatter.sectionCode || deriveSectionCode(filename)
        const title = frontmatter.title || deriveTitle(body, sectionCode.replace(/_/g, ' '))
        const part = frontmatter.part || derivePart(sectionCode)
        const subPart = frontmatter.subPart || deriveSubPart(sectionCode)
        const orderIndex = frontmatter.orderIndex ?? 0

        // Check if section already exists -> update, otherwise create
        const existing = await db.aipSection.findUnique({
          where: { sectionCode },
        })

        if (existing) {
          const updated = await db.aipSection.update({
            where: { sectionCode },
            data: {
              title,
              titleEn: frontmatter.titleEn || existing.titleEn,
              part,
              subPart: String(subPart),
              orderIndex,
              content: body.trim(),
              contentEn: frontmatter.contentEn || existing.contentEn,
              lastAmendment: frontmatter.lastAmendment || existing.lastAmendment,
              effectiveDate: frontmatter.effectiveDate || existing.effectiveDate,
              sourceFile: filename,
            },
          })
          results.push({
            file: filename,
            sectionCode: updated.sectionCode,
            title: updated.title,
            status: 'updated',
          })
        } else {
          const created = await db.aipSection.create({
            data: {
              sectionCode,
              title,
              titleEn: frontmatter.titleEn || null,
              part,
              subPart: String(subPart),
              orderIndex,
              content: body.trim(),
              contentEn: frontmatter.contentEn || null,
              lastAmendment: frontmatter.lastAmendment || null,
              effectiveDate: frontmatter.effectiveDate || null,
              sourceFile: filename,
            },
          })
          results.push({
            file: filename,
            sectionCode: created.sectionCode,
            title: created.title,
            status: 'created',
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({
          file: filename,
          sectionCode: '',
          title: '',
          status: 'error',
          error: message,
        })
      }
    }

    const created = results.filter((r) => r.status === 'created').length
    const updated = results.filter((r) => r.status === 'updated').length
    const errors = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      message: `Processed ${results.length} file(s): ${created} created, ${updated} updated, ${errors} error(s)`,
      results,
      summary: { total: results.length, created, updated, errors },
    })
  } catch (error) {
    console.error('Error uploading markdown files:', error)
    return NextResponse.json(
      { error: 'Failed to upload markdown files' },
      { status: 500 }
    )
  }
}
