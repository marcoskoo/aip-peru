import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fir = await db.fIRBoundary.findUnique({ where: { id } })
    if (!fir) {
      return NextResponse.json({ error: "FIR no encontrado" }, { status: 404 })
    }
    return NextResponse.json(fir)
  } catch (error) {
    console.error("Error fetching FIR:", error)
    return NextResponse.json({ error: "Error al obtener FIR" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, centerLat, centerLon, polygon } = body

    const polygonStr = polygon !== undefined
      ? (typeof polygon === "string" ? polygon : JSON.stringify(polygon))
      : undefined

    const fir = await db.fIRBoundary.update({
      where: { id },
      data: {
        name,
        type,
        centerLat: centerLat !== undefined ? Number(centerLat) : undefined,
        centerLon: centerLon !== undefined ? Number(centerLon) : undefined,
        polygon: polygonStr,
      },
    })
    return NextResponse.json(fir)
  } catch (error: unknown) {
    console.error("Error updating FIR:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "FIR no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al actualizar FIR" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.fIRBoundary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting FIR:", error)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "FIR no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar FIR" }, { status: 500 })
  }
}
