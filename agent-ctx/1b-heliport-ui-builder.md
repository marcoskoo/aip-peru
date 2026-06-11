---
Task ID: 1b
Agent: Heliport UI Builder
Task: Add heliport listing and detail UI to the AIP PERÚ application

Work Log:
- Read worklog.md (Tasks 1-10) and reviewed project context
- Read types.ts, page.tsx, airport-listing.tsx, airport-card.tsx, airport-detail.tsx for pattern reference
- Verified heliports API at /api/heliports already exists with GET/POST and ?search=, ?type=, ?department= support
- Verified Prisma Heliport model in schema.prisma matches the required interface
- Added Heliport interface to /src/lib/types.ts with all fields matching the Prisma schema
- Created /src/components/heliport-listing.tsx:
  - Hero section with Crosshair icon, navy/amber color scheme matching airport listing
  - Search bar (by name, city, or ICAO code) with Search icon
  - Type filter buttons: Todos, Hospital, Petrolero, Militar, Comercial with counts
  - Stats line: "X helipuertos encontrados" with breakdown by type
  - Card grid with HeliportCard component showing: ICAO code badge, name, city/department, type badge (color-coded), elevation, status badge
  - Type badge colors: HOSPITAL=red, OIL INDUSTRIAL=amber, MILITARY=green, COMMERCIAL=blue
  - Loading skeleton, empty state with Crosshair icon
  - Debounced search (300ms)
  - Calls onSelectHeliport(heliport) on card click
- Created /src/components/heliport-detail.tsx:
  - Back button ("Volver a Helipuertos")
  - Navy header with ICAO code, name, type badge, status badge
  - 4 section cards in 2-column grid:
    - Datos Geográficos: ICAO code, coordinates, decimal coords, elevation, city, department, province, district
    - Información: type, surface, dimensions, markings, lighting
    - Operaciones: operating hours, authorized traffic, restrictions
    - Administración: operator, phone, remarks
  - Full-width Comunicaciones section with Table (service, frequency, callsign, hours)
  - JSON communications parsing with both Spanish and English field names
  - Fetches fresh detail from API on mount using icaoCode search
  - Loading skeleton state
- Updated /src/app/page.tsx:
  - Added "heliports" to ViewMode type union
  - Added selectedHeliport state and handlers (handleSelectHeliport, handleHeliportBack)
  - Added "Helipuertos" navigation button with Crosshair icon in header
  - Navigation buttons hidden when heliport is selected (same pattern as airports)
  - Heliport badge shown in header when selected
  - Logo click resets both airport and heliport selection
  - Conditional rendering: heliports view shows HeliportListing or HeliportDetail
- Lint passes (0 errors)
- Dev server compiling successfully, heliports API responding correctly

Stage Summary:
- Complete heliport listing and detail UI integrated into AIP PERÚ app
- Navy/amber color scheme consistent with existing airport views
- Spanish labels throughout
- Responsive design (mobile-first with sm/md/lg breakpoints)
- Color-coded type badges: Hospital(red), Petrolero(amber), Militar(green), Comercial(blue)
- Communications table with JSON parsing
- Accessible via "Helipuertos" button in header navigation
