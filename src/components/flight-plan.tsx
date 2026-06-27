"use client"

import { useState } from "react"
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
 * The `initialRoute` / `initialSummary` props are accepted for backward
 * compatibility with `page.tsx` but are intentionally unused — the iframe
 * application is fully self-contained.
 */
export function FlightPlan({
  initialRoute: _initialRoute,
  initialSummary: _initialSummary,
}: FlightPlanProps) {
  const [loading, setLoading] = useState(true)

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
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#050b14]">
        {loading && <Skeleton className="h-[90vh] w-full" />}
        <iframe
          src="/fpl.html"
          title="Plan de Vuelo OACI / ICAO FPL"
          className="w-full"
          style={{
            minHeight: "90vh",
            border: 0,
            display: loading ? "none" : "block",
          }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  )
}
