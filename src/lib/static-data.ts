/**
 * Static data fallback for serverless environments (Vercel).
 *
 * When DATABASE_URL points to a file-based SQLite DB (sandbox only),
 * Prisma cannot connect on Vercel serverless. These JSON snapshots
 * provide the same data so all API routes work in production.
 *
 * Data extracted from the local SQLite DB via scripts/extract-db-data.
 */
import airportsData from "./data/airport.json";
import heliportsData from "./data/heliport.json";
import abbreviationsData from "./data/abbreviation.json";
import aipSectionsData from "./data/aipSection.json";
import airspaceRestrictionsData from "./data/airspaceRestriction.json";
import designatedAuthoritiesData from "./data/designatedAuthority.json";
import publicHolidaysData from "./data/publicHoliday.json";
import nationalRegulationsData from "./data/nationalRegulation.json";
import supplementsData from "./data/supplement.json";
import obstaclesData from "./data/obstacle.json";
import radioNavAidsData from "./data/radioNavAid.json";
import communicationsData from "./data/communication.json";
import airwaysData from "./data/airway.json";
import navaidsData from "./data/navaid.json";
import waypointsData from "./data/waypoint.json";
import firBoundariesData from "./data/fIRBoundary.json";
import adjacentFirsData from "./data/adjacentFIR.json";

// Typed re-exports (using `any` for flexibility since these mirror Prisma models)
export const staticAirports = airportsData as Record<string, unknown>[];
export const staticHeliports = heliportsData as Record<string, unknown>[];
export const staticAbbreviations = abbreviationsData as Record<string, unknown>[];
export const staticAipSections = aipSectionsData as Record<string, unknown>[];
export const staticAirspaceRestrictions = airspaceRestrictionsData as Record<string, unknown>[];
export const staticDesignatedAuthorities = designatedAuthoritiesData as Record<string, unknown>[];
export const staticPublicHolidays = publicHolidaysData as Record<string, unknown>[];
export const staticNationalRegulations = nationalRegulationsData as Record<string, unknown>[];
export const staticSupplements = supplementsData as Record<string, unknown>[];
export const staticObstacles = obstaclesData as Record<string, unknown>[];
export const staticRadioNavAids = radioNavAidsData as Record<string, unknown>[];
export const staticCommunications = communicationsData as Record<string, unknown>[];
export const staticAirways = airwaysData as Record<string, unknown>[];
export const staticNavaids = navaidsData as Record<string, unknown>[];
export const staticWaypoints = waypointsData as Record<string, unknown>[];
export const staticFIRBoundaries = firBoundariesData as Record<string, unknown>[];
export const staticAdjacentFIRs = adjacentFirsData as Record<string, unknown>[];

/**
 * Returns true when Prisma is likely to work in the current environment.
 * On Vercel serverless without a real DB URL, this returns false so routes
 * can fall back to static data.
 */
export function prismaLikelyAvailable(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  // File-based SQLite only works in sandbox/local, not on Vercel serverless
  if (url.startsWith("file:")) {
    return process.env.VERCEL !== "1";
  }
  return true;
}
