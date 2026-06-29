import { NextResponse } from "next/server";
import { getWorldCounts } from "@/lib/aviation/world-data";

/**
 * GET /api/world/counts
 *
 * Returns total worldwide counts for airports, navaids, countries.
 * Used by the map UI to display data scope.
 */
export async function GET() {
  try {
    const counts = getWorldCounts();
    return NextResponse.json(counts);
  } catch (err) {
    console.error("[api/world/counts] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch counts", detail: String(err) },
      { status: 500 }
    );
  }
}
