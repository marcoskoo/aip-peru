"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  Search,
  Route,
  Navigation,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Ruler,
  Mountain,
  Compass,
  Shield,
  Layers,
  Info,
  Plane,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AirwaySegmentData {
  id: string
  orderIndex: number
  fromPoint: string
  toPoint: string
  distance: number
  bearing: number
  minFL: number | null
  maxFL: number | null
  trackTrue: number | null
  reverseTrack: number | null
  magneticTrack: number | null
  reverseMagneticTrack: number | null
  classification: string | null
  widthNM: number | null
  upperLimit: string | null
  lowerLimit: string | null
  minEnrouteAltitude: string | null
  remarks: string | null
}

interface AirwayData {
  id: string
  designator: string
  type: "CONVENTIONAL" | "RNAV"
  level: string
  segments: AirwaySegmentData[]
}

interface AirwaysListingProps {
  onViewChart?: () => void
}

const TYPE_CONFIG = {
  CONVENTIONAL: {
    label: "Convencional",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    darkColor: "dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    lineColor: "bg-emerald-500",
  },
  RNAV: {
    label: "RNAV",
    color: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    darkColor: "dark:bg-fuchsia-950/50 dark:text-fuchsia-400 dark:border-fuchsia-800",
    lineColor: "bg-fuchsia-500",
  },
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  LOWER: { label: "Inferior", color: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-400", icon: "↓" },
  UPPER: { label: "Superior", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400", icon: "↑" },
  BOTH: { label: "Ambos", color: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-400", icon: "↕" },
}

const CLASSIFICATION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  A: { label: "Clase A", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  D: { label: "Clase D", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  G: { label: "Clase G", color: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  F: { label: "Clase F", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
}

function ClassificationBadge({ cls }: { cls: string | null }) {
  if (!cls) return null
  const config = CLASSIFICATION_CONFIG[cls]
  if (!config) return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{cls}</Badge>
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 font-bold ${config.bg} ${config.color}`}>
      {config.label}
    </Badge>
  )
}

function AirwayCard({
  airway,
  expanded,
  onToggle,
}: {
  airway: AirwayData
  expanded: boolean
  onToggle: () => void
}) {
  const typeConfig = TYPE_CONFIG[airway.type]
  const levelConfig = LEVEL_CONFIG[airway.level] || LEVEL_CONFIG.BOTH
  const totalDistance = airway.segments.reduce((sum, s) => sum + s.distance, 0)
  const minFL = Math.min(...airway.segments.filter((s) => s.minFL).map((s) => s.minFL!), Infinity)
  const maxFL = Math.max(...airway.segments.filter((s) => s.maxFL).map((s) => s.maxFL!), 0)
  const waypoints = new Set<string>()
  airway.segments.forEach((s) => {
    waypoints.add(s.fromPoint)
    waypoints.add(s.toPoint)
  })

  // Get unique classifications in this route
  const classifications = new Set<string>()
  airway.segments.forEach((s) => { if (s.classification) classifications.add(s.classification) })

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-amber-600/50">
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className="bg-navy text-white font-bold text-sm px-3 py-1 tracking-wider font-mono">
              {airway.designator}
            </Badge>
            <Badge className={`${typeConfig.color} ${typeConfig.darkColor} text-[10px] px-1.5 py-0.5 font-bold tracking-wider`}>
              {typeConfig.label}
            </Badge>
            <Badge className={`${levelConfig.color} text-[10px] px-1.5 py-0.5 font-bold tracking-wider`}>
              {levelConfig.icon} {levelConfig.label}
            </Badge>
            {Array.from(classifications).map((cls) => (
              <ClassificationBadge key={cls} cls={cls} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ruler className="size-3" />
                {totalDistance.toFixed(0)} NM
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="size-3" />
                {airway.segments.length} seg
              </span>
              {maxFL > 0 && (
                <span className="flex items-center gap-1">
                  <Mountain className="size-3" />
                  FL{minFL === Infinity ? "???" : minFL}–FL{maxFL}
                </span>
              )}
            </div>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Mobile stats */}
        <div className="sm:hidden flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Ruler className="size-3" />
            {totalDistance.toFixed(0)} NM
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="size-3" />
            {airway.segments.length} segmentos
          </span>
        </div>

        {/* Route path preview */}
        <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground mb-2">
          <Compass className="size-3 shrink-0" />
          {Array.from(waypoints).slice(0, 8).map((wp, i, arr) => (
            <span key={wp} className="flex items-center gap-1">
              <span className="font-mono font-semibold text-foreground/80">{wp}</span>
              {i < arr.length - 1 && <ArrowRight className="size-2.5 text-muted-foreground/50" />}
            </span>
          ))}
          {waypoints.size > 8 && <span className="text-muted-foreground">+{waypoints.size - 8} más</span>}
        </div>

        {/* Expanded segment details */}
        {expanded && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            {/* Segment table header */}
            <div className="bg-muted/50 px-2 py-2 grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-x-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>#</span>
              <span>Desde</span>
              <span>Hacia</span>
              <span>Derrota</span>
              <span>Dist</span>
              <span>Niveles</span>
              <span>Clase</span>
            </div>
            <ScrollArea className="max-h-[400px]">
              {airway.segments.map((seg, idx) => {
                const segClassifications = seg.classification || "—"
                const hasUpperLimit = seg.upperLimit && seg.upperLimit !== "—"
                const hasLowerLimit = seg.lowerLimit && seg.lowerLimit !== "—"
                
                return (
                  <div key={seg.id} className="group">
                    {/* Main segment row */}
                    <div className="px-2 py-1.5 grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-x-2 text-xs border-t hover:bg-muted/30 transition-colors items-center">
                      <span className="text-muted-foreground w-4">{seg.orderIndex + 1}</span>
                      <span className="font-mono font-semibold">{seg.fromPoint}</span>
                      <span className="font-mono font-semibold">{seg.toPoint}</span>
                      <span className="text-muted-foreground tabular-nums font-mono text-[11px]">
                        {seg.magneticTrack ? `${seg.magneticTrack.toFixed(0)}°` : "—"}
                        {seg.reverseMagneticTrack ? `/${seg.reverseMagneticTrack.toFixed(0)}°` : ""}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{seg.distance.toFixed(1)}</span>
                      <span className="text-muted-foreground tabular-nums text-[11px]">
                        {hasUpperLimit || hasLowerLimit
                          ? `${seg.lowerLimit || "—"}‑${seg.upperLimit || "—"}`
                          : seg.minFL && seg.maxFL
                            ? `FL${seg.minFL}‑FL${seg.maxFL}`
                            : "—"}
                      </span>
                      <span>
                        <ClassificationBadge cls={seg.classification} />
                      </span>
                    </div>
                    
                    {/* Expanded detail row for this segment */}
                    {(seg.widthNM || seg.remarks || seg.minEnrouteAltitude) && (
                      <div className="px-2 pb-2 pt-0 border-t-0 text-[11px] text-muted-foreground bg-muted/10">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-5">
                          {seg.widthNM && (
                            <span className="flex items-center gap-1">
                              <Layers className="size-3" />
                              WID {seg.widthNM} NM
                            </span>
                          )}
                          {seg.minEnrouteAltitude && (
                            <span className="flex items-center gap-1">
                              <Mountain className="size-3" />
                              MEA {seg.minEnrouteAltitude}
                            </span>
                          )}
                          {seg.remarks && (
                            <span className="flex items-center gap-1">
                              <Info className="size-3 shrink-0" />
                              <span className="truncate max-w-[300px]">{seg.remarks}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </ScrollArea>
            
            {/* Route summary footer */}
            <div className="border-t bg-navy/5 dark:bg-navy/20 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Plane className="size-3" />
                Total: {totalDistance.toFixed(0)} NM
              </span>
              <span className="text-muted-foreground">
                {waypoints.size} puntos significativos
              </span>
              {Array.from(classifications).length > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="size-3" />
                  {Array.from(classifications).map((c) => `Clase ${c}`).join(", ")}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AirwaysListing({ onViewChart }: AirwaysListingProps) {
  const [airways, setAirways] = useState<AirwayData[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"" | "CONVENTIONAL" | "RNAV">("")
  const [levelFilter, setLevelFilter] = useState<"" | "LOWER" | "UPPER" | "BOTH">("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAirways = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter) params.set("type", typeFilter)
      if (levelFilter) params.set("level", levelFilter)
      const response = await fetch(`/api/airdata/airways?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAirways(Array.isArray(data) ? data : [])
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, levelFilter])

  useEffect(() => {
    fetchAirways()
  }, [fetchAirways])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAirways()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchAirways])

  const stats = useMemo(() => {
    const conventional = airways.filter((a) => a.type === "CONVENTIONAL")
    const rnav = airways.filter((a) => a.type === "RNAV")
    const lower = airways.filter((a) => a.level === "LOWER")
    const upper = airways.filter((a) => a.level === "UPPER")
    const totalSegments = airways.reduce((sum, a) => sum + a.segments.length, 0)
    const totalDistance = airways.reduce(
      (sum, a) => sum + a.segments.reduce((s, seg) => s + seg.distance, 0),
      0
    )
    const allWaypoints = new Set<string>()
    airways.forEach((a) =>
      a.segments.forEach((s) => {
        allWaypoints.add(s.fromPoint)
        allWaypoints.add(s.toPoint)
      })
    )
    return {
      conventional: conventional.length,
      rnav: rnav.length,
      lower: lower.length,
      upper: upper.length,
      totalSegments,
      totalDistance: totalDistance.toFixed(0),
      waypoints: allWaypoints.size,
    }
  }, [airways])

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-navy rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-95" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8">
            <Route className="size-32 text-white rotate-12" />
          </div>
          <div className="absolute bottom-4 left-8">
            <Navigation className="size-20 text-white -rotate-45" />
          </div>
        </div>
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-500" />
            <Route className="size-6 text-amber-500" />
            <div className="h-px w-12 bg-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Aerovías del Perú
          </h1>
          <div className="mt-2">
            <span className="text-amber-500 text-xl sm:text-2xl lg:text-3xl font-bold tracking-widest">
              AIP PERÚ
            </span>
          </div>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Información de aerovías ATS convencionales y RNAV dentro de la FIR Lima (SPIM).
            Segmentos con derrota magnética, clasificación de espacio aéreo, niveles de vuelo y observaciones.
          </p>
          {/* Stats bar */}
          {!loading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.conventional + stats.rnav}</div>
                <div className="text-xs text-slate-400">Aerovías</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.conventional}</div>
                <div className="text-xs text-slate-400">Convencionales</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-fuchsia-400">{stats.rnav}</div>
                <div className="text-xs text-slate-400">RNAV</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-400">{stats.lower}</div>
                <div className="text-xs text-slate-400">Inferior</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.upper}</div>
                <div className="text-xs text-slate-400">Superior</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalSegments}</div>
                <div className="text-xs text-slate-400">Segmentos</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalDistance}</div>
                <div className="text-xs text-slate-400">NM Total</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.waypoints}</div>
                <div className="text-xs text-slate-400">Waypoints</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por designador de aerovía (ej. G675, UV1, L525)..."
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              className="pl-10 h-11 font-mono"
              suppressHydrationWarning
            />
          </div>
          {onViewChart && (
            <Button
              onClick={onViewChart}
              className="bg-amber-500 text-navy hover:bg-amber-600 gap-1.5"
            >
              <Route className="size-4" />
              Ver en Carta
            </Button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === "" && levelFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => { setTypeFilter(""); setLevelFilter("") }}
            className={
              typeFilter === "" && levelFilter === ""
                ? "bg-amber-500 text-navy hover:bg-amber-600 gap-1.5 text-xs"
                : "gap-1.5 text-xs"
            }
          >
            <Route className="size-3.5" />
            Todas
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 ml-0.5">
              {airways.length}
            </Badge>
          </Button>
          <Button
            variant={typeFilter === "CONVENTIONAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(typeFilter === "CONVENTIONAL" ? "" : "CONVENTIONAL")}
            className={
              typeFilter === "CONVENTIONAL"
                ? "bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 text-xs"
                : "gap-1.5 text-xs"
            }
          >
            <Navigation className="size-3.5" />
            Convencionales
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 ml-0.5">
              {stats.conventional}
            </Badge>
          </Button>
          <Button
            variant={typeFilter === "RNAV" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(typeFilter === "RNAV" ? "" : "RNAV")}
            className={
              typeFilter === "RNAV"
                ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 gap-1.5 text-xs"
                : "gap-1.5 text-xs"
            }
          >
            <Navigation className="size-3.5" />
            RNAV
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 ml-0.5">
              {stats.rnav}
            </Badge>
          </Button>
          
          <Separator orientation="vertical" className="h-7 mx-1" />
          
          {/* Level Filter */}
          <Button
            variant={levelFilter === "LOWER" ? "default" : "outline"}
            size="sm"
            onClick={() => setLevelFilter(levelFilter === "LOWER" ? "" : "LOWER")}
            className={
              levelFilter === "LOWER"
                ? "bg-sky-600 text-white hover:bg-sky-700 gap-1.5 text-xs"
                : "gap-1.5 text-xs"
            }
          >
            <Layers className="size-3.5" />
            ↓ Inferior
          </Button>
          <Button
            variant={levelFilter === "UPPER" ? "default" : "outline"}
            size="sm"
            onClick={() => setLevelFilter(levelFilter === "UPPER" ? "" : "UPPER")}
            className={
              levelFilter === "UPPER"
                ? "bg-orange-600 text-white hover:bg-orange-700 gap-1.5 text-xs"
                : "gap-1.5 text-xs"
            }
          >
            <Layers className="size-3.5" />
            ↑ Superior
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {loading
              ? "Buscando..."
              : `${airways.length} aerovía${airways.length !== 1 ? "s" : ""} encontrada${airways.length !== 1 ? "s" : ""}`}
          </span>
          {!loading && airways.length > 0 && (
            <span className="hidden sm:inline text-xs">
              Haga clic en una aerovía para ver los detalles de los segmentos
            </span>
          )}
        </div>
      </div>

      {/* Airways Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : airways.length === 0 ? (
        <div className="text-center py-16">
          <Route className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron aerovías</h3>
          <p className="text-muted-foreground mt-1">
            Intente con otros términos de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {airways.map((airway) => (
            <AirwayCard
              key={airway.id}
              airway={airway}
              expanded={expandedId === airway.id}
              onToggle={() => toggleExpanded(airway.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
