import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { staticAirways, prismaLikelyAvailable } from "@/lib/static-data"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const airway = await db.airway.findUnique({
          where: { id },
          include: { segments: { orderBy: { orderIndex: "asc" } } },
        })
        if (airway) {
          return NextResponse.json(airway)
        }
        // If not found in DB, fall through to static fallback
      }
    } catch (error) {
      console.warn("[api/airdata/airways/[id]] Prisma failed, using static fallback:", error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const airway = staticAirways.find((a) => a.id === id)
    if (!airway) {
      return NextResponse.json({ error: "Aerovía no encontrada" }, { status: 404 })
    }
    // Static airways don't carry segments; expose empty array to preserve shape.
    return NextResponse.json({ ...airway, segments: [] })
  } catch (error) {
    console.error("Error fetching airway:", error)
    return NextResponse.json({ error: "Error al obtener aerovía" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { designator, type, level, segments } = body

    // Delete existing segments and recreate
    if (segments !== undefined) {
      await db.airwaySegment.deleteMany({ where: { airwayId: id } })
    }

    const airway = await db.airway.update({
      where: { id },
      data: {
        designator,
        type,
        level,
        segments: segments && segments.length > 0
          ? {
              create: segments.map((seg: { from: string; to: string; distance: number; bearing: number; minFL?: number; maxFL?: number }, idx: number) => ({
                orderIndex: idx,
                fromPoint: seg.from,
                toPoint: seg.to,
                distance: Number(seg.distance),
                bearing: Number(seg.bearing),
                minFL: seg.minFL ? Number(seg.minFL) : null,
                maxFL: seg.maxFL ? Number(seg.maxFL) : null,
              })),
            }
          : undefined,
      },
      include: { segments: { orderBy: { orderIndex: "asc" } } },
    })
    return NextResponse.json(airway)
  } catch (error: unknown) {
    console.error("Error updating airway:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Aerovía no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al actualizar aerovía" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.airway.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting airway:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Aerovía no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar aerovía" }, { status: 500 })
  }
}
