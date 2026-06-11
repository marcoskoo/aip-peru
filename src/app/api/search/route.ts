import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const RESULT_LIMIT = 10

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
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
