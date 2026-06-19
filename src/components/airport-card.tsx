"use client"

import { Plane, Mountain, Flame, ArrowRightLeft, Globe, Flag, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Airport } from "@/lib/types"
import { isInternationalAirport } from "@/lib/utils"

interface AirportCardProps {
  airport: Airport
  onClick: (airport: Airport) => void
}

export function AirportCard({ airport, onClick }: AirportCardProps) {
  const isInternational = isInternationalAirport(airport)

  return (
    <Card
      className={`group relative cursor-pointer overflow-hidden border-l-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
        isInternational
          ? "border-l-amber-500 hover:border-l-amber-600"
          : "border-l-emerald-500 hover:border-l-emerald-600"
      }`}
      onClick={() => onClick(airport)}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          isInternational
            ? "bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/10"
            : "bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/10"
        }`}
      />

      <div className="relative p-4 space-y-3">
        {/* Header: ICAO Code + Category Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xl font-bold tracking-wider text-navy dark:text-slate-100">
              {airport.icaoCode}
            </span>
            {isInternational ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider gap-0.5 w-fit">
                <Globe className="size-2.5" />
                INTERNACIONAL
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider gap-0.5 w-fit">
                <Flag className="size-2.5" />
                NACIONAL
              </Badge>
            )}
          </div>
          <div
            className={`flex items-center justify-center size-9 rounded-lg shrink-0 transition-colors ${
              isInternational
                ? "bg-amber-500/10 group-hover:bg-amber-500/20"
                : "bg-emerald-500/10 group-hover:bg-emerald-500/20"
            }`}
          >
            <Plane
              className={`size-4 transition-all duration-300 group-hover:rotate-[-45deg] ${
                isInternational
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            />
          </div>
        </div>

        {/* Body: Airport Name + Location */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {airport.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {airport.city}
              {airport.department ? `, ${airport.department}` : ""}
            </span>
          </p>
        </div>

        {/* Footer: Technical Data */}
        <div className="flex items-center gap-3 pt-2.5 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1" title="Elevación">
            <Mountain className="size-3 text-muted-foreground/70" />
            <span className="font-medium text-foreground/80">{airport.elevation}</span>
          </div>
          <div className="w-px h-3 bg-border/60" />
          <div className="flex items-center gap-1" title="Categoría de incendio">
            <Flame className="size-3 text-muted-foreground/70" />
            <span className="font-medium text-foreground/80">CAT {airport.fireCategory}</span>
          </div>
          <div className="w-px h-3 bg-border/60" />
          <div className="flex items-center gap-1" title="Tráfico autorizado">
            <ArrowRightLeft className="size-3 text-muted-foreground/70" />
            <span className="font-medium text-foreground/80">{airport.authorizedTraffic}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
