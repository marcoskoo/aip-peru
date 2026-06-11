"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import {
  ArrowLeft, Printer, Clock, MapPin, Plane, Radio, ShieldAlert,
  AlertCircle, CheckCircle2, Calendar, ArrowRightLeft, ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

// ─── Types ────────────────────────────────────────────────────────

interface NotamDetailData {
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
  relatedNotams?: NotamDetailData[]
  createdAt: string
  updatedAt: string
}

interface NotamDetailProps {
  notamId: string
  onBack: () => void
  onSelectAirport?: (icaoCode: string) => void
  onSelectNotam?: (notamId: string) => void
}

// ─── Dynamic map import ──────────────────────────────────────────

const NotamMap = dynamic(
  () => import("./aeronautical-chart").then((mod) => mod.AeronauticalChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
  }
)

// ─── Helpers ──────────────────────────────────────────────────────

function getPriorityConfig(priority: string) {
  switch (priority) {
    case "URGENT":
      return { bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-800 dark:text-red-300", border: "border-red-300 dark:border-red-700", label: "URGENTE" }
    case "HIGH":
      return { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-800 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", label: "ALTA" }
    case "MEDIUM":
      return { bg: "bg-yellow-100 dark:bg-yellow-950/50", text: "text-yellow-800 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700", label: "MEDIA" }
    case "LOW":
      return { bg: "bg-green-100 dark:bg-green-950/50", text: "text-green-800 dark:text-green-300", border: "border-green-300 dark:border-green-700", label: "BAJA" }
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", border: "border-slate-300 dark:border-slate-600", label: priority }
  }
}

function getScopeConfig(scope?: string | null) {
  switch (scope) {
    case "A": return { label: "Aeródromo", color: "text-blue-600 dark:text-blue-400" }
    case "E": return { label: "En-ruta", color: "text-purple-600 dark:text-purple-400" }
    case "W": return { label: "Aviso Navegación", color: "text-amber-600 dark:text-amber-400" }
    default: return { label: "N/A", color: "text-muted-foreground" }
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "NOTAMN": return { label: "Nuevo", color: "text-emerald-600 dark:text-emerald-400" }
    case "NOTAMR": return { label: "Reemplazo", color: "text-blue-600 dark:text-blue-400" }
    case "NOTAMC": return { label: "Cancelación", color: "text-red-600 dark:text-red-400" }
    default: return { label: type, color: "text-muted-foreground" }
  }
}

function formatDateTimeUTC(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
  } catch {
    return dateStr
  }
}

function getDuration(from: string, to?: string | null, isPerm?: boolean): string {
  if (isPerm) return "Permanente"
  if (!to) return "Indefinido"
  try {
    const ms = new Date(to).getTime() - new Date(from).getTime()
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} día${days !== 1 ? "s" : ""} ${hours % 24}h`
    return `${hours} hora${hours !== 1 ? "s" : ""}`
  } catch {
    return "—"
  }
}

// ─── Component ────────────────────────────────────────────────────

export function NotamDetail({ notamId, onBack, onSelectAirport, onSelectNotam }: NotamDetailProps) {
  const [notam, setNotam] = useState<NotamDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNotam() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/notams/${notamId}`)
        if (!response.ok) throw new Error("NOTAM no encontrado")
        const data = await response.json()
        setNotam(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar NOTAM")
      } finally {
        setLoading(false)
      }
    }
    fetchNotam()
  }, [notamId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (error || !notam) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Error al cargar NOTAM</h3>
        <p className="text-muted-foreground mt-1">{error || "NOTAM no encontrado"}</p>
        <Button variant="outline" onClick={onBack} className="mt-4 gap-2">
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </div>
    )
  }

  const priorityConf = getPriorityConfig(notam.priority)
  const scopeConf = getScopeConfig(notam.scope)
  const typeConf = getTypeBadge(notam.type)
  const isActive = !notam.effectiveTo || notam.isPermanent || new Date(notam.effectiveTo) > new Date()
  const effectiveFrom = new Date(notam.effectiveFrom)
  const effectiveTo = notam.effectiveTo ? new Date(notam.effectiveTo) : null
  const now = new Date()

  // Timeline progress
  let progressPercent = 0
  if (effectiveTo && !notam.isPermanent) {
    const total = effectiveTo.getTime() - effectiveFrom.getTime()
    const elapsed = now.getTime() - effectiveFrom.getTime()
    progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100))
  } else if (notam.isPermanent) {
    progressPercent = -1 // Permanent
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg bg-navy text-white px-3 py-1 rounded">
            {notam.notamId}
          </span>
          <Badge className={`${priorityConf.bg} ${priorityConf.text} font-bold`}>
            {priorityConf.label}
          </Badge>
          {isActive ? (
            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">Expirado</Badge>
          )}
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-amber-500" />
            Información del NOTAM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key-value rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={AlertCircle} label="Tipo" value={typeConf.label} valueClass={typeConf.color} />
            <InfoRow icon={ShieldAlert} label="Alcance" value={`${notam.scope || "—"} (${scopeConf.label})`} valueClass={scopeConf.color} />
            <InfoRow icon={Radio} label="FIR" value={notam.fir} />
            <InfoRow icon={CheckCircle2} label="Estado" value={notam.verified ? "Verificado" : "No verificado"} valueClass={notam.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
            <InfoRow icon={AlertCircle} label="Asunto" value={notam.subject} />
            <InfoRow icon={AlertCircle} label="Condición" value={notam.condition} />
            {notam.source && <InfoRow icon={Radio} label="Fuente" value={notam.source} />}
            {notam.replacesId && (
              <InfoRow
                icon={ArrowRightLeft}
                label="Reemplaza"
                value={notam.replacesId}
                valueClass="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                onClick={() => onSelectNotam?.(notam.replacesId!)}
              />
            )}
          </div>

          <Separator />

          {/* Full text */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Texto Completo</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{notam.text}</p>
            </div>
          </div>

          <Separator />

          {/* Altitude & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(notam.lowerLimit || notam.upperLimit) && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Límites de Altitud</h4>
                <p className="font-mono text-sm">
                  {notam.lowerLimit || "SFC"} — {notam.upperLimit || "UNL"}
                </p>
              </div>
            )}
            {notam.coordinates && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Coordenadas</h4>
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {notam.coordinates}
                  {notam.radius && <span className="text-muted-foreground ml-1">r={notam.radius}NM</span>}
                </div>
              </div>
            )}
          </div>

          {/* Airport link */}
          {notam.airport && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Plane className="size-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Aeródromo relacionado:</span>
                <button
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  onClick={() => onSelectAirport?.(notam.airport!.icaoCode)}
                >
                  {notam.airport.icaoCode} — {notam.airport.name}
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-5 text-amber-500" />
            Período de Vigencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Inicio</span>
              <p className="font-medium">{formatDateTimeUTC(notam.effectiveFrom)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fin</span>
              <p className="font-medium">
                {notam.isPermanent ? "Permanente" : notam.effectiveTo ? formatDateTimeUTC(notam.effectiveTo) : "Indefinido"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Duración</span>
              <p className="font-medium">{getDuration(notam.effectiveFrom, notam.effectiveTo, notam.isPermanent)}</p>
            </div>
          </div>

          {/* Progress bar */}
          {!notam.isPermanent && effectiveTo && (
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 90 ? "bg-red-500" : progressPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inicio</span>
                <span>{Math.round(progressPercent)}% transcurrido</span>
                <span>Fin</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Card (if coordinates available) */}
      {notam.lat && notam.lon && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-5 text-amber-500" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl overflow-hidden border">
              <NotamMap />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {notam.lat.toFixed(4)}°, {notam.lon.toFixed(4)}°
              {notam.radius && ` · Radio: ${notam.radius} NM`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Related NOTAMs */}
      {notam.relatedNotams && notam.relatedNotams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-5 text-amber-500" />
              NOTAMs Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notam.relatedNotams.map((related) => {
              const relPriority = getPriorityConfig(related.priority)
              const relActive = !related.effectiveTo || related.isPermanent || new Date(related.effectiveTo) > new Date()
              return (
                <div
                  key={related.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectNotam?.(related.notamId)}
                >
                  <span className="font-mono text-sm font-semibold">{related.notamId}</span>
                  <Badge className={`${relPriority.bg} ${relPriority.text} text-[10px]`}>
                    {relPriority.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {related.scope || "—"}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {related.subject} — {related.condition}
                  </span>
                  {relActive ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px]">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Expirado</Badge>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// ─── Helper Sub-component ─────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = "",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueClass?: string
  onClick?: () => void
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-sm font-medium ${valueClass} ${onClick ? "cursor-pointer" : ""}`}
          onClick={onClick}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
