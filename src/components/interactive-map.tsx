"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plane,
  Radio,
  Navigation2,
  Map as MapIcon,
  Crosshair,
  Layers,
  Route,
  Trash2,
  MapPin,
  X,
  ChevronDown,
  ChevronRight,
  Gauge,
  Undo2,
  Pencil,
  Move,
} from "lucide-react"
import type {
  AirwaysData,
  Airway,
  AirwaySegment,
  Navaid,
  Waypoint,
  FIRBoundary,
  AdjacentFIR,
  Coord,
} from "@/lib/types"
import { PERUVIAN_AIRPORTS, type PeruvianAirport } from "@/lib/aviation/peru-airports-static"
import { PERUVIAN_NAVAIDS, normalizeNavaidType } from "@/lib/aviation/peru-navaids-static"
import { PERUVIAN_WAYPOINTS, PERUVIAN_AIRWAYS } from "@/lib/aviation/peru-airways-static"

// ─── Color Palette (Light Aeronautical Chart Theme) ─────────────
// Based on classic aviation charts: white land, dark blue airways,
// magenta highlighted route, green waypoints, blue VOR/airports.
const C = {
  // Markers
  airport: "#1e40af",        // blue — international airport marker
  airportBorder: "#1e3a8a",  // darker blue border
  airportNat: "#3b82f6",     // lighter blue — national airport marker
  navaid: "#1d4ed8",         // blue — VOR/DME marker
  navaidBorder: "#1e3a8a",
  waypoint: "#16a34a",       // green — waypoint marker
  waypointBorder: "#15803d",
  // Routes & airways
  route: "#c026d3",          // magenta — user-built route (highlighted)
  routeGlow: "#e879f9",      // lighter magenta glow
  airwayConv: "#1e3c78",     // dark blue — conventional airways
  airwayRnav: "#64748b",     // slate gray — RNAV airways (dashed)
  // Boundaries
  fir: "#475569",            // slate — FIR Lima boundary
  adjacentFir: "#94a3b8",    // lighter slate — adjacent FIRs
  grid: "#cbd5e1",           // light gray — lat/lon grid
  // UI / text
  ink: "#0f172a",            // near-black — primary text on light bg
  inkSoft: "#475569",        // soft slate — secondary text
  panelBg: "#ffffff",        // white — panel background
  panelBorder: "#cbd5e1",    // light border
  panelAccent: "#eef2ff",    // very light blue — panel accent/header
  accent: "#1e40af",         // blue — buttons/badges accent
  orange: "#ea580c",         // orange — undo / action
  red: "#dc2626",            // red — clear / delete
  white: "#ffffff",
  mapBg: "#e8eef5",          // light blue-gray — map background
}

// ─── Constants ───────────────────────────────────────────────────
const MAP_CENTER: [number, number] = [-9.19, -75.0]
const MAP_ZOOM = 6

// ─── Types ───────────────────────────────────────────────────────
interface RoutePoint {
  id: string
  name: string
  type: "AIRPORT" | "NAVAID" | "WAYPOINT" | "CUSTOM"
  lat: number
  lon: number
}

