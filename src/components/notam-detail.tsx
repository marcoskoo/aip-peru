"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft, Printer, Plane,
  AlertCircle, Calendar, ArrowRightLeft, ExternalLink, ChevronRight
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

// ─── Helpers ──────────────────────────────────────────────────────

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

      {/* TEXTO CRUDO OACI — único contenido principal.
          Se muestra EXACTAMENTE como lo emite la fuente (FAA USNS en vivo o AIS Perú manual).
          Sin interpretación, sin campos parseados, sin resumen. Todos los campos OACI
          (Q, A, B, C, D, E) están incluidos en este texto tal cual. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-5" />
              Texto OACI completo (crudo)
            </span>
            {notam.source && (
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900">
                Fuente: {notam.source}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 border border-slate-700 dark:border-slate-800">
            <p className="text-sm font-mono text-slate-100 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{notam.text}</p>
          </div>
        </CardContent>
      </Card>

      {/* Período de vigencia — campos B)/C) del NOTAM, factual. */}
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

      {/* Aeródromo relacionado — asociación factual, no interpretación del NOTAM. */}
      {notam.airport && (
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      )}

      {/* NOTAMs relacionados — solo ID + estado, sin subject/condition (que son interpretación). */}
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
              const relActive = !related.effectiveTo || related.isPermanent || new Date(related.effectiveTo) > new Date()
              return (
                <div
                  key={related.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectNotam?.(related.notamId)}
                >
                  <span className="font-mono text-sm font-semibold">{related.notamId}</span>
                  {relActive ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px]">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Expirado</Badge>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground ml-auto" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
