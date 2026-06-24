"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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
  fir: string
  priority: string
  scope: string
  subject: string
  condition: string
  text: string
  effectiveFrom: string
  effectiveTo?: string
  isPermanent?: boolean
  airport?: { icaoCode: string; name: string; city: string }
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

export function SpimBriefing() {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showRawMetar, setShowRawMetar] = useState(false)
  const [showRawTaf, setShowRawTaf] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchBriefing = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/spim-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "briefing" }),
      })
      if (!res.ok) throw new Error("Error al obtener briefing")
      const data: BriefingResponse = await res.json()
      setBriefing(data)
    } catch (err) {
      console.error("Error:", err)
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

  return (
    <div className="space-y-4">
      {/* Header */}
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
            <div className="flex items-center gap-2">
              {briefing && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-400 gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {notams.length} NOTAMs activos
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBriefing}
                disabled={loading}
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Weather + NOTAMs Grid */}
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
                  className={cn(
                    "ml-auto text-xs",
                    flightCategoryColors[metar.flightCategory]
                  )}
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
                          className={cn(
                            "ml-auto text-xs",
                            flightCategoryColors[p.flightCategory]
                          )}
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

      {/* NOTAMs Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-500" />
            NOTAMs Activos — FIR Lima
            <Badge variant="outline" className="ml-auto text-xs">
              {notams.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72 overflow-y-auto">
            <div className="space-y-1.5">
              {notams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay NOTAMs activos
                </p>
              ) : (
                notams.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 border border-border/40"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        priorityColors[n.priority] || priorityColors.LOW
                      )}
                    >
                      {n.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold">
                          {n.notamId}
                        </span>
                        {n.airport?.icaoCode && (
                          <Badge variant="secondary" className="text-xs">
                            {n.airport.icaoCode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.subject} {n.condition}
                      </p>
                    </div>
                  </div>
                ))
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
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-3" />
          Fuente: {briefing.source} · Datos: {briefing.weather?.source || "simulado"}
        </div>
      )}
    </div>
  )
}

// Minimal skeleton to avoid extra imports
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className || ""}`} />
}
