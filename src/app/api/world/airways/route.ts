import { NextRequest, NextResponse } from "next/server";
import {
  getAirwaysInBBox,
  type WorldAirwayResolved,
} from "@/lib/aviation/world-data";

/**
 * GET /api/world/airways?bbox=minLat,minLon,maxLat,maxLon
 *
 * Returns worldwide airways that intersect the bounding box.
 * Each airway comes with resolved coordinates for its endpoints,
 * so the client can draw polylines directly without further lookups.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bboxStr = searchParams.get("bbox");
    if (!bboxStr) {
      return NextResponse.json(
        { error: "bbox query param required (format: minLat,minLon,maxLat,maxLon)" },
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

    const airways = getAirwaysInBBox({ minLat, maxLat, minLon, maxLon });

    // Map to client-friendly format
    const result = airways.map((aw: WorldAirwayResolved) => ({
      designator: aw.designator,
      type: aw.type,
      level: aw.level,
      points: aw.points,
      totalDistance: aw.totalDistance,
    }));

    return NextResponse.json({
      count: result.length,
      airways: result,
    });
  } catch (err) {
    console.error("[api/world/airways] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch airways", detail: String(err) },
      { status: 500 }
    );
  }
}
