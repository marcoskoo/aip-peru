import { NextRequest, NextResponse } from "next/server";
import {
  getExtraWaypointsInBBox,
  type WorldWaypointExtra,
} from "@/lib/aviation/world-data";

/**
 * GET /api/world/waypoints?bbox=minLat,minLon,maxLat,maxLon
 *
 * Returns worldwide extra waypoints (FIR transfer points, oceanic
 * entry/exit fixes, major intersections) within the bounding box.
 * These complement the curated WORLD_WAYPOINTS static set.
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

    const wps = getExtraWaypointsInBBox({ minLat, maxLat, minLon, maxLon });

    // Map to client-friendly format
    const result = wps.map((w: WorldWaypointExtra) => ({
      id: w.id,
      name: w.id,
      lat: w.lat,
      lon: w.lon,
      country: w.country,
      region: w.region,
      description: w.description,
      transfer: !!w.transfer,
      notif: !!w.notif,
    }));

    return NextResponse.json({
      count: result.length,
      waypoints: result,
    });
  } catch (err) {
    console.error("[api/world/waypoints] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch waypoints", detail: String(err) },
      { status: 500 }
    );
  }
}
