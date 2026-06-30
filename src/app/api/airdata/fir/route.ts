import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { staticFIRBoundaries, prismaLikelyAvailable } from "@/lib/static-data"

export async function GET() {
  try {
    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const firs = await db.fIRBoundary.findMany({
          orderBy: { id: "asc" },
        })
        return NextResponse.json(firs)
      }
    } catch (error) {
      console.warn("[api/airdata/fir] Prisma failed, using static fallback:", error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const sorted = [...staticFIRBoundaries].sort((a, b) =>
      String(a.id ?? "").localeCompare(String(b.id ?? ""))
    )
    return NextResponse.json(sorted)
  } catch (error) {
    console.error("Error fetching FIR boundaries:", error)
    return NextResponse.json({ error: "Error al obtener límites FIR" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, centerLat, centerLon, polygon } = body

    if (!id || !name || centerLat === undefined || centerLon === undefined) {
      return NextResponse.json(
        { error: "Campos requeridos: id, name, centerLat, centerLon" },
        { status: 400 }
      )
    }

    const polygonStr = typeof polygon === "string" ? polygon : JSON.stringify(polygon || [])

    const fir = await db.fIRBoundary.create({
      data: {
        id,
        name,
        type: type || "FIR",
        centerLat: Number(centerLat),
        centerLon: Number(centerLon),
        polygon: polygonStr,
      },
    })
    return NextResponse.json(fir, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating FIR boundary:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un FIR con ese ID" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear FIR" }, { status: 500 })
  }
}
