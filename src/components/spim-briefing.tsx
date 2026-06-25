"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Plane,
  RefreshCw,
  Send,
  Bot,
  User,
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  FileText,
  Zap,
  Clock,
  Timer,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { usePolling } from "@/lib/aviation/use-polling"
import {
  parseIsoMs,
  notamStatus,
  formatCountdown,
} from "@/lib/aviation/notam-parser"

// ─── Types ──────────────────────────────────────────────────────────────

interface WeatherData {
  icaoCode: string
  metar: {
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
    cavok?: boolean
  } | null
  taf: {
    raw: string
    time: string
    periods: Array<{
      type: string
      from: string
      to?: string
      flightCategory?: "VFR" | "MVFR" | "IFR" | "LIFR"
    }>
  } | null
  fetchedAt: string
  source: string
}

interface NotamItem {
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
}

interface BriefingResponse {
  briefing: string
  weather: WeatherData
  notams: NotamItem[]
  notamCount: number
  generatedAt: string
  source: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
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

// ─── Helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    })
  } catch {
    return "--:--"
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
  // Simple markdown to HTML: bold, headers, lists, line breaks
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm mt-3 mb-1 text-amber-600 dark:text-amber-400">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-base mt-4 mb-2 text-amber-600 dark:text-amber-400">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, "<br/>")
}

// ─── Countdown hook + component ─────────────────────────────────────────

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
  if (target === null) {
    return { remainingMs: null, critical: false, expired: false }
  }
  const diff = target - Date.now()
  if (diff <= 0) {
    return { remainingMs: 0, critical: true, expired: true }
  }
  return {
    remainingMs: diff,
    critical: diff <= 5 * 60 * 1000, // 5 minutos
    expired: false,
  }
}

function useCountdown(validTo?: string | null, isPermanent?: boolean): CountdownState {
  // "Tick" counter para forzar re-render cada segundo.
  // El estado del countdown se deriva durante el render (no via setState en effect).
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!validTo || validTo === "PERM" || isPermanent) return
    const target = parseIsoMs(validTo)
    if (target === null) return

    // Solo dispara re-render mientras falte tiempo; cuando expira, deja de tickar.
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [validTo, isPermanent])

  // Estado derivado: se recalcula en cada render con el "now" actual.
  return computeCountdown(validTo, isPermanent)
}

/**
 * Reloj de cuenta regresiva para un NOTAM.
 * - Azul negrita mientras falte más de 5 minutos.
 * - Rojo negrita con pulso en los últimos 5 minutos.
 * - "PERM" para NOTAMs permanentes.
 * - "EXPIRADO" en rojo si ya pasó la fecha.
 * - "PRÓXIMO" para NOTAMs aún no vigentes.
 */
