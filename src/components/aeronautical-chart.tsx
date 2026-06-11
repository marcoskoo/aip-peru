"use client"

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Layers, ChevronDown, MapIcon, Plane, Crosshair } from "lucide-react"
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

// ─── Constants ───────────────────────────────────────────────────
const MAP_CENTER: [number, number] = [-9.19, -79.34]
const MAP_ZOOM = 6
const GRID_STEP = 1

// ─── Adjacent FIR Colors ─────────────────────────────────────────
const ADJ_FIR_COLORS: Record<string, string> = {
  SEGU: "#f97316", // orange
  SKED: "#eab308", // yellow
  SBAM: "#22c55e", // green
  SLLP: "#a855f7", // purple
  SCEZ: "#ef4444", // red
}

// ─── Custom DivIcon: Waypoint (cyan diamond) ─────────────────────
function createWaypointIcon(name: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:10px;height:10px;
          background:#06b6d4;
          border:1.5px solid #0e7490;
          transform:rotate(45deg);
          margin-top:-5px;
          box-shadow:0 0 3px rgba(6,182,212,0.6);
        "></div>
        <span style="
          position:absolute;top:8px;
          font-size:9px;font-weight:600;
          color:#0e7490;white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:0.5px;
          pointer-events:none;
        ">${name}</span>
      </div>
    `,
    iconSize: [10, 24],
    iconAnchor: [5, 5],
  })
}

// ─── Custom DivIcon: Navaid (blue circle with frequency) ─────────
function createNavaidIcon(navaid: Navaid) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:12px;height:12px;
          background:transparent;
          border:2.5px solid #3b82f6;
          border-radius:50%;
          box-shadow:0 0 4px rgba(59,130,246,0.5);
        "></div>
        <div style="
          position:absolute;top:2px;left:14px;
          display:flex;flex-direction:column;align-items:flex-start;gap:0;
          pointer-events:none;
        ">
          <span style="
            font-size:9px;font-weight:700;
            color:#1d4ed8;white-space:nowrap;
            text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
            line-height:1;
          ">${navaid.id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:#3b82f6;white-space:nowrap;
            text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
            line-height:1;
          ">${navaid.frequency.replace(" MHz", "")}</span>
        </div>
      </div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

// ─── Custom DivIcon: FIR center label ────────────────────────────
function createFIRLabelIcon(text: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        font-size:14px;font-weight:800;
        color:#1d4ed8;white-space:nowrap;
        text-shadow:1px 1px 2px #fff,-1px -1px 2px #fff,1px -1px 2px #fff,-1px 1px 2px #fff;
        letter-spacing:2px;
        pointer-events:none;
        opacity:0.7;
      ">${text}</div>
    `,
    iconSize: [120, 20],
    iconAnchor: [60, 10],
  })
}

// ─── Custom DivIcon: Adjacent FIR label ──────────────────────────
function createAdjFIRLabelIcon(icao: string, name: string, color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:1px;
        pointer-events:none;opacity:0.8;
      ">
        <span style="
          font-size:10px;font-weight:700;
          color:${color};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:1px;
        ">${icao}</span>
        <span style="
          font-size:7.5px;font-weight:500;
          color:${color};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
        ">${name}</span>
      </div>
    `,
    iconSize: [100, 30],
    iconAnchor: [50, 15],
  })
}

// ─── Helper: Parse DMS coordinates to decimal ────────────────────
function parseDMS(dms: string): number | null {
  if (!dms) return null
  const match = dms.match(/(\d+)[°º]\s*(\d+)[′']\s*([\d.]+)[″"]\s*([NSWE])/i)
  if (!match) return null
  const deg = parseFloat(match[1])
  const min = parseFloat(match[2])
  const sec = parseFloat(match[3])
  const dir = match[4].toUpperCase()
  let decimal = deg + min / 60 + sec / 3600
  if (dir === "S" || dir === "W") decimal = -decimal
  return decimal
}

// ─── Custom DivIcon: Airport (navy square with code) ──────────────
function createAirportIcon(icaoCode: string, category?: string) {
  const isIntl = category === "INTERNACIONAL"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:14px;height:14px;
          background:${isIntl ? "#1e3a5f" : "#475569"};
          border:2px solid ${isIntl ? "#f59e0b" : "#94a3b8"};
          transform:rotate(0deg);
          box-shadow:0 0 3px rgba(0,0,0,0.3);
        "></div>
        <span style="
          position:absolute;top:12px;
          font-size:8px;font-weight:700;
          color:${isIntl ? "#1e3a5f" : "#475569"};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:0.5px;
          pointer-events:none;
        ">${icaoCode}</span>
      </div>
    `,
    iconSize: [14, 26],
    iconAnchor: [7, 7],
  })
}

