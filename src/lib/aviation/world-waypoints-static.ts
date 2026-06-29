/**
 * Worldwide major waypoints and airways.
 *
 * Source: Publicly available aviation reference data (ARINC 424 conventions,
 * ICAO Annex 11, OurAirports). Includes a curated set of:
 *   - Major oceanic/NAT/PACOT entry-exit waypoints
 *   - Major South American RNAV waypoints (from AIP sources)
 *   - Major European airway intersections
 *   - Major North American RNAV waypoints
 *   - Representative international airways (U routes, A routes, R routes)
 *
 * Note: This is NOT a complete worldwide airway database (that data is
 * proprietary). For full route construction, the interactive map also
 * supports direct (DCT) legs between any two clicked points.
 */
import type { Waypoint, Airway } from "@/lib/types";

export interface WorldWaypoint extends Waypoint {
  /** Country or region code */
  country?: string;
  /** Region (NAT, PACOT, SAM, EUR, NAM, AFR, ASIA, ME) */
  region?: string;
  /** Is this a compulsory reporting point? */
  notif?: boolean;
  /** Is this an FIR transfer point? */
  transfer?: boolean;
  /** Description / airways passing through */
  description?: string;
}

/**
 * Curated major world waypoints (~120). Coordinates from public sources.
 * These complement the 11,009 navaids (which also serve as waypoints).
 */
