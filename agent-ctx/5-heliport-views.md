# Task 5: Heliport Listing and Detail Views

## Summary
Added complete helipuerto (heliport) section to the AIP PERÚ application with listing, detail, and chart gallery views.

## Files Created
1. **`/src/components/heliport-listing.tsx`** - Listing component with hero, search, department-grouped grid
2. **`/src/components/heliport-detail.tsx`** - Detail view with 4 tabs (General, FATO/TLOF, Servicios, Cartas)

## Files Modified
1. **`/src/lib/types.ts`** - Added `Heliport` interface
2. **`/src/app/page.tsx`** - Added "heliports" ViewMode, Radar icon button, selectedHeliport state

## Key Decisions
- Used `Radar` icon instead of `Helicopter` (not available in lucide-react)
- Chart gallery reuses `/api/airports/[icaoCode]/charts` endpoint (works for heliports with chart metadata like SPBR)
- Heliport cards show ICAO code, name, elevation, use type badge (PRIVADO), department
- commsAts and radioNavAids JSON fields are parsed client-side with fallback for string/raw types
- Department-grouped listing with search filtering by name, ICAO, city, or department

## API Endpoints Used
- `GET /api/heliports` - Returns all 17 heliports
- `GET /api/heliports/[icaoCode]` - Returns single heliport with parsed JSON fields
- `GET /api/airports/[icaoCode]/charts` - Returns charts (works for heliports in charts-metadata.json)