// ─── Custom DivIcon: Heliport (red cross) ─────────────────────────
function createHeliportIcon(icaoCode: string, type?: string) {
  const colorMap: Record<string, string> = {
    HOSPITAL: "#ef4444",
    "OIL INDUSTRIAL": "#f59e0b",
    MILITARY: "#22c55e",
    COMMERCIAL: "#3b82f6",
  }
  const color = colorMap[type || ""] || "#ef4444"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:12px;height:12px;
          background:${color}22;
          border:2px solid ${color};
          border-radius:50%;
          box-shadow:0 0 3px ${color}66;
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:6px;height:2px;background:${color};border-radius:1px;"></div>
          <div style="width:2px;height:6px;background:${color};border-radius:1px;position:absolute;"></div>
        </div>
        <span style="
          position:absolute;top:12px;
          font-size:7px;font-weight:600;
          color:${color};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:0.3px;
          pointer-events:none;
        ">${icaoCode}</span>
      </div>
    `,
    iconSize: [12, 24],
    iconAnchor: [6, 6],
  })
}

// ─── Grid Component ──────────────────────────────────────────────
function GPSGrid({ visible }: { visible: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return

    const bounds = map.getBounds()
    const south = Math.floor(bounds.getSouth())
    const north = Math.ceil(bounds.getNorth())
    const west = Math.floor(bounds.getWest())
    const east = Math.ceil(bounds.getEast())

    const lines: L.Polyline[] = []
    const labels: L.Marker[] = []

    // Latitude lines
    for (let lat = south; lat <= north; lat += GRID_STEP) {
      const line = L.polyline(
        [
          [lat, west - 5],
          [lat, east + 5],
        ],
        {
          color: "#9ca3af",
          weight: 0.5,
          dashArray: "4,4",
          opacity: 0.5,
          interactive: false,
        }
      ).addTo(map)
      lines.push(line)

      // Label on the left edge
      const label = L.marker([lat, bounds.getWest() + 0.3], {
        icon: L.divIcon({
          className: "",
          html: `<span style="font-size:8px;color:#6b7280;background:rgba(255,255,255,0.7);padding:0 2px;border-radius:2px;">${lat}°</span>`,
          iconSize: [30, 12],
          iconAnchor: [0, 6],
        }),
        interactive: false,
      }).addTo(map)
      labels.push(label)
    }

    // Longitude lines
    for (let lon = west; lon <= east; lon += GRID_STEP) {
      const line = L.polyline(
        [
          [south - 5, lon],
          [north + 5, lon],
        ],
        {
          color: "#9ca3af",
          weight: 0.5,
          dashArray: "4,4",
          opacity: 0.5,
          interactive: false,
        }
      ).addTo(map)
      lines.push(line)

      // Label on the top edge
      const label = L.marker([bounds.getNorth() - 0.3, lon], {
        icon: L.divIcon({
          className: "",
          html: `<span style="font-size:8px;color:#6b7280;background:rgba(255,255,255,0.7);padding:0 2px;border-radius:2px;">${lon}°</span>`,
          iconSize: [30, 12],
          iconAnchor: [15, 12],
        }),
        interactive: false,
      }).addTo(map)
      labels.push(label)
    }

    return () => {
      lines.forEach((l) => map.removeLayer(l))
      labels.forEach((l) => map.removeLayer(l))
    }
  }, [map, visible])

  return null
}

// ─── Helper: Build lookup map for waypoints/navaids ──────────────
function buildCoordLookup(
  waypoints: Waypoint[],
  navaids: Navaid[]
): Map<string, Coord> {
  const map = new Map<string, Coord>()
  for (const wp of waypoints) {
    map.set(wp.id, { lat: wp.lat, lon: wp.lon })
  }
  for (const nv of navaids) {
    map.set(nv.id, { lat: nv.lat, lon: nv.lon })
  }
  return map
}

// ─── Helper: Get center of polygon ──────────────────────────────
function getPolygonCenter(points: Coord[]): [number, number] {
  const sumLat = points.reduce((s, p) => s + p.lat, 0)
  const sumLon = points.reduce((s, p) => s + p.lon, 0)
  return [sumLat / points.length, sumLon / points.length]
}

// ─── Helper: Convert Coord[] to [lat,lon][] for Leaflet ─────────
function coordsToLatLng(coords: Coord[]): [number, number][] {
  return coords.map((c) => [c.lat, c.lon])
}

// ─── Helper: Resolve airway segment to polyline coordinates ──────
function resolveAirwaySegments(
  airway: Airway,
  coordLookup: Map<string, Coord>
): { positions: [number, number][]; resolvedSegments: (AirwaySegment & { fromCoord: Coord; toCoord: Coord })[] } {
  const positions: [number, number][] = []
  const resolvedSegments: (AirwaySegment & { fromCoord: Coord; toCoord: Coord })[] = []

  for (let i = 0; i < airway.segments.length; i++) {
    const seg = airway.segments[i]
    const fromCoord = coordLookup.get(seg.from)
    const toCoord = coordLookup.get(seg.to)

    if (!fromCoord || !toCoord) continue

    resolvedSegments.push({ ...seg, fromCoord, toCoord })

    if (i === 0 || positions.length === 0) {
      positions.push([fromCoord.lat, fromCoord.lon])
    }
    positions.push([toCoord.lat, toCoord.lon])
  }

  return { positions, resolvedSegments }
}

// ─── Layer state type ────────────────────────────────────────────
interface LayerState {
  conventional: boolean
  rnav: boolean
  waypoints: boolean
  navaids: boolean
  firBoundary: boolean
  adjacentFirs: boolean
  grid: boolean
  aerodromos: boolean
  helipuertos: boolean
}

// ─── Layer definitions ───────────────────────────────────────────
interface LayerDef {
  key: keyof LayerState
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

const LAYER_DEFS: LayerDef[] = [
  { key: "aerodromos", label: "Aeródromos", icon: Plane },
  { key: "helipuertos", label: "Helipuertos", icon: Crosshair },
  { key: "conventional", label: "Aerovías Convencionales" },
  { key: "rnav", label: "Aerovías RNAV" },
  { key: "waypoints", label: "Waypoints" },
  { key: "navaids", label: "Radioayudas" },
  { key: "firBoundary", label: "Límite FIR Lima" },
  { key: "adjacentFirs", label: "FIRs Adyacentes" },
  { key: "grid", label: "Grilla GPS" },
]

// ─── Airway Detail Popup Content ─────────────────────────────────
function AirwayDetail({ airway, resolvedSegments }: {
  airway: Airway
  resolvedSegments: (AirwaySegment & { fromCoord: Coord; toCoord: Coord })[]
}) {
  return (
    <div className="text-xs space-y-1.5 min-w-[180px]">
      <div className="font-bold text-sm">{airway.designator}</div>
      <div className="flex gap-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {airway.type === "CONVENTIONAL" ? "Convencional" : "RNAV"}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {airway.level === "LOWER" ? "Inferior" : airway.level === "UPPER" ? "Superior" : "Ambos"}
        </Badge>
      </div>
      <Separator />
      <div className="space-y-1">
        {resolvedSegments.map((seg, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="font-mono">{seg.from} → {seg.to}</span>
            <span className="text-muted-foreground">{seg.distance} NM</span>
          </div>
        ))}
      </div>
      {resolvedSegments.length > 0 && (
        <>
          <Separator />
          <div className="flex justify-between text-muted-foreground">
            <span>FL: {resolvedSegments[0].minFL ?? "—"} - {resolvedSegments[0].maxFL ?? "—"}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Legend entries data ─────────────────────────────────────────
const LEGEND_ITEMS = [
  { color: "#22c55e", style: "line", label: "Aerovía Convencional" },
  { color: "#d946ef", style: "line", label: "Aerovía RNAV" },
  { color: "#3b82f6", style: "dashed", label: "FIR Lima" },
  { color: "#06b6d4", style: "diamond", label: "Waypoint" },
  { color: "#3b82f6", style: "circle", label: "Radioayuda" },
  { color: "#1e3a5f", style: "square", label: "Aeródromo" },
  { color: "#ef4444", style: "heliport", label: "Helipuerto" },
]

// ─── Main Component ──────────────────────────────────────────────
export function AeronauticalChart() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [data, setData] = useState<AirwaysData | null>(null)
  const [airports, setAirports] = useState<Array<{icaoCode: string; name: string; city: string; category?: string; arpLatitude?: string; arpLongitude?: string}>>([])
  const [heliports, setHeliports] = useState<Array<{id: string; icaoCode: string; name: string; city: string; type?: string; lat?: number; lon?: number; elevation?: string; status?: string}>>([])
  const [loading, setLoading] = useState(true)
  const [layers, setLayers] = useState<LayerState>({
    conventional: true,
    rnav: true,
    waypoints: true,
    navaids: true,
    firBoundary: true,
    adjacentFirs: true,
    grid: true,
    aerodromos: true,
    helipuertos: false,
  })
  const [layerPanelOpen, setLayerPanelOpen] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/airdata/all").then((res) => res.json()),
      fetch("/api/airports").then((res) => res.json()),
      fetch("/api/heliports").then((res) => res.json()),
    ])
      .then(([airwaysJson, airportsJson, heliportsJson]) => {
        setData(airwaysJson as AirwaysData)
        setAirports(airportsJson)
        setHeliports(heliportsJson)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load chart data:", err)
        setLoading(false)
      })
  }, [])

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const coordLookup = useMemo(() => {
    if (!data) return new Map<string, Coord>()
    return buildCoordLookup(data.waypoints, data.navaids)
  }, [data])

  // Resolve conventional airways
  const conventionalResolved = useMemo(() => {
    if (!data) return []
    return data.airways.conventional.map((aw) => ({
      airway: aw,
      ...resolveAirwaySegments(aw, coordLookup),
    }))
  }, [data, coordLookup])

  // Resolve RNAV airways
  const rnavResolved = useMemo(() => {
    if (!data) return []
    return data.airways.rnav.map((aw) => ({
      airway: aw,
      ...resolveAirwaySegments(aw, coordLookup),
    }))
  }, [data, coordLookup])

  const mapHeight = "h-[calc(100vh-200px)]"

  if (!mounted) {
    return <Skeleton className={`${mapHeight} w-full`} />
  }

  if (loading) {
    return (
      <div className={`relative ${mapHeight} w-full rounded-lg overflow-hidden border`}>
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando carta aeronáutica...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`${mapHeight} w-full rounded-lg overflow-hidden border flex items-center justify-center text-muted-foreground`}>
        Error al cargar datos de aerovías
      </div>
    )
  }

  const firBoundary = data.firBoundaries.SPIM

  return (
    <div className={`relative ${mapHeight} w-full rounded-lg overflow-hidden border`}>
      {/* Layer Toggle Panel */}
      <div className="absolute top-3 right-3 z-[1000]">
        {/* Collapsed toggle button */}
        {!layerPanelOpen && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border hover:bg-accent transition-all duration-200"
            onClick={() => setLayerPanelOpen(true)}
            title="Mostrar capas"
          >
            <Layers className="size-4" />
          </Button>
        )}

        {/* Expanded panel */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            layerPanelOpen ? "max-w-56 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {layerPanelOpen && (
            <Card className="w-56 shadow-lg bg-background/95 backdrop-blur-sm border-border">
              <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-semibold text-foreground">
                  Capas
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setLayerPanelOpen(false)}
                  title="Ocultar capas"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 space-y-1.5">
                {LAYER_DEFS.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`layer-${key}`}
                      checked={layers[key]}
                      onCheckedChange={() => toggleLayer(key)}
                      className="size-3.5"
                    />
                    <Label
                      htmlFor={`layer-${key}`}
                      className="text-[11px] cursor-pointer leading-tight flex items-center gap-1"
                    >
                      {Icon && <Icon className="size-3" />}
                      {label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Legend Panel */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        {/* Collapsed toggle button */}
        {!legendOpen && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-background/95 backdrop-blur-sm shadow-lg border-border hover:bg-accent transition-all duration-200 gap-1.5 px-2.5"
            onClick={() => setLegendOpen(true)}
            title="Mostrar leyenda"
          >
            <MapIcon className="size-3.5" />
            <span className="text-[11px] font-semibold">Leyenda</span>
          </Button>
        )}

        {/* Expanded legend */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            legendOpen ? "max-w-64 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {legendOpen && (
            <Card className="w-64 shadow-lg bg-background/95 backdrop-blur-sm border-border">
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-xs font-semibold text-foreground">Leyenda</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setLegendOpen(false)}
                  title="Ocultar leyenda"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>
              <div className="px-3 pb-3 space-y-1.5">
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.style === "line" && (
                      <div
                        className="w-6 h-[3px] rounded-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.style === "dashed" && (
                      <div
                        className="w-6 h-[2px] shrink-0 border-t-2 border-dashed"
                        style={{ borderColor: item.color }}
                      />
                    )}
                    {item.style === "diamond" && (
                      <div
                        className="w-2.5 h-2.5 shrink-0 rotate-45"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.style === "circle" && (
                      <div
                        className="w-2.5 h-2.5 shrink-0 rounded-full border-2"
                        style={{ borderColor: item.color }}
                      />
                    )}
                    {item.style === "square" && (
                      <div
                        className="w-2.5 h-2.5 shrink-0 border-2"
                        style={{ backgroundColor: item.color, borderColor: "#f59e0b" }}
                      />
                    )}
                    {item.style === "heliport" && (
                      <div
                        className="w-2.5 h-2.5 shrink-0 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: item.color }}
                      >
                        <div className="w-1.5 h-0.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      </div>
                    )}
                    <span className="text-[11px] text-foreground leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="h-full w-full z-0"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GPSGrid visible={layers.grid} />

        {/* ─── FIR Boundary (SPIM Lima) ─── */}
        {layers.firBoundary && firBoundary && (
          <>
            <Polygon
              positions={coordsToLatLng(firBoundary.polygon)}
              pathOptions={{
                color: "#3b82f6",
                weight: 2.5,
                fillColor: "#3b82f6",
                fillOpacity: 0.05,
                dashArray: "8,4",
              }}
            >
              <Tooltip sticky>SPIM – {firBoundary.name}</Tooltip>
            </Polygon>
            <Marker
              position={[firBoundary.center.lat, firBoundary.center.lon]}
              icon={createFIRLabelIcon("LIMA FIR")}
              interactive={false}
            />
          </>
        )}

        {/* ─── Adjacent FIRs ─── */}
        {layers.adjacentFirs &&
          data.adjacentFirs.map((fir: AdjacentFIR) => {
            if (!fir.borderPoints || fir.borderPoints.length < 2) return null
            const color = ADJ_FIR_COLORS[fir.icao] || "#94a3b8"
            const center = getPolygonCenter(fir.borderPoints)
            return (
              <div key={fir.icao}>
                <Polygon
                  positions={coordsToLatLng(fir.borderPoints)}
                  pathOptions={{
                    color,
                    weight: 1.5,
                    fillColor: color,
                    fillOpacity: 0.04,
                    dashArray: "6,4",
                  }}
                >
                  <Tooltip sticky>
                    {fir.icao} – {fir.name} ({fir.country})
                  </Tooltip>
                </Polygon>
                <Marker
                  position={center}
                  icon={createAdjFIRLabelIcon(fir.icao, fir.name, color)}
                  interactive={false}
                />
              </div>
            )
          })}

        {/* ─── Conventional Airways ─── */}
        {layers.conventional &&
          conventionalResolved.map(({ airway, positions, resolvedSegments }) => {
            if (positions.length < 2) return null
            return (
              <Polyline
                key={`conv-${airway.designator}`}
                positions={positions}
                pathOptions={{
                  color: "#22c55e",
                  weight: 2,
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>
                  <AirwayDetail airway={airway} resolvedSegments={resolvedSegments} />
                </Tooltip>
              </Polyline>
            )
          })}

        {/* ─── RNAV Airways ─── */}
        {layers.rnav &&
          rnavResolved.map(({ airway, positions, resolvedSegments }) => {
            if (positions.length < 2) return null
            return (
              <Polyline
                key={`rnav-${airway.designator}`}
                positions={positions}
                pathOptions={{
                  color: "#d946ef",
                  weight: 2,
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>
                  <AirwayDetail airway={airway} resolvedSegments={resolvedSegments} />
                </Tooltip>
              </Polyline>
            )
          })}

        {/* ─── Waypoints ─── */}
        {layers.waypoints &&
          data.waypoints
            .filter((wp) => wp.type === "WAYPOINT")
            .map((wp) => (
              <Marker
                key={`wp-${wp.id}-${wp.lat}-${wp.lon}`}
                position={[wp.lat, wp.lon]}
                icon={createWaypointIcon(wp.name)}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold">{wp.name}</div>
                    <div>Lat: {wp.lat.toFixed(4)}° Lon: {wp.lon.toFixed(4)}°</div>
                    {wp.description && (
                      <div className="text-muted-foreground">{wp.description}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* ─── Navaids ─── */}
        {layers.navaids &&
          data.navaids.map((nv) => (
            <Marker
              key={`nv-${nv.id}`}
              position={[nv.lat, nv.lon]}
              icon={createNavaidIcon(nv)}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold">{nv.id} – {nv.name}</div>
                  <div>Tipo: {nv.type}</div>
                  <div>Frecuencia: {nv.frequency}</div>
                  <div>Lat: {nv.lat.toFixed(4)}° Lon: {nv.lon.toFixed(4)}°</div>
                  {nv.elevation !== undefined && (
                    <div>Elevación: {nv.elevation} ft</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ─── Aeródromos ─── */}
        {layers.aerodromos &&
          airports
            .filter((a) => a.arpLatitude && a.arpLongitude)
            .map((airport) => {
              const lat = parseDMS(airport.arpLatitude || "")
              const lon = parseDMS(airport.arpLongitude || "")
              if (lat === null || lon === null) return null
              return (
                <Marker
                  key={`apt-${airport.icaoCode}`}
                  position={[lat, lon]}
                  icon={createAirportIcon(airport.icaoCode, airport.category)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold">{airport.icaoCode} – {airport.name}</div>
                      <div>{airport.city}</div>
                      {airport.category && <div>Categoría: {airport.category}</div>}
                    </div>
                  </Popup>
                </Marker>
              )
            })}

        {/* ─── Helipuertos ─── */}
        {layers.helipuertos &&
          heliports
            .filter((h) => h.lat != null && h.lon != null)
            .map((heliport) => (
              <Marker
                key={`hpt-${heliport.icaoCode}`}
                position={[heliport.lat!, heliport.lon!]}
                icon={createHeliportIcon(heliport.icaoCode, heliport.type)}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold">{heliport.icaoCode} – {heliport.name}</div>
                    <div>{heliport.city}</div>
                    {heliport.type && <div>Tipo: {heliport.type}</div>}
                    {heliport.elevation && <div>Elevación: {heliport.elevation}</div>}
                    {heliport.status && <div>Estado: {heliport.status}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  )
}
