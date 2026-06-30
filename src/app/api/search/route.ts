import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  staticAirports,
  staticHeliports,
  staticWaypoints,
  staticNavaids,
  staticAirways,
  staticAirspaceRestrictions,
  staticAbbreviations,
  staticNationalRegulations,
  staticAipSections,
  prismaLikelyAvailable,
} from '@/lib/static-data'

const RESULT_LIMIT = 10

// ─── Static search helpers ────────────────────────────────────────────
function strContains(hay: unknown, needle: string): boolean {
  if (hay === null || hay === undefined) return false
  return String(hay).toLowerCase().includes(needle.toLowerCase())
}

function searchStaticAirports(q: string, upperQ: string) {
  return staticAirports
    .filter(
      (a) =>
        strContains(a.icaoCode, upperQ) ||
        strContains(a.name, q) ||
        strContains(a.city, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((a) => ({
      id: a.id,
      icaoCode: a.icaoCode,
      name: a.name,
      city: a.city,
      department: a.department,
      category: a.category,
      elevation: a.elevation,
    }))
    .sort((a, b) =>
      String(a.icaoCode).localeCompare(String(b.icaoCode))
    )
}

function searchStaticHeliports(q: string, upperQ: string) {
  return staticHeliports
    .filter(
      (h) =>
        strContains(h.icaoCode, upperQ) ||
        strContains(h.name, q) ||
        strContains(h.city, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((h) => ({
      id: h.id,
      icaoCode: h.icaoCode,
      name: h.name,
      city: h.city,
      type: h.type,
      status: h.status,
    }))
    .sort((a, b) =>
      String(a.icaoCode).localeCompare(String(b.icaoCode))
    )
}

function searchStaticWaypoints(q: string, upperQ: string) {
  return staticWaypoints
    .filter(
      (w) => strContains(w.id, upperQ) || strContains(w.name, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      lat: w.lat,
      lon: w.lon,
      description: w.description,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

function searchStaticNavaids(q: string, upperQ: string) {
  return staticNavaids
    .filter(
      (n) => strContains(n.id, upperQ) || strContains(n.name, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      frequency: n.frequency,
      lat: n.lat,
      lon: n.lon,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

function searchStaticAirways(upperQ: string) {
  return staticAirways
    .filter((a) => strContains(a.designator, upperQ))
    .slice(0, RESULT_LIMIT)
    .map((a) => ({
      id: a.id,
      designator: a.designator,
      type: a.type,
      level: a.level,
    }))
    .sort((a, b) =>
      String(a.designator).localeCompare(String(b.designator))
    )
}

function searchStaticRestrictions(q: string, upperQ: string) {
  return staticAirspaceRestrictions
    .filter(
      (r) => strContains(r.designator, upperQ) || strContains(r.name, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((r) => ({
      id: r.id,
      designator: r.designator,
      name: r.name,
      type: r.type,
      status: r.status,
      lowerLimit: r.lowerLimit,
      upperLimit: r.upperLimit,
    }))
    .sort((a, b) =>
      String(a.designator).localeCompare(String(b.designator))
    )
}

function searchStaticAbbreviations(q: string, upperQ: string) {
  return staticAbbreviations
    .filter(
      (a) => strContains(a.code, upperQ) || strContains(a.meaning, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((a) => ({
      id: a.id,
      code: a.code,
      meaning: a.meaning,
      meaningEn: a.meaningEn,
    }))
    .sort((a, b) => String(a.code).localeCompare(String(b.code)))
}

function searchStaticRegulations(q: string, upperQ: string) {
  return staticNationalRegulations
    .filter(
      (r) => strContains(r.code, upperQ) || strContains(r.title, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      type: r.type,
    }))
    .sort(
      (a, b) =>
        Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0)
    )
}

function searchStaticAipSections(q: string, upperQ: string) {
  return staticAipSections
    .filter(
      (s) => strContains(s.sectionCode, upperQ) || strContains(s.title, q)
    )
    .slice(0, RESULT_LIMIT)
    .map((s) => ({
      id: s.id,
      sectionCode: s.sectionCode,
      title: s.title,
      part: s.part,
    }))
    .sort(
      (a, b) =>
        Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0)
    )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')?.trim() || ''

    // Require at least 2 characters
    if (q.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const upperQ = q.toUpperCase()

    // ─── Prisma (sandbox / production DB) ────────────────────────────
    try {
      if (prismaLikelyAvailable()) {
        // Run all searches in parallel
        const [
          airports,
          heliports,
          waypoints,
          navaids,
          airways,
          notams,
          restrictions,
          abbreviations,
          regulations,
          aipSections,
        ] = await Promise.all([
          // Airports: search icaoCode, name, city
          db.airport.findMany({
            where: {
              OR: [
                { icaoCode: { contains: upperQ } },
                { name: { contains: q } },
                { city: { contains: q } },
              ],
            },
            select: {
              id: true,
              icaoCode: true,
              name: true,
              city: true,
              department: true,
              category: true,
              elevation: true,
            },
            take: RESULT_LIMIT,
            orderBy: { icaoCode: 'asc' },
          }),

          // Heliports: search icaoCode, name, city
          db.heliport.findMany({
            where: {
              OR: [
                { icaoCode: { contains: upperQ } },
                { name: { contains: q } },
                { city: { contains: q } },
              ],
            },
            select: {
              id: true,
              icaoCode: true,
              name: true,
              city: true,
              type: true,
              status: true,
            },
            take: RESULT_LIMIT,
            orderBy: { icaoCode: 'asc' },
          }),

          // Waypoints: search id, name
          db.waypoint.findMany({
            where: {
              OR: [
                { id: { contains: upperQ } },
                { name: { contains: q } },
              ],
            },
            select: {
              id: true,
              name: true,
              type: true,
              lat: true,
              lon: true,
              description: true,
            },
            take: RESULT_LIMIT,
            orderBy: { id: 'asc' },
          }),

          // Navaids: search id, name
          db.navaid.findMany({
            where: {
              OR: [
                { id: { contains: upperQ } },
                { name: { contains: q } },
              ],
            },
            select: {
              id: true,
              name: true,
              type: true,
              frequency: true,
              lat: true,
              lon: true,
            },
            take: RESULT_LIMIT,
            orderBy: { id: 'asc' },
          }),

          // Airways: search designator
          db.airway.findMany({
            where: {
              designator: { contains: upperQ },
            },
            select: {
              id: true,
              designator: true,
              type: true,
              level: true,
            },
            take: RESULT_LIMIT,
            orderBy: { designator: 'asc' },
          }),

          // NOTAMs: search notamId, text, subject
          db.notam.findMany({
            where: {
              OR: [
                { notamId: { contains: upperQ } },
                { text: { contains: q } },
                { subject: { contains: q } },
              ],
            },
            select: {
              id: true,
              notamId: true,
              fir: true,
              text: true,
              subject: true,
              condition: true,
              priority: true,
              effectiveFrom: true,
              effectiveTo: true,
              isPermanent: true,
              scope: true,
            },
            take: RESULT_LIMIT,
            orderBy: { effectiveFrom: 'desc' },
          }),

          // Airspace Restrictions: search designator, name
          db.airspaceRestriction.findMany({
            where: {
              OR: [
                { designator: { contains: upperQ } },
                { name: { contains: q } },
              ],
            },
            select: {
              id: true,
              designator: true,
              name: true,
              type: true,
              status: true,
              lowerLimit: true,
              upperLimit: true,
            },
            take: RESULT_LIMIT,
            orderBy: { designator: 'asc' },
          }),

          // Abbreviations: search code, meaning
          db.abbreviation.findMany({
            where: {
              OR: [
                { code: { contains: upperQ } },
                { meaning: { contains: q } },
              ],
            },
            select: {
              id: true,
              code: true,
              meaning: true,
              meaningEn: true,
            },
            take: RESULT_LIMIT,
            orderBy: { code: 'asc' },
          }),

          // Regulations: search code, title
          db.nationalRegulation.findMany({
            where: {
              OR: [
                { code: { contains: upperQ } },
                { title: { contains: q } },
              ],
            },
            select: {
              id: true,
              code: true,
              title: true,
              type: true,
            },
            take: RESULT_LIMIT,
            orderBy: { orderIndex: 'asc' },
          }),

          // AIP Sections: search sectionCode, title
          db.aipSection.findMany({
            where: {
              OR: [
                { sectionCode: { contains: upperQ } },
                { title: { contains: q } },
              ],
            },
            select: {
              id: true,
              sectionCode: true,
              title: true,
              part: true,
            },
            take: RESULT_LIMIT,
            orderBy: { orderIndex: 'asc' },
          }),
        ])

        // Calculate total results
        const totalResults =
          airports.length +
          heliports.length +
          waypoints.length +
          navaids.length +
          airways.length +
          notams.length +
          restrictions.length +
          abbreviations.length +
          regulations.length +
          aipSections.length

        return NextResponse.json({
          query: q,
          totalResults,
          airports,
          heliports,
          waypoints,
          navaids,
          airways,
          notams,
          restrictions,
          abbreviations,
          regulations,
          aipSections,
        })
      }
    } catch (error) {
      console.warn('[api/search] Prisma failed, using static fallback:', error)
    }

    // ─── Static fallback (Vercel serverless) ─────────────────────────
    // NOTAMs are not stored statically (served live from FAA), so they're
    // excluded here — the user can use the dedicated NOTAM search.
    const airports = searchStaticAirports(q, upperQ)
    const heliports = searchStaticHeliports(q, upperQ)
    const waypoints = searchStaticWaypoints(q, upperQ)
    const navaids = searchStaticNavaids(q, upperQ)
    const airways = searchStaticAirways(upperQ)
    const restrictions = searchStaticRestrictions(q, upperQ)
    const abbreviations = searchStaticAbbreviations(q, upperQ)
    const regulations = searchStaticRegulations(q, upperQ)
    const aipSections = searchStaticAipSections(q, upperQ)

    const totalResults =
      airports.length +
      heliports.length +
      waypoints.length +
      navaids.length +
      airways.length +
      restrictions.length +
      abbreviations.length +
      regulations.length +
      aipSections.length

    return NextResponse.json({
      query: q,
      totalResults,
      airports,
      heliports,
      waypoints,
      navaids,
      airways,
      notams: [],
      restrictions,
      abbreviations,
      regulations,
      aipSections,
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