interface LayerState {
  aerodromos: boolean
  navaids: boolean
  waypoints: boolean
  convAirways: boolean
  rnavAirways: boolean
  firBoundary: boolean
  adjacentFirs: boolean
  grid: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Great-circle distance in NM (haversine) */
function gcDistNM(a: Coord, b: Coord): number {
  const R = 3440.065 // Earth radius in NM
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

/** Initial bearing from a to b (degrees true) */
function bearingDeg(a: Coord, b: Coord): number {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return Math.round(((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360))
}

/** Format coords lookup */
function buildCoordLookup(
  waypoints: Waypoint[],
  navaids: Navaid[],
  airports: PeruvianAirport[]
): Map<string, Coord> {
  const m = new Map<string, Coord>()
  for (const wp of waypoints) m.set(wp.id, { lat: wp.lat, lon: wp.lon })
  for (const nv of navaids) m.set(nv.id, { lat: nv.lat, lon: nv.lon })
  for (const ap of airports) m.set(ap.icao, { lat: ap.lat, lon: ap.lng })
  return m
}

/** Find nearest known point (airport/navaid/waypoint) within threshold degrees */
function findNearestPoint(
  lat: number,
  lon: number,
  airports: PeruvianAirport[],
  navaids: Navaid[],
  waypoints: Waypoint[],
  threshold = 0.4
): RoutePoint | null {
  let nearest: RoutePoint | null = null
  let minDist = Infinity
  for (const ap of airports) {
    const d = Math.hypot(ap.lat - lat, ap.lng - lon)
    if (d < minDist && d < threshold) {
      minDist = d
      nearest = { id: ap.icao, name: ap.short || ap.city, type: "AIRPORT", lat: ap.lat, lon: ap.lng }
    }
  }
  for (const nv of navaids) {
    const d = Math.hypot(nv.lat - lat, nv.lon - lon)
    if (d < minDist && d < threshold) {
      minDist = d
      nearest = { id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon }
    }
  }
  if (waypoints) {
    for (const wp of waypoints) {
      const d = Math.hypot(wp.lat - lat, wp.lon - lon)
      if (d < minDist && d < threshold) {
        minDist = d
        nearest = { id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon }
      }
    }
  }
  return nearest
}

// ─── Icons ───────────────────────────────────────────────────────

function createAirportIcon(icao: string, isIntl: boolean, isSelected: boolean) {
  const color = isSelected ? C.route : isIntl ? C.airport : C.airportNat
  const border = isSelected ? C.route : isIntl ? C.airportBorder : C.airportBorder
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid ${border};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : ""}
        "></div>
        <span style="
          position:absolute;top:12px;
          font-size:8px;font-weight:700;
          color:${C.ink};white-space:nowrap;
          text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
          letter-spacing:0.5px;pointer-events:none;
        ">${icao}</span>
      </div>`,
    iconSize: [14, 24],
    iconAnchor: [7, 7],
  })
}

function createNavaidIcon(id: string, freq: string, isSelected: boolean) {
  const color = isSelected ? C.route : C.navaid
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:12px;height:12px;
          background:transparent;
          border:2.5px solid ${color};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : ""}
        "></div>
        <div style="position:absolute;top:2px;left:14px;display:flex;flex-direction:column;pointer-events:none;">
          <span style="
            font-size:9px;font-weight:700;
            color:${C.ink};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;
          ">${id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:${C.inkSoft};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;
          ">${freq.replace(" MHz", "")}</span>
        </div>
      </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function createWaypointIcon(id: string, isSelected: boolean) {
  const color = isSelected ? C.route : C.waypoint
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:8px;height:8px;
          background:transparent;
          border:1.5px solid ${color};
          transform:rotate(45deg);
          ${isSelected ? `box-shadow:0 0 6px ${C.route}aa;` : ""}
        "></div>
        <span style="
          position:absolute;top:7px;
          font-size:7px;font-weight:600;
          color:${C.inkSoft};white-space:nowrap;
          text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
          pointer-events:none;
        ">${id}</span>
      </div>`,
    iconSize: [8, 18],
    iconAnchor: [4, 4],
  })
}

