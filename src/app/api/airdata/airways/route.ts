import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { staticAirways, prismaLikelyAvailable } from "@/lib/static-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const level = searchParams.get("level") || ""

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const where: Record<string, unknown> = {}
        if (search) {
          where.designator = { contains: search }
        }
        if (type) {
          where.type = type
        }
        if (level) {
          where.level = level
        }

        const airways = await db.airway.findMany({
          where,
          include: {
            segments: { orderBy: { orderIndex: "asc" } },
          },
          orderBy: [{ level: "asc" }, { type: "asc" }, { designator: "asc" }],
        })
        return NextResponse.json(airways)
      }
    } catch (error) {
      console.warn("[api/airdata/airways] Prisma failed, using static fallback:", error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    // Static airways don't carry segments (stored as separate relation in
    // Prisma). We expose an empty segments array to preserve response shape.
    const s = search.toLowerCase()
    let filtered = staticAirways
    if (s) {
      filtered = filtered.filter((a) =>
        String(a.designator ?? "").toLowerCase().includes(s)
      )
    }
    if (type) {
      filtered = filtered.filter((a) => String(a.type ?? "") === type)
    }
    if (level) {
      filtered = filtered.filter((a) => String(a.level ?? "") === level)
    }
    const result = filtered
      .map((a) => ({ ...a, segments: [] }))
      .sort((a, b) => {
        const la = String(a.level ?? '').localeCompare(String(b.level ?? ''))
        if (la !== 0) return la
        const ta = String(a.type ?? '').localeCompare(String(b.type ?? ''))
        if (ta !== 0) return ta
        return String(a.designator ?? '').localeCompare(String(b.designator ?? ''))
      })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching airways:", error)
    return NextResponse.json({ error: "Error al obtener aerovías" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { designator, type, level, segments } = body

    if (!designator || !type || !level) {
      return NextResponse.json(
        { error: "Campos requeridos: designator, type, level" },
        { status: 400 }
      )
    }

    const airway = await db.airway.create({
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
    return NextResponse.json(airway, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating airway:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe una aerovía con ese designador y tipo" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear aerovía" }, { status: 500 })
  }
}
