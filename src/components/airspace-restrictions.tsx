"use client"

import { useEffect, useState, useCallback } from "react"
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

                                  {/* Map preview placeholder */}
                                  <div className="h-[150px] rounded-lg bg-muted/30 border flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                      <MapPin className="size-6 mx-auto mb-1 opacity-40" />
                                      <p className="text-[10px]">
                                        {restriction.centerLat.toFixed(4)}°, {restriction.centerLon.toFixed(4)}°
                                        {restriction.radius && ` · R: ${restriction.radius}NM`}
                                      </p>
                                    </div>
                                  </div>

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
