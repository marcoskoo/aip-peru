import { NextRequest, NextResponse } from "next/server";
import { getNavaidsInBBox } from "@/lib/aviation/world-data";

/**
 * GET /api/world/navaids?bbox=minLat,minLon,maxLat,maxLon
 *
 * Returns worldwide navaids (VOR/DME/NDB/TACAN) within the bounding box.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bboxStr = searchParams.get("bbox");
    if (!bboxStr) {
      return NextResponse.json(
        { error: "bbox query param required" },
        { status: 400 }
      );
    }
    const parts = bboxStr.split(",").map(parseFloat);
    if (parts.length !== 4 || parts.some(p => !isFinite(p))) {
      return NextResponse.json(
        { error: "bbox must be 4 numbers: minLat,minLon,maxLat,maxLon" },
        { status: 400 }
      );
    }
    const [minLat, minLon, maxLat, maxLon] = parts;

    const navaids = getNavaidsInBBox({ minLat, maxLat, minLon, maxLon });

    const result = navaids.map(n => ({
      ident: n.i,
      name: n.n,
      type: n.t,
      frequency: n.f,
      country: n.c,
      lat: n.la,
      lon: n.lo,
      elevation: n.e,
    }));

    return NextResponse.json({
      count: result.length,
      navaids: result,
    });
  } catch (err) {
    console.error("[api/world/navaids] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch navaids", detail: String(err) },
      { status: 500 }
    );
  }
}
