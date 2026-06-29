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
import { PERUVIAN_NAVAIDS } from "@/lib/aviation/peru-navaids-static"

// ─── Color Palette (Neon Green Aviation Theme) ──────────────────
const C = {
  neon: "#00ff66",       // primary neon green
  neonDim: "#00cc52",    // dimmer green for unselected
  lightGreen: "#99ffcc", // secondary text green
  darkGreen: "#003300",  // dark green bg/border
  darkBg: "#0a0f1a",     // map background (dark blue-black)
  panelBg: "#001a0d",    // panel background (very dark green)
  blue: "#4da6ff",       // secondary blue (airways)
  lightCyan: "#66ff99",  // waypoints
  orange: "#ff9933",     // undo / action
  red: "#ff3333",        // clear / delete
  white: "#ffffff",
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
  const color = isSelected ? C.neon : isIntl ? C.darkGreen : "#1a4d2e"
  const border = isSelected ? C.neon : isIntl ? C.neon : C.neonDim
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid ${border};
          ${isSelected ? `box-shadow:0 0 10px ${C.neon};` : ""}
        "></div>
        <span style="
          position:absolute;top:12px;
          font-size:8px;font-weight:700;
          color:${C.neon};white-space:nowrap;
          text-shadow:1px 1px 2px #000,-1px -1px 2px #000,1px -1px 2px #000,-1px 1px 2px #000;
          letter-spacing:0.5px;pointer-events:none;
        ">${icao}</span>
      </div>`,
    iconSize: [14, 24],
    iconAnchor: [7, 7],
  })
}

function createNavaidIcon(id: string, freq: string, isSelected: boolean) {
  const color = isSelected ? C.neon : C.neon
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:12px;height:12px;
          background:transparent;
          border:2.5px solid ${color};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 10px ${C.neon};` : `box-shadow:0 0 5px ${C.neon}88;`}
        "></div>
        <div style="position:absolute;top:2px;left:14px;display:flex;flex-direction:column;pointer-events:none;">
          <span style="
            font-size:9px;font-weight:700;
            color:${C.neon};white-space:nowrap;
            text-shadow:1px 1px 2px #000,-1px -1px 2px #000,1px -1px 2px #000,-1px 1px 2px #000;
            line-height:1;
          ">${id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:${C.lightGreen};white-space:nowrap;
            text-shadow:1px 1px 2px #000,-1px -1px 2px #000,1px -1px 2px #000,-1px 1px 2px #000;
            line-height:1;
          ">${freq.replace(" MHz", "")}</span>
        </div>
      </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function createWaypointIcon(id: string, isSelected: boolean) {
  const color = isSelected ? C.neon : C.lightCyan
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:8px;height:8px;
          background:transparent;
          border:1.5px solid ${color};
          transform:rotate(45deg);
          ${isSelected ? `box-shadow:0 0 8px ${C.neon};` : ""}
        "></div>
        <span style="
          position:absolute;top:7px;
          font-size:7px;font-weight:600;
          color:${C.lightGreen};white-space:nowrap;
          text-shadow:1px 1px 2px #000,-1px -1px 2px #000,1px -1px 2px #000,-1px 1px 2px #000;
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
          background:${C.neon};
          border:2px solid ${C.darkGreen};
          border-radius:50%;
          box-shadow:0 0 ${editable ? 14 : 10}px ${C.neon}${editable ? "cc" : "99"};
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:700;color:${C.darkGreen};
          ${editable ? "border-style:dashed;" : ""}
        ">${index + 1}</div>
        <span style="
          position:absolute;top:-12px;
          font-size:8px;font-weight:700;
          color:${C.darkGreen};background:${C.neon};
          padding:1px 4px;border-radius:2px;white-space:nowrap;
          pointer-events:none;
          box-shadow:0 0 6px ${C.neon}88;
        ">${label}</span>
        ${editable ? `<div style="position:absolute;top:-2px;right:-6px;font-size:7px;color:${C.neon};pointer-events:none;">✥</div>` : ""}
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
        const d: AirwaysData = {
          firBoundaries: raw.firBoundaries ?? {},
          adjacentFirs: raw.adjacentFirs ?? [],
          navaids: (raw.navaids && raw.navaids.length > 0)
            ? raw.navaids
            : PERUVIAN_NAVAIDS.map((n) => ({
                id: n.id, name: n.name, type: n.type, frequency: n.frequency,
                lat: n.lat, lon: n.lon, elevation: n.elevation ?? undefined,
              })),
          waypoints: raw.waypoints ?? [],
          airways: raw.airways ?? { conventional: [], rnav: [] },
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
          waypoints: [],
          airways: { conventional: [], rnav: [] },
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
    }
    return pts.sort((a, b) => a.id.localeCompare(b.id))
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
      <Card className="border-[#00ff66]/30 bg-[#001a0d]/80 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Route builder */}
            <div className="flex items-center gap-1.5">
              <Route className="size-4 text-[#00ff66]" style={{ filter: "drop-shadow(0 0 3px #00ff66)" }} />
              <span className="text-xs font-bold text-[#00ff66] hidden sm:inline tracking-wider">RUTA:</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#99ffcc] font-mono hidden md:inline">ORIGEN</span>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-[#003300]/40 border-[#00ff66]/40 text-[#00ff66]">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-[#001a0d] border-[#00ff66]/40">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs text-[#99ffcc] focus:bg-[#003300] focus:text-[#00ff66]">
                      <span className="font-mono text-[#00ff66]">{p.id}</span>
                      <span className="text-[#99ffcc]/70 ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-[#00ff66] font-bold" style={{ textShadow: "0 0 4px #00ff66" }}>→</span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#99ffcc] font-mono hidden md:inline">DESTINO</span>
              <Select value={dest} onValueChange={setDest}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-[#003300]/40 border-[#00ff66]/40 text-[#00ff66]">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-[#001a0d] border-[#00ff66]/40">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs text-[#99ffcc] focus:bg-[#003300] focus:text-[#00ff66]">
                      <span className="font-mono text-[#00ff66]">{p.id}</span>
                      <span className="text-[#99ffcc]/70 ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distance display */}
            {directDist && (
              <Badge variant="outline" className="border-[#00ff66]/50 text-[#00ff66] font-mono text-xs gap-1 bg-[#003300]/30" style={{ textShadow: "0 0 3px #00ff66" }}>
                <Gauge className="size-3" />
                {directDist.nm} NM · {directDist.brg}°
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={buildDirectRoute}
              disabled={!origin || !dest}
              className="h-8 text-xs border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66]/15 hover:text-[#00ff66] bg-[#003300]/30"
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
              className={`h-8 text-xs ${editMode ? "bg-[#00ff66] text-[#003300] hover:bg-[#00cc52] font-bold" : "border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66]/15 bg-[#003300]/30"}`}
              style={editMode ? { boxShadow: "0 0 10px #00ff6688" } : {}}
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
              className="h-8 text-xs border-[#ff9933]/50 text-[#ff9933] hover:bg-[#ff9933]/15 bg-[#3a1f00]/30 disabled:opacity-30"
            >
              <Undo2 className="size-3 mr-1" />
              Deshacer
            </Button>

            {routeMode && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setRouteMode(false)}
                className="h-8 text-xs bg-[#00ff66] text-[#003300] hover:bg-[#00cc52] font-bold"
                style={{ boxShadow: "0 0 10px #00ff6688" }}
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
                className="h-8 text-xs border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66]/15 bg-[#003300]/30"
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
                className="h-8 text-xs border-[#ff3333]/50 text-[#ff3333] hover:bg-[#ff3333]/15 bg-[#3a0000]/30"
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
              className="h-8 text-xs ml-auto text-[#99ffcc] hover:bg-[#00ff66]/10"
            >
              <Layers className="size-3 mr-1" />
              Capas
              {showLayerPanel ? <ChevronDown className="size-3 ml-1" /> : <ChevronRight className="size-3 ml-1" />}
            </Button>
          </div>

          {/* Route summary */}
          {route.length >= 2 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-[#00ff66]/20">
              <Badge className="bg-[#00ff66] text-[#003300] gap-1 text-xs font-bold" style={{ boxShadow: "0 0 8px #00ff6666" }}>
                <Route className="size-3" />
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scroll">
                {route.map((p, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] font-mono cursor-pointer hover:bg-[#ff3333]/15 hover:border-[#ff3333]/50 hover:text-[#ff3333] border-[#00ff66]/40 text-[#00ff66] bg-[#003300]/20"
                    onClick={() => removeFromRoute(i)}
                    title={`Click para eliminar ${p.id}`}
                  >
                    {i + 1}. {p.id.length > 14 ? p.id.slice(0, 12) + ".." : p.id}
                    {i < route.length - 1 && (
                      <span className="text-[#99ffcc] ml-1">
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
            <div className="mt-2 pt-2 border-t border-[#00ff66]/20">
              {routeMode && (
                <p className="text-[10px] text-[#00ff66] font-mono" style={{ textShadow: "0 0 2px #00ff66" }}>
                  ✛ Modo construcción: Click cerca de un aeródromo, radioayuda o waypoint para agregarlo a la ruta.
                </p>
              )}
              {editMode && (
                <p className="text-[10px] text-[#00ff66] font-mono flex items-center gap-1" style={{ textShadow: "0 0 2px #00ff66" }}>
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
        <Card className="border-[#00ff66]/20 bg-[#001a0d]/60 backdrop-blur">
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
                  <Label htmlFor={`layer-${key}`} className="text-[10px] cursor-pointer flex items-center gap-1 leading-tight text-[#99ffcc]">
                    <Icon className="size-3 text-[#00ff66]" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Map ─────────────────────────────────── */}
      <div className="relative rounded-lg overflow-hidden border border-[#00ff66]/30" style={{ height: "70vh", minHeight: "500px" }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="w-full h-full"
          style={{ background: C.darkBg }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Grid */}
          {layers.grid && <GridLayer />}

          {/* FIR Boundary */}
          {layers.firBoundary && data?.firBoundaries && Object.values(data.firBoundaries).map((fir) => (
            <Polygon
              key={fir.name}
              positions={fir.polygon.map((p) => [p.lat, p.lon] as [number, number])}
              pathOptions={{ color: C.neon, weight: 2, dashArray: "6,4", opacity: 0.6, fillColor: C.neon, fillOpacity: 0.04 }}
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
                pathOptions={{ color: C.orange, weight: 1, dashArray: "3,3", opacity: 0.4, fillColor: C.orange, fillOpacity: 0.02 }}
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
                pathOptions={{ color: C.blue, weight: 1.5, opacity: 0.5 }}
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
                pathOptions={{ color: C.lightCyan, weight: 1.5, opacity: 0.5, dashArray: "5,3" }}
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
                      <span className="font-bold text-sm text-[#00ff66]">{ap.icao}</span>
                      <Badge variant="outline" className="text-[9px] border-[#00ff66]/40 text-[#00ff66]">{ap.cert}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-[#99ffcc]">{ap.name}</p>
                    <p className="text-[10px] text-[#99ffcc]/70 mb-2">{ap.city}, {ap.dept}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#99ffcc]">
                      <span><b className="text-[#00ff66]">IATA:</b> {ap.iata || "—"}</span>
                      <span><b className="text-[#00ff66]">Elev:</b> {ap.elev || "—"} ft</span>
                      <span><b className="text-[#00ff66]">Var:</b> {ap.magVar || "—"}°</span>
                      <span><b className="text-[#00ff66]">TA:</b> {ap.transAlt || "—"}</span>
                      <span><b className="text-[#00ff66]">TL:</b> {ap.transLvl || "—"}</span>
                      <span><b className="text-[#00ff66]">AFTN:</b> {ap.aftn || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-[#99ffcc]/60 mt-2 pt-2 border-t border-[#00ff66]/20">
                      {ap.lat.toFixed(4)}, {ap.lng.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
                        onClick={() => setOrigin(ap.icao)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
                        onClick={() => setDest(ap.icao)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
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
                      <span className="font-bold text-sm text-[#00ff66]">{nv.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#00ff66]/40 text-[#00ff66]">{nv.type}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-[#99ffcc]">{nv.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#99ffcc]">
                      <span><b className="text-[#00ff66]">Freq:</b> {nv.frequency}</span>
                      <span><b className="text-[#00ff66]">Elev:</b> {nv.elevation || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-[#99ffcc]/60 mt-2 pt-2 border-t border-[#00ff66]/20">
                      {nv.lat.toFixed(4)}, {nv.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
                        onClick={() => setOrigin(nv.id)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
                        onClick={() => setDest(nv.id)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
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
                    <span className="font-bold text-sm text-[#00ff66]">{wp.id}</span>
                    <p className="text-xs text-[#99ffcc]">{wp.name}</p>
                    {wp.description && <p className="text-[10px] text-[#99ffcc]/70 mt-1">{wp.description}</p>}
                    <div className="text-[9px] font-mono text-[#99ffcc]/60 mt-2 pt-2 border-t border-[#00ff66]/20">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 mt-2 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/15"
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
                pathOptions={{ color: C.neon, weight: 10, opacity: 0.18, lineCap: "round" }}
                interactive={false}
              />
              {/* Main line */}
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.neon, weight: 3, opacity: 0.9, dashArray: editMode ? undefined : "8,4", lineCap: "round" }}
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
                        <span className="font-bold text-sm text-[#00ff66]">{i + 1}. {p.id}</span>
                        <Badge variant="outline" className="text-[9px] border-[#00ff66]/40 text-[#00ff66]">{p.type}</Badge>
                      </div>
                      <p className="text-[10px] text-[#99ffcc]">{p.name}</p>
                      <div className="text-[9px] font-mono text-[#99ffcc]/70 mt-1">
                        {p.lat.toFixed(4)}°, {p.lon.toFixed(4)}°
                      </div>
                      {i < route.length - 1 && (
                        <div className="text-[10px] font-mono mt-1 text-[#99ffcc]">
                          → {route[i + 1].id.length > 14 ? "PT" + (i + 2) : route[i + 1].id}: <b className="text-[#00ff66]">{routeStats.legs[i]?.nm} NM</b> · {routeStats.legs[i]?.brg}°
                        </div>
                      )}
                      {editMode && (
                        <p className="text-[9px] text-[#ff9933] mt-1 font-mono">
                          ✦ Arrastra este punto para moverlo
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-[#ff3333]/40 text-[#ff3333] hover:bg-[#ff3333]/15"
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
                        background:${C.neon};color:${C.darkGreen};
                        font-size:9px;font-weight:700;font-family:monospace;
                        padding:1px 5px;border-radius:3px;
                        border:1px solid ${C.darkGreen};white-space:nowrap;
                        box-shadow:0 0 6px ${C.neon}88;
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
        <div className="absolute bottom-2 right-2 bg-[#001a0d]/90 text-[#00ff66] text-[9px] font-mono px-2 py-1 rounded border border-[#00ff66]/30 pointer-events-none" style={{ textShadow: "0 0 2px #00ff66" }}>
          WGS84 · ICAO · CORPAC Perú
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-[#001a0d]/90 text-[#99ffcc] text-[10px] font-mono px-3 py-2 rounded border border-[#00ff66]/30 space-y-1 max-w-[190px] backdrop-blur">
          <div className="font-bold text-[#00ff66] mb-1" style={{ textShadow: "0 0 3px #00ff66" }}>LEYENDA</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#003300] border-2 border-[#00ff66] inline-block" style={{ boxShadow: "0 0 4px #00ff66" }}></span> Aeródromo Intl</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1a4d2e] border-2 border-[#00cc52] inline-block"></span> Aeródromo Nacional</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-[#00ff66] inline-block" style={{ boxShadow: "0 0 4px #00ff66" }}></span> Radioayuda (VOR/DME)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-[#66ff99] inline-block transform rotate-45"></span> Waypoint</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#4da6ff] inline-block"></span> Aerovía Conv.</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#66ff99] inline-block border-dashed"></span> Aerovía RNAV</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#00ff66] inline-block" style={{ boxShadow: "0 0 3px #00ff66" }}></span> Ruta construida</div>
          {editMode && <div className="flex items-center gap-1.5 pt-1 border-t border-[#00ff66]/20 text-[#ff9933]"><Move className="size-2.5" /> Arrastrar puntos</div>}
        </div>
      </div>

      {/* Route details table */}
      {route.length >= 2 && (
        <Card className="border-[#00ff66]/30 bg-[#001a0d]/60">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="size-4 text-[#00ff66]" style={{ filter: "drop-shadow(0 0 3px #00ff66)" }} />
              <h3 className="text-sm font-bold text-[#00ff66]">Detalle de Ruta</h3>
              <Badge variant="outline" className="ml-auto text-xs font-mono border-[#00ff66]/40 text-[#00ff66]">
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-48 custom-scroll">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[#003300] text-[#00ff66]">
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
                      <tr key={i} className="border-b border-[#00ff66]/10 hover:bg-[#00ff66]/10 text-[#99ffcc]">
                        <td className="p-1.5 text-[#00ff66] font-bold">{i + 1}</td>
                        <td className="p-1.5 font-bold text-[#00ff66]">{p.id.length > 18 ? p.id.slice(0, 16) + ".." : p.id}</td>
                        <td className="p-1.5 text-[#99ffcc]/70 text-[10px]">{p.type}</td>
                        <td className="p-1.5 text-[10px] text-[#99ffcc]/70">
                          {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                        </td>
                        <td className="p-1.5 text-right">{leg?.nm ?? "—"}</td>
                        <td className="p-1.5 text-right">{leg?.brg ?? "—"}</td>
                        <td className="p-1.5 text-right text-[#00ff66] font-bold">{acum}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#00ff66]/15 font-bold">
                    <td colSpan={4} className="p-1.5 text-right text-[#00ff66]">TOTAL</td>
                    <td className="p-1.5 text-right text-[#00ff66]">{routeStats.totalNM} NM</td>
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
        { color: "#1a3a2a", weight: 0.5, opacity: 0.4, interactive: false }
      ).addTo(map)
      lines.push(line)
    }
    for (let lon = west; lon <= east; lon++) {
      const line = L.polyline(
        [[south, lon], [north, lon]],
        { color: "#1a3a2a", weight: 0.5, opacity: 0.4, interactive: false }
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
