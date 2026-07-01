"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Plane,
  RefreshCw,
  Send,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Zap,
  Clock,
  Timer,
  Trash2,
  Upload,
  ChevronRight,
  ChevronLeft,
  Database,
  Wind,
  Waves,
  Code2,
  Settings2,
  Volume2,
  Search,
  MapPin,
  ListFilter,
  Cloud,
  Wifi,
  Lock,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePolling } from "@/lib/aviation/use-polling"
import {
  parseIsoMs,
  notamStatus,
  formatCountdown,
} from "@/lib/aviation/notam-parser"
import { NotamCountdownClock, sortByExpiry } from "@/components/notam-countdown-clock"
import { NotamListing } from "@/components/notam-listing"
import { useAdminAuth } from "@/hooks/use-admin-auth"

// ─── Types ──────────────────────────────────────────────────────────────

interface StationSummary {
  icao: string
  iata?: string
  name: string
  city: string
  region?: string
  type: string
  elevationFt?: number
  lat: number
  lon: number
  frequencies?: string
  notamCount: number
  hasMetar: boolean
  hasTaf: boolean
}

interface StatsResponse {
  totalStations: number
  metarCount: number
  tafCount: number
  notamCount: number
  notamSource?: string | null
  stations: StationSummary[]
  generatedAt: string
}

interface ParsedMetar {
  raw: string
  time: string
  wind: { direction: number; speed: number; gust?: number; variable?: boolean }
  visibility: { value: number; unit: string }
  clouds: { quantity: string; height: number; type?: string }[]
  temperature: number
  dewpoint: number
  qnh: number
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR"
  weather?: string[]
  remarks?: string
  auto?: boolean
  cavok?: boolean
}

interface TafPeriod {
  type: string
  from: string
  to?: string
  wind?: { direction: number; speed: number; gust?: number }
  visibility?: { value: number; unit: string }
  clouds?: { quantity: string; height: number; type?: string }[]
  weather?: string[]
  flightCategory?: "VFR" | "MVFR" | "IFR" | "LIFR"
}

interface StructuredNotam {
  id: string
  notamId: string
  type: string
  replacesId: string | null
  fir: string
  effectiveFrom: string
  effectiveTo: string | null
  isPermanent: boolean
  scope: string | null
  subject: string
  condition: string
  text: string
  priority: string
  source: string | null
  verified: boolean
  airport?: { icaoCode: string; name: string; city: string } | null
  status: "vigente" | "upcoming" | "expired" | "perm"
  qCode?: string
  fields: { label: string; value: string }[]
}

interface StationDetail {
  station: StationSummary
  weather: {
    metar: ParsedMetar | null
    taf: { raw: string; time: string; periods: TafPeriod[] } | null
    fetchedAt: string
    source: string
    metarReadable: string
    tafReadable: string
  }
  notams: StructuredNotam[]
  notamCount: number
  summary: string
  summaryColor: "green" | "amber" | "red"
  lastUpdate: string
  generatedAt: string
}

interface IngestResult {
  ok: boolean
  inserted: number
  skipped: number
  errors: string[]
  items: Array<{
    notamId: string
    icao: string
    validFrom: string | null
    validTo: string | null
    summary: string
    action: "created" | "updated" | "skipped"
  }>
  parsedTotal?: number
  error?: string
}

interface DeleteAllResult {
  ok: boolean
  deleted?: number
  fir?: string
  error?: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// ─── Color maps ─────────────────────────────────────────────────────────

const flightCategoryColors: Record<string, string> = {
  VFR: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  MVFR: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  IFR: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  LIFR: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  LOW: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
}

const statusColors: Record<string, string> = {
  vigente: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  upcoming: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  expired: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  perm: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    if (diff < 0) return "recién"
    const min = Math.floor(diff / 60000)
    if (min < 1) return "hace menos de 1 min"
    if (min < 60) return `hace ${min} min`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `hace ${hr} h`
    const days = Math.floor(hr / 24)
    return `hace ${days} d`
  } catch {
    return "—"
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z$/, "Z")
  } catch {
    return iso
  }
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-base mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, "<br/>")
}

// ─── Countdown hook ─────────────────────────────────────────────────────

interface CountdownState {
  remainingMs: number | null
  critical: boolean
  expired: boolean
}

function computeCountdown(validTo?: string | null, isPermanent?: boolean): CountdownState {
  if (!validTo || validTo === "PERM" || isPermanent) {
    return { remainingMs: null, critical: false, expired: false }
  }
  const target = parseIsoMs(validTo)
  if (target === null) return { remainingMs: null, critical: false, expired: false }
  const diff = target - Date.now()
  if (diff <= 0) return { remainingMs: 0, critical: true, expired: true }
  return { remainingMs: diff, critical: diff <= 5 * 60 * 1000, expired: false }
}

function useCountdown(validTo?: string | null, isPermanent?: boolean): CountdownState {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!validTo || validTo === "PERM" || isPermanent) return
    const target = parseIsoMs(validTo)
    if (target === null) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [validTo, isPermanent])
  return computeCountdown(validTo, isPermanent)
}

