"use client"

import { useEffect, useState, useCallback, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldOff, ShieldAlert, AlertTriangle, Layers, Circle, Target,
  Search, ChevronDown, ChevronUp, MapPin, Clock, Shield, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Circle as LCircle,
  Polygon,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"
import L from "leaflet"

// ─── Types ────────────────────────────────────────────────────────

interface AirspaceRestriction {
  id: string
  designator: string
  name: string
  type: string
  status: string
  centerLat: number
  centerLon: number
  lowerLimit: string
  upperLimit: string
  lowerLimitFt?: number | null
  upperLimitFt?: number | null
  polygon?: string | null
  radius?: number | null
  restrictions?: string | null
  operatingHours?: string | null
  authority?: string | null
  remarks?: string | null
  color?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────

function getTypeConfig(type: string) {
  switch (type) {
    case "PROHIBITED":
      return { icon: ShieldOff, bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-800 dark:text-red-300", border: "border-red-300 dark:border-red-700", label: "Prohibida", accent: "text-red-600 dark:text-red-400" }
    case "RESTRICTED":
      return { icon: ShieldAlert, bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-800 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", label: "Restringida", accent: "text-orange-600 dark:text-orange-400" }
    case "DANGER":
      return { icon: AlertTriangle, bg: "bg-yellow-100 dark:bg-yellow-950/50", text: "text-yellow-800 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700", label: "Peligro", accent: "text-yellow-600 dark:text-yellow-400" }
    case "TMA":
      return { icon: Layers, bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", label: "TMA", accent: "text-blue-600 dark:text-blue-400" }
    case "CTA":
      return { icon: Circle, bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", label: "CTA", accent: "text-blue-600 dark:text-blue-400" }
    case "CTR":
      return { icon: Target, bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", label: "CTR", accent: "text-blue-600 dark:text-blue-400" }
    default:
      return { icon: Shield, bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", border: "border-slate-300 dark:border-slate-600", label: type, accent: "text-muted-foreground" }
  }
}

// ─── Map Helpers ──────────────────────────────────────────────────

const PERU_CENTER: [number, number] = [-9.19, -75.0152]
const PERU_ZOOM = 5
const NM_TO_METERS = 1852

const TYPE_COLORS: Record<string, string> = {
  PROHIBITED: "#ef4444",
  RESTRICTED: "#f97316",
  DANGER: "#eab308",
  TMA: "#3b82f6",
  CTA: "#3b82f6",
  CTR: "#3b82f6",
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#64748b"
}

function isValidCoord(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    isFinite(lat) &&
    isFinite(lon)
  )
}

// Parse the polygon JSON string into an array of [lat, lon] pairs.
// Returns null if the field is missing or not a valid polygon array.
function parsePolygon(polygon: string | null | undefined): [number, number][] | null {
  if (!polygon) return null
  try {
    const parsed = JSON.parse(polygon)
    if (!Array.isArray(parsed)) return null
    const positions: [number, number][] = []
    for (const p of parsed) {
      if (
        p &&
        typeof p.lat === "number" &&
        typeof p.lon === "number" &&
        !isNaN(p.lat) &&
        !isNaN(p.lon)
      ) {
        positions.push([p.lat, p.lon])
      }
    }
    return positions.length >= 3 ? positions : null
  } catch {
    return null
  }
}

// Custom divIcon marker showing the zone designator label
function createZoneIcon(designator: string, color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid #ffffff;
          border-radius:50%;
          box-shadow:0 0 4px rgba(0,0,0,0.5);
        "></div>
        <span style="
          position:absolute;top:14px;
          font-size:9px;font-weight:700;
          color:${color};white-space:nowrap;
          text-shadow:1px 1px 1px #fff,-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff;
          letter-spacing:0.5px;
          pointer-events:none;
        ">${designator}</span>
      </div>
    `,
    iconSize: [14, 26],
    iconAnchor: [7, 7],
  })
}

// Popup content shared by both the overview map and the mini-maps.
function ZonePopupContent({
  restriction,
  color,
}: {
  restriction: AirspaceRestriction
  color: string
}) {
  return (
    <div className="text-xs space-y-1 min-w-[200px]">
      <div className="font-bold text-sm flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {restriction.designator}
      </div>
      <div className="text-muted-foreground">{restriction.name}</div>
      <div className="flex gap-2 pt-1">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {restriction.type}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {restriction.status}
        </Badge>
      </div>
      <div className="pt-1">
        <span className="text-muted-foreground">Altitud: </span>
        <span className="font-mono">
          {restriction.lowerLimit} – {restriction.upperLimit}
        </span>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {restriction.centerLat.toFixed(4)}°, {restriction.centerLon.toFixed(4)}°
        {restriction.radius ? ` · R: ${restriction.radius}NM` : ""}
      </div>
      {restriction.restrictions && (
        <div className="pt-1 border-t mt-1">
          <div className="text-muted-foreground text-[10px] uppercase">Restricciones</div>
          <div>{restriction.restrictions}</div>
        </div>
      )}
    </div>
  )
}

// Renders the appropriate Leaflet shape (Polygon, Circle, or Marker)
// for a single restriction. Used by both OverviewMap and ZoneMiniMap.
function ZoneShape({
  restriction,
  color,
}: {
  restriction: AirspaceRestriction
  color: string
}) {
  const positions = parsePolygon(restriction.polygon)
  const center: [number, number] = [restriction.centerLat, restriction.centerLon]
  const radiusMeters =
    restriction.radius && restriction.radius > 0
      ? restriction.radius * NM_TO_METERS
      : null

  if (positions) {
    return (
      <Polygon
        positions={positions}
        pathOptions={{
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.25,
        }}
      >
        <Popup>
          <ZonePopupContent restriction={restriction} color={color} />
        </Popup>
      </Polygon>
    )
  }

  if (radiusMeters) {
    return (
      <LCircle
        center={center}
        radius={radiusMeters}
        pathOptions={{
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.25,
        }}
      >
        <Popup>
          <ZonePopupContent restriction={restriction} color={color} />
        </Popup>
      </LCircle>
    )
  }

  return (
    <Marker
      position={center}
      icon={createZoneIcon(restriction.designator, color)}
    >
      <Popup>
        <ZonePopupContent restriction={restriction} color={color} />
      </Popup>
    </Marker>
  )
}

// Child component that auto-fits the map to the zone's bounds.
function FitBounds({
  positions,
  center,
  radius,
}: {
  positions?: [number, number][] | null
  center: [number, number]
  radius?: number | null
}) {
  const map = useMap()

  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 })
    } else if (radius && radius > 0) {
      const meters = radius * NM_TO_METERS
      const latOffset = meters / 111111
      const lonOffset =
        meters / (111111 * Math.cos((center[0] * Math.PI) / 180))
      const bounds = L.latLngBounds([
        [center[0] - latOffset, center[1] - lonOffset],
        [center[0] + latOffset, center[1] + lonOffset],
      ])
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 })
    } else {
      map.setView(center, 12)
    }
  }, [map, positions, center, radius])

  return null
}

// Hook that returns true only after the component has mounted on the client.
// Leaflet accesses `window`, so we must avoid rendering it during SSR.
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

// Main overview map showing ALL restrictions across Peru.
function OverviewMap({ restrictions }: { restrictions: AirspaceRestriction[] }) {
  const mounted = useMounted()
  const validRestrictions = restrictions.filter((r) =>
    isValidCoord(r.centerLat, r.centerLon)
  )

  if (!mounted) {
    return <Skeleton className="h-[300px] sm:h-[400px] rounded-2xl w-full" />
  }

  if (validRestrictions.length === 0) {
    return (
      <div className="h-[300px] sm:h-[400px] rounded-2xl border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
        Sin zonas para mostrar en el mapa
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border bg-muted/30 h-[300px] sm:h-[400px]">
      <MapContainer
        center={PERU_CENTER}
        zoom={PERU_ZOOM}
        className="h-full w-full z-0"
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validRestrictions.map((r) => (
          <ZoneShape
            key={`ov-${r.id}`}
            restriction={r}
            color={r.color || getTypeColor(r.type)}
          />
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2.5 space-y-1.5 max-w-[160px]">
        <div className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
          Leyenda
        </div>
        {[
          { color: "#ef4444", label: "Prohibida" },
          { color: "#f97316", label: "Restringida" },
          { color: "#eab308", label: "Peligro" },
          { color: "#3b82f6", label: "TMA / CTA / CTR" },
        ].map((item) => (
          <div key={item.color} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-white/60"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mini-map rendered inside each card showing the single zone.
function ZoneMiniMap({ restriction }: { restriction: AirspaceRestriction }) {
  const mounted = useMounted()

  if (!mounted) {
    return <Skeleton className="h-[150px] w-full rounded-lg" />
  }

  if (!isValidCoord(restriction.centerLat, restriction.centerLon)) {
    return (
      <div className="h-[150px] rounded-lg border bg-muted/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="size-5 mx-auto mb-1 opacity-40" />
          <p className="text-[10px]">Coordenadas no disponibles</p>
        </div>
      </div>
    )
  }

  const color = restriction.color || getTypeColor(restriction.type)
  const positions = parsePolygon(restriction.polygon)
  const center: [number, number] = [restriction.centerLat, restriction.centerLon]

  return (
    <div className="h-[150px] rounded-lg overflow-hidden border bg-muted/30">
      <MapContainer
        key={restriction.id}
        center={center}
        zoom={12}
        className="h-full w-full z-0"
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoneShape restriction={restriction} color={color} />
        <FitBounds
          positions={positions}
          center={center}
          radius={restriction.radius ?? null}
        />
      </MapContainer>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────

export function AirspaceRestrictions() {
  const [restrictions, setRestrictions] = useState<AirspaceRestriction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchRestrictions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter)
      const response = await fetch(`/api/airspace-restrictions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRestrictions(Array.isArray(data) ? data : data.restrictions || [])
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchRestrictions()
  }, [fetchRestrictions])

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group by type
  const grouped = restrictions.reduce<Record<string, AirspaceRestriction[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  const typeOrder = ["PROHIBITED", "RESTRICTED", "DANGER", "TMA", "CTA", "CTR"]
  const sortedTypes = Object.keys(grouped).sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b))

  // Stats
  const stats = typeOrder.map(t => ({
    type: t,
    count: restrictions.filter(r => r.type === t).length,
    config: getTypeConfig(t),
  }))

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative bg-navy rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-95" />
        <div className="absolute inset-0 opacity-5">
          <Shield className="absolute top-4 right-8 size-32 text-white rotate-12" />
        </div>
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-amber-500" />
            <Shield className="size-6 text-amber-500" />
            <div className="h-px w-12 bg-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-center">
            Restricciones de Espacio Aéreo
          </h1>
          <p className="text-slate-300 text-sm text-center mt-1 max-w-2xl mx-auto">
            Zonas prohibidas, restringidas, de peligro y espacios controlados
          </p>

          {/* Stats by type */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6">
            {stats.map(s => {
              const Icon = s.config.icon
              return (
                <TooltipProvider key={s.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`${s.config.bg} rounded-lg p-2.5 text-center backdrop-blur-sm cursor-default`}>
                        <Icon className={`size-4 mx-auto mb-1 ${s.config.accent}`} />
                        <div className={`text-lg font-bold ${s.config.text}`}>{s.count}</div>
                        <div className="text-[10px] text-muted-foreground">{s.config.label}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{s.count} zona{s.count !== 1 ? "s" : ""} {s.config.label.toLowerCase()}{s.count !== 1 ? "s" : ""}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>
      </div>

      {/* Overview Map — shows all restrictions across Peru */}
      {!loading && restrictions.length > 0 && <OverviewMap restrictions={restrictions} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por designador, nombre o autoridad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="Tipo de zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="PROHIBITED">Prohibida</SelectItem>
            <SelectItem value="RESTRICTED">Restringida</SelectItem>
            <SelectItem value="DANGER">Peligro</SelectItem>
            <SelectItem value="TMA">TMA</SelectItem>
            <SelectItem value="CTA">CTA</SelectItem>
            <SelectItem value="CTR">CTR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">
        {restrictions.length} zona{restrictions.length !== 1 ? "s" : ""}
      </div>

      {/* Grouped display */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, gi) => (
            <div key={gi} className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, ci) => (
                  <Card key={ci} className="py-4">
                    <CardContent className="space-y-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : restrictions.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron zonas</h3>
          <p className="text-muted-foreground mt-1">Intente con otros filtros de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence>
            {sortedTypes.map((type) => {
              const typeConf = getTypeConfig(type)
              const TypeIcon = typeConf.icon
              const items = grouped[type] || []

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Type Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${typeConf.bg} border ${typeConf.border}`}>
                      <TypeIcon className={`size-4 ${typeConf.accent}`} />
                      <span className={`font-semibold ${typeConf.text} text-sm tracking-wide`}>
                        {typeConf.label.toUpperCase()}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((restriction) => {
                      const isExpanded = expandedIds.has(restriction.id)
                      const isActive = restriction.status === "ACTIVO"

                      return (
                        <Card
                          key={restriction.id}
                          className={`transition-all duration-200 hover:shadow-md ${
                            isActive
                              ? "border-l-4 border-l-amber-500"
                              : "border-l-4 border-l-slate-300 dark:border-l-slate-600 opacity-60"
                          }`}
                        >
                          <Collapsible
                            open={isExpanded}
                            onOpenChange={() => toggleExpanded(restriction.id)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className={`size-4 ${typeConf.accent}`} />
                                  <span className="font-bold text-sm">{restriction.designator}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-[10px] ${isActive ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                                    {restriction.status}
                                  </Badge>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="text-sm text-muted-foreground">{restriction.name}</div>

                              {/* Altitude range */}
                              <div className="flex items-center gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Desde: </span>
                                  <span className="font-mono font-medium">{restriction.lowerLimit}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Hasta: </span>
                                  <span className="font-mono font-medium">{restriction.upperLimit}</span>
                                </div>
                              </div>

                              {/* Operating hours & Authority */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {restriction.operatingHours && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {restriction.operatingHours}
                                  </div>
                                )}
                                {restriction.authority && (
                                  <div className="flex items-center gap-1">
                                    <Shield className="size-3" />
                                    {restriction.authority}
                                  </div>
                                )}
                              </div>

                              {/* Expanded details */}
                              <CollapsibleContent>
                                <div className="mt-3 space-y-3 pt-3 border-t">
                                  {/* Restrictions text */}
                                  {restriction.restrictions && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Restricciones</h5>
                                      <p className="text-sm bg-muted/50 rounded-lg p-2.5">{restriction.restrictions}</p>
                                    </div>
                                  )}

                                  {/* Coordinates & Radius */}
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="size-3" />
                                      <span className="font-mono">
                                        {restriction.centerLat.toFixed(4)}°, {restriction.centerLon.toFixed(4)}°
                                      </span>
                                    </div>
                                    {restriction.radius && (
                                      <span className="text-muted-foreground">
                                        Radio: {restriction.radius} NM
                                      </span>
                                    )}
                                  </div>

                                  {/* Mini map showing this single zone */}
                                  <ZoneMiniMap restriction={restriction} />

                                  {/* Remarks */}
                                  {restriction.remarks && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Observaciones</h5>
                                      <p className="text-xs text-muted-foreground">{restriction.remarks}</p>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </CardContent>
                          </Collapsible>
                        </Card>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
