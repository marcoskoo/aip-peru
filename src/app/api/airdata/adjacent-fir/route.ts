import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { staticAdjacentFIRs, prismaLikelyAvailable } from "@/lib/static-data"

export async function GET() {
  try {
    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        const adjacentFirs = await db.adjacentFIR.findMany({
          orderBy: { icao: "asc" },
        })
        return NextResponse.json(adjacentFirs)
      }
    } catch (error) {
      console.warn("[api/airdata/adjacent-fir] Prisma failed, using static fallback:", error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    const sorted = [...staticAdjacentFIRs].sort((a, b) =>
      String(a.icao ?? "").localeCompare(String(b.icao ?? ""))
    )
    return NextResponse.json(sorted)
  } catch (error) {
    console.error("Error fetching adjacent FIRs:", error)
    return NextResponse.json({ error: "Error al obtener FIRs adyacentes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { icao, name, country, borderPoints, color } = body

    if (!icao || !name || !country) {
      return NextResponse.json(
        { error: "Campos requeridos: icao, name, country" },
        { status: 400 }
      )
    }

    const borderPointsStr = borderPoints
      ? (typeof borderPoints === "string" ? borderPoints : JSON.stringify(borderPoints))
      : null

    const adjFir = await db.adjacentFIR.create({
      data: {
        icao,
        name,
        country,
        borderPoints: borderPointsStr,
        color: color || null,
      },
    })
    return NextResponse.json(adjFir, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating adjacent FIR:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un FIR adyacente con ese ICAO" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear FIR adyacente" }, { status: 500 })
  }
}
