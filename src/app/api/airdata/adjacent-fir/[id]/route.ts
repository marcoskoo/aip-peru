import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adjFir = await db.adjacentFIR.findUnique({ where: { id } })
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