function NotamCountdown({ validFrom, validTo, isPermanent }: {
  validFrom?: string | null
  validTo?: string | null
  isPermanent?: boolean
}) {
  const { remainingMs, critical, expired } = useCountdown(validTo, isPermanent)
  const status = notamStatus(validFrom, validTo ?? (isPermanent ? "PERM" : undefined))
  if (status === "upcoming") {
    return <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-600"><Timer className="h-3.5 w-3.5" />PRÓXIMO</span>
  }
  if (!validTo || validTo === "PERM" || isPermanent || remainingMs === null) {
    return <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400"><Timer className="h-3.5 w-3.5" />PERM</span>
  }
  if (expired) {
    return <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-red-600"><Timer className="h-3.5 w-3.5" />EXPIRADO</span>
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums", critical ? "text-red-600 animate-pulse" : "text-blue-600 dark:text-blue-400")}>
      <Timer className={cn("h-3.5 w-3.5", critical && "animate-pulse")} />
      {formatCountdown(remainingMs)}
    </span>
  )
}

// ─── Ingest Dialog ──────────────────────────────────────────────────────

function NotamIngestDialog({ onIngested }: { onIngested: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)

  const handleIngest = async () => {
    if (!text.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/spim-briefing/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data: IngestResult = await res.json()
      setResult(data)
      if (data.ok && data.inserted > 0) onIngested()
    } catch (err) {
      setResult({ ok: false, inserted: 0, skipped: 0, errors: [err instanceof Error ? err.message : String(err)], items: [] })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => { setOpen(false); setText(""); setResult(null) }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <button className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-emerald-600 p-2 group-hover:scale-105 transition-transform">
              <Upload className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Pegado masivo de NOTAMS</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Pega todos los NOTAMs de FIR SPIM de una sola vez. El sistema los clasifica y distribuye automáticamente al aeródromo correspondiente (según el campo A).
              </p>
            </div>
            <ChevronRight className="size-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-emerald-600" />
            Ingesta manual de NOTAMs
          </DialogTitle>
          <DialogDescription>
            Pega el texto plano del boletín NOTAM recibido por email desde AIS Perú. El parser OACI extraerá cada NOTAM y lo guardará en la base de datos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Pega aquí el texto del NOTAM, por ejemplo:\n\nA1234/25 NOTAMN\nQ) SPIM/QFALC/IV/NBO/A/000/999/SPJC\nA) SPJC\nB) 2501151200\nC) 2501161200\nE) RWY 15/33 CLOSED FOR MAINTENANCE\n`}
            className="min-h-[200px] font-mono text-xs"
            disabled={loading}
          />
          {result && (
            <div className="rounded-md border p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {result.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-red-600" />}
                <span className="font-semibold">{result.ok ? `${result.inserted} NOTAMs procesados` : "Error"}</span>
                {result.parsedTotal != null && <Badge variant="secondary" className="text-xs">{result.parsedTotal} detectados</Badge>}
                {result.skipped > 0 && <Badge variant="outline" className="text-xs">{result.skipped} saltados</Badge>}
              </div>
              {result.items.length > 0 && (
                <ScrollArea className="max-h-40 rounded border">
                  <ul className="divide-y text-xs">
                    {result.items.map((it, i) => (
                      <li key={i} className="p-2 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs", it.action === "created" ? "text-emerald-600" : it.action === "updated" ? "text-blue-600" : "text-slate-500")}>{it.action.toUpperCase()}</Badge>
                        <span className="font-mono font-semibold">{it.notamId}</span>
                        <span className="text-muted-foreground">{it.icao}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleIngest} disabled={loading || !text.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Procesar NOTAMs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete All Dialog ──────────────────────────────────────────────────

function NotamDeleteAllDialog({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeleteAllResult | null>(null)

  const handleDelete = async () => {
    if (loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/notams?fir=SPIM", { method: "DELETE" })
      const data: DeleteAllResult = await res.json()
      setResult(data)
      if (data.ok) {
        toast.success(`Se eliminaron ${data.deleted ?? 0} NOTAMs`)
        onDeleted()
        setOpen(false)
        setResult(null)
      } else {
        toast.error(data.error || "Error al eliminar NOTAMs")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setResult({ ok: false, error: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setOpen(false)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <button className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-red-600 p-2 group-hover:scale-105 transition-transform">
              <Trash2 className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Eliminar todos los NOTAMs</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Borra todos los NOTAMs de FIR SPIM de la base de datos local. Útil antes de pegar un boletín nuevo para evitar duplicados.
              </p>
            </div>
            <ChevronRight className="size-4 text-slate-400 group-hover:text-red-600 transition-colors shrink-0 mt-1" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="size-5" />
            Eliminar todos los NOTAMs
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            Se eliminarán TODOS los NOTAMs de FIR SPIM de la base de datos local. Esta acción no se puede deshacer.

Útil para limpiar duplicados antes de pegar un boletín nuevo.
          </DialogDescription>
        </DialogHeader>
        {result && !result.ok && (
          <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span className="break-words">{result.error || "Error al eliminar NOTAMs"}</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Eliminar todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Plane; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={cn("rounded-lg p-1.5", color)}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

// ─── Dashboard View ─────────────────────────────────────────────────────

function DashboardView({ stats, loading, onRefresh, onIngested, onSelectStation }: {
  stats: StatsResponse | null
  loading: boolean
  onRefresh: () => void
  onIngested: () => void
  onSelectStation: (s: StationSummary) => void
}) {
  const [search, setSearch] = useState("")
  const { isAuthenticated } = useAdminAuth()

  const filteredStations = stats?.stations.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.icao.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || (s.iata || "").toLowerCase().includes(q)
  }) || []

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Plane} label="Aeródromos" value={stats?.totalStations ?? "—"} color="bg-blue-500/15 text-blue-600" />
        <StatCard icon={Wind} label="METAR" value={stats?.metarCount ?? "—"} color="bg-green-500/15 text-green-600" />
        <StatCard icon={Waves} label="TAF" value={stats?.tafCount ?? "—"} color="bg-orange-500/15 text-orange-600" />
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">NOTAMs</span>
            <div className="rounded-lg p-1.5 bg-red-500/15 text-red-600">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{stats?.notamCount ?? "—"}</p>
          {stats?.notamSource && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate" title={stats.notamSource}>
              Fuente: {stats.notamSource}
            </p>
          )}
        </div>
      </div>

      {/* Pegado masivo + Eliminar — solo visible para administradores */}
      {isAuthenticated && (
        <>
          <NotamIngestDialog onIngested={onIngested} />
          <NotamDeleteAllDialog onDeleted={onIngested} />
        </>
      )}
      {!isAuthenticated && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 text-center text-xs text-slate-500 dark:text-slate-400">
          <Lock className="size-3.5 inline mr-1.5 opacity-60" />
          Inicie sesión como administrador para pegar o eliminar NOTAMs en lote.
        </div>
      )}

      {/* Station list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-emerald-600" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Estaciones</h3>
            <Badge variant="secondary" className="text-xs">{filteredStations.length}</Badge>
          </div>
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ICAO, IATA, ciudad..."
              className="h-8 pl-7 text-xs"
              suppressHydrationWarning
            />
          </div>
        </div>
        <ScrollArea className="max-h-[80vh] overscroll-contain">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && !stats ? (
              <div className="p-8 text-center">
                <Loader2 className="size-6 animate-spin text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cargando estaciones...</p>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No se encontraron estaciones</p>
              </div>
            ) : (
              filteredStations.map((s) => (
                <StationRow key={s.icao} station={s} onSelect={() => onSelectStation(s)} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function StationRow({ station, onSelect }: { station: StationSummary; onSelect: () => void }) {
  const typeLabel = station.type === "INTERNACIONAL" ? "INTL" : station.type === "MILITAR" ? "MIL" : station.type === "HELIPUERTO" ? "HELI" : "NAC"
  return (
    <div onClick={onSelect} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-12 text-center">
          <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{station.icao}</p>
          {station.iata && <p className="text-[10px] text-slate-400 font-mono">{station.iata}</p>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{station.name}</p>
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{typeLabel}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {station.city}{station.region ? ` · ${station.region}` : ""}{station.elevationFt ? ` · ${station.elevationFt} ft` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {station.hasMetar && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">
              <Wind className="size-2.5" />METAR
            </span>
          )}
          {station.hasTaf && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded">
              <Waves className="size-2.5" />TAF
            </span>
          )}
          {station.notamCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded">
              <FileText className="size-2.5" />{station.notamCount}
            </span>
          )}
        </div>
        <ChevronRight className="size-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
      </div>
    </div>
  )
}

// ─── Station Detail View ────────────────────────────────────────────────

type StationTab = "metar" | "taf" | "notam"

function StationDetailView({ station, onBack }: { station: StationSummary; onBack: () => void }) {
  const [tab, setTab] = useState<StationTab>("metar")
  const [detail, setDetail] = useState<StationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/spim-agent/station/${station.icao}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: StationDetail = await res.json()
      setDetail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [station.icao])

  useEffect(() => {
    setLoading(true)
    setDetail(null)
    fetchDetail()
  }, [fetchDetail])

  // Auto-polling every 30s
  const { secondsToNext, isFetching, refreshNow, autoOn, setAutoOn } = usePolling(fetchDetail, 30)

  const metar = detail?.weather.metar
  const taf = detail?.weather.taf
  const notams = detail?.notams || []

  const typeLabel = station.type === "INTERNACIONAL" ? "INTL" : station.type === "MILITAR" ? "MIL" : station.type === "HELIPUERTO" ? "HELI" : "NAC"

  return (
    <div className="space-y-4">
      {/* Back nav + breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
          <ChevronLeft className="size-3.5" />
          Volver
        </button>
        <span>·</span>
        <span className="font-mono">{station.icao}</span>
      </div>

      {/* Station header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{station.icao}</h2>
                  {station.iata && (
                    <Badge variant="secondary" className="text-xs">{station.iata}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{station.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {station.city}{station.region ? ` · ${station.region}` : ""}{station.elevationFt ? ` · ${station.elevationFt} ft` : ""} · {station.lat.toFixed(4)}, {station.lon.toFixed(4)}
                </p>
                {station.frequencies && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Frecuencias: {station.frequencies}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                <Clock className="size-3" />
                <span className="font-mono">30s</span>
                <Switch checked={autoOn} onCheckedChange={setAutoOn} aria-label="Auto-refresh" />
              </div>
              <Button variant="outline" size="icon" onClick={refreshNow} disabled={isFetching} className="size-8">
                {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              </Button>
            </div>
          </div>
          {autoOn && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <Badge variant="secondary" className="font-mono text-[10px] gap-1">
                <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
                {isFetching ? "consultando…" : `próxima consulta en ${secondsToNext}s`}
              </Badge>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {([
            { key: "metar" as const, label: "METAR", icon: Wind, count: metar ? 1 : 0 },
            { key: "taf" as const, label: "TAF", icon: Waves, count: taf ? 1 : 0 },
            { key: "notam" as const, label: "NOTAM", icon: FileText, count: notams.length },
          ]).map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={cn("text-xs px-1.5 rounded", active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {loading && !detail ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 className="size-5 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Cargando datos de {station.icao}...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="size-4 mt-0.5 text-red-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-700">Error al cargar datos</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Last update + Source + Summary */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-medium">Última actualización</span>
                    <span className="ml-1.5">{detail ? formatTimeAgo(detail.lastUpdate) : "—"}</span>
                  </div>
                  {detail?.weather?.source && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                      detail.weather.source === "aviationweather.gov"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40",
                    )} title={`Origen de los datos METAR/TAF: ${detail.weather.source}`}>
                      {detail.weather.source === "aviationweather.gov" ? (
                        <>
                          <Wifi className="size-2.5" />
                          Datos reales
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-2.5" />
                          Datos simulados
                        </>
                      )}
                    </span>
                  )}
                </div>
                {detail && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border",
                    detail.summaryColor === "green" && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
                    detail.summaryColor === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
                    detail.summaryColor === "red" && "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
                  )}>
                    <CheckCircle2 className="size-3" />
                    Resumen: {detail.summary}
                  </div>
                )}
              </div>

              {/* Tab panels */}
              {tab === "metar" && (
                <MetarPanel metar={metar} readable={detail?.weather.metarReadable || "METAR no disponible"} showJson={showJson} onToggleJson={() => setShowJson(!showJson)} />
              )}
              {tab === "taf" && (
                <TafPanel taf={taf} readable={detail?.weather.tafReadable || "TAF no disponible"} showJson={showJson} onToggleJson={() => setShowJson(!showJson)} />
              )}
              {tab === "notam" && (
                <NotamPanel notams={notams} showJson={showJson} onToggleJson={() => setShowJson(!showJson)} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── METAR Panel ────────────────────────────────────────────────────────

function MetarPanel({ metar, readable, showJson, onToggleJson }: {
  metar: ParsedMetar | null | undefined
  readable: string
  showJson: boolean
  onToggleJson: () => void
}) {
  if (!metar) {
    return <div className="py-8 text-center text-sm text-slate-500">METAR no disponible para esta estación</div>
  }
  return (
    <div className="space-y-4">
      {/* Flight category badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría de vuelo</span>
        <Badge variant="outline" className={cn("text-xs", flightCategoryColors[metar.flightCategory])}>{metar.flightCategory}</Badge>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Viento</p>
          <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
            {metar.wind.variable ? "VRB" : String(metar.wind.direction).padStart(3, "0")}° {metar.wind.speed}kt{metar.wind.gust ? ` G${metar.wind.gust}` : ""}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Visibilidad</p>
          <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
            {metar.cavok ? "CAVOK" : metar.visibility.value >= 9999 ? "10km+" : `${metar.visibility.value}m`}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Temp / Rocío</p>
          <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">{metar.temperature}° / {metar.dewpoint}°</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">QNH</p>
          <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">{metar.qnh} hPa</p>
        </div>
      </div>

      {/* Readable version */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Versión legible</h4>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {readable}
        </div>
      </div>

      {/* Raw message */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mensaje crudo</h4>
        <div className="rounded-lg bg-slate-900 dark:bg-slate-950 p-3 font-mono text-sm text-slate-100 dark:text-slate-200 overflow-x-auto break-all">
          {metar.raw}
        </div>
      </div>

      {/* JSON toggle */}
      <Button variant="ghost" size="sm" onClick={onToggleJson} className="text-xs gap-1.5 text-slate-500 hover:text-slate-700">
        <Code2 className="size-3.5" />
        {showJson ? "Ocultar" : "Ver"} JSON completo
      </Button>
      {showJson && (
        <pre className="rounded-lg bg-slate-900 dark:bg-slate-950 p-3 font-mono text-[10px] text-slate-100 dark:text-slate-200 overflow-x-auto max-h-64">
          {JSON.stringify(metar, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── TAF Panel ──────────────────────────────────────────────────────────

function TafPanel({ taf, readable, showJson, onToggleJson }: {
  taf: { raw: string; time: string; periods: TafPeriod[] } | null | undefined
  readable: string
  showJson: boolean
  onToggleJson: () => void
}) {
  if (!taf) {
    return <div className="py-8 text-center text-sm text-slate-500">TAF no disponible para esta estación</div>
  }
  return (
    <div className="space-y-4">
      {/* Periods */}
      {taf.periods.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Períodos ({taf.periods.length})</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
            {taf.periods.slice(0, 12).map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs border-b border-slate-200 dark:border-slate-700 pb-1 last:border-0">
                <Badge variant="outline" className="text-[10px] font-mono">{p.type}</Badge>
                {p.wind && (
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {p.wind.variable ? "VRB" : String(p.wind.direction).padStart(3, "0")}{String(p.wind.speed).padStart(2, "0")}KT{p.wind.gust ? `G${p.wind.gust}` : ""}
                  </span>
                )}
                {p.visibility && (
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {p.visibility.value >= 9999 ? "10km+" : `${p.visibility.value}m`}
                  </span>
                )}
                {p.flightCategory && (
                  <Badge variant="outline" className={cn("text-[10px] ml-auto", flightCategoryColors[p.flightCategory])}>{p.flightCategory}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readable version */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Versión legible</h4>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {readable}
        </div>
      </div>

      {/* Raw message */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mensaje crudo</h4>
        <div className="rounded-lg bg-slate-900 dark:bg-slate-950 p-3 font-mono text-sm text-slate-100 dark:text-slate-200 overflow-x-auto break-all">
          {taf.raw}
        </div>
      </div>

      {/* JSON toggle */}
      <Button variant="ghost" size="sm" onClick={onToggleJson} className="text-xs gap-1.5 text-slate-500 hover:text-slate-700">
        <Code2 className="size-3.5" />
        {showJson ? "Ocultar" : "Ver"} JSON completo
      </Button>
      {showJson && (
        <pre className="rounded-lg bg-slate-900 dark:bg-slate-950 p-3 font-mono text-[10px] text-slate-100 dark:text-slate-200 overflow-x-auto max-h-64">
          {JSON.stringify(taf, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── NOTAM Panel ────────────────────────────────────────────────────────

function NotamPanel({ notams, showJson, onToggleJson }: {
  notams: StructuredNotam[]
  showJson: boolean
  onToggleJson: () => void
}) {
  // Por defecto TODOS los NOTAMs expandidos. Para evitar anti-patterns de React
  // (setState dentro de useEffect), guardamos solo los IDs COLAPSADOS por el usuario.
  // Si un ID colapsado ya no existe en la nueva lista, simplemente no matchea — no pasa nada.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (notams.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="size-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No hay NOTAMs activos para esta estación</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Banner: recordatorio de que se muestra texto crudo OACI */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400">
        <FileText className="size-3.5 shrink-0" />
        <span>Los NOTAMs se muestran en <strong>formato crudo OACI</strong> tal cual fueron emitidos por la fuente.</span>
      </div>

      {notams.map((n) => {
        const isOpen = !collapsed.has(n.id)
        return (
          <div key={n.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => toggle(n.id)}
              className="w-full flex items-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <ChevronRight className={cn("size-4 text-slate-400 transition-transform shrink-0", isOpen && "rotate-90")} />
              <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">{n.notamId}</span>
              <Badge variant="outline" className={cn("text-[10px]", statusColors[n.status])}>{n.status}</Badge>
              <span className="ml-auto flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                <NotamCountdown validFrom={n.effectiveFrom} validTo={n.effectiveTo} isPermanent={n.isPermanent} />
              </span>
            </button>

            {/* Expanded content — SOLO TEXTO CRUDO OACI */}
            {isOpen && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                {/* TEXTO CRUDO OACI — único contenido mostrado.
                    Se presenta EXACTAMENTE como lo emite la fuente. Sin interpretación,
                    sin campos parseados, sin vigencia. Todo está en el texto crudo. */}
                <div>
                  <h5 className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FileText className="size-3" />
                    Texto OACI completo (crudo)
                  </h5>
                  <pre className="rounded bg-slate-900 dark:bg-slate-950 p-3 font-mono text-[11px] text-slate-100 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed border border-slate-700 dark:border-slate-800">{n.text}</pre>
                </div>

                {/* JSON — opcional, solo para depuración */}
                {showJson && (
                  <pre className="rounded bg-slate-900 dark:bg-slate-950 p-2 font-mono text-[10px] text-slate-100 dark:text-slate-200 overflow-x-auto max-h-48">
                    {JSON.stringify(n, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )
      })}

      <Button variant="ghost" size="sm" onClick={onToggleJson} className="text-xs gap-1.5 text-slate-500 hover:text-slate-700 mt-2">
        <Code2 className="size-3.5" />
        {showJson ? "Ocultar" : "Ver"} JSON de NOTAMs
      </Button>
    </div>
  )
}

// ─── Agente View (AI Briefing + Chat) ───────────────────────────────────

function AgenteView({ onRefresh }: { onRefresh: () => void }) {
  const [briefing, setBriefing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch("/api/spim-briefing", { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setBriefing(data.briefing)
    } catch {
      setBriefing(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBriefing()
  }, [fetchBriefing])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: "user", content: chatInput, timestamp: new Date().toISOString() }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput("")
    setChatLoading(true)
    try {
      const res = await fetch("/api/spim-briefing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content }),
      })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer || "Sin respuesta", timestamp: new Date().toISOString() }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión", timestamp: new Date().toISOString() }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Briefing */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-1.5">
              <Zap className="size-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Briefing del Agente IA</h3>
              <p className="text-xs text-slate-500">Análisis automático de FIR SPIM</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchBriefing() }} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Actualizar
          </Button>
        </div>
        <div className="p-4">
          {loading && !briefing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Generando briefing operacional...
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          ) : briefing ? (
            <div
              className="text-sm leading-relaxed prose-sm max-w-none [&_li]:mt-0.5 [&_h2]:mt-3 [&_h3]:mt-2"
              dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${renderMarkdown(briefing)}</p>` }}
            />
          ) : (
            <p className="text-sm text-slate-500">No se pudo cargar el briefing.</p>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Bot className="size-4 text-emerald-600" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Consulta al Agente IA</h3>
          <span className="ml-auto text-xs text-slate-400">Pregunta sobre METAR/TAF/NOTAM</span>
        </div>
        <div className="p-4 space-y-3">
          {chatMessages.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="shrink-0 rounded-full bg-emerald-500/15 p-1.5">
                      <Bot className="size-3.5 text-emerald-600" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", msg.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800")}>
                    <div className="prose-sm [&_li]:mt-0.5" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 rounded-full bg-slate-300 dark:bg-slate-700 p-1.5">
                      <User className="size-3.5 text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 rounded-full bg-emerald-500/15 p-1.5">
                    <Bot className="size-3.5 text-emerald-600" />
                  </div>
                  <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2">
                    <Loader2 className="size-4 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {["¿Hay restricciones en pista?", "¿Cuál es la categoría de vuelo actual?", "Resume los NOTAMs urgentes", "¿Condiciones para VFR nocturno?"].map((q) => (
                <Button key={q} variant="outline" size="sm" className="text-xs h-7" onClick={() => setChatInput(q)}>{q}</Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
              placeholder="Escribe tu consulta al agente..."
              disabled={chatLoading || !briefing}
              suppressHydrationWarning
            />
            <Button size="icon" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim() || !briefing} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              {chatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── API View ───────────────────────────────────────────────────────────

function ApiView() {
  const endpoints = [
    { method: "GET", path: "/api/spim-agent/stats", desc: "Estadísticas agregadas + lista de estaciones FIR SPIM" },
    { method: "GET", path: "/api/spim-agent/station/[icao]", desc: "Detalle de estación: METAR + TAF + NOTAMs combinados" },
    { method: "POST", path: "/api/spim-briefing", desc: "Briefing operacional generado por LLM (z-ai-web-dev-sdk)" },
    { method: "POST", path: "/api/spim-briefing/chat", desc: "Consulta al agente IA sobre METAR/TAF/NOTAM" },
    { method: "POST", path: "/api/spim-briefing/ingest", desc: "Ingesta masiva de NOTAMs (parser OACI)" },
    { method: "GET", path: "/api/weather/[icao]", desc: "METAR/TAF individual desde aviationweather.gov" },
    { method: "GET", path: "/api/notams", desc: "Lista de NOTAMs con filtros (fir, airportId, priority, scope)" },
  ]
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Code2 className="size-4 text-emerald-600" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Endpoints de INFO SPIM</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {endpoints.map((e) => (
            <div key={e.path} className="p-3 flex items-center gap-3">
              <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0", e.method === "GET" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30")}>{e.method}</Badge>
              <code className="text-xs font-mono text-slate-900 dark:text-slate-100 shrink-0">{e.path}</code>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Fuentes de datos</h4>
        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2"><Wind className="size-3.5 text-green-600 shrink-0" /> METAR/TAF: NOAA NWS (aviationweather.gov)</li>
          <li className="flex items-center gap-2"><FileText className="size-3.5 text-red-600 shrink-0" /> NOTAMs: AIS Perú · CORPAC (ingesta manual vía parser OACI)</li>
          <li className="flex items-center gap-2"><Bot className="size-3.5 text-emerald-600 shrink-0" /> Agente LLM: z-ai-web-dev-sdk (análisis inteligente)</li>
          <li className="flex items-center gap-2"><Database className="size-3.5 text-blue-600 shrink-0" /> Base de datos: PostgreSQL (Prisma ORM)</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Multi-Station Briefing View ─────────────────────────────────────────
//
// Permite consultar la información de varias estaciones a la vez (METAR,
// TAF y NOTAMs). El usuario ingresa una lista de designadores OACI (SPHI,
// SPRU, SPEO, etc.) separados por comas, espacios o líneas nuevas, y el
// sistema presenta los resultados en dos bloques:
//
//   Bloque 1: METAR y TAF de todas las estaciones solicitadas.
//   Bloque 2: NOTAMs de todas las estaciones solicitadas.

interface WeatherResult {
  icao: string
  ok: boolean
  metar: { raw: string; flightCategory?: string } | null
  taf: { raw: string } | null
  error?: string
}

interface NotamResult {
  icao: string
  ok: boolean
  count: number
  notams: Array<{
    id: string
    notamId: string
    text: string
    effectiveFrom: string
    effectiveTo: string | null
    isPermanent: boolean
    priority: string
    scope: string | null
    airport?: { icaoCode: string; name: string } | null
  }>
  error?: string
}

// Parser de designadores OACI desde texto libre.
// Acepta comas, espacios, puntos y comas, saltos de línea como separadores.
// Filtra códigos válidos (4 letras, mayúsculas automáticamente).
function parseIcaoList(input: string): string[] {
  if (!input.trim()) return []
  const tokens = input
    .toUpperCase()
    .split(/[\s,;]+/)
    .map((t) => t.replace(/[^A-Z]/g, ""))
    .filter((t) => t.length === 4)
  // Eliminar duplicados preservando el orden de entrada.
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t)
      result.push(t)
    }
  }
  return result
}

