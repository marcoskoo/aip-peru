"use client"

import { Plane, Mountain, Flame, ArrowRightLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Airport } from "@/lib/types"

interface AirportCardProps {
  airport: Airport
  onClick: (airport: Airport) => void
}

export function AirportCard({ airport, onClick }: AirportCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-amber-600/50 group"
      onClick={() => onClick(airport)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className="bg-navy text-white font-bold text-sm px-3 py-1 tracking-wider">
            {airport.icaoCode}
          </Badge>
          <Plane className="size-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
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
