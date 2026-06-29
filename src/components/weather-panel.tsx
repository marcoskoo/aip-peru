"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Cloud, Sun, CloudRain, Wind, Eye, Thermometer, Gauge,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CloudFog, CloudSnow, CloudLightning, Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AerodromeSelector, type AerodromeOption } from "@/components/aerodrome-selector"

// ─── Types ────────────────────────────────────────────────────────

interface WeatherData {
  icaoCode: string
  metar?: {
    raw: string
    time: string
    wind: { direction: number; speed: number; gust?: number; variable?: boolean; varFrom?: number; varTo?: number }
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
  speci?: {
    raw: string
    time: string
    wind: { direction: number; speed: number; gust?: number; variable?: boolean; varFrom?: number; varTo?: number }
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
  }[]
  taf?: {
    raw: string
    time: string
    periods: {
      type: string // FM, BECMG, TEMPO, PROB
      from: string
      to?: string
      probability?: number
      wind?: { direction: number; speed: number; gust?: number }
      visibility?: { value: number; unit: string }
      clouds?: { quantity: string; height: number; type?: string }[]
      weather?: string[]
      flightCategory?: "VFR" | "MVFR" | "IFR" | "LIFR"
    }[]
  }
  lastUpdated?: string
  fetchedAt?: string
}

interface WeatherPanelProps {
  icaoCode: string
  /** When true, shows an AerodromeSelector at the top to change the active aerodrome */
  showSelector?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────

function getFlightCategoryConfig(cat: string) {
  switch (cat) {
    case "VFR":
      return { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-800 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", label: "VFR", description: "Condiciones visuales" }
    case "MVFR":
      return { bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-800 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", label: "MVFR", description: "Visual marginal" }
    case "IFR":
      return { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-800 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", label: "IFR", description: "Instrumentos" }
    case "LIFR":
      return { bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-800 dark:text-red-300", border: "border-red-300 dark:border-red-700", label: "LIFR", description: "Instrumentos limitadas" }
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", border: "border-slate-300 dark:border-slate-600", label: "N/A", description: "" }
  }
}

function getCloudIcon(quantity: string) {
  switch (quantity) {
    case "SKC":
    case "CLR":
      return Sun
    case "FEW":
      return Cloud
    case "SCT":
      return Cloud
    case "BKN":
      return CloudFog
    case "OVC":
      return CloudRain
    default:
      return Cloud
  }
}

function getCloudLabel(quantity: string) {
  switch (quantity) {
    case "SKC": return "Despejado"
    case "CLR": return "Despejado"
    case "FEW": return "Pocas"
    case "SCT": return "Dispersas"
    case "BKN": return "Fragmentadas"
    case "OVC": return "Cubierto"
    default: return quantity
  }
}

function formatWeatherTime(timeStr: string) {
  try {
    const d = new Date(timeStr)
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " Z"
  } catch {
    return timeStr
  }
}

// ─── Component ────────────────────────────────────────────────────

export function WeatherPanel({ icaoCode, showSelector = false }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRawMetar, setShowRawMetar] = useState(false)
  const [showRawTaf, setShowRawTaf] = useState(false)
  const [showSpeciDetails, setShowSpeciDetails] = useState(true)
  const [activeIcao, setActiveIcao] = useState(icaoCode)

  // Sync icaoCode prop to internal state
  useEffect(() => {
    setActiveIcao(icaoCode)
  }, [icaoCode])

  const handleAerodromeSelect = useCallback((aero: AerodromeOption) => {
    setActiveIcao(aero.icaoCode)
  }, [])

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/weather/${activeIcao}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Error al obtener datos meteorológicos")
      }
      const data = await response.json()
      setWeather(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [activeIcao])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  if (loading) {
    return <WeatherSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="size-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium">Error al cargar datos meteorológicos</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchWeather} className="mt-3 gap-1.5">
            <RefreshCw className="size-3.5" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!weather || !weather.metar) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Cloud className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Datos meteorológicos no disponibles</p>
          <p className="text-xs text-muted-foreground mt-1">No se encontraron datos para {activeIcao}</p>
        </CardContent>
      </Card>
    )
  }

  const metar = weather.metar
  const taf = weather.taf
  const speci = weather.speci || []
  const catConfig = getFlightCategoryConfig(metar.flightCategory)

