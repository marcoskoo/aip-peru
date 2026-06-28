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

// ─── Constants ───────────────────────────────────────────────────
const MAP_CENTER: [number, number] = [-9.19, -75.0]
const MAP_ZOOM = 6

// ─── Types ───────────────────────────────────────────────────────
interface RoutePoint {
  id: string
  name: string
  type: "AIRPORT" | "NAVAID" | "WAYPOINT"
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

// ─── Icons ───────────────────────────────────────────────────────

function createAirportIcon(icao: string, isIntl: boolean, isSelected: boolean) {
  const color = isSelected ? "#f59e0b" : isIntl ? "#1e3a5f" : "#475569"
  const border = isSelected ? "#f59e0b" : isIntl ? "#f59e0b" : "#94a3b8"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid ${border};
          ${isSelected ? "box-shadow:0 0 8px #f59e0b;" : ""}
        "></div>
        <span style="
          position:absolute;top:12px;
          font-size:8px;font-weight:700;
          color:#1e3a5f;white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:0.5px;pointer-events:none;
        ">${icao}</span>
      </div>`,
    iconSize: [14, 24],
    iconAnchor: [7, 7],
  })
}

function createNavaidIcon(id: string, freq: string, isSelected: boolean) {
  const color = isSelected ? "#f59e0b" : "#3b82f6"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:12px;height:12px;
          background:transparent;
          border:2.5px solid ${color};
          border-radius:50%;
          ${isSelected ? "box-shadow:0 0 8px #f59e0b;" : "box-shadow:0 0 4px rgba(59,130,246,0.5);"}
        "></div>
        <div style="position:absolute;top:2px;left:14px;display:flex;flex-direction:column;pointer-events:none;">
          <span style="
            font-size:9px;font-weight:700;
            color:${isSelected ? "#b45309" : "#1d4ed8"};white-space:nowrap;
            text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
            line-height:1;
          ">${id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:${color};white-space:nowrap;
            text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
            line-height:1;
          ">${freq.replace(" MHz", "")}</span>
        </div>
      </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function createWaypointIcon(id: string, isSelected: boolean) {
  const color = isSelected ? "#f59e0b" : "#06b6d4"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:8px;height:8px;
          background:transparent;
          border:1.5px solid ${color};
          transform:rotate(45deg);
          ${isSelected ? "box-shadow:0 0 6px #f59e0b;" : ""}
        "></div>
        <span style="
          position:absolute;top:7px;
          font-size:7px;font-weight:600;
          color:${isSelected ? "#b45309" : "#0e7490"};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          pointer-events:none;
        ">${id}</span>
      </div>`,
    iconSize: [8, 18],
    iconAnchor: [4, 4],
  })
}