function NotamCountdown({
  validFrom,
  validTo,
  isPermanent,
}: {
  validFrom?: string | null
  validTo?: string | null
  isPermanent?: boolean
}) {
  const { remainingMs, critical, expired } = useCountdown(validTo, isPermanent)
  const status = notamStatus(validFrom, validTo ?? (isPermanent ? "PERM" : undefined))

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-600">
        <Timer className="h-3.5 w-3.5" />
        PRÓXIMO
      </span>
    )
  }

  if (!validTo || validTo === "PERM" || isPermanent || remainingMs === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
        <Timer className="h-3.5 w-3.5" />
        PERM
      </span>
    )
  }

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-red-600">
        <Timer className="h-3.5 w-3.5" />
        EXPIRADO
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums",
        critical ? "text-red-600 animate-pulse" : "text-blue-600 dark:text-blue-400"
      )}
      title={critical ? "Expira en menos de 5 minutos" : "Tiempo restante hasta expiración"}
    >
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
      if (data.ok && data.inserted > 0) {
        onIngested()
      }
    } catch (err) {
      setResult({
        ok: false,
        inserted: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : String(err)],
        items: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setText("")
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="size-3.5" />
          <span className="hidden sm:inline">Ingestar NOTAMs</span>
          <span className="sm:hidden">Ingestar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-amber-500" />
            Ingesta manual de NOTAMs
          </DialogTitle>
          <DialogDescription>
            Pega el texto plano del boletín NOTAM recibido por email desde AIS Perú
            (ais@corpac.gob.pe). El parser OACI extraerá cada NOTAM y lo guardará
            en la base de datos, deduplicando por ID.
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
                {result.ok ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="size-4 text-red-600" />
                )}
                <span className="font-semibold">
                  {result.ok
                    ? `${result.inserted} NOTAMs ${result.inserted === 1 ? "procesado" : "procesados"}`
                    : "Error"}
                </span>
                {result.parsedTotal != null && (
                  <Badge variant="secondary" className="text-xs">
                    {result.parsedTotal} detectados
                  </Badge>
                )}
                {result.skipped > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {result.skipped} saltados
                  </Badge>
                )}
              </div>

              {result.items.length > 0 && (
                <ScrollArea className="max-h-40 rounded border">
                  <ul className="divide-y text-xs">
                    {result.items.map((it, i) => (
                      <li key={i} className="p-2 flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            it.action === "created" && "text-emerald-700 border-emerald-500/40 bg-emerald-500/5",
                            it.action === "updated" && "text-blue-700 border-blue-500/40 bg-blue-500/5",
                            it.action === "skipped" && "text-amber-700 border-amber-500/40 bg-amber-500/5"
                          )}
                        >
                          {it.action === "created" ? "CREADO" : it.action === "updated" ? "ACTUALIZADO" : "SALTADO"}
                        </Badge>
                        <span className="font-mono font-semibold">{it.notamId}</span>
                        <Badge variant="secondary" className="text-[10px]">{it.icao}</Badge>
                        <span className="text-muted-foreground line-clamp-1 flex-1 min-w-0">
                          {it.summary}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}

              {result.errors.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-amber-700 dark:text-amber-400">
                    Ver {result.errors.length} advertencia(s)
                  </summary>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {result.errors.map((e, i) => (
                      <li key={i} className="font-mono">{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cerrar
          </Button>
          <Button
            onClick={handleIngest}
            disabled={loading || !text.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-navy gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Procesar NOTAMs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── NOTAM row (collapsible) ────────────────────────────────────────────

function NotamRow({ n }: { n: NotamItem }) {
  const [expanded, setExpanded] = useState(false)
  const status = notamStatus(n.effectiveFrom, n.effectiveTo ?? (n.isPermanent ? "PERM" : undefined))

  const statusBadge = useMemo(() => {
    if (status === "upcoming")
      return (
        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-500/40 bg-amber-500/5">
          próximo
        </Badge>
      )
    if (status === "expired")
      return (
        <Badge variant="outline" className="text-[10px] text-red-700 border-red-500/40 bg-red-500/5">
          expirado
        </Badge>
      )
    if (n.isPermanent || !n.effectiveTo)
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-500/40 bg-emerald-500/5">
          permanente
        </Badge>
      )
    return (
      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-500/40 bg-emerald-500/5">
        vigente
      </Badge>
    )
  }, [status, n.isPermanent, n.effectiveTo])

  return (
    <div className="rounded-md border border-border/60 bg-background/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        <Badge
          variant="outline"
          className={cn("text-[10px] shrink-0", priorityColors[n.priority] || priorityColors.LOW)}
        >
          {n.priority}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold">{n.notamId}</span>
            {n.airport?.icaoCode && (
              <Badge variant="secondary" className="text-[10px]">{n.airport.icaoCode}</Badge>
            )}
            {n.scope && (
              <Badge variant="outline" className="text-[10px] h-4">{n.scope}</Badge>
            )}
            {statusBadge}
            <span className="ml-auto">
              <NotamCountdown
                validFrom={n.effectiveFrom}
                validTo={n.effectiveTo}
                isPermanent={n.isPermanent}
              />
            </span>
            {expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            <span className="font-medium text-foreground/90">{n.subject}</span>{" "}
            <span className="text-amber-700 dark:text-amber-400">{n.condition}</span>
            {" — "}
            {n.text.split("\n").find((l) => l.startsWith("E)"))?.replace(/^E\)\s*/, "").slice(0, 120) || n.text.slice(0, 120)}
          </p>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40">
          <pre className="font-mono text-[11px] bg-muted/50 p-2 rounded whitespace-pre-wrap overflow-x-auto max-h-72">
            {n.text}
          </pre>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono flex-wrap">
            {n.effectiveFrom && (
              <span>Desde: {formatDateTime(n.effectiveFrom)}</span>
            )}
            {n.effectiveTo && (
              <span>
                Hasta: {n.isPermanent ? "PERM" : formatDateTime(n.effectiveTo)}
              </span>
            )}
            {n.source && <span>Fuente: {n.source}</span>}
            {n.verified && (
              <Badge variant="outline" className="text-[10px] h-4 text-emerald-700 border-emerald-500/40">
                verificado
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────

export function SpimBriefing() {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showRawMetar, setShowRawMetar] = useState(false)
  const [showRawTaf, setShowRawTaf] = useState(false)
  const [autoOn, setAutoOn] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchBriefing = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/spim-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "briefing" }),
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: BriefingResponse = await res.json()
      setBriefing(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling determinista cada 30s
  const { secondsToNext, isFetching, refreshNow } = usePolling({
    fetcher: fetchBriefing,
    intervalMs: 30_000,
    enabled: autoOn,
    runOnMount: true,
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading || !briefing) return
    const userMsg: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput("")
    setChatLoading(true)

    try {
      const res = await fetch("/api/spim-briefing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg.content,
          weather: briefing.weather,
          notams: briefing.notams,
        }),
      })
      if (!res.ok) throw new Error("Error en chat")
      const data = await res.json()
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: data.timestamp,
        },
      ])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error al procesar tu consulta. Intenta nuevamente.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const metar = briefing?.weather?.metar
  const taf = briefing?.weather?.taf
  const notams = briefing?.notams || []

  // Stats para el header
  const urgentCount = notams.filter((n) => n.priority === "URGENT").length
  const highCount = notams.filter((n) => n.priority === "HIGH").length
  const permCount = notams.filter((n) => n.isPermanent).length
  const expiringSoon = notams.filter((n) => {
    if (n.isPermanent || !n.effectiveTo) return false
    const ms = parseIsoMs(n.effectiveTo)
    return ms !== null && ms > Date.now() && ms - Date.now() <= 60 * 60 * 1000 // 1h
  }).length

  return (
    <div className="space-y-4">
      {/* Header con branding + controles de polling */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-navy to-navy-light text-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="rounded-full bg-amber-500/20 p-2.5">
                <Bot className="size-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Agente IA SPIM
                </h2>
                <p className="text-sm text-slate-300">
                  Briefing operacional NOTAM · METAR · TAF — FIR Lima
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {briefing && (
                <>
                  {urgentCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-red-500/40 text-red-400 gap-1"
                    >
                      <AlertTriangle className="size-3" />
                      {urgentCount} urgentes
                    </Badge>
                  )}
                  {expiringSoon > 0 && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 gap-1"
                    >
                      <Timer className="size-3" />
                      {expiringSoon} expiran &lt;1h
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400 gap-1"
                  >
                    <CheckCircle2 className="size-3" />
                    {notams.length} NOTAMs
                  </Badge>
                </>
              )}
              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 px-2 py-1 rounded-md border border-white/10">
                <Clock className="size-3" />
                <span className="font-mono">{secondsToNext}s</span>
                <Switch
                  checked={autoOn}
                  onCheckedChange={setAutoOn}
                  id="auto-polling"
                  aria-label="Auto-refresh cada 30 segundos"
                />
                <Label htmlFor="auto-polling" className="sr-only">
                  Auto-refresh cada 30 segundos
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNow}
                disabled={isFetching}
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-1.5"
              >
                {isFetching ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
          {autoOn && (
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-2">
              <Badge variant="secondary" className="font-mono text-[10px] gap-1">
                <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
                {isFetching ? "consultando NOAA + AIS…" : `próxima consulta en ${secondsToNext}s`}
              </Badge>
              <span className="text-slate-400">
                · Polling automático cada 30s · Datos oficiales CORPAC AIS Perú
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && !briefing && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-rose-500/10 border border-rose-500/30">
          <AlertTriangle className="size-4 mt-0.5 text-rose-600 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-rose-700">Error al cargar el briefing</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* AI Briefing Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-amber-500" />
            Briefing del Agente
            {briefing && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {formatTime(briefing.generatedAt)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !briefing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generando briefing operacional...
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </div>
          ) : briefing ? (
            <div
              className="text-sm leading-relaxed prose-sm max-w-none [&_li]:mt-0.5 [&_h2]:mt-3 [&_h3]:mt-2"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-2">${renderMarkdown(briefing.briefing)}</p>`,
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el briefing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weather Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* METAR Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudSun className="size-4 text-blue-500" />
              METAR — SPIM
              {metar?.flightCategory && (
                <Badge
                  variant="outline"
                  className={cn("ml-auto text-xs", flightCategoryColors[metar.flightCategory])}
                >
                  {metar.flightCategory}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metar ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="text-muted-foreground">Viento</span>
                    <p className="font-mono font-semibold">
                      {metar.wind.variable
                        ? "VRB"
                        : String(metar.wind.direction).padStart(3, "0")}
                      ° {metar.wind.speed}kt
                      {metar.wind.gust ? ` G${metar.wind.gust}` : ""}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="text-muted-foreground">Visibilidad</span>
                    <p className="font-mono font-semibold">
                      {metar.visibility.value >= 9999
                        ? "CAVOK"
                        : `${metar.visibility.value}m`}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="text-muted-foreground">Temp/Pto.Rocío</span>
                    <p className="font-mono font-semibold">
                      {metar.temperature}° / {metar.dewpoint}°
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="text-muted-foreground">QNH</span>
                    <p className="font-mono font-semibold">{metar.qnh} hPa</p>
                  </div>
                </div>
                {metar.weather && metar.weather.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {metar.weather.map((w, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {w}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawMetar(!showRawMetar)}
                  className="w-full text-xs h-7"
                >
                  {showRawMetar ? "Ocultar" : "Ver"} METAR crudo
                </Button>
                {showRawMetar && (
                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
                    {metar.raw}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                METAR no disponible
              </p>
            )}
          </CardContent>
        </Card>

        {/* TAF Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="size-4 text-purple-500" />
              TAF — SPIM
              {taf && taf.periods.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {taf.periods.length} períodos
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {taf ? (
              <>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {taf.periods.slice(0, 6).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs border-b border-border/40 pb-1"
                    >
                      <Badge variant="outline" className="text-xs font-mono">
                        {p.type}
                      </Badge>
                      <span className="text-muted-foreground font-mono">
                        {formatTime(p.from)}
                        {p.to ? ` → ${formatTime(p.to)}` : ""}
                      </span>
                      {p.flightCategory && (
                        <Badge
                          variant="outline"
                          className={cn("ml-auto text-xs", flightCategoryColors[p.flightCategory])}
                        >
                          {p.flightCategory}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawTaf(!showRawTaf)}
                  className="w-full text-xs h-7"
                >
                  {showRawTaf ? "Ocultar" : "Ver"} TAF crudo
                </Button>
                {showRawTaf && (
                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
                    {taf.raw}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">TAF no disponible</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NOTAMs Summary con countdown + ingest */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-500" />
            NOTAMs Activos — FIR Lima
            <Badge variant="outline" className="ml-auto text-xs">
              {notams.length} total
              {permCount > 0 && (
                <span className="text-emerald-700 dark:text-emerald-400 ml-1">
                  · {permCount} PERM
                </span>
              )}
            </Badge>
          </CardTitle>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              Orden: expiración más próxima primero · Click en un NOTAM para ver detalle
            </p>
            <NotamIngestDialog onIngested={refreshNow} />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96 overflow-y-auto">
            <div className="space-y-1.5 pr-2">
              {notams.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <FileText className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No hay NOTAMs activos para FIR Lima
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usa <strong>Ingestar NOTAMs</strong> para pegar boletines desde AIS Perú
                  </p>
                </div>
              ) : (
                notams.map((n) => <NotamRow key={n.id} n={n} />)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Chat */}
      <Card className="border-amber-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-amber-500" />
            Consulta al Agente IA
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Pregunta sobre METAR/TAF/NOTAM
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Chat messages */}
          {chatMessages.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 rounded-full bg-amber-500/15 p-1.5">
                      <Bot className="size-3.5 text-amber-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-navy text-white"
                        : "bg-muted/60"
                    )}
                  >
                    <div
                      className="prose-sm [&_li]:mt-0.5"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content),
                      }}
                    />
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 rounded-full bg-navy/15 p-1.5">
                      <User className="size-3.5 text-navy" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 rounded-full bg-amber-500/15 p-1.5">
                    <Bot className="size-3.5 text-amber-600" />
                  </div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Suggested questions */}
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                "¿Hay restricciones en pista?",
                "¿Cuál es la categoría de vuelo actual?",
                "Resume los NOTAMs urgentes",
                "¿Condiciones para VFR nocturno?",
              ].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setChatInput(q)
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendChat()
                }
              }}
              placeholder="Escribe tu consulta al agente..."
              disabled={chatLoading || !briefing}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50"
              suppressHydrationWarning
            />
            <Button
              size="icon"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim() || !briefing}
              className="bg-amber-500 hover:bg-amber-600 text-navy shrink-0"
            >
              {chatLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Source info */}
      {briefing && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
          <FileText className="size-3" />
          <span>Fuente: {briefing.source}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Datos meteorológicos: {briefing.weather?.source || "simulado"}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>NOTAMs: Prisma + PostgreSQL · Parser OACI local</span>
        </div>
      )}
    </div>
  )
}

// Minimal skeleton to avoid extra imports
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className || "")} />
}
