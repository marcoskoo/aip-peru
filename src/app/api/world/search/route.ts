import { NextRequest, NextResponse } from "next/server";
import { searchAirports, searchNavaids } from "@/lib/aviation/world-data";

/**
 * GET /api/world/search?q=<query>&limit=<n>&kind=<airports|navaids|all>
 *
 * Searches worldwide airports and navaids by ICAO/IATA/ident/name/city.
 * Returns top N matches. Used by the route calculator autocomplete.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const kind = searchParams.get("kind") || "all";

    if (!q.trim()) {
      return NextResponse.json({ airports: [], navaids: [] });
    }

    const result: {
      airports: ReturnType<typeof searchAirports>;
      navaids: ReturnType<typeof searchNavaids>;
    } = { airports: [], navaids: [] };

    if (kind === "all" || kind === "airports") {
      result.airports = searchAirports(q, limit).map(a => ({
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
    }
    if (kind === "all" || kind === "navaids") {
      result.navaids = searchNavaids(q, limit).map(n => ({
        ident: n.i,
        name: n.n,
        type: n.t,
        frequency: n.f,
        country: n.c,
        lat: n.la,
        lon: n.lo,
      }));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/world/search] error:", err);
    return NextResponse.json(
      { error: "Search failed", detail: String(err) },
      { status: 500 }
    );
  }
}