function createRoutePointIcon(label: string, index: number) {
  const isEndpoint = index === 0
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:${isEndpoint ? 16 : 12}px;height:${isEndpoint ? 16 : 12}px;
          background:#f59e0b;
          border:2px solid #1e3a5f;
          border-radius:50%;
          box-shadow:0 0 8px rgba(245,158,11,0.6);
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:700;color:#1e3a5f;
        ">${index + 1}</div>
        <span style="
          position:absolute;top:-12px;
          font-size:8px;font-weight:700;
          color:#1e3a5f;background:#f59e0b;
          padding:1px 4px;border-radius:2px;white-space:nowrap;
          pointer-events:none;
        ">${label}</span>
      </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
    setRoute((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearRoute = useCallback(() => {
    setRoute([])
    setOrigin("")
    setDest("")
  }, [])

  const setOriginFromRoute = useCallback(() => {
    if (route.length > 0) setOrigin(route[0].id)
  }, [route])

  const setDestFromRoute = useCallback(() => {
    if (route.length > 0) setDest(route[route.length - 1].id)
  }, [route])

  // Quick route: set origin+dest and build direct
  const buildDirectRoute = useCallback(() => {
    if (!origin || !dest) return
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (a && b) setRoute([a, b])
  }, [origin, dest, allPoints])

  // Handle map click in route mode — find nearest point
  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (!routeMode || !data) return
    // Find nearest navaid/waypoint/airport within threshold
    let nearest: RoutePoint | null = null
    let minDist = Infinity
    const threshold = 0.5 // degrees

    for (const ap of PERUVIAN_AIRPORTS) {
      const d = Math.hypot(ap.lat - lat, ap.lng - lon)
      if (d < minDist && d < threshold) {
        minDist = d
        nearest = { id: ap.icao, name: ap.short || ap.city, type: "AIRPORT", lat: ap.lat, lon: ap.lng }
      }
    }
    for (const nv of data.navaids) {
      const d = Math.hypot(nv.lat - lat, nv.lon - lon)
      if (d < minDist && d < threshold) {
        minDist = d
        nearest = { id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon }
      }
    }
    if (data.waypoints && layers.waypoints) {
      for (const wp of data.waypoints) {
        const d = Math.hypot(wp.lat - lat, wp.lon - lon)
        if (d < minDist && d < threshold) {
          minDist = d
          nearest = { id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon }
        }
      }
    }
    if (nearest) {
      addToRoute(nearest)
    }
  }, [routeMode, data, layers.waypoints, addToRoute])

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />
  }

  return (
    <div className="space-y-3">
      {/* ─── Toolbar ─────────────────────────────── */}
      <Card className="border-amber-500/20 bg-navy/50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Route builder */}
            <div className="flex items-center gap-1.5">
              <Route className="size-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500 hidden sm:inline">RUTA:</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-mono hidden md:inline">ORIGEN</span>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs">
                      <span className="font-mono">{p.id}</span>
                      <span className="text-muted-foreground ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-amber-500 font-bold">→</span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-mono hidden md:inline">DESTINO</span>
              <Select value={dest} onValueChange={setDest}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allPoints.map((p) => (
                    <SelectItem key={p.type + p.id} value={p.id} className="text-xs">
                      <span className="font-mono">{p.id}</span>
                      <span className="text-muted-foreground ml-1 truncate">— {p.name.split("—")[1]?.trim() || ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distance display */}
            {directDist && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono text-xs gap-1">
                <Gauge className="size-3" />
                {directDist.nm} NM · {directDist.brg}°
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={buildDirectRoute}
              disabled={!origin || !dest}
              className="h-8 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <MapPin className="size-3 mr-1" />
              Ruta Directa
            </Button>

            <Button
              size="sm"
              variant={routeMode ? "default" : "outline"}
              onClick={() => setRouteMode(!routeMode)}
              className={`h-8 text-xs ${routeMode ? "bg-amber-500 text-navy hover:bg-amber-600" : "border-amber-500/30 text-amber-600 dark:text-amber-400"}`}
            >
              <Crosshair className="size-3 mr-1" />
              {routeMode ? "Click en mapa ON" : "Click en mapa"}
            </Button>

            {route.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearRoute}
                className="h-8 text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
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
              className="h-8 text-xs ml-auto"
            >
              <Layers className="size-3 mr-1" />
              Capas
              {showLayerPanel ? <ChevronDown className="size-3 ml-1" /> : <ChevronRight className="size-3 ml-1" />}
            </Button>
          </div>

          {/* Route summary */}
          {route.length >= 2 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/10">
              <Badge className="bg-amber-500 text-navy gap-1 text-xs">
                <Route className="size-3" />
                {route.length} puntos · {routeStats.totalNM} NM total
              </Badge>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {route.map((p, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] font-mono cursor-pointer hover:bg-red-500/10 hover:border-red-500/40"
                    onClick={() => removeFromRoute(i)}
                    title={`Click para eliminar ${p.id}`}
                  >
                    {i + 1}. {p.id}
                    {i < route.length - 1 && (
                      <span className="text-amber-500 ml-1">
                        →{routeStats.legs[i]?.nm}NM
                      </span>
                    )}
                    <X className="size-2.5 ml-1 opacity-50" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {routeMode && (
            <div className="mt-2 pt-2 border-t border-amber-500/10">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                ✛ Modo construcción: Click cerca de un aeródromo, radioayuda o waypoint para agregarlo a la ruta. Click en un punto de la ruta (arriba) para eliminarlo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Layer Panel ─────────────────────────── */}
      {showLayerPanel && (
        <Card className="border-amber-500/20 bg-navy/30">
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
                  <Label htmlFor={`layer-${key}`} className="text-[10px] cursor-pointer flex items-center gap-1 leading-tight">
                    <Icon className="size-3 text-amber-500" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Map ─────────────────────────────────── */}
      <div className="relative rounded-lg overflow-hidden border border-amber-500/20" style={{ height: "70vh", minHeight: "500px" }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="w-full h-full"
          style={{ background: "#0a1628" }}
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
              pathOptions={{ color: "#1d4ed8", weight: 2, dashArray: "6,4", opacity: 0.7, fillColor: "#1d4ed8", fillOpacity: 0.03 }}
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
                pathOptions={{ color: "#f97316", weight: 1, dashArray: "3,3", opacity: 0.4, fillColor: "#f97316", fillOpacity: 0.02 }}
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
                pathOptions={{ color: "#3b82f6", weight: 1.5, opacity: 0.5 }}
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
                pathOptions={{ color: "#06b6d4", weight: 1.5, opacity: 0.5, dashArray: "5,3" }}
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
                      <span className="font-bold text-sm text-navy">{ap.icao}</span>
                      <Badge variant="outline" className="text-[9px]">{ap.cert}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1">{ap.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{ap.city}, {ap.dept}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span><b>IATA:</b> {ap.iata || "—"}</span>
                      <span><b>Elev:</b> {ap.elev || "—"} ft</span>
                      <span><b>Var:</b> {ap.magVar || "—"}°</span>
                      <span><b>TA:</b> {ap.transAlt || "—"}</span>
                      <span><b>TL:</b> {ap.transLvl || "—"}</span>
                      <span><b>AFTN:</b> {ap.aftn || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-2 pt-2 border-t">
                      {ap.lat.toFixed(4)}, {ap.lng.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setOrigin(ap.icao)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setDest(ap.icao)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
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
                      <span className="font-bold text-sm text-blue-700">{nv.id}</span>
                      <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-600">{nv.type}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1">{nv.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span><b>Freq:</b> {nv.frequency}</span>
                      <span><b>Elev:</b> {nv.elevation || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-2 pt-2 border-t">
                      {nv.lat.toFixed(4)}, {nv.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setOrigin(nv.id)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setDest(nv.id)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
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
                    <span className="font-bold text-sm text-cyan-700">{wp.id}</span>
                    <p className="text-xs">{wp.name}</p>
                    {wp.description && <p className="text-[10px] text-muted-foreground mt-1">{wp.description}</p>}
                    <div className="text-[9px] font-mono text-muted-foreground mt-2 pt-2 border-t">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 mt-2"
                      onClick={() => addToRoute({ id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon })}
                    >
                      + Agregar a Ruta
                    </Button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Route polyline */}
          {route.length >= 2 && (
            <>
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: "#f59e0b", weight: 3, opacity: 0.85, dashArray: "8,4" }}
              />
              {/* Route point markers */}
              {route.map((p, i) => (
                <Marker
                  key={`route-${i}-${p.id}`}
                  position={[p.lat, p.lon]}
                  icon={createRoutePointIcon(p.id, i)}
                >
                  <Popup>
                    <div className="min-w-[150px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{i + 1}. {p.id}</span>
                        <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{p.name}</p>
                      {i < route.length - 1 && (
                        <div className="text-[10px] font-mono mt-1">
                          → {route[i + 1].id}: <b className="text-amber-600">{routeStats.legs[i]?.nm} NM</b> · {routeStats.legs[i]?.brg}°
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
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
                        background:#f59e0b;color:#1e3a5f;
                        font-size:9px;font-weight:700;font-family:monospace;
                        padding:1px 5px;border-radius:3px;
                        border:1px solid #1e3a5f;white-space:nowrap;
                        box-shadow:0 1px 3px rgba(0,0,0,0.3);
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
        <div className="absolute bottom-2 right-2 bg-navy/80 text-amber-400 text-[9px] font-mono px-2 py-1 rounded border border-amber-500/20 pointer-events-none">
          WGS84 · ICAO · CORPAC Perú
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-navy/85 text-white text-[10px] font-mono px-3 py-2 rounded border border-amber-500/20 space-y-1 max-w-[180px]">
          <div className="font-bold text-amber-500 mb-1">LEYENDA</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-navy-light border-2 border-amber-500 inline-block"></span> Aeródromo Intl</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-600 border-2 border-slate-400 inline-block"></span> Aeródromo Nacional</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-blue-500 inline-block"></span> Radioayuda (VOR/DME)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-cyan-500 inline-block transform rotate-45"></span> Waypoint</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block"></span> Aerovía Conv.</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-cyan-500 inline-block border-dashed"></span> Aerovía RNAV</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-amber-500 inline-block"></span> Ruta construida</div>
        </div>
      </div>

      {/* Route details table */}
      {route.length >= 2 && (
        <Card className="border-amber-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="size-4 text-amber-500" />
              <h3 className="text-sm font-bold">Detalle de Ruta</h3>
              <Badge variant="outline" className="ml-auto text-xs font-mono">
                {route.length} pts · {routeStats.totalNM} NM
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-navy text-amber-400">
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
                      <tr key={i} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                        <td className="p-1.5 text-amber-500 font-bold">{i + 1}</td>
                        <td className="p-1.5 font-bold">{p.id}</td>
                        <td className="p-1.5 text-muted-foreground text-[10px]">{p.type}</td>
                        <td className="p-1.5 text-[10px] text-muted-foreground">
                          {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                        </td>
                        <td className="p-1.5 text-right">{leg?.nm ?? "—"}</td>
                        <td className="p-1.5 text-right">{leg?.brg ?? "—"}</td>
                        <td className="p-1.5 text-right text-amber-500 font-bold">{acum}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-amber-500/10 font-bold">
                    <td colSpan={4} className="p-1.5 text-right">TOTAL</td>
                    <td className="p-1.5 text-right text-amber-500">{routeStats.totalNM} NM</td>
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
        { color: "#6b7280", weight: 0.5, opacity: 0.3, interactive: false }
      ).addTo(map)
      lines.push(line)
    }
    for (let lon = west; lon <= east; lon++) {
      const line = L.polyline(
        [[south, lon], [north, lon]],
        { color: "#6b7280", weight: 0.5, opacity: 0.3, interactive: false }
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