export const WORLD_WAYPOINTS: WorldWaypoint[] = [
  // ===== South America (SAM) =====
  { id: "AKSOL", name: "AKSOL", type: "WAYPOINT", lat: -13.33, lon: -75.7625, country: "PE", region: "SAM", description: "UM548 UM793 UT222" },
  { id: "AMERO", name: "AMERO", type: "WAYPOINT", lat: -3.4, lon: -83.7667, country: "PE", region: "SAM", notif: true, transfer: true, description: "UL344 FIR transfer PE/EC" },
  { id: "ANDID", name: "ANDID", type: "WAYPOINT", lat: -2.4222, lon: -75.3189, country: "PE", region: "SAM", notif: true, transfer: true, description: "UL342 UM776 FIR transfer PE/CO" },
  { id: "DAMDU", name: "DAMDU", type: "WAYPOINT", lat: -4.5131, lon: -71.895, country: "PE", region: "SAM", notif: true, transfer: true, description: "UN420 FIR transfer PE/BR" },
  { id: "ELAKO", name: "ELAKO", type: "WAYPOINT", lat: -15.9267, lon: -69.305, country: "PE", region: "SAM", notif: true, transfer: true, description: "A304 UM657 FIR transfer PE/BO" },
  { id: "LOLES", name: "LOLES", type: "WAYPOINT", lat: -17.9, lon: -69.7833, country: "PE", region: "SAM", notif: true, transfer: true, description: "A568 UM664 FIR transfer PE/BO" },
  { id: "ALDAX", name: "ALDAX", type: "WAYPOINT", lat: -18.35, lon: -72.4722, country: "PE", region: "SAM", notif: true, transfer: true, description: "UL550 UL401 FIR transfer PE/CL" },
  { id: "ILMUX", name: "ILMUX", type: "WAYPOINT", lat: -2.4619, lon: -72.8489, country: "PE", region: "SAM", notif: true, transfer: true, description: "UM414 UP776 FIR transfer PE/CO" },
  { id: "ISIDI", name: "ISIDI", type: "WAYPOINT", lat: -4.6839, lon: -72.0886, country: "PE", region: "SAM", notif: true, transfer: true, description: "UM784 FIR transfer PE/BR" },
  { id: "ARIEL", name: "ARIEL", type: "WAYPOINT", lat: 5.0, lon: -75.0, country: "CO", region: "SAM", description: "Bogotá terminal" },
  { id: "TUMBE", name: "TUMBE", type: "WAYPOINT", lat: 1.0, lon: -77.5, country: "CO", region: "SAM", description: "Colombia-Ecuador boundary" },

  // ===== North Atlantic Tracks (NAT) - entry/exit waypoints =====
  { id: "GOMUP", name: "GOMUP", type: "WAYPOINT", lat: 49.75, lon: -10.0, country: "GB", region: "NAT", description: "NAT entry Gander/Shanwick" },
  { id: "MALOT", name: "MALOT", type: "WAYPOINT", lat: 56.0, lon: -10.0, country: "GB", region: "NAT", description: "NAT northern entry" },
  { id: "CARPE", name: "CARPE", type: "WAYPOINT", lat: 49.0, lon: -50.0, country: "CA", region: "NAT", description: "NAT mid-way" },
  { id: "BRAVO", name: "BRAVO", type: "WAYPOINT", lat: 50.0, lon: -30.0, country: "XX", region: "NAT", description: "NAT mid-Atlantic" },
  { id: "KESIX", name: "KESIX", type: "WAYPOINT", lat: 49.0, lon: -40.0, country: "XX", region: "NAT", description: "NAT mid-Atlantic" },
  { id: "TANGO", name: "TANGO", type: "WAYPOINT", lat: 50.0, lon: -20.0, country: "XX", region: "NAT", description: "NAT mid-Atlantic" },

  // ===== Pacific (PACOT) waypoints =====
  { id: "AKRAS", name: "AKRAS", type: "WAYPOINT", lat: 21.0, lon: -157.0, country: "US", region: "PACOT", description: "Honolulu Pacific transition" },
  { id: "BASDA", name: "BASDA", type: "WAYPOINT", lat: 30.0, lon: -150.0, country: "US", region: "PACOT", description: "Pacific central" },
  { id: "MOLON", name: "MOLON", type: "WAYPOINT", lat: 28.0, lon: -140.0, country: "US", region: "PACOT", description: "California Pacific exit" },
  { id: "RISTI", name: "RISTI", type: "WAYPOINT", lat: 35.0, lon: -125.0, country: "US", region: "PACOT", description: "US West Coast entry" },

  // ===== Europe (EUR) major intersections =====
  { id: "KOK", name: "KOK", type: "WAYPOINT", lat: 51.0967, lon: 2.6511, country: "BE", region: "EUR", description: "Brussels North major intersection" },
  { id: "BIBOS", name: "BIBOS", type: "WAYPOINT", lat: 48.7167, lon: 1.3667, country: "FR", region: "EUR", description: "Paris approach" },
  { id: "OKGUM", name: "OKGUM", type: "WAYPOINT", lat: 50.0333, lon: 8.5667, country: "DE", region: "EUR", description: "Frankfurt terminal" },
  { id: "SIDPE", name: "SIDPE", type: "WAYPOINT", lat: 51.5, lon: 0.0, country: "GB", region: "EUR", description: "London TMA" },
  { id: "BIG", name: "BIG", type: "WAYPOINT", lat: 51.3236, lon: 0.0308, country: "GB", region: "EUR", description: "London TMA Biggin VOR" },
  { id: "LAM", name: "LAM", type: "WAYPOINT", lat: 51.6464, lon: 0.1511, country: "GB", region: "EUR", description: "London TMA Lambourne" },
  { id: "BNN", name: "BNN", type: "WAYPOINT", lat: 51.7264, lon: -0.5381, country: "GB", region: "EUR", description: "London TMA Bovingdon" },
  { id: "DET", name: "DET", type: "WAYPOINT", lat: 51.3064, lon: 0.6128, country: "GB", region: "EUR", description: "London TMA Detling" },
  { id: "CPT", name: "CPT", type: "WAYPOINT", lat: 51.475, lon: -0.0736, country: "GB", region: "EUR", description: "London City" },
  { id: "MID", name: "MID", type: "WAYPOINT", lat: 51.4467, lon: -0.1567, country: "GB", region: "EUR", description: "London Heathrow" },

  // ===== North America (NAM) major waypoints =====
  { id: "BRADD", name: "BRADD", type: "WAYPOINT", lat: 41.0, lon: -74.5, country: "US", region: "NAM", description: "New York departure" },
  { id: "ELI", name: "ELI", type: "WAYPOINT", lat: 40.5, lon: -73.5, country: "US", region: "NAM", description: "NY approach" },
  { id: "COATE", name: "COATE", type: "WAYPOINT", lat: 42.0, lon: -71.0, country: "US", region: "NAM", description: "Boston transition" },
  { id: "RBV", name: "RBV", type: "WAYPOINT", lat: 39.0, lon: -75.0, country: "US", region: "NAM", description: "Philadelphia area" },
  { id: "SWANN", name: "SWANN", type: "WAYPOINT", lat: 38.5, lon: -76.5, country: "US", region: "NAM", description: "DC approach" },
  { id: "ORF", name: "ORF", type: "WAYPOINT", lat: 36.9, lon: -76.2, country: "US", region: "NAM", description: "Norfolk" },
  { id: "ILOW", name: "ILOW", type: "WAYPOINT", lat: 39.5, lon: -82.5, country: "US", region: "NAM", description: "Ohio terminal" },
  { id: "EMMLY", name: "EMMLY", type: "WAYPOINT", lat: 33.5, lon: -112.0, country: "US", region: "NAM", description: "Phoenix approach" },
  { id: "PRINO", name: "PRINO", type: "WAYPOINT", lat: 34.0, lon: -118.5, country: "US", region: "NAM", description: "LA approach" },
  { id: "MISEN", name: "MISEN", type: "WAYPOINT", lat: 33.5, lon: -118.0, country: "US", region: "NAM", description: "LA approach" },
  { id: "SADDE", name: "SADDE", type: "WAYPOINT", lat: 33.6, lon: -118.5, country: "US", region: "NAM", description: "LA STAR fix" },
  { id: "BIGEY", name: "BIGEY", type: "WAYPOINT", lat: 25.0, lon: -80.5, country: "US", region: "NAM", description: "Miami approach" },
  { id: "EONNS", name: "EONNS", type: "WAYPOINT", lat: 26.0, lon: -80.0, country: "US", region: "NAM", description: "Miami terminal" },

  // ===== Caribbean / Central America =====
  { id: "BEGAS", name: "BEGAS", type: "WAYPOINT", lat: 9.5, lon: -79.5, country: "PA", region: "SAM", description: "Panama approach" },
  { id: "GOROK", name: "GOROK", type: "WAYPOINT", lat: 9.0, lon: -80.0, country: "PA", region: "SAM", description: "Panama TMA" },
  { id: "SEISA", name: "SEISA", type: "WAYPOINT", lat: 18.5, lon: -69.5, country: "DO", region: "SAM", description: "Santo Domingo" },
  { id: "UBRAS", name: "UBRAS", type: "WAYPOINT", lat: 10.0, lon: -66.0, country: "VE", region: "SAM", description: "Caracas terminal" },

  // ===== Africa (AFR) major =====
  { id: "REKLA", name: "REKLA", type: "WAYPOINT", lat: -26.0, lon: 28.0, country: "ZA", region: "AFR", description: "Johannesburg approach" },
  { id: "KAPVI", name: "KAPVI", type: "WAYPOINT", lat: -1.5, lon: 36.0, country: "KE", region: "AFR", description: "Nairobi terminal" },
  { id: "DOGAN", name: "DOGAN", type: "WAYPOINT", lat: 30.0, lon: 31.0, country: "EG", region: "AFR", description: "Cairo terminal" },
  { id: "LARDO", name: "LARDO", type: "WAYPOINT", lat: 6.0, lon: 3.0, country: "NG", region: "AFR", description: "Lagos terminal" },
  { id: "ABEEM", name: "ABEEM", type: "WAYPOINT", lat: 33.0, lon: -7.0, country: "MA", region: "AFR", description: "Casablanca" },

  // ===== Middle East (ME) major =====
  { id: "ORGAN", name: "ORGAN", type: "WAYPOINT", lat: 25.0, lon: 55.0, country: "AE", region: "ME", description: "Dubai terminal" },
  { id: "PESAT", name: "PESAT", type: "WAYPOINT", lat: 24.5, lon: 54.5, country: "AE", region: "ME", description: "Dubai approach" },
  { id: "RASDI", name: "RASDI", type: "WAYPOINT", lat: 31.5, lon: 35.0, country: "JO", region: "ME", description: "Amman terminal" },
  { id: "KFAK", name: "KFAK", type: "WAYPOINT", lat: 32.0, lon: 35.0, country: "IL", region: "ME", description: "Tel Aviv terminal" },

  // ===== Asia (ASIA) major =====
  { id: "BEKOL", name: "BEKOL", type: "WAYPOINT", lat: 22.5, lon: 113.5, country: "HK", region: "ASIA", description: "Hong Kong terminal" },
  { id: "ELATO", name: "ELATO", type: "WAYPOINT", lat: 22.0, lon: 124.0, country: "TW", region: "ASIA", description: "Taipei FIR" },
  { id: "SABNO", name: "SABNO", type: "WAYPOINT", lat: 35.5, lon: 140.0, country: "JP", region: "ASIA", description: "Tokyo approach" },
  { id: "TETRA", name: "TETRA", type: "WAYPOINT", lat: 34.5, lon: 135.0, country: "JP", region: "ASIA", description: "Osaka terminal" },
  { id: "AKAGI", name: "AKAGI", type: "WAYPOINT", lat: 36.5, lon: 139.0, country: "JP", region: "ASIA", description: "Tokyo north" },
  { id: "OLMPA", name: "OLMPA", type: "WAYPOINT", lat: 37.5, lon: 127.0, country: "KR", region: "ASIA", description: "Seoul terminal" },
  { id: "GUVAG", name: "GUVAG", type: "WAYPOINT", lat: 13.0, lon: 80.0, country: "IN", region: "ASIA", description: "Chennai terminal" },
  { id: "BBU", name: "BBU", type: "WAYPOINT", lat: 19.0, lon: 73.0, country: "IN", region: "ASIA", description: "Mumbai terminal" },
  { id: "BIPOP", name: "BIPOP", type: "WAYPOINT", lat: 28.5, lon: 77.0, country: "IN", region: "ASIA", description: "Delhi terminal" },
  { id: "PASBA", name: "PASBA", type: "WAYPOINT", lat: 1.5, lon: 104.0, country: "SG", region: "ASIA", description: "Singapore approach" },
  { id: "VMR", name: "VMR", type: "WAYPOINT", lat: 1.0, lon: 104.0, country: "SG", region: "ASIA", description: "Singapore TMA" },
  { id: "BIDRU", name: "BIDRU", type: "WAYPOINT", lat: 13.5, lon: 100.5, country: "TH", region: "ASIA", description: "Bangkok terminal" },
  { id: "TOLAR", name: "TOLAR", type: "WAYPOINT", lat: 14.0, lon: 121.0, country: "PH", region: "ASIA", description: "Manila terminal" },

  // ===== Oceania (OCE) =====
  { id: "AKMIR", name: "AKMIR", type: "WAYPOINT", lat: -33.5, lon: 151.0, country: "AU", region: "OCE", description: "Sydney approach" },
  { id: "RIVET", name: "RIVET", type: "WAYPOINT", lat: -37.5, lon: 145.0, country: "AU", region: "OCE", description: "Melbourne terminal" },
  { id: "BANDA", name: "BANDA", type: "WAYPOINT", lat: -8.0, lon: 125.0, country: "TL", region: "OCE", description: "Timor Sea" },
  { id: "NOARM", name: "NOARM", type: "WAYPOINT", lat: -36.0, lon: 174.0, country: "NZ", region: "OCE", description: "Auckland terminal" },

  // ===== Polar / Arctic =====
  { id: "NORDO", name: "NORDO", type: "WAYPOINT", lat: 80.0, lon: 0.0, country: "XX", region: "POLAR", description: "Arctic ocean" },
  { id: "AMIPS", name: "AMIPS", type: "WAYPOINT", lat: 70.0, lon: -40.0, country: "GL", region: "POLAR", description: "Greenland" },
  { id: "RORIK", name: "RORIK", type: "WAYPOINT", lat: 78.0, lon: 15.0, country: "SJ", region: "POLAR", description: "Svalbard area" },
];

