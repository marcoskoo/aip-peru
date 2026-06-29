import { NextRequest, NextResponse } from "next/server";
import {
  getAirportsInBBox,
  type WorldAirport,
} from "@/lib/aviation/world-data";

/**
 * GET /api/world/airports?bbox=minLat,minLon,maxLat,maxLon
 *
 * Returns worldwide airports within the bounding box.
 * Used by the interactive map for viewport-based loading.
 *
 * Query params:
 *   bbox  - Required. "minLat,minLon,maxLat,maxLon" (degrees)
 *   small - Optional. "1" to include small_airport types
 *   heli  - Optional. "1" to include heliports
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
    const includeSmall = searchParams.get("small") === "1";
    const includeHeli = searchParams.get("heli") === "1";

    const airports = getAirportsInBBox(
      { minLat, maxLat, minLon, maxLon },
      { includeSmall, includeHeliports: includeHeli }
    );

    // Map compact format to full field names for client convenience
    const result: AirportApi[] = airports.map(a => ({
      icao: a.i,
      name: a.n,
      country: a.c,
      type: a.t,
      lat: a.la,
      lon: a.lo,
      elevation: a.e,
      iata: a.iata,
      city: a.city,
    }));

    return NextResponse.json({
      count: result.length,
      airports: result,
    });
  } catch (err) {
    console.error("[api/world/airports] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch airports", detail: String(err) },
      { status: 500 }
    );
  }
}

interface AirportApi {
  icao: string;
  name: string;
  country: string;
  type: string;
  lat: number;
  lon: number;
  elevation: number | null;
  iata: string | null;
  city: string | null;
}
