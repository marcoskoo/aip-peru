"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { RoutePoint, RouteSummary } from "@/lib/types"

interface FlightPlanProps {
  initialRoute?: RoutePoint[]
  initialSummary?: RouteSummary
}

/**
 * Plan de Vuelo OACI / ICAO FPL
 *
 * This section renders a self-contained HTML application (located at
 * `/public/fpl.html`) inside an iframe. The HTML app is a standalone ICAO
 * flight-plan form (Items 7–19) with equipment chips, fuel calculator,
 * cruise-level selector, ICAO message generation, PDF export (jsPDF), email
 * sending (SMTP.js), UTC clock and a localStorage-backed database.
 *
 * When `initialRoute` / `initialSummary` are provided (e.g. from the
 * Interactive Map's "Enviar al FPL" button), they are forwarded to the iframe
 * via `postMessage` with type `AIP_PERU_IMPORT_ROUTE`. The iframe listens and
 * auto-fills ADEP/ADES/Route/EET/Endurance/Speed/Level (per OACI Doc 4444 +
 * RAP Peru) — but every field remains user-editable.
 */
export function FlightPlan({
  initialRoute,
  initialSummary,
}: FlightPlanProps) {
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pendingDataRef = useRef<{ route?: RoutePoint[]; summary?: RouteSummary } | null>(null)

  // Store the latest route+summary so we can re-send after iframe loads
  useEffect(() => {
    if (initialRoute && initialRoute.length > 0) {
      pendingDataRef.current = { route: initialRoute, summary: initialSummary }
    } else {
      pendingDataRef.current = null
    }
  }, [initialRoute, initialSummary])

  // Send the route to the iframe via postMessage
  const sendRouteToFpl = useCallback(() => {
    const iframe = iframeRef.current
    const data = pendingDataRef.current
    if (!iframe || !data || !data.route || data.route.length === 0) return
    try {
      iframe.contentWindow?.postMessage(
        {
          type: "AIP_PERU_IMPORT_ROUTE",
          route: data.route.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            lat: p.lat,
            lon: p.lon,
          })),
          summary: data.summary
            ? {
                totalNM: (data.summary as any).totalDistance ?? (data.summary as any).totalNM ?? 0,
                totalEET: (data.summary as any).totalEET ?? "",
                legs: (data.summary as any).legs ?? [],
                departure: (data.summary as any).departure ?? "",
                destination: (data.summary as any).destination ?? "",
              }
            : null,
        },
        "*"
      )
    } catch (e) {
      console.error("Failed to send route to FPL iframe:", e)
    }
  }, [])

  // Re-send when route changes (after iframe already loaded)
  useEffect(() => {
    if (!loading) sendRouteToFpl()
  }, [initialRoute, initialSummary, loading, sendRouteToFpl])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="size-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Plan de Vuelo OACI / ICAO FPL
          </h1>
          <p className="text-sm text-muted-foreground">
            Formulario de plan de vuelo — OACI DOC 4444 PANS-ATM · Anexo 2
          </p>
        </div>
      </div>

      {/* Iframe */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#F0F0F0]">
        {loading && <Skeleton className="h-[90vh] w-full" />}
        <iframe
          ref={iframeRef}
          src="/fpl.html"
          title="Plan de Vuelo OACI / ICAO FPL"
          className="w-full"
          style={{
            minHeight: "90vh",
            border: 0,
            display: loading ? "none" : "block",
          }}
          onLoad={() => {
            setLoading(false)
            // Give the iframe a moment to initialize its JS before sending
            setTimeout(sendRouteToFpl, 500)
          }}
        />
      </div>
    </div>
  )
}