  return (
    <div className="space-y-4">
      {/* Aerodrome Selector */}
      {showSelector && (
        <div className="flex items-center gap-3">
          <AerodromeSelector
            onSelect={handleAerodromeSelect}
            value={activeIcao}
            placeholder="Seleccionar aeródromo para meteorología..."
          />
        </div>
      )}

      {/* METAR Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="size-5 text-amber-500" />
              METAR — {activeIcao}
            </CardTitle>
            <div className="flex items-center gap-2">
              {metar.auto && (
                <Badge variant="outline" className="text-[10px]">AUTO</Badge>
              )}
              {metar.cavok && (
                <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px]">
                  CAVOK
                </Badge>
              )}
              <Badge className={`${catConfig.bg} ${catConfig.text} border ${catConfig.border} font-bold text-xs px-3 py-1`}>
                {catConfig.label}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {catConfig.description} · {formatWeatherTime(metar.time)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Decoded Weather Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Wind */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Wind className="size-3" />
                Viento
              </div>
              <div className="text-sm font-semibold">
                {metar.wind.variable ? "VRB" : `${metar.wind.direction}°`} {metar.wind.speed} kt
                {metar.wind.gust && ` G${metar.wind.gust}`}
              </div>
              {metar.wind.variable && metar.wind.varFrom && metar.wind.varTo && (
                <div className="text-[10px] text-muted-foreground">
                  Var {metar.wind.varFrom}°–{metar.wind.varTo}°
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Eye className="size-3" />
                Visibilidad
              </div>
              <div className="text-sm font-semibold">
                {metar.visibility.value >= 9999 ? ">10 km" : `${metar.visibility.value} ${metar.visibility.unit}`}
              </div>
            </div>

            {/* Temperature & Dewpoint */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Thermometer className="size-3" />
                Temperatura
              </div>
              <div className="text-sm font-semibold">
                {metar.temperature}°C
              </div>
              <div className="text-[10px] text-muted-foreground">
                Pto. rocío: {metar.dewpoint}°C
              </div>
            </div>

            {/* QNH */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Gauge className="size-3" />
                QNH
              </div>
              <div className="text-sm font-semibold">
                {metar.qnh} hPa
              </div>
              <div className="text-[10px] text-muted-foreground">
                {Math.round(metar.qnh * 0.02953 * 100) / 100} inHg
              </div>
            </div>

            {/* Clouds */}
            <div className="bg-muted/30 rounded-lg p-3 col-span-2 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Cloud className="size-3" />
                Nubes
              </div>
              {metar.clouds.length === 0 ? (
                <div className="text-sm font-semibold">SKC / CAVOK</div>
              ) : (
                <div className="space-y-1">
                  {metar.clouds.map((cloud, i) => {
                    const CloudIcon = getCloudIcon(cloud.quantity)
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CloudIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{getCloudLabel(cloud.quantity)}</span>
                        <span className="text-muted-foreground">{cloud.height * 100} ft</span>
                        {cloud.type && <Badge variant="outline" className="text-[9px] h-4">{cloud.type}</Badge>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Weather phenomena */}
          {metar.weather && metar.weather.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metar.weather.map((w, i) => (
                <Badge key={i} variant="outline" className="text-xs gap-1">
                  {getWeatherIcon(w)}
                  {w}
                </Badge>
              ))}
            </div>
          )}

          {/* Raw METAR */}
          <Collapsible open={showRawMetar} onOpenChange={setShowRawMetar}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground">
                {showRawMetar ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {showRawMetar ? "Ocultar" : "Ver"} METAR crudo
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded-lg p-3 mt-1">
                <p className="text-xs font-mono">{metar.raw}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* SPECI Card — Reportes Especiales */}
      {speci.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-5 text-amber-500" />
                SPECI — {activeIcao}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold">
                  {speci.length} REPORTE{speci.length !== 1 ? "S" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSpeciDetails(!showSpeciDetails)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {showSpeciDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  {showSpeciDetails ? "Contraer" : "Expandir"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Reportes especiales emitidos por cambios significativos en las condiciones meteorológicas (últimas 3 h)
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {showSpeciDetails && (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {speci.map((s, i) => {
                  const sCat = getFlightCategoryConfig(s.flightCategory)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.3) }}
                      className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300">
                            SPECI
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatWeatherTime(s.time)}
                          </span>
                          {s.auto && (
                            <Badge variant="outline" className="text-[9px] h-4">AUTO</Badge>
                          )}
                          {s.cavok && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[9px] h-4 px-1">
                              CAVOK
                            </Badge>
                          )}
                        </div>
                        <Badge className={`${sCat.bg} ${sCat.text} border ${sCat.border} text-[9px] h-4 px-1.5 font-bold`}>
                          {sCat.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Wind className="size-3 text-muted-foreground" />
                          <span className="font-medium">
                            {s.wind.variable ? "VRB" : `${s.wind.direction}°`} {s.wind.speed} kt
                            {s.wind.gust && ` G${s.wind.gust}`}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3 text-muted-foreground" />
                          <span className="font-medium">
                            {s.visibility.value >= 9999 ? ">10 km" : `${s.visibility.value} ${s.visibility.unit}`}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Thermometer className="size-3 text-muted-foreground" />
                          <span className="font-medium">{s.temperature}°C</span>
                          <span className="text-muted-foreground">/ {s.dewpoint}°C</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="size-3 text-muted-foreground" />
                          <span className="font-medium">{s.qnh} hPa</span>
                        </span>
                      </div>
                      {s.clouds.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {s.clouds.map((cloud, ci) => {
                            const CloudIcon = getCloudIcon(cloud.quantity)
                            return (
                              <span key={ci} className="flex items-center gap-1">
                                <CloudIcon className="size-3 text-muted-foreground" />
                                <span className="font-medium">{getCloudLabel(cloud.quantity)}</span>
                                <span className="text-muted-foreground">{cloud.height * 100} ft</span>
                                {cloud.type && (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1">{cloud.type}</Badge>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {s.weather && s.weather.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.weather.map((w, wi) => (
                            <Badge key={wi} variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                              {getWeatherIcon(w)}
                              {w}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="bg-muted/40 dark:bg-muted/20 rounded-md p-2 mt-1">
                        <p className="text-[11px] font-mono text-muted-foreground break-all">{s.raw}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
            {!showSpeciDetails && (
              <div className="text-xs text-muted-foreground italic">
                {speci.length} reporte{speci.length !== 1 ? "s" : ""} especial{speci.length !== 1 ? "es" : ""} en las últimas 3 horas — Expanda para ver detalles
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAF Card */}
      {taf && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="size-5 text-amber-500" />
                TAF — {activeIcao}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {formatWeatherTime(taf.time)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {taf.periods.map((period, i) => {
              const periodCat = period.flightCategory
                ? getFlightCategoryConfig(period.flightCategory)
                : null

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5 min-w-[52px] justify-center">
                    {period.type}
                    {period.probability && ` ${period.probability}%`}
                  </Badge>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatWeatherTime(period.from)}
                        {period.to && ` → ${formatWeatherTime(period.to)}`}
                      </span>
                      {periodCat && (
                        <Badge className={`${periodCat.bg} ${periodCat.text} text-[9px] h-4 px-1.5`}>
                          {periodCat.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {period.wind && (
                        <span>
                          <Wind className="size-3 inline mr-0.5" />
                          {period.wind.direction}°@{period.wind.speed}kt
                          {period.wind.gust && `G${period.wind.gust}`}
                        </span>
                      )}
                      {period.visibility && (
                        <span>
                          <Eye className="size-3 inline mr-0.5" />
                          {period.visibility.value >= 9999 ? ">10km" : `${period.visibility.value}${period.visibility.unit}`}
                        </span>
                      )}
                      {period.clouds && period.clouds.map((c, ci) => (
                        <span key={ci}>
                          {c.quantity} {c.height * 100}ft
                        </span>
                      ))}
                    </div>
                    {period.weather && period.weather.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {period.weather.map((w, wi) => (
                          <Badge key={wi} variant="outline" className="text-[9px] h-4 px-1">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {/* Raw TAF */}
            <Collapsible open={showRawTaf} onOpenChange={setShowRawTaf}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground">
                  {showRawTaf ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  {showRawTaf ? "Ocultar" : "Ver"} TAF crudo
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-muted/50 rounded-lg p-3 mt-1">
                  <p className="text-xs font-mono whitespace-pre-wrap">{taf.raw}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Last updated + Refresh */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Última actualización: {(weather.fetchedAt || weather.lastUpdated) ? new Date(weather.fetchedAt || weather.lastUpdated!).toLocaleTimeString("es-PE") : "—"}
        </span>
        <Button variant="ghost" size="sm" onClick={fetchWeather} className="gap-1.5 h-7 text-xs">
          <RefreshCw className="size-3" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────

function WeatherSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16 ml-auto" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3 space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Weather Icon Helper ──────────────────────────────────────────

function getWeatherIcon(code: string) {
  if (code.includes("TS") || code.includes("TSRA")) return <CloudLightning className="size-3" />
  if (code.includes("SN")) return <CloudSnow className="size-3" />
  if (code.includes("FG") || code.includes("BR") || code.includes("HZ")) return <CloudFog className="size-3" />
  if (code.includes("RA") || code.includes("SH")) return <CloudRain className="size-3" />
  return <Cloud className="size-3" />
}