function createRoutePointIcon(label: string, index: number, editable: boolean) {
  const isEndpoint = index === 0
  const size = editable ? 18 : (isEndpoint ? 16 : 12)
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;${editable ? "cursor:grab;" : "cursor:pointer;"}">
        <div style="
          width:${size}px;height:${size}px;
          background:${C.route};
          border:2px solid ${C.white};
          border-radius:50%;
          box-shadow:0 0 ${editable ? 10 : 6}px ${C.routeGlow}${editable ? "cc" : "88"};
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:700;color:${C.white};
          ${editable ? "border-style:dashed;" : ""}
        ">${index + 1}</div>
        <span style="
          position:absolute;top:-12px;
          font-size:8px;font-weight:700;
          color:${C.white};background:${C.route};
          padding:1px 4px;border-radius:2px;white-space:nowrap;
          pointer-events:none;
          box-shadow:0 0 4px ${C.routeGlow}88;
        ">${label}</span>
        ${editable ? `<div style="position:absolute;top:-2px;right:-6px;font-size:7px;color:${C.route};pointer-events:none;">✥</div>` : ""}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Map Click Handler ───────────────────────────────────────────
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ─── Main Component ──────────────────────────────────────────────
export function InteractiveMap() {
  const [data, setData] = useState<AirwaysData | null>(null)
  const [loading, setLoading] = useState(true)
  const [layers, setLayers] = useState<LayerState>({
    aerodromos: true,
    navaids: true,
    waypoints: false, // 302 waypoints — off by default to reduce clutter
    convAirways: true,
    rnavAirways: true,
    firBoundary: true,
    adjacentFirs: true,
    grid: false,
  })
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [origin, setOrigin] = useState<string>("")
  const [dest, setDest] = useState<string>("")
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null)
  const [showLayerPanel, setShowLayerPanel] = useState(true)
  const [routeMode, setRouteMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [history, setHistory] = useState<RoutePoint[][]>([])

  // Refs to avoid stale closures in drag handlers (updated in effect, not during render)
  const routeRef = useRef(route)
  const dataRef = useRef<AirwaysData | null>(null)
  useEffect(() => { routeRef.current = route }, [route])
  useEffect(() => { dataRef.current = data }, [data])

  // Fetch airdata
  useEffect(() => {
    let cancelled = false
    fetch("/api/airdata/all")
      .then((r) => r.json())
      .then((raw: Partial<AirwaysData> & { error?: string }) => {
        if (cancelled) return
        // Validate the response has the expected shape; if not, use fallback
        const hasNavaids = raw.navaids && raw.navaids.length > 0
        const hasWaypoints = raw.waypoints && raw.waypoints.length > 0
        const hasAirways =
          raw.airways &&
          ((raw.airways.conventional && raw.airways.conventional.length > 0) ||
            (raw.airways.rnav && raw.airways.rnav.length > 0))
        const d: AirwaysData = {
          firBoundaries: raw.firBoundaries ?? {},
          adjacentFirs: raw.adjacentFirs ?? [],
          navaids: hasNavaids
            ? raw.navaids!.map((n) => ({
                ...n,
                // Normaliza el tipo al formato canónico "VOR DME" / "DVOR DME"
                type: normalizeNavaidType(n.type),
                // Limpia el nombre: reemplaza VOR/DME → VOR DME en el nombre también
                name: (n.name || "").replace(/\s*\/\s*/g, " ").replace(/VOR DME/gi, "VOR DME").replace(/DVOR DME/gi, "DVOR DME").trim(),
              }))
            : PERUVIAN_NAVAIDS.map((n) => ({
                id: n.id, name: n.name, type: n.type, frequency: n.frequency,
                lat: n.lat, lon: n.lon, elevation: n.elevation ?? undefined,
              })),
          waypoints: hasWaypoints ? raw.waypoints! : PERUVIAN_WAYPOINTS,
          airways: hasAirways
            ? raw.airways!
            : { conventional: PERUVIAN_AIRWAYS.conventional, rnav: PERUVIAN_AIRWAYS.rnav },
        }
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        // Fallback: use static data only
        if (cancelled) return
        setData({
          firBoundaries: {},
          adjacentFirs: [],
          navaids: PERUVIAN_NAVAIDS.map((n) => ({
            id: n.id, name: n.name, type: n.type, frequency: n.frequency,
            lat: n.lat, lon: n.lon, elevation: n.elevation ?? undefined,
          })),
          waypoints: PERUVIAN_WAYPOINTS,
          airways: { conventional: PERUVIAN_AIRWAYS.conventional, rnav: PERUVIAN_AIRWAYS.rnav },
        })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Build coord lookup for airway resolution
  const coordLookup = useMemo(() => {
    if (!data) return new Map<string, Coord>()
    return buildCoordLookup(data.waypoints, data.navaids, PERUVIAN_AIRPORTS)
  }, [data])

  // All selectable points for dropdowns
  const allPoints = useMemo<RoutePoint[]>(() => {
    const pts: RoutePoint[] = []
    for (const ap of PERUVIAN_AIRPORTS) {
      pts.push({
        id: ap.icao, name: `${ap.icao} — ${ap.short || ap.city}`,
        type: "AIRPORT", lat: ap.lat, lon: ap.lng,
      })
    }
    if (data) {
      for (const nv of data.navaids) {
        pts.push({
          id: nv.id, name: `${nv.id} — ${nv.name}`,
          type: "NAVAID", lat: nv.lat, lon: nv.lon,
        })
      }
      // Include waypoints too — they're now available as a static fallback
      for (const wp of data.waypoints) {
        pts.push({
          id: wp.id, name: `${wp.id}${wp.description ? ` — ${wp.description}` : ""}`,
          type: "WAYPOINT", lat: wp.lat, lon: wp.lon,
        })
      }
    }
    // Deduplicate by id (in case waypoints overlap with navaids/airports)
    const seen = new Set<string>()
    return pts
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [data])

  // Route calculations
  const routeStats = useMemo(() => {
    if (route.length < 2) return { totalNM: 0, legs: [] as { from: string; to: string; nm: number; brg: number }[] }
    const legs: { from: string; to: string; nm: number; brg: number }[] = []
    let total = 0
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i]
      const b = route[i + 1]
      const nm = gcDistNM({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
      const brg = bearingDeg({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
      legs.push({ from: a.id, to: b.id, nm, brg })
      total += nm
    }
    return { totalNM: total, legs }
  }, [route])

  // Estimated flight time (assume 240 KTAS default)
  const flightTime = useMemo(() => {
    if (routeStats.totalNM <= 0) return null
    const mins = Math.round((routeStats.totalNM / 240) * 60)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}H${m.toString().padStart(2, "0")}MIN`
  }, [routeStats.totalNM])

  // Direct distance between origin and dest
  const directDist = useMemo(() => {
    if (!origin || !dest) return null
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (!a || !b) return null
    const nm = gcDistNM({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
    const brg = bearingDeg({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
    return { nm, brg, a, b }
  }, [origin, dest, allPoints])

  // ─── Route handlers ───────────────────────────────────────────
  const addToRoute = useCallback((pt: RoutePoint) => {
    setRoute((prev) => {
      // Avoid duplicates
      if (prev.length > 0 && prev[prev.length - 1].id === pt.id) return prev
      return [...prev, pt]
    })
  }, [])

  const removeFromRoute = useCallback((index: number) => {
    setHistory((h) => [...h, routeRef.current])
    setRoute((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearRoute = useCallback(() => {
    if (route.length > 0) setHistory((h) => [...h, routeRef.current])
    setRoute([])
    setOrigin("")
    setDest("")
  }, [route.length])

  // Undo last change
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const last = h[h.length - 1]
      setRoute(last)
      return h.slice(0, -1)
    })
  }, [])

  // Handle route point drag — update position with optional snapping
  const handleRoutePointDrag = useCallback((index: number, newLat: number, newLon: number) => {
    const d = dataRef.current
    // Save current state to history before modifying
    setHistory((h) => [...h, routeRef.current])
    // Try snapping to nearest known point
    const snap = d ? findNearestPoint(newLat, newLon, PERUVIAN_AIRPORTS, d.navaids, d.waypoints || [], 0.35) : null
    setRoute((prev) => prev.map((p, i) => {
      if (i !== index) return p
      if (snap) {
        return { ...p, id: snap.id, name: snap.name, type: snap.type, lat: snap.lat, lon: snap.lon }
      }
      // No snap — keep as custom point with coords
      return {
        ...p,
        id: `LAT${newLat.toFixed(2)} LON${newLon.toFixed(2)}`,
        name: `Lat ${newLat.toFixed(4)}° Lon ${newLon.toFixed(4)}°`,
        type: "CUSTOM" as const,
        lat: newLat,
        lon: newLon,
      }
    }))
  }, [])

  // Quick route: set origin+dest and build direct
  const buildDirectRoute = useCallback(() => {
    if (!origin || !dest) return
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (a && b) {
      if (route.length > 0) setHistory((h) => [...h, routeRef.current])
      setRoute([a, b])
    }
  }, [origin, dest, allPoints, route.length])

  // Handle map click in route mode — find nearest point
  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (!routeMode || !data) return
    const nearest = findNearestPoint(lat, lon, PERUVIAN_AIRPORTS, data.navaids, data.waypoints || [], 0.5)
    if (nearest) {
      addToRoute(nearest)
    }
  }, [routeMode, data, addToRoute])

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />
  }

  return (
    <div className="space-y-3">
      {/* ─── Toolbar ─────────────────────────────── */}
      <Card className="border-[#cbd5e1] bg-white/80 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Route builder */}
            <div className="flex items-center gap-1.5">
              <Route className="size-4 text-[#1e40af]" style={{ filter: "drop-shadow(0 0 3px #1e40af)" }} />
              <span className="text-xs font-bold text-[#1e40af] hidden sm:inline tracking-wider">RUTA:</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-600 font-mono hidden md:inline">ORIGEN</span>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-[#eef2ff]/40 border-[#1e40af]/40 text-[#1e40af]">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white border-[#1e40af]/40">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs text-slate-600 focus:bg-[#eef2ff] focus:text-[#1e40af]">
                      <span className="font-mono text-[#1e40af]">{p.id}</span>
                      <span className="text-slate-600/70 ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-[#1e40af] font-bold" style={{ textShadow: "0 0 4px #1e40af" }}>→</span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-600 font-mono hidden md:inline">DESTINO</span>
              <Select value={dest} onValueChange={setDest}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-[#eef2ff]/40 border-[#1e40af]/40 text-[#1e40af]">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white border-[#1e40af]/40">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs text-slate-600 focus:bg-[#eef2ff] focus:text-[#1e40af]">
                      <span className="font-mono text-[#1e40af]">{p.id}</span>
                      <span className="text-slate-600/70 ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distance display */}
            {directDist && (
              <Badge variant="outline" className="border-[#1e40af]/50 text-[#1e40af] font-mono text-xs gap-1 bg-[#eef2ff]/30" style={{ textShadow: "0 0 3px #1e40af" }}>
                <Gauge className="size-3" />
                {directDist.nm} NM · {directDist.brg}°
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={buildDirectRoute}
              disabled={!origin || !dest}
              className="h-8 text-xs border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 hover:text-[#1e40af] bg-[#eef2ff]/30"
            >
              <MapPin className="size-3 mr-1" />
              Ruta Directa
            </Button>

            {/* EDITAR RUTA toggle — enables drag-and-drop of route points */}
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
              disabled={route.length === 0}
              className={`h-8 text-xs ${editMode ? "bg-[#c026d3] text-white hover:bg-[#a21caf] font-bold" : "border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 bg-[#eef2ff]/30"}`}
              style={editMode ? { boxShadow: "0 0 8px #c026d388" } : {}}
            >
              <Pencil className="size-3 mr-1" />
              {editMode ? "Editar Ruta ON" : "Editar Ruta"}
            </Button>

            {/* DESHACER (undo) */}
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={history.length === 0}
              className="h-8 text-xs border-[#ea580c]/50 text-[#ea580c] hover:bg-[#ea580c]/10 bg-[#fff7ed] disabled:opacity-30"
            >
              <Undo2 className="size-3 mr-1" />
              Deshacer
            </Button>

            {routeMode && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setRouteMode(false)}
                className="h-8 text-xs bg-[#c026d3] text-white hover:bg-[#a21caf] font-bold"
                style={{ boxShadow: "0 0 8px #c026d388" }}
              >
                <Crosshair className="size-3 mr-1" />
                Click en mapa ON
              </Button>
            )}
            {!routeMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRouteMode(true)}
                className="h-8 text-xs border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 bg-[#eef2ff]/30"
              >
                <Crosshair className="size-3 mr-1" />
                Click en mapa
              </Button>
            )}

            {route.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearRoute}
                className="h-8 text-xs border-[#dc2626]/50 text-[#dc2626] hover:bg-[#dc2626]/10 bg-[#3a0000]/30"
              >
                <Trash2 className="size-3 mr-1" />
                Limpiar
              </Button>
            )}

            {/* Layer panel toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="h-8 text-xs ml-auto text-slate-600 hover:bg-[#1e40af]/10"
            >
              <Layers className="size-3 mr-1" />
              Capas
              {showLayerPanel ? <ChevronDown className="size-3 ml-1" /> : <ChevronRight className="size-3 ml-1" />}
            </Button>
          </div>

          {/* Route summary */}
          {route.length >= 2 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <Badge className="bg-[#1e40af] text-white gap-1 text-xs font-bold" >
                <Route className="size-3" />
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scroll">
                {route.map((p, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] font-mono cursor-pointer hover:bg-[#dc2626]/10 hover:border-[#dc2626]/50 hover:text-[#dc2626] border-[#1e40af]/40 text-[#1e40af] bg-[#eef2ff]/20"
                    onClick={() => removeFromRoute(i)}
                    title={`Click para eliminar ${p.id}`}
                  >
                    {i + 1}. {p.id.length > 14 ? p.id.slice(0, 12) + ".." : p.id}
                    {i < route.length - 1 && (
                      <span className="text-slate-600 ml-1">
                        →{routeStats.legs[i]?.nm}NM
                      </span>
                    )}
                    <X className="size-2.5 ml-1 opacity-50" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(routeMode || editMode) && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              {routeMode && (
                <p className="text-[10px] text-[#1e40af] font-mono" >
                  ✛ Modo construcción: Click cerca de un aeródromo, radioayuda o waypoint para agregarlo a la ruta.
                </p>
              )}
              {editMode && (
                <p className="text-[10px] text-[#1e40af] font-mono flex items-center gap-1" >
                  <Move className="size-3" />
                  Modo edición: Arrastra y suelta los puntos de la ruta (números verdes) al punto deseado por donde quieres la trayectoria. Se ajustan automáticamente a radioayudas/aeródromos cercanos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Layer Panel ─────────────────────────── */}
      {showLayerPanel && (
        <Card className="border-slate-200 bg-white/60 backdrop-blur">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {([
                { key: "aerodromos", label: "Aeródromos", icon: Plane },
                { key: "navaids", label: "Radioayudas", icon: Radio },
                { key: "waypoints", label: "Waypoints", icon: Navigation2 },
                { key: "convAirways", label: "Aerovías Conv.", icon: Route },
                { key: "rnavAirways", label: "Aerovías RNAV", icon: Route },
                { key: "firBoundary", label: "FIR Lima", icon: MapIcon },
                { key: "adjacentFirs", label: "FIRs Adyac.", icon: Crosshair },
                { key: "grid", label: "Grilla", icon: Layers },
              ] as const).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`layer-${key}`}
                    checked={layers[key]}
                    onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [key]: !!v }))}
                  />
                  <Label htmlFor={`layer-${key}`} className="text-[10px] cursor-pointer flex items-center gap-1 leading-tight text-slate-600">
                    <Icon className="size-3 text-[#1e40af]" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Map ─────────────────────────────────── */}
      <div className="relative rounded-lg overflow-hidden border border-[#cbd5e1]" style={{ height: "70vh", minHeight: "500px" }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="w-full h-full"
          style={{ background: C.mapBg }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Grid */}
          {layers.grid && <GridLayer />}

          {/* FIR Boundary */}
          {layers.firBoundary && data?.firBoundaries && Object.values(data.firBoundaries).map((fir) => (
            <Polygon
              key={fir.name}
              positions={fir.polygon.map((p) => [p.lat, p.lon] as [number, number])}
              pathOptions={{ color: C.fir, weight: 2, dashArray: "6,4", opacity: 0.7, fillColor: C.fir, fillOpacity: 0.04 }}
            >
              <Tooltip sticky>{fir.name} ({fir.type})</Tooltip>
            </Polygon>
          ))}

          {/* Adjacent FIRs */}
          {layers.adjacentFirs && data?.adjacentFirs?.map((fir) => (
            fir.borderPoints && fir.borderPoints.length > 0 ? (
              <Polygon
                key={fir.icao}
                positions={fir.borderPoints.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.adjacentFir, weight: 1, dashArray: "3,3", opacity: 0.5, fillColor: C.adjacentFir, fillOpacity: 0.02 }}
              >
                <Tooltip sticky>{fir.icao} — {fir.name} ({fir.country})</Tooltip>
              </Polygon>
            ) : null
          ))}

          {/* Conventional Airways */}
          {layers.convAirways && data?.airways?.conventional?.map((aw) => {
            const positions: [number, number][] = []
            for (const seg of aw.segments) {
              const fromC = coordLookup.get(seg.from)
              const toC = coordLookup.get(seg.to)
              if (fromC && toC) {
                if (positions.length === 0) positions.push([fromC.lat, fromC.lon])
                positions.push([toC.lat, toC.lon])
              }
            }
            if (positions.length < 2) return null
            return (
              <Polyline
                key={aw.designator + "-" + aw.type}
                positions={positions}
                pathOptions={{ color: C.airwayConv, weight: 1.5, opacity: 0.55 }}
              >
                <Tooltip sticky>{aw.designator} ({aw.type}, {aw.level})</Tooltip>
              </Polyline>
            )
          })}

          {/* RNAV Airways */}
          {layers.rnavAirways && data?.airways?.rnav?.map((aw) => {
            const positions: [number, number][] = []
            for (const seg of aw.segments) {
              const fromC = coordLookup.get(seg.from)
              const toC = coordLookup.get(seg.to)
              if (fromC && toC) {
                if (positions.length === 0) positions.push([fromC.lat, fromC.lon])
                positions.push([toC.lat, toC.lon])
              }
            }
            if (positions.length < 2) return null
            return (
              <Polyline
                key={aw.designator + "-" + aw.type}
                positions={positions}
                pathOptions={{ color: C.airwayRnav, weight: 1.5, opacity: 0.5, dashArray: "5,3" }}
              >
                <Tooltip sticky>{aw.designator} (RNAV, {aw.level})</Tooltip>
              </Polyline>
            )
          })}

          {/* Airports */}
          {layers.aerodromos && PERUVIAN_AIRPORTS?.map((ap) => {
            const isInRoute = route.some((r) => r.id === ap.icao)
            return (
              <Marker
                key={ap.icao}
                position={[ap.lat, ap.lng]}
                icon={createAirportIcon(ap.icao, ap.cert === "INTERNACIONAL", isInRoute)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#1e40af]">{ap.icao}</span>
                      <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{ap.cert}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{ap.name}</p>
                    <p className="text-[10px] text-slate-600/70 mb-2">{ap.city}, {ap.dept}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#1e40af]">IATA:</b> {ap.iata || "—"}</span>
                      <span><b className="text-[#1e40af]">Elev:</b> {ap.elev || "—"} ft</span>
                      <span><b className="text-[#1e40af]">Var:</b> {ap.magVar || "—"}°</span>
                      <span><b className="text-[#1e40af]">TA:</b> {ap.transAlt || "—"}</span>
                      <span><b className="text-[#1e40af]">TL:</b> {ap.transLvl || "—"}</span>
                      <span><b className="text-[#1e40af]">AFTN:</b> {ap.aftn || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {ap.lat.toFixed(4)}, {ap.lng.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(ap.icao)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(ap.icao)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: ap.icao, name: ap.short || ap.city, type: "AIRPORT", lat: ap.lat, lon: ap.lng })}
                      >
                        + Ruta
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Navaids */}
          {layers.navaids && data?.navaids?.map((nv) => {
            const isInRoute = route.some((r) => r.id === nv.id)
            return (
              <Marker
                key={nv.id}
                position={[nv.lat, nv.lon]}
                icon={createNavaidIcon(nv.id, nv.frequency, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#1e40af]">{nv.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{normalizeNavaidType(nv.type)}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{nv.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#1e40af]">Freq:</b> {nv.frequency}</span>
                      <span><b className="text-[#1e40af]">Elev:</b> {nv.elevation || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {nv.lat.toFixed(4)}, {nv.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(nv.id)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(nv.id)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon })}
                      >
                        + Ruta
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Waypoints (only if enabled) */}
          {layers.waypoints && data?.waypoints?.map((wp) => {
            const isInRoute = route.some((r) => r.id === wp.id)
            return (
              <Marker
                key={wp.id}
                position={[wp.lat, wp.lon]}
                icon={createWaypointIcon(wp.id, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <span className="font-bold text-sm text-[#1e40af]">{wp.id}</span>
                    <p className="text-xs text-slate-600">{wp.name}</p>
                    {wp.description && <p className="text-[10px] text-slate-600/70 mt-1">{wp.description}</p>}
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 mt-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                      onClick={() => addToRoute({ id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon })}
                    >
                      + Agregar a Ruta
                    </Button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Route polyline with glow (two layers: wide glow + sharp line) */}
          {route.length >= 2 && (
            <>
              {/* Glow underlay */}
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.routeGlow, weight: 10, opacity: 0.2, lineCap: "round" }}
                interactive={false}
              />
              {/* Main line */}
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.route, weight: 3, opacity: 0.9, dashArray: editMode ? undefined : "8,4", lineCap: "round" }}
              />
              {/* Route point markers — draggable when editMode is ON */}
              {route.map((p, i) => (
                <Marker
                  key={`route-${i}-${p.id}`}
                  position={[p.lat, p.lon]}
                  icon={createRoutePointIcon(p.id.length > 10 ? `PT${i + 1}` : p.id, i, editMode)}
                  draggable={editMode}
                  eventHandlers={editMode ? {
                    dragend: (e) => {
                      const marker = e.target as L.Marker
                      const ll = marker.getLatLng()
                      handleRoutePointDrag(i, ll.lat, ll.lng)
                    },
                  } : undefined}
                >
                  <Popup>
                    <div className="min-w-[170px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#1e40af]">{i + 1}. {p.id}</span>
                        <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{p.type}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-600">{p.name}</p>
                      <div className="text-[9px] font-mono text-slate-600/70 mt-1">
                        {p.lat.toFixed(4)}°, {p.lon.toFixed(4)}°
                      </div>
                      {i < route.length - 1 && (
                        <div className="text-[10px] font-mono mt-1 text-slate-600">
                          → {route[i + 1].id.length > 14 ? "PT" + (i + 2) : route[i + 1].id}: <b className="text-[#1e40af]">{routeStats.legs[i]?.nm} NM</b> · {routeStats.legs[i]?.brg}°
                        </div>
                      )}
                      {editMode && (
                        <p className="text-[9px] text-[#ea580c] mt-1 font-mono">
                          ✦ Arrastra este punto para moverlo
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-[#dc2626]/40 text-[#dc2626] hover:bg-[#dc2626]/10"
                          onClick={() => removeFromRoute(i)}
                        >
                          <Trash2 className="size-2.5 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Distance labels at midpoints */}
              {routeStats.legs.map((leg, i) => {
                const a = route[i]
                const b = route[i + 1]
                const midLat = (a.lat + b.lat) / 2
                const midLon = (a.lon + b.lon) / 2
                return (
                  <Marker
                    key={`dist-${i}`}
                    position={[midLat, midLon]}
                    icon={L.divIcon({
                      className: "",
                      html: `<div style="
                        background:${C.route};color:${C.white};
                        font-size:9px;font-weight:700;font-family:monospace;
                        padding:1px 5px;border-radius:3px;
                        border:1px solid ${C.white};white-space:nowrap;
                        box-shadow:0 0 4px ${C.routeGlow}88;
                      ">${leg.nm} NM / ${leg.brg}°</div>`,
                      iconSize: [60, 14],
                      iconAnchor: [30, 7],
                    })}
                    interactive={false}
                  />
                )
              })}
            </>
          )}
        </MapContainer>

        {/* Map info badge */}
        <div className="absolute bottom-2 right-2 bg-white/90 text-slate-500 text-[9px] font-mono px-2 py-1 rounded border border-[#cbd5e1] pointer-events-none">
          WGS84 · ICAO · CORPAC Perú
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-white/90 text-slate-600 text-[10px] font-mono px-3 py-2 rounded border border-[#cbd5e1] space-y-1 max-w-[190px] backdrop-blur">
          <div className="font-bold text-[#1e40af] mb-1" style={{ textShadow: "0 0 3px #1e40af" }}>LEYENDA</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1e40af] border-2 border-[#1e3a8a] inline-block rounded-full"></span> Aeródromo Intl</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#3b82f6] border-2 border-[#1e3a8a] inline-block rounded-full"></span> Aeródromo Nacional</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-[#1d4ed8] inline-block"></span> Radioayuda (VOR DME)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-[#16a34a] inline-block transform rotate-45"></span> Waypoint</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#1e3c78] inline-block"></span> Aerovía Conv.</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#64748b] inline-block border-dashed"></span> Aerovía RNAV</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#c026d3] inline-block"></span> Ruta construida</div>
          {editMode && <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 text-[#ea580c]"><Move className="size-2.5" /> Arrastrar puntos</div>}
        </div>
      </div>

      {/* Route details table */}
      {route.length >= 2 && (
        <Card className="border-[#cbd5e1] bg-white/60">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="size-4 text-[#1e40af]" style={{ filter: "drop-shadow(0 0 3px #1e40af)" }} />
              <h3 className="text-sm font-bold text-[#1e40af]">Detalle de Ruta</h3>
              <Badge variant="outline" className="ml-auto text-xs font-mono border-[#1e40af]/40 text-[#1e40af]">
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-48 custom-scroll">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[#eef2ff] text-[#1e40af]">
                  <tr>
                    <th className="text-left p-1.5">#</th>
                    <th className="text-left p-1.5">Punto</th>
                    <th className="text-left p-1.5">Tipo</th>
                    <th className="text-left p-1.5">Coordenadas</th>
                    <th className="text-right p-1.5">Leg NM</th>
                    <th className="text-right p-1.5">Rumbo°</th>
                    <th className="text-right p-1.5">Acum NM</th>
                  </tr>
                </thead>
                <tbody>
                  {route.map((p, i) => {
                    const leg = i > 0 ? routeStats.legs[i - 1] : null
                    const acum = routeStats.legs.slice(0, i).reduce((s, l) => s + l.nm, 0)
                    return (
                      <tr key={i} className="border-b border-slate-200 hover:bg-[#1e40af]/10 text-slate-600">
                        <td className="p-1.5 text-[#1e40af] font-bold">{i + 1}</td>
                        <td className="p-1.5 font-bold text-[#1e40af]">{p.id.length > 18 ? p.id.slice(0, 16) + ".." : p.id}</td>
                        <td className="p-1.5 text-slate-600/70 text-[10px]">{p.type}</td>
                        <td className="p-1.5 text-[10px] text-slate-600/70">
                          {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                        </td>
                        <td className="p-1.5 text-right">{leg?.nm ?? "—"}</td>
                        <td className="p-1.5 text-right">{leg?.brg ?? "—"}</td>
                        <td className="p-1.5 text-right text-[#1e40af] font-bold">{acum}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#1e40af]/15 font-bold">
                    <td colSpan={4} className="p-1.5 text-right text-[#1e40af]">TOTAL</td>
                    <td className="p-1.5 text-right text-[#1e40af]">{routeStats.totalNM} NM</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Grid Layer Component ────────────────────────────────────────
function GridLayer() {
  const map = useMap()
  const linesRef = useRef<L.Polyline[]>([])
  const labelsRef = useRef<L.Marker[]>([])

  useEffect(() => {
    const bounds = map.getBounds()
    const south = Math.floor(bounds.getSouth())
    const north = Math.ceil(bounds.getNorth())
    const west = Math.floor(bounds.getWest())
    const east = Math.ceil(bounds.getEast())

    const lines: L.Polyline[] = []
    const labels: L.Marker[] = []

    for (let lat = south; lat <= north; lat++) {
      const line = L.polyline(
        [[lat, west], [lat, east]],
        { color: C.grid, weight: 0.5, opacity: 0.5, interactive: false }
      ).addTo(map)
      lines.push(line)
    }
    for (let lon = west; lon <= east; lon++) {
      const line = L.polyline(
        [[south, lon], [north, lon]],
        { color: C.grid, weight: 0.5, opacity: 0.5, interactive: false }
      ).addTo(map)
      lines.push(line)
    }

    linesRef.current = lines
    labelsRef.current = labels

    return () => {
      lines.forEach((l) => map.removeLayer(l))
      labels.forEach((l) => map.removeLayer(l))
    }
  }, [map])

  return null
}
