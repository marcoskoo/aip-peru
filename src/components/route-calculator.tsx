"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import {
  Search,
  X,
  Navigation,
  Plane,
  Trash2,
  MapPin,
  Radio,
  ChevronRight,
  Clock,
  Ruler,
  Mountain,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { RoutePoint, RouteSummary, AirwaysData, Waypoint, Airway } from "@/lib/types"

// ─── Dynamic Map Import (SSR disabled) ──────────────────────────────

const RouteCalculatorMap = dynamic(
  () => import("./route-calculator-map").then((mod) => mod.RouteCalculatorMap),
  { ssr: false }
)

// ─── Haversine & Bearing ────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065 // Earth radius in NM
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// ─── Airway Lookup Types ────────────────────────────────────────────

interface AirwayConnection {
  designator: string
  type: "CONVENTIONAL" | "RNAV"
  distance: number
  minFL?: number
  maxFL?: number
  intermediatePoints: Waypoint[]
}

// ─── Component ──────────────────────────────────────────────────────

export function RouteCalculator({
  onGenerateFlightPlan,
}: {
  onGenerateFlightPlan?: (route: RoutePoint[], summary: RouteSummary) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<AirwaysData | null>(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [speed, setSpeed] = useState(450)
  const searchRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Load airways data (with static fallback when API fails)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/airdata/all")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        // Validate shape — API may return { error } on failure
        if (!json || typeof json !== "object" || !Array.isArray(json.waypoints)) {
          throw new Error("Invalid airdata response shape")
        }
        // Normalize: ensure all expected arrays exist (defensive)
        const normalized: AirwaysData = {
          firBoundaries: json.firBoundaries ?? {},
          adjacentFirs: Array.isArray(json.adjacentFirs) ? json.adjacentFirs : [],
          navaids: Array.isArray(json.navaids) ? json.navaids : [],
          waypoints: Array.isArray(json.waypoints) ? json.waypoints : [],
          airways: {
            conventional:
              json.airways?.conventional && Array.isArray(json.airways.conventional)
                ? json.airways.conventional
                : [],
            rnav:
              json.airways?.rnav && Array.isArray(json.airways.rnav)
                ? json.airways.rnav
                : [],
          },
        }
        setData(normalized)
      } catch (err) {
        if (cancelled) return
        console.error("Failed to load airways data from API, using static fallback:", err)
        // Static fallback — same data the interactive map uses
        const { PERUVIAN_WAYPOINTS, PERUVIAN_AIRWAYS } = await import(
          "@/lib/aviation/peru-airways-static"
        )
        const { PERUVIAN_NAVAIDS } = await import("@/lib/aviation/peru-navaids-static")
        if (cancelled) return
        setData({
          firBoundaries: {},
          adjacentFirs: [],
          navaids: PERUVIAN_NAVAIDS.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            frequency: n.frequency,
            lat: n.lat,
            lon: n.lon,
            elevation: n.elevation,
          })),
          waypoints: PERUVIAN_WAYPOINTS,
          airways: {
            conventional: PERUVIAN_AIRWAYS.conventional,
            rnav: PERUVIAN_AIRWAYS.rnav,
          },
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Build waypoint lookup ──────────────────────────────────────

  const waypointMap = useMemo(() => {
    const map = new Map<string, Waypoint>()
    if (!data) return map
    for (const wp of data.waypoints ?? []) {
      map.set(wp.id, wp)
    }
    for (const nv of data.navaids ?? []) {
      if (!map.has(nv.id)) {
        map.set(nv.id, {
          id: nv.id,
          name: nv.name,
          type: "NAVAID",
          lat: nv.lat,
          lon: nv.lon,
          description: nv.type + " " + nv.frequency,
        })
      }
    }
    return map
  }, [data])

  // ─── Build airway connection lookup ─────────────────────────────

  const airwayLookup = useMemo(() => {
    const lookup = new Map<string, AirwayConnection[]>()
    if (!data) return lookup

    const allAirways: Airway[] = [
      ...(data.airways?.conventional ?? []),
      ...(data.airways?.rnav ?? []),
    ]

    for (const airway of allAirways) {
      const segs = airway.segments
      for (let i = 0; i < segs.length; i++) {
        // Include single-segment connections (j = i) and multi-segment connections (j > i)
        for (let j = i; j < segs.length; j++) {
          const fromId = segs[i].from
          const toId = segs[j].to

          // Collect intermediate waypoints and accumulate distance
          const intermediates: Waypoint[] = []
          let totalDist = 0
          let minFL: number | undefined
          let maxFL: number | undefined

          for (let k = i; k <= j; k++) {
            const seg = segs[k]
            totalDist += seg.distance
            if (seg.minFL !== undefined) {
              minFL = minFL === undefined ? seg.minFL : Math.min(minFL, seg.minFL)
            }
            if (seg.maxFL !== undefined) {
              maxFL = maxFL === undefined ? seg.maxFL : Math.max(maxFL, seg.maxFL)
            }
            // Intermediate points between from and to
            if (k > i && k <= j) {
              const wp = waypointMap.get(seg.from)
              if (wp) intermediates.push(wp)
            }
          }

          const key = `${fromId}->${toId}`
          const reverseKey = `${toId}->${fromId}`

          const connection: AirwayConnection = {
            designator: airway.designator,
            type: airway.type,
            distance: totalDist,
            minFL,
            maxFL,
            intermediatePoints: intermediates,
          }

          // Forward
          if (!lookup.has(key)) lookup.set(key, [])
          lookup.get(key)!.push(connection)

          // Reverse (reversed intermediates)
          const reverseConnection: AirwayConnection = {
            designator: airway.designator,
            type: airway.type,
            distance: totalDist,
            minFL,
            maxFL,
            intermediatePoints: [...intermediates].reverse(),
          }
          if (!lookup.has(reverseKey)) lookup.set(reverseKey, [])
          lookup.get(reverseKey)!.push(reverseConnection)
        }
      }
    }

    return lookup
  }, [data, waypointMap])

  // ─── Recalculate route distances/airways ────────────────────────

  const recalculateRoute = useCallback(
    (points: RoutePoint[]): RoutePoint[] => {
      let cumulative = 0
      return points.map((point, idx) => {
        if (idx === 0) {
          return {
            ...point,
            distanceFromPrev: 0,
            bearingFromPrev: 0,
            cumulativeDistance: 0,
            airwayUsed: undefined,
          }
        }
        const prev = points[idx - 1]
        const dist = haversineDistance(prev.lat, prev.lon, point.lat, point.lon)
        const brng = bearing(prev.lat, prev.lon, point.lat, point.lon)
        cumulative += dist

        // Check airway connection
        const key = `${prev.id}->${point.id}`
        const connections = airwayLookup.get(key)
        let airwayUsed: string | undefined
        if (connections && connections.length > 0) {
          airwayUsed = connections[0].designator
        }

        return {
          ...point,
          distanceFromPrev: Math.round(dist * 10) / 10,
          bearingFromPrev: Math.round(brng * 10) / 10,
          cumulativeDistance: Math.round(cumulative * 10) / 10,
          airwayUsed,
        }
      })
    },
    [airwayLookup]
  )

  // ─── Search filtering ───────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!data || !searchTerm.trim()) return []
    const term = searchTerm.trim().toUpperCase()
    const allPoints = (data.waypoints ?? []).map((wp) => ({
      id: wp.id,
      name: wp.name,
      type: wp.type as "WAYPOINT" | "NAVAID" | "AIRPORT",
      lat: wp.lat,
      lon: wp.lon,
    }))
    // Deduplicate by id
    const seen = new Set<string>()
    const unique = allPoints.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    return unique.filter((p) => p.name.includes(term) || p.id.includes(term)).slice(0, 15)
  }, [data, searchTerm])

  // ─── Add point to route ─────────────────────────────────────────

  const addPoint = useCallback(
    (pointId: string) => {
      const wp = waypointMap.get(pointId)
      if (!wp) return

      const newPoint: RoutePoint = {
        id: wp.id,
        name: wp.name || wp.id,
        lat: wp.lat,
        lon: wp.lon,
        type: wp.type as "WAYPOINT" | "NAVAID" | "AIRPORT",
      }

      setRoute((prev) => {
        const updated = [...prev]

        // Check if last point and new point are connected via an airway
        if (updated.length > 0) {
          const lastPoint = updated[updated.length - 1]
          const key = `${lastPoint.id}->${newPoint.id}`
          const connections = airwayLookup.get(key)

          if (connections && connections.length > 0) {
            // Use the shortest airway connection
            const best = connections.reduce((a, b) => (a.distance < b.distance ? a : b))

            // Add intermediate points from the airway
            for (const intWp of best.intermediatePoints) {
              // Skip if already in route
              if (updated.some((p) => p.id === intWp.id)) continue
              const intPoint: RoutePoint = {
                id: intWp.id,
                name: intWp.name || intWp.id,
                lat: intWp.lat,
                lon: intWp.lon,
                type: intWp.type as "WAYPOINT" | "NAVAID" | "AIRPORT",
              }
              updated.push(intPoint)
            }
          }
        }

        // Add the new point
        updated.push(newPoint)

        // Recalculate all distances, bearings, and airways
        return recalculateRoute(updated)
      })

      setSearchTerm("")
      setShowDropdown(false)
    },
    [waypointMap, airwayLookup, recalculateRoute]
  )

  // ─── Remove point ───────────────────────────────────────────────

  const removePoint = useCallback(
    (index: number) => {
      setRoute((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        return recalculateRoute(updated)
      })
    },
    [recalculateRoute]
  )

  // ─── Clear route ────────────────────────────────────────────────

  const clearRoute = useCallback(() => {
    setRoute([])
  }, [])

  // ─── Route summary ──────────────────────────────────────────────

  const summary = useMemo((): RouteSummary => {
    const totalDistance = route.length > 0 ? route[route.length - 1].cumulativeDistance ?? 0 : 0
    const totalSegments = Math.max(0, route.length - 1)
    const waypoints = route.filter((p) => p.type === "WAYPOINT" || p.type === "AIRPORT").length
    const navaids = route.filter((p) => p.type === "NAVAID").length
    const estimatedTime = speed > 0 ? (totalDistance / speed) * 60 : 0

    // Flight levels from airway data
    let minFL = Infinity
    let maxFL = -Infinity
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1]
      const curr = route[i]
      const key = `${prev.id}->${curr.id}`
      const connections = airwayLookup.get(key)
      if (connections && connections.length > 0) {
        for (const conn of connections) {
          if (conn.minFL !== undefined) minFL = Math.min(minFL, conn.minFL)
          if (conn.maxFL !== undefined) maxFL = Math.max(maxFL, conn.maxFL)
        }
      }
    }

    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalSegments,
      waypoints,
      navaids,
      estimatedTime: Math.round(estimatedTime),
      flightLevels: {
        min: minFL === Infinity ? 0 : minFL,
        max: maxFL === -Infinity ? 0 : maxFL,
      },
      trajectory: route,
    }
  }, [route, speed, airwayLookup])

  // ─── Format time ────────────────────────────────────────────────

  const formatTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  // ─── Handle generate flight plan ────────────────────────────────

  const handleGenerateFlightPlan = useCallback(() => {
    if (onGenerateFlightPlan) {
      onGenerateFlightPlan(route, summary)
    }
  }, [onGenerateFlightPlan, route, summary])

  // ─── Map data ───────────────────────────────────────────────────

  const mapCenter = useMemo((): [number, number] => {
    if (route.length === 0) return [-9.19, -79.34] // Lima FIR center
    const latSum = route.reduce((s, p) => s + p.lat, 0) / route.length
    const lonSum = route.reduce((s, p) => s + p.lon, 0) / route.length
    return [latSum, lonSum]
  }, [route])

  const mapZoom = useMemo(() => {
    if (route.length <= 1) return 6
    return 7
  }, [route])

  const contextAirwayLines = useMemo(() => {
    if (!data) return { conventional: [], rnav: [] }

    const convLines: [number, number][][] = []
    const rnavLines: [number, number][][] = []

    for (const airway of data.airways?.conventional ?? []) {
      for (const seg of airway.segments) {
        const from = waypointMap.get(seg.from)
        const to = waypointMap.get(seg.to)
        if (from && to) {
          convLines.push([
            [from.lat, from.lon],
            [to.lat, to.lon],
          ])
        }
      }
    }

    for (const airway of data.airways?.rnav ?? []) {
      for (const seg of airway.segments) {
        const from = waypointMap.get(seg.from)
        const to = waypointMap.get(seg.to)
        if (from && to) {
          rnavLines.push([
            [from.lat, from.lon],
            [to.lat, to.lon],
          ])
        }
      }
    }

    return { conventional: convLines, rnav: rnavLines }
  }, [data, waypointMap])

  const airwayLabels = useMemo(() => {
    const labels: { lat: number; lon: number; name: string }[] = []
    const seen = new Set<string>()

    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1]
      const curr = route[i]
      const key = `${prev.id}->${curr.id}`
      const connections = airwayLookup.get(key)
      if (connections && connections.length > 0) {
        const designator = connections[0].designator
        const labelKey = `${designator}-${prev.id}-${curr.id}`
        if (!seen.has(labelKey)) {
          seen.add(labelKey)
          labels.push({
            lat: (prev.lat + curr.lat) / 2,
            lon: (prev.lon + curr.lon) / 2,
            name: designator,
          })
        }
      }
    }

    return labels
  }, [route, airwayLookup])

  const routePositions = useMemo((): [number, number][] => route.map((p) => [p.lat, p.lon]), [route])

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex gap-4 p-4">
        <div className="w-1/3 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="w-2/3">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* ─── Left Panel ──────────────────────────────────────────── */}
      <div className="w-full lg:w-1/3 flex flex-col gap-3 min-w-0">
        {/* Search / Add Waypoint */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="size-4 text-amber-500" />
              Agregar Punto de Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar waypoint o navaid..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-9 pr-8 h-9 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setShowDropdown(false)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-thin">
                  {searchResults.map((point) => (
                    <button
                      key={point.id}
                      onClick={() => addPoint(point.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                    >
                      {point.type === "NAVAID" ? (
                        <Radio className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <MapPin className="size-3.5 text-amber-500 shrink-0" />
                      )}
                      <span className="font-mono font-semibold">{point.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {point.lat.toFixed(2)}°, {point.lon.toFixed(2)}°
                      </span>
                      <Badge
                        variant="outline"
                        className={`ml-auto text-[10px] px-1.5 py-0 shrink-0 ${
                          point.type === "NAVAID"
                            ? "border-emerald-500/50 text-emerald-600"
                            : "border-amber-500/50 text-amber-600"
                        }`}
                      >
                        {point.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Points List */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Navigation className="size-4 text-amber-500" />
              Puntos de Ruta
              {route.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {route.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {route.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Plane className="size-8 mb-2 opacity-30" />
                <p className="text-sm text-center">
                  Busca y agrega waypoints
                  <br />
                  para construir tu ruta
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-80 lg:max-h-96">
                <div className="space-y-0.5">
                  {route.map((point, idx) => (
                    <div
                      key={`${point.id}-${idx}`}
                      className="group flex items-start gap-2 p-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      {/* Index & Connector */}
                      <div className="flex flex-col items-center shrink-0 mt-0.5">
                        <div className="size-5 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        {idx < route.length - 1 && <div className="w-px h-3 bg-border mt-0.5" />}
                      </div>

                      {/* Point Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-sm truncate">{point.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 shrink-0 ${
                              point.type === "NAVAID"
                                ? "border-emerald-500/50 text-emerald-600"
                                : "border-amber-500/50 text-amber-600"
                            }`}
                          >
                            {point.type === "NAVAID" ? "NAV" : "WPT"}
                          </Badge>
                        </div>

                        {idx > 0 && (
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {point.airwayUsed && (
                              <span className="font-mono text-emerald-600 font-medium">{point.airwayUsed}</span>
                            )}
                            {point.distanceFromPrev !== undefined && <span>{point.distanceFromPrev} NM</span>}
                            {point.bearingFromPrev !== undefined && (
                              <span className="flex items-center gap-0.5">
                                <ChevronRight className="size-2.5" />
                                {point.bearingFromPrev}°
                              </span>
                            )}
                          </div>
                        )}

                        {point.cumulativeDistance !== undefined && idx > 0 && (
                          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                            Acum: {point.cumulativeDistance} NM
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removePoint(idx)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Route Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Ruler className="size-4 text-amber-500" />
              Resumen de Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            <div className="grid grid-cols-2 gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <Ruler className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs">Distancia:</span>
                <span className="font-semibold text-xs">{summary.totalDistance} NM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs">Segmentos:</span>
                <span className="font-semibold text-xs">{summary.totalSegments}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-amber-500 shrink-0" />
                <span className="text-muted-foreground text-xs">Waypoints:</span>
                <span className="font-semibold text-xs">{summary.waypoints}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className="size-3.5 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground text-xs">Navaids:</span>
                <span className="font-semibold text-xs">{summary.navaids}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Tiempo Est.:</span>
              <span className="font-semibold text-xs font-mono">{formatTime(summary.estimatedTime)}</span>
              <span className="text-[10px] text-muted-foreground">a</span>
              <Input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value) || 450)}
                className="w-14 h-6 text-xs text-center px-1"
                min={100}
                max={999}
              />
              <span className="text-[10px] text-muted-foreground">kts</span>
            </div>

            {summary.flightLevels.min > 0 && summary.flightLevels.max > 0 && (
              <div className="flex items-center gap-1.5">
                <Mountain className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Niveles:</span>
                <span className="font-semibold text-xs">
                  FL{summary.flightLevels.min} – FL{summary.flightLevels.max}
                </span>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearRoute}
                disabled={route.length === 0}
                className="flex-1 text-xs h-8"
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Limpiar Ruta
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateFlightPlan}
                disabled={route.length < 2}
                className="flex-1 text-xs h-8 bg-amber-600 hover:bg-amber-700"
              >
                <Plane className="size-3.5 mr-1.5" />
                Generar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Right Panel - Mini Map ──────────────────────────────── */}
      <div className="w-full lg:w-2/3 min-h-[400px] lg:min-h-0">
        <Card className="h-full overflow-hidden">
          {mounted ? (
            <RouteCalculatorMap
              route={route}
              routePositions={routePositions}
              contextAirwayLines={contextAirwayLines}
              airwayLabels={airwayLabels}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
            />
          ) : (
            <div className="h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center bg-muted/30">
              <Skeleton className="h-full w-full" />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
