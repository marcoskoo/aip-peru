import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync } from 'node:fs'
import { Readable } from 'node:stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min para descargas grandes

// Rutas candidatas donde puede estar el zip del proyecto.
// Se prueba en orden y se sirve la primera que exista.
const CANDIDATE_PATHS = [
  '/home/z/my-project.zip',
  '/home/z/my-project/my-project.zip',
  '/tmp/my-project.zip',
]

function resolveZipPath(): string | null {
  for (const p of CANDIDATE_PATHS) {
    try {
      const st = statSync(p)
      if (st.isFile() && st.size > 0) return p
    } catch {
      // no existe, seguir
    }
  }
  return null
}

/**
 * GET /api/download
 *
 * Sirve el archivo zip del proyecto completo como descarga adjunta
 * (Content-Disposition: attachment) para que el navegador lo descargue
 * en vez de intentar renderizarlo.
 *
 * El zip incluye TODO el proyecto (src, prisma, public, mini-services,
 * skills, configs, seeds, worklog, .env) y excluye node_modules, .next,
 * .git y screenshots de desarrollo.
 */
export async function GET(_request: NextRequest) {
  const filePath = resolveZipPath()
  if (!filePath) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'No se encontró el archivo zip del proyecto. Genéralo primero desde la terminal.',
      },
      { status: 404 },
    )
  }

  let stat
  try {
    stat = statSync(filePath)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'No se pudo leer el archivo zip.' },
      { status: 500 },
    )
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="my-project.zip"`,
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
