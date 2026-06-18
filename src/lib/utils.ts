import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines whether an airport is international.
 *
 * Primary signal: the explicit `category` field ("INTERNACIONAL").
 * Fallback signal (used when category is null/missing, which is the case
 * for all seeded airports): the airport name contains the word
 * "INTERNACIONAL" (case-insensitive).
 *
 * This dual detection keeps the UI correct even before the database
 * `category` field is back-filled.
 */
export function isInternationalAirport(airport: { category?: string | null; name?: string | null }): boolean {
  if (airport.category && airport.category.toUpperCase() === "INTERNACIONAL") {
    return true
  }
  const name = (airport.name || "").toUpperCase()
  return name.includes("INTERNACIONAL")
}