function MultiStationBriefing() {
  const [input, setInput] = useState("")
  const [icaos, setIcaos] = useState<string[]>([])
  const [weather, setWeather] = useState<WeatherResult[]>([])
  const [notams, setNotams] = useState<NotamResult[]>([])
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [loadingNotams, setLoadingNotams] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    const parsed = parseIcaoList(input)
    if (parsed.length === 0) return
    setIcaos(parsed)
    setSearched(true)
    setWeather([])
    setNotams([])

    // ── Bloque 1: METAR + TAF (uno por estación, en paralelo) ───────
    setLoadingWeather(true)
    Promise.all(
      parsed.map(async (icao) => {
        try {
          const res = await fetch(`/api/weather/${icao}`)
          if (!res.ok) {
            return { icao, ok: false, metar: null, taf: null, error: `HTTP ${res.status}` } as WeatherResult
          }
          const data = await res.json()
          return {
            icao,
            ok: true,
            metar: data.metar ? { raw: data.metar.raw, flightCategory: data.metar.flightCategory } : null,
            taf: data.taf ? { raw: data.taf.raw } : null,
          } as WeatherResult
        } catch (e) {
          return { icao, ok: false, metar: null, taf: null, error: String(e) } as WeatherResult
        }
      }),
    )
      .then((results) => setWeather(results))
      .finally(() => setLoadingWeather(false))

    // ── Bloque 2: NOTAMs (uno por estación, en paralelo) ────────────
    // Necesitamos el airportId de la DB para filtrar. Lo obtenemos
    // consultando /api/airports y filtrando por ICAO en el cliente, o
    // más simple: consultamos /api/notams sin airportId y filtramos por
    // airport.icaoCode en el resultado. Como /api/notams acepta search,
    // usamos search=ICAO para acotar.
    setLoadingNotams(true)
    Promise.all(
      parsed.map(async (icao) => {
        try {
          // Buscar NOTAMs cuyo aeropuerto tenga este ICAO.
          // El API filtra por airportId (DB), no por ICAO, así que
          // usamos search con el ICAO para acotar y luego filtramos.
          const res = await fetch(`/api/notams?search=${encodeURIComponent(icao)}&active=true&limit=200`)
          if (!res.ok) {
            return { icao, ok: false, count: 0, notams: [], error: `HTTP ${res.status}` } as NotamResult
          }
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.notams || []
          // Filtrar solo los que pertenecen a este aeropuerto por ICAO.
          const filtered = list.filter(
            (n: { airport?: { icaoCode?: string } | null; text?: string }) =>
              n.airport?.icaoCode === icao || (n.text || "").includes(`A) ${icao}`),
          )
          return {
            icao,
            ok: true,
            count: filtered.length,
            notams: filtered.map(
              (n: Record<string, unknown>) =>
                ({
                  id: String(n.id),
                  notamId: String(n.notamId),
                  text: String(n.text || ""),
                  effectiveFrom: String(n.effectiveFrom || ""),
                  effectiveTo: (n.effectiveTo as string | null) || null,
                  isPermanent: Boolean(n.isPermanent),
                  priority: String(n.priority || "MEDIUM"),
                  scope: (n.scope as string | null) || null,
                  airport: (n.airport as { icaoCode: string; name: string } | null) || null,
                }),
            ),
          } as NotamResult
        } catch (e) {
          return { icao, ok: false, count: 0, notams: [], error: String(e) } as NotamResult
        }
      }),
    )
      .then((results) => setNotams(results))
      .finally(() => setLoadingNotams(false))
  }, [input])

  const totalWeather = weather.filter((w) => w.ok && (w.metar || w.taf)).length
  const totalNotams = notams.reduce((acc, n) => acc + n.count, 0)
  const allNotamsSorted = sortByExpiry(
    notams.flatMap((n) => n.notams.map((nt) => ({ ...nt, icao: n.icao }))),
  )

  return (
    <div className="space-y-4">
      {/* ─── Input ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-emerald-600" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Briefing Múltiple — Consulta varias estaciones
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Ingresa los designadores OACI de las estaciones (4 letras). Puedes
          separarlos con comas, espacios o líneas nuevas. Ejemplo:
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">SPHI, SPRU, SPEO</code>
        </p>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"SPHI, SPRU, SPEO\nSPJC SPZO\nSPQU;SPRU"}
          className="min-h-[80px] font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSearch()
            }
          }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleSearch}
            disabled={parseIcaoList(input).length === 0 || loadingWeather || loadingNotams}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            {(loadingWeather || loadingNotams) ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            Consultar ({parseIcaoList(input).length} estaciones)
          </Button>
          {icaos.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {icaos.map((icao) => (
                <Badge key={icao} variant="outline" className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  {icao}
                </Badge>
              ))}
            </div>
          )}
          <span className="text-[11px] text-slate-400 ml-auto hidden sm:block">
            ⌘+Enter para consultar
          </span>
        </div>
      </div>

      {/* ─── Resumen ──────────────────────────────────────────────── */}
      {searched && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
              <MapPin className="size-3" /> Estaciones
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{icaos.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
              <Cloud className="size-3" /> METAR/TAF
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {loadingWeather ? "…" : `${totalWeather}/${icaos.length}`}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
              <FileText className="size-3" /> NOTAMs
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {loadingNotams ? "…" : totalNotams}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
              <ListFilter className="size-3" /> Sin datos
            </div>
            <div className="text-xl font-bold text-slate-400 mt-1">
              {icaos.length - totalWeather}
            </div>
          </div>
        </div>
      )}

      {/* ─── Bloque 1: METAR y TAF ────────────────────────────────── */}
      {searched && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-green-50/50 dark:bg-green-950/20">
            <Wind className="size-4 text-green-600" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Bloque 1 — METAR y TAF
            </h3>
            <Badge variant="secondary" className="text-xs ml-auto">
              {loadingWeather ? "Cargando…" : `${totalWeather} con datos`}
            </Badge>
          </div>
          {loadingWeather ? (
            <div className="p-8 text-center">
              <Loader2 className="size-6 text-green-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Consultando METAR/TAF…</p>
            </div>
          ) : weather.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Sin resultados
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weather.map((w) => (
                <div key={w.icao} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{w.icao}</span>
                    {w.metar?.flightCategory && (
                      <Badge variant="outline" className={cn("text-[10px]", flightCategoryColors[w.metar.flightCategory] || "")}>
                        {w.metar.flightCategory}
                      </Badge>
                    )}
                    {!w.ok && (
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-500/30">
                        Error
                      </Badge>
                    )}
                    {w.ok && !w.metar && !w.taf && (
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Sin datos
                      </Badge>
                    )}
                  </div>
                  {w.metar?.raw && (
                    <pre className="rounded bg-slate-900 dark:bg-slate-950 p-2 font-mono text-sm text-slate-100 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-all mb-1.5">
                      <span className="text-green-400">METAR </span>
                      {w.metar.raw}
                    </pre>
                  )}
                  {w.taf?.raw && (
                    <pre className="rounded bg-slate-900 dark:bg-slate-950 p-2 font-mono text-sm text-slate-100 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-all">
                      <span className="text-orange-400">TAF   </span>
                      {w.taf.raw}
                    </pre>
                  )}
                  {w.error && !w.metar && !w.taf && (
                    <p className="text-[11px] text-red-500 font-mono">{w.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Bloque 2: NOTAMs ─────────────────────────────────────── */}
      {searched && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-red-50/50 dark:bg-red-950/20">
            <FileText className="size-4 text-red-600" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Bloque 2 — NOTAMs
            </h3>
            <Badge variant="secondary" className="text-xs ml-auto">
              {loadingNotams ? "Cargando…" : `${totalNotams} NOTAMs`}
            </Badge>
          </div>
          {/* Banner: formato crudo OACI */}
          {!loadingNotams && allNotamsSorted.length > 0 && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <FileText className="size-3.5 shrink-0" />
              <span>NOTAMs en <strong>formato crudo OACI</strong>, tal cual fueron emitidos por AIS Perú. Ordenados por fin de vigencia (más próximo a vencer primero, PERM al final).</span>
            </div>
          )}
          {loadingNotams ? (
            <div className="p-8 text-center">
              <Loader2 className="size-6 text-red-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Consultando NOTAMs…</p>
            </div>
          ) : allNotamsSorted.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No hay NOTAMs activos para las estaciones solicitadas
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto overscroll-contain custom-scrollbar">
              {allNotamsSorted.map((n, idx) => (
                <div key={n.id} className="p-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                      {n.icao}
                    </Badge>
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{n.notamId}</span>
                    {n.priority !== "MEDIUM" && (
                      <Badge variant="outline" className={cn("text-[9px]", priorityColors[n.priority] || "")}>
                        {n.priority}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1.5 ml-auto shrink-0">
                      <NotamCountdownClock
                        effectiveFrom={n.effectiveFrom}
                        effectiveTo={n.effectiveTo}
                        isPermanent={n.isPermanent}
                      />
                      <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                    </span>
                  </div>
                  <pre className="rounded bg-slate-900 dark:bg-slate-950 p-2 font-mono text-[11px] text-slate-100 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {n.text}
                  </pre>
                </div>
              ))}
            </div>
          )}
          {/* Per-station NOTAM counts */}
          {!loadingNotams && notams.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Por estación:</span>
                {notams.map((n) => (
                  <Badge
                    key={n.icao}
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px]",
                      n.count > 0
                        ? "text-red-600 dark:text-red-400 border-red-500/30"
                        : "text-slate-400 border-slate-300",
                    )}
                  >
                    {n.icao}: {n.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <Search className="size-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            Ingresa designadores OACI arriba y presiona <strong>Consultar</strong> para obtener el briefing.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

type MainTab = "gestion" | "notams" | "briefing" | "agente" | "api"

export function SpimBriefing() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<StationSummary | null>(null)
  const [mainTab, setMainTab] = useState<MainTab>("gestion")
  const { isAuthenticated } = useAdminAuth()

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/spim-agent/stats")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: StatsResponse = await res.json()
      setStats(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const { secondsToNext, isFetching, refreshNow, autoOn, setAutoOn } = usePolling(fetchStats, 30)

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* ─── Agent Header ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          {/* Top row: icon + title + badges */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="rounded-xl bg-emerald-600 p-2.5 shadow-sm">
              <Plane className="size-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  INFO SPIM — Información de Aviación FIR SPIM
                </h1>
                <Badge variant="secondary" className="text-xs">Perú</Badge>
                <Badge variant="outline" className="text-xs text-slate-500">v1.1</Badge>
              </div>
            </div>
            {/* Live badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-3 py-1 text-xs font-medium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-green-600" />
              </span>
              <Volume2 className="size-3" />
              Live · 30s
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 mb-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {stats?.totalStations ?? "—"} estaciones · FIR Lima (SPIM)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              METAR · TAF · NOTAM para todos los aeródromos del Perú — API + agente LLM
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Fuentes: NOAA NWS (METAR/TAF) · NOTAMs ingresados manualmente vía AIS Perú · CORPAC
            </p>
          </div>

          {/* Auto-consulta controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Auto-consulta cada 30s</span>
              <Switch checked={autoOn} onCheckedChange={setAutoOn} aria-label="Auto-consulta" />
            </div>
            {autoOn && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                próxima en {secondsToNext}s
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNow}
              disabled={isFetching}
              className="ml-auto gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Consultar ahora
            </Button>
          </div>
        </div>

        {/* Bottom nav tabs */}
        <div className="flex border-t border-slate-200 dark:border-slate-700 overflow-x-auto">
          {([
            { key: "gestion" as const, label: "Gestión", icon: Settings2 },
            { key: "notams" as const, label: "NOTAMs", icon: ClipboardList },
            { key: "briefing" as const, label: "Briefing Múltiple", icon: Search },
            { key: "agente" as const, label: "Agente", icon: Bot },
            { key: "api" as const, label: "API", icon: Code2 },
          ]).map((t) => {
            const active = mainTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setMainTab(t.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Content area ──────────────────────────────────────────── */}
      {selectedStation ? (
        <StationDetailView station={selectedStation} onBack={() => setSelectedStation(null)} />
      ) : mainTab === "gestion" ? (
        <DashboardView stats={stats} loading={loading} onRefresh={refreshNow} onIngested={refreshNow} onSelectStation={setSelectedStation} />
      ) : mainTab === "notams" ? (
        <NotamListing isAdmin={isAuthenticated} />
      ) : mainTab === "briefing" ? (
        <MultiStationBriefing />
      ) : mainTab === "agente" ? (
        <AgenteView onRefresh={refreshNow} />
      ) : (
        <ApiView />
      )}
    </div>
  )
}
