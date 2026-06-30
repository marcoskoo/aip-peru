import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { staticAdjacentFIRs, prismaLikelyAvailable } from "@/lib/static-data"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const adjFir = await db.adjacentFIR.findUnique({ where: { id } })
        if (adjFir) {
          return NextResponse.json(adjFir)
        }
        // If not found in DB, fall through to static fallback
      }
    } catch (error) {
      console.warn("[api/airdata/adjacent-fir/[id]] Prisma failed, using static fallback:", error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    // Try by id first, then by icao (the route receives an id but the
    // frontend sometimes uses the ICAO code as identifier).
    const adjFir =
      staticAdjacentFIRs.find((f) => f.id === id) ||
      staticAdjacentFIRs.find((f) => String(f.icao).toUpperCase() === id.toUpperCase())
    if (!adjFir) {
      return NextResponse.json({ error: "FIR adyacente no encontrado" }, { status: 404 })
    }
    return NextResponse.json(adjFir)
  } catch (error) {
    console.error("Error fetching adjacent FIR:", error)
    return NextResponse.json({ error: "Error al obtener FIR adyacente" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { icao, name, country, borderPoints, color } = body

    const borderPointsStr = borderPoints !== undefined
      ? (typeof borderPoints === "string" ? borderPoints : JSON.stringify(borderPoints))
      : undefined

    const adjFir = await db.adjacentFIR.update({
      where: { id },
      data: {
        icao,
        name,
        country,
        borderPoints: borderPointsStr,
        color: color || null,
      },
    })
    return NextResponse.json(adjFir)
  } catch (error: unknown) {
    console.error("Error updating adjacent FIR:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "FIR adyacente no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al actualizar FIR adyacente" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.adjacentFIR.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting adjacent FIR:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "FIR adyacente no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar FIR adyacente" }, { status: 500 })
  }
}
