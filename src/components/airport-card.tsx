"use client"

import { Plane, Mountain, Flame, ArrowRightLeft, Globe, Flag } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group ${
        isInternational
          ? "hover:border-amber-600/50"
          : "hover:border-emerald-600/50"
      }`}
      onClick={() => onClick(airport)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-navy text-white font-bold text-sm px-3 py-1 tracking-wider">
              {airport.icaoCode}
            </Badge>
            {isInternational ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider gap-0.5">
                <Globe className="size-2.5" />
                INTL
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider gap-0.5">
                <Flag className="size-2.5" />
                NAC
              </Badge>
            )}
          </div>
          <Plane className={`size-4 text-muted-foreground group-hover:text-amber-600 transition-colors`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {airport.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {airport.city}, {airport.department}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mountain className="size-3.5" />
            <span>{airport.elevation}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="size-3.5" />
            <span>{airport.fireCategory}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowRightLeft className="size-3.5" />
            <span>{airport.authorizedTraffic}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
