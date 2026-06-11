import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const navaid = await db.navaid.findUnique({ where: { id } })
    if (!navaid) {
      return NextResponse.json({ error: "Radioayuda no encontrada" }, { status: 404 })
    }
    return NextResponse.json(navaid)
  } catch (error) {
    console.error("Error fetching navaid:", error)
    return NextResponse.json({ error: "Error al obtener radioayuda" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, frequency, lat, lon, elevation } = body

    const navaid = await db.navaid.update({
      where: { id },
      data: {
        name,
        type,
        frequency,
        lat: lat !== undefined ? Number(lat) : undefined,
        lon: lon !== undefined ? Number(lon) : undefined,
        elevation: elevation !== undefined && elevation !== null ? Number(elevation) : null,
      },
    })
    return NextResponse.json(navaid)
  } catch (error: unknown) {
    console.error("Error updating navaid:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Radioayuda no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al actualizar radioayuda" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.navaid.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting navaid:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Radioayuda no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar radioayuda" }, { status: 500 })
  }
}
