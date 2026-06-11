import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const navaids = await db.navaid.findMany({
      orderBy: { id: "asc" },
    })
    return NextResponse.json(navaids)
  } catch (error) {
    console.error("Error fetching navaids:", error)
    return NextResponse.json({ error: "Error al obtener radioayudas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, frequency, lat, lon, elevation } = body

    if (!id || !name || !type || !frequency || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Campos requeridos: id, name, type, frequency, lat, lon" },
        { status: 400 }
      )
    }

    const navaid = await db.navaid.create({
      data: {
        id,
        name,
        type,
        frequency,
        lat: Number(lat),
        lon: Number(lon),
        elevation: elevation !== undefined && elevation !== null ? Number(elevation) : null,
      },
    })
    return NextResponse.json(navaid, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating navaid:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe una radioayuda con ese ID" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear radioayuda" }, { status: 500 })
  }
}