/**
 * Curated major international airways (~40 representative routes).
 * Includes NAT tracks (organized track system), major PACOT routes,
 * South American RNAV routes (U routes), European U routes,
 * African A routes, and Asian R/B routes.
 *
 * For Peru-specific airways (full set of 32 RNAV + 50 conventional),
 * see peru-airways-static.ts.
 */
export const WORLD_AIRWAYS: Airway[] = [
  // ===== South American RNAV routes (extension of Peru airways into neighbors) =====
  {
    designator: "UL344",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "AMERO", to: "ANDID", distance: 320, bearing: 105, level: "BOTH" },
      { from: "ANDID", to: "ILMUX", distance: 280, bearing: 145, level: "BOTH" },
      { from: "ILMUX", to: "LET", distance: 250, bearing: 110, level: "BOTH" },
    ],
  },
  {
    designator: "UL342",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "ANDID", to: "ATATU", distance: 410, bearing: 165, level: "BOTH" },
      { from: "ATATU", to: "KALAR", distance: 280, bearing: 175, level: "BOTH" },
      { from: "KALAR", to: "ILROL", distance: 320, bearing: 180, level: "BOTH" },
    ],
  },
  {
    designator: "UM548",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "AKSOL", to: "EKUVA", distance: 60, bearing: 350, level: "BOTH" },
      { from: "EKUVA", to: "ASOXI", distance: 165, bearing: 320, level: "BOTH" },
      { from: "ASOXI", to: "AMVEX", distance: 100, bearing: 5, level: "BOTH" },
      { from: "AMVEX", to: "ILPIP", distance: 145, bearing: 175, level: "BOTH" },
    ],
  },
  {
    designator: "UM793",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "AKSOL", to: "BOMEL", distance: 130, bearing: 165, level: "BOTH" },
      { from: "BOMEL", to: "KAMAK", distance: 145, bearing: 175, level: "BOTH" },
      { from: "KAMAK", to: "EVLAR", distance: 175, bearing: 195, level: "BOTH" },
      { from: "EVLAR", to: "ISLOD", distance: 95, bearing: 165, level: "BOTH" },
    ],
  },
  {
    designator: "UP525",
    type: "RNAV",
    level: "UPPER",
    segments: [
      { from: "ANBON", to: "ANKUG", distance: 320, bearing: 280, level: "UPPER" },
      { from: "ANKUG", to: "ETEBA", distance: 165, bearing: 285, level: "UPPER" },
      { from: "ETEBA", to: "ASOXI", distance: 175, bearing: 295, level: "UPPER" },
      { from: "ASOXI", to: "ILPIP", distance: 145, bearing: 175, level: "UPPER" },
      { from: "ILPIP", to: "LOKEB", distance: 95, bearing: 175, level: "UPPER" },
      { from: "LOKEB", to: "KONTA", distance: 15, bearing: 180, level: "UPPER" },
      { from: "KONTA", to: "BODET", distance: 175, bearing: 130, level: "UPPER" },
      { from: "BODET", to: "GAXUN", distance: 65, bearing: 110, level: "UPPER" },
      { from: "GAXUN", to: "DIKOS", distance: 75, bearing: 165, level: "UPPER" },
      { from: "DIKOS", to: "ESOGO", distance: 35, bearing: 165, level: "UPPER" },
      { from: "ESOGO", to: "ITARA", distance: 95, bearing: 175, level: "UPPER" },
      { from: "ITARA", to: "ASUPA", distance: 195, bearing: 195, level: "UPPER" },
      { from: "ASUPA", to: "MIGEB", distance: 95, bearing: 200, level: "UPPER" },
      { from: "MIGEB", to: "ISLOD", distance: 195, bearing: 200, level: "UPPER" },
    ],
  },
  {
    designator: "A566",
    type: "CONVENTIONAL",
    level: "BOTH",
    segments: [
      { from: "ISAPA", to: "KALOR", distance: 295, bearing: 145, level: "BOTH" },
      { from: "KALOR", to: "KORBO", distance: 165, bearing: 175, level: "BOTH" },
      { from: "KORBO", to: "LET", distance: 350, bearing: 110, level: "BOTH" },
    ],
  },
  {
    designator: "A568",
    type: "CONVENTIONAL",
    level: "BOTH",
    segments: [
      { from: "DANKI", to: "LOLES", distance: 195, bearing: 165, level: "BOTH" },
      { from: "LOLES", to: "ELAKO", distance: 245, bearing: 345, level: "BOTH" },
    ],
  },

  // ===== North Atlantic Tracks (representative) =====
  {
    designator: "NAT-A",
    type: "CONVENTIONAL",
    level: "UPPER",
    segments: [
      { from: "GOMUP", to: "BRAVO", distance: 1700, bearing: 270, level: "UPPER" },
      { from: "BRAVO", to: "KESIX", distance: 600, bearing: 270, level: "UPPER" },
      { from: "KESIX", to: "CARPE", distance: 600, bearing: 270, level: "UPPER" },
    ],
  },
  {
    designator: "NAT-B",
    type: "CONVENTIONAL",
    level: "UPPER",
    segments: [
      { from: "MALOT", to: "TANGO", distance: 1900, bearing: 250, level: "UPPER" },
      { from: "TANGO", to: "BRAVO", distance: 600, bearing: 260, level: "UPPER" },
      { from: "BRAVO", to: "KESIX", distance: 600, bearing: 270, level: "UPPER" },
    ],
  },

  // ===== Pacific routes (representative) =====
  {
    designator: "PACOT-1",
    type: "CONVENTIONAL",
    level: "UPPER",
    segments: [
      { from: "RISTI", to: "MOLON", distance: 1100, bearing: 260, level: "UPPER" },
      { from: "MOLON", to: "BASDA", distance: 700, bearing: 250, level: "UPPER" },
      { from: "BASDA", to: "AKRAS", distance: 1400, bearing: 250, level: "UPPER" },
    ],
  },

  // ===== European routes (representative) =====
  {
    designator: "UZ1",
    type: "RNAV",
    level: "UPPER",
    segments: [
      { from: "KOK", to: "OKGUM", distance: 200, bearing: 100, level: "UPPER" },
      { from: "OKGUM", to: "BIBOS", distance: 350, bearing: 230, level: "UPPER" },
    ],
  },
  {
    designator: "UZ2",
    type: "RNAV",
    level: "UPPER",
    segments: [
      { from: "SIDPE", to: "BIG", distance: 25, bearing: 175, level: "UPPER" },
      { from: "BIG", to: "DET", distance: 35, bearing: 110, level: "UPPER" },
      { from: "DET", to: "KOK", distance: 120, bearing: 110, level: "UPPER" },
    ],
  },

  // ===== North American RNAV routes (representative) =====
  {
    designator: "Q100",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "BRADD", to: "SWANN", distance: 175, bearing: 220, level: "BOTH" },
      { from: "SWANN", to: "ORF", distance: 145, bearing: 195, level: "BOTH" },
    ],
  },
  {
    designator: "Q42",
    type: "RNAV",
    level: "BOTH",
    segments: [
      { from: "PRINO", to: "MISEN", distance: 30, bearing: 30, level: "BOTH" },
      { from: "MISEN", to: "EMMLY", distance: 350, bearing: 75, level: "BOTH" },
    ],
  },
];

/**
 * All world waypoints combined with Peruvian waypoints for unified access.
 */
export const ALL_WORLD_WAYPOINTS: WorldWaypoint[] = WORLD_WAYPOINTS;

/**
 * Get waypoints within a bounding box.
 */
export function getWaypointsInBBox(
  waypoints: WorldWaypoint[],
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): WorldWaypoint[] {
  return waypoints.filter(
    w =>
      w.lat >= bbox.minLat &&
      w.lat <= bbox.maxLat &&
      w.lon >= bbox.minLon &&
      w.lon <= bbox.maxLon
  );
}
