"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle, Search, Filter, RefreshCw, ChevronDown, ChevronUp,
  Clock, MapPin, Plane, Radio, ShieldAlert, Activity, Trash2, Loader2
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AerodromeSelector, type AerodromeOption } from "@/components/aerodrome-selector"

// ─── Types ────────────────────────────────────────────────────────

interface Notam {
  id: string
  notamId: string
  type: string
  replacesId?: string | null
  fir: string
  effectiveFrom: string
  effectiveTo?: string | null
  isPermanent: boolean
  scope?: string | null
  subject: string
  condition: string
  text: string
  coordinates?: string | null
  lat?: number | null
  lon?: number | null
  radius?: number | null
  lowerLimit?: string | null
  upperLimit?: string | null
  airportId?: string | null
  priority: string
  source?: string | null
  verified: boolean
  airport?: { icaoCode: string; name: string } | null
  createdAt: string
  updatedAt: string
}

interface NotamStats {
  total: number
  active: number
  byScope: { A: number; E: number; W: number }
  byPriority: { LOW: number; MEDIUM: number; HIGH: number; URGENT: number }
}

interface NotamListingProps {
  onSelectNotam?: (notam: Notam) => void
  onSelectAirport?: (icaoCode: string) => void
  /** When false (non-admin), the "Eliminar todos" button is hidden. */
  isAdmin?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────

function getPriorityConfig(priority: string) {
  switch (priority) {
    case "URGENT":
      return { bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-800 dark:text-red-300", border: "border-red-200 dark:border-red-800", label: "URGENTE" }
    case "HIGH":
      return { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-800 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", label: "ALTA" }
    case "MEDIUM":
      return { bg: "bg-yellow-100 dark:bg-yellow-950/50", text: "text-yellow-800 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800", label: "MEDIA" }
    case "LOW":
      return { bg: "bg-green-100 dark:bg-green-950/50", text: "text-green-800 dark:text-green-300", border: "border-green-200 dark:border-green-800", label: "BAJA" }
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", label: priority }
  }
}

function getScopeConfig(scope?: string | null) {
  switch (scope) {
    case "A":
      return { label: "Aeródromo", bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300", icon: Plane }
    case "E":
      return { label: "En-ruta", bg: "bg-purple-100 dark:bg-purple-950/50", text: "text-purple-800 dark:text-purple-300", icon: Radio }
    case "W":
      return { label: "Aviso", bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-800 dark:text-amber-300", icon: ShieldAlert }
    default:
      return { label: scope || "N/A", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", icon: AlertCircle }
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "NOTAMN":
      return { label: "NUEVO", bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-800 dark:text-emerald-300" }
    case "NOTAMR":
      return { label: "REEMPLAZO", bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300" }
    case "NOTAMC":
      return { label: "CANCELACIÓN", bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-800 dark:text-red-300" }
    default:
      return { label: type, bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300" }
  }
}

function formatDateTimeUTC(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
  } catch {
    return dateStr
  }
}

function getCountdown(dateStr: string): { text: string; isExpired: boolean; isUrgent: boolean } {
  try {
    const target = new Date(dateStr).getTime()
    const now = Date.now()
    const diff = target - now
    if (diff <= 0) return { text: "Expirado", isExpired: true, isUrgent: false }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const isUrgent = hours < 24
    if (days > 0) return { text: `${days}d ${hours % 24}h restantes`, isExpired: false, isUrgent }
    if (hours > 0) return { text: `${hours}h restantes`, isExpired: false, isUrgent }
    const minutes = Math.floor(diff / (1000 * 60))
    return { text: `${minutes}m restantes`, isExpired: false, isUrgent: true }
  } catch {
    return { text: "—", isExpired: false, isUrgent: false }
  }
}

// ─── Component ────────────────────────────────────────────────────

export function NotamListing({ onSelectNotam, onSelectAirport, isAdmin = false }: NotamListingProps) {
  const [notams, setNotams] = useState<Notam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [scopeFilter, setScopeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [activeOnly, setActiveOnly] = useState(true)
  const [visibleCount, setVisibleCount] = useState(10)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState<NotamStats | null>(null)
  const [selectedAerodrome, setSelectedAerodrome] = useState<AerodromeOption | null>(null)

  // ── Nuevos filtros (Q, Lugar A, Vigencia, Texto E) ──
  const [qCodeFilter, setQCodeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [validityFilter, setValidityFilter] = useState<string>("all")
  const [textEFilter, setTextEFilter] = useState<string>("")
  // textEInput es el valor inmediato del input; textEFilter es el valor debounced.
  const [textEInput, setTextEInput] = useState<string>("")
  const [qCodeOptions, setQCodeOptions] = useState<{ value: string; count: number }[]>([])
  const [locationOptions, setLocationOptions] = useState<{ value: string; count: number }[]>([])

  // ── Delete-all dialog state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotams = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (scopeFilter && scopeFilter !== "all") params.set("scope", scopeFilter)
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter)
      if (activeOnly) params.set("active", "true")
      if (selectedAerodrome?.id) params.set("airportId", selectedAerodrome.id)
      // ── Nuevos filtros solicitados por el usuario ──
      if (qCodeFilter && qCodeFilter !== "all") params.set("qCode", qCodeFilter)
      if (locationFilter && locationFilter !== "all") params.set("locationA", locationFilter)
      if (validityFilter && validityFilter !== "all") params.set("validity", validityFilter)
      if (textEFilter) params.set("textE", textEFilter)
      // Pedir hasta 200 NOTAMs (máximo que permite la API) para que el
      // listado muestre el boletín completo en vez de solo los primeros 50.
      params.set("limit", "200")
      const response = await fetch(`/api/notams?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const list: Notam[] = Array.isArray(data) ? data : data.notams || []
        setNotams(list)

        // El servidor devuelve el total real en `data.total` (puede ser > list.length
        // cuando hay más de 200). Para stats por scope/prioridad, usamos la lista
        // que sí tenemos en memoria; para total, preferimos data.total.
        const serverTotal: number = typeof data.total === "number" ? data.total : list.length
        const serverActiveStats = data.activeStats as
          | { total: number; urgent: number; high: number }
          | undefined

        const activeNotams = list.filter((n: Notam) => {
          if (!n.effectiveTo || n.isPermanent) return true
          return new Date(n.effectiveTo) > new Date()
        })
        setStats({
          total: serverTotal,
          active: serverActiveStats?.total ?? activeNotams.length,
          byScope: {
            A: list.filter((n: Notam) => n.scope === "A").length,
            E: list.filter((n: Notam) => n.scope === "E").length,
            W: list.filter((n: Notam) => n.scope === "W").length,
          },
          byPriority: {
            LOW: list.filter((n: Notam) => n.priority === "LOW").length,
            MEDIUM: list.filter((n: Notam) => n.priority === "MEDIUM").length,
            HIGH: list.filter((n: Notam) => n.priority === "HIGH").length,
            URGENT: list.filter((n: Notam) => n.priority === "URGENT").length,
          },
        })
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }
  }, [search, scopeFilter, priorityFilter, activeOnly, selectedAerodrome, qCodeFilter, locationFilter, validityFilter, textEFilter])

  useEffect(() => {
    fetchNotams()
  }, [fetchNotams])

  // ── Fetch distinct Q-codes and locations on mount ──
  // Populates the dropdowns for Código Q and Lugar (A) filters.
  useEffect(() => {
    let cancelled = false
    async function loadFilters() {
      try {
        const res = await fetch("/api/notams/filters?fir=SPIM")
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data.qCodes)) setQCodeOptions(data.qCodes)
        if (Array.isArray(data.locations)) setLocationOptions(data.locations)
      } catch {
        // silently ignore — filters just won't have options
      }
    }
    loadFilters()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Debounce textE input (300ms) ──
  // textEInput se actualiza inmediatamente; textEFilter se actualiza
  // 300ms después de la última pulsación para no spammear la API.
  useEffect(() => {
    const t = setTimeout(() => setTextEFilter(textEInput), 300)
    return () => clearTimeout(t)
  }, [textEInput])

  // ── Delete all NOTAMs handler ──
  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/notams?fir=SPIM", { method: "DELETE" })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Se eliminaron ${data.deleted} NOTAMs`)
        setDeleteDialogOpen(false)
        fetchNotams()
      } else {
        toast.error(data.error || "Error al eliminar NOTAMs")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeleting(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setIsRefreshing(true)
      fetchNotams()
    }, 300000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [fetchNotams])

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleNotams = notams.slice(0, visibleCount)
  const hasMore = visibleCount < notams.length

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative bg-navy rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-95" />
        <div className="absolute inset-0 opacity-5">
          <AlertCircle className="absolute top-4 right-8 size-32 text-white rotate-12" />
        </div>
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-amber-500" />
            <AlertCircle className="size-6 text-amber-500" />
            <div className="h-px w-12 bg-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-center">
            NOTAMs
          </h1>
          <p className="text-slate-300 text-sm text-center mt-1 max-w-2xl mx-auto">
            Notices to Airmen — Avisos a los Aeronavegantes
          </p>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-300">Total</div>
              </div>
              <div className="bg-emerald-500/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-300">{stats.active}</div>
                <div className="text-xs text-slate-300">Activos</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-xs text-slate-400 mb-1">Por Alcance</div>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="text-blue-300 font-semibold">A:{stats.byScope.A}</span>
                  <span className="text-purple-300 font-semibold">E:{stats.byScope.E}</span>
                  <span className="text-amber-300 font-semibold">W:{stats.byScope.W}</span>
                </div>
              </div>
              <div className="bg-amber-500/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-xs text-slate-400 mb-1">Por Prioridad</div>
                <div className="flex justify-center gap-1.5 text-xs flex-wrap">
                  <span className="text-green-300 font-semibold">L:{stats.byPriority.LOW}</span>
                  <span className="text-yellow-300 font-semibold">M:{stats.byPriority.MEDIUM}</span>
                  <span className="text-orange-300 font-semibold">H:{stats.byPriority.HIGH}</span>
                  <span className="text-red-300 font-semibold">U:{stats.byPriority.URGENT}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Row 1: search + aerodrome + delete-all */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar NOTAM por ID, texto, asunto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <AerodromeSelector
            onSelect={(aero) => setSelectedAerodrome(aero)}
            value={selectedAerodrome?.icaoCode}
            placeholder="Filtrar por aeródromo..."
            showClear
            onClear={() => setSelectedAerodrome(null)}
            className="shrink-0"
          />
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              className="h-10 gap-1.5 shrink-0"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Eliminar todos
            </Button>
          )}
        </div>

        {/* Row 2: advanced filters (wrap on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Texto E) — debounced 300ms */}
          <Input
            placeholder="Buscar en casilla E)..."
            value={textEInput}
            onChange={(e) => setTextEInput(e.target.value)}
            className="h-10"
          />
          {/* Código Q — dinámico desde /api/notams/filters */}
          <Select value={qCodeFilter} onValueChange={setQCodeFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Código Q" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Q</SelectItem>
              {qCodeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Lugar (A) — dinámico desde /api/notams/filters */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Lugar (A)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los lugares</SelectItem>
              {locationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Vigencia — opciones fijas */}
          <Select value={validityFilter} onValueChange={setValidityFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Vigencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PERM">PERM</SelectItem>
              <SelectItem value="EST">EST</SelectItem>
              <SelectItem value="FINITE">Finita</SelectItem>
            </SelectContent>
          </Select>
          {/* Alcance (filtro existente) */}
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-full h-10">
              <Filter className="size-3.5 mr-1.5" />
              <SelectValue placeholder="Alcance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="A">A — Aeródromo</SelectItem>
              <SelectItem value="E">E — En-ruta</SelectItem>
              <SelectItem value="W">W — Aviso Nav.</SelectItem>
            </SelectContent>
          </Select>
          {/* Prioridad (filtro existente) */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="MEDIUM">Media</SelectItem>
              <SelectItem value="LOW">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 3: active-only toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeOnly ? "default" : "outline"}
            size="sm"
            className="h-10 gap-1.5 text-xs"
            onClick={() => setActiveOnly(!activeOnly)}
          >
            <Activity className="size-3.5" />
            {activeOnly ? "Solo Activos" : "Todos"}
          </Button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>
            {isRefreshing ? "Actualizando..." : `Última actualización: ${lastRefresh.toLocaleTimeString("es-PE")}`}
          </span>
          {selectedAerodrome && (
            <Badge className="bg-navy/10 dark:bg-navy/30 text-navy dark:text-amber-400 text-[10px] gap-1">
              <Plane className="size-2.5" />
              {selectedAerodrome.icaoCode}
            </Badge>
          )}
        </div>
        <span>{notams.length} NOTAM{notams.length !== 1 ? "s" : ""}</span>
      </div>

      {/* NOTAM Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="py-4">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notams.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron NOTAMs</h3>
          <p className="text-muted-foreground mt-1">Intente con otros filtros de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleNotams.map((notam, index) => {
              const priorityConf = getPriorityConfig(notam.priority)
              const scopeConf = getScopeConfig(notam.scope)
              const typeConf = getTypeBadge(notam.type)
              const isExpanded = expandedIds.has(notam.id)
              const countdown = notam.effectiveTo ? getCountdown(notam.effectiveTo) : null
              const ScopeIcon = scopeConf.icon
              const isActive = !notam.effectiveTo || notam.isPermanent || new Date(notam.effectiveTo) > new Date()

              return (
                <motion.div
                  key={notam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      isActive
                        ? "border-l-4 border-l-amber-500"
                        : "border-l-4 border-l-slate-300 dark:border-l-slate-600 opacity-60"
                    }`}
                    onClick={() => onSelectNotam?.(notam)}
                  >
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(notam.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono font-bold text-sm bg-navy text-white px-2.5 py-1 rounded">
                            {notam.notamId}
                          </span>
                          <Badge className={`${typeConf.bg} ${typeConf.text} text-[10px] font-bold tracking-wider`}>
                            {typeConf.label}
                          </Badge>
                          <Badge className={`${scopeConf.bg} ${scopeConf.text} text-[10px] gap-1`}>
                            <ScopeIcon className="size-2.5" />
                            {notam.scope || "—"}
                          </Badge>
                          <Badge className={`${priorityConf.bg} ${priorityConf.text} text-[10px] font-bold`}>
                            {priorityConf.label}
                          </Badge>
                          {notam.verified && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px]">
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* TEXTO CRUDO OACI — siempre visible, sin truncar, primero y prominente.
                            El texto se muestra EXACTAMENTE como lo emite la fuente (FAA USNS en vivo
                            o AIS Perú manual). NO hay interpretación, resumen ni transformación del sistema. */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              Texto OACI original · sin interpretación
                            </span>
                            {notam.source && (
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                {notam.source}
                              </span>
                            )}
                          </div>
                          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 border border-slate-700 dark:border-slate-800">
                            <p className="text-[11px] font-mono text-slate-100 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{notam.text}</p>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="shrink-0 h-7 gap-1 text-xs">
                                {isExpanded ? (
                                  <><ChevronUp className="size-4" /> Ocultar metadatos</>
                                ) : (
                                  <><ChevronDown className="size-4" /> Ver metadatos</>
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="mt-3 space-y-3">
                            {/* Q-code de referencia (derivado del texto, no interpretación) */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Q-code (ref.):</span>
                              <span className="font-mono">{notam.subject}{notam.condition ? ` / ${notam.condition}` : ""}</span>
                            </div>

                            {/* Altitude limits */}
                            {(notam.lowerLimit || notam.upperLimit) && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Altitud:</span>
                                <span className="font-mono">{notam.lowerLimit || "SFC"} — {notam.upperLimit || "UNL"}</span>
                              </div>
                            )}

                            {/* Coordinates */}
                            {notam.coordinates && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="size-3" />
                                <span className="font-mono">{notam.coordinates}</span>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>

                        {/* Footer row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3" />
                            <span>Desde: {formatDateTimeUTC(notam.effectiveFrom)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3" />
                            <span>
                              {notam.isPermanent
                                ? "Permanente"
                                : notam.effectiveTo
                                  ? `Hasta: ${formatDateTimeUTC(notam.effectiveTo)}`
                                  : "Sin fecha fin"}
                            </span>
                          </div>
                          {countdown && !countdown.isExpired && (
                            <span className={`font-semibold ${countdown.isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {countdown.text}
                            </span>
                          )}
                          {countdown?.isExpired && (
                            <span className="font-semibold text-slate-500">Expirado</span>
                          )}
                          {notam.airport && (
                            <button
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectAirport?.(notam.airport!.icaoCode)
                              }}
                            >
                              <Plane className="size-3" />
                              {notam.airport.icaoCode}
                            </button>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Radio className="size-3" />
                            <span>FIR: {notam.fir}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="gap-2"
              >
                <ChevronDown className="size-4" />
                Cargar más ({notams.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="size-5" />
              Eliminar todos los NOTAMs
            </DialogTitle>
            <DialogDescription className="text-sm">
              Se eliminarán <strong>TODOS</strong> los NOTAMs de FIR SPIM de la base de datos local. Esta acción no se puede deshacer.
              <br /><br />
              Útil para limpiar duplicados antes de pegar un boletín nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-1.5" />
                  Eliminar todos
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
