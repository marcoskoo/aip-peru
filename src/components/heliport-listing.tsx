"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Crosshair, Mountain, Building2, Shield, Building, Landmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Heliport } from "@/lib/types"

interface HeliportListingProps {
  onSelectHeliport: (heliport: Heliport) => void
}

const TYPE_CONFIG: Record<string, { label: string; color: string; darkColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  "HOSPITAL": { label: "Hospital", color: "bg-red-100 text-red-800 border-red-200", darkColor: "dark:bg-red-950/50 dark:text-red-400 dark:border-red-800", icon: Building2 },
  "OIL INDUSTRIAL": { label: "Petrolero", color: "bg-amber-100 text-amber-800 border-amber-200", darkColor: "dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800", icon: Landmark },
  "MILITARY": { label: "Militar", color: "bg-green-100 text-green-800 border-green-200", darkColor: "dark:bg-green-950/50 dark:text-green-400 dark:border-green-800", icon: Shield },
  "COMMERCIAL": { label: "Comercial", color: "bg-blue-100 text-blue-800 border-blue-200", darkColor: "dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800", icon: Building },
}

const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "OIL INDUSTRIAL", label: "Petrolero" },
  { value: "MILITARY", label: "Militar" },
  { value: "COMMERCIAL", label: "Comercial" },
]

function getTypeConfig(type?: string) {
  if (!type) return { label: "Otro", color: "bg-slate-100 text-slate-800 border-slate-200", darkColor: "dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800", icon: Crosshair }
  return TYPE_CONFIG[type] || { label: type, color: "bg-slate-100 text-slate-800 border-slate-200", darkColor: "dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800", icon: Crosshair }
}

function getStatusBadge(status: string) {
  if (status === "OPERATIVO") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider">OPERATIVO</Badge>
  }
  if (status === "INACTIVO") {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider">INACTIVO</Badge>
  }
  return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0.5 font-bold tracking-wider">{status}</Badge>
}

function HeliportCard({ heliport, onClick }: { heliport: Heliport; onClick: (h: Heliport) => void }) {
  const typeConfig = getTypeConfig(heliport.type)
  const TypeIcon = typeConfig.icon

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-amber-600/50 group"
      onClick={() => onClick(heliport)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-navy text-white font-bold text-sm px-3 py-1 tracking-wider">
              {heliport.icaoCode}
            </Badge>
            <Badge className={`${typeConfig.color} ${typeConfig.darkColor} text-[10px] px-1.5 py-0.5 font-bold tracking-wider gap-0.5`}>
              <TypeIcon className="size-2.5" />
              {typeConfig.label}
            </Badge>
          </div>
          <Crosshair className="size-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {heliport.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {heliport.city}{heliport.department ? `, ${heliport.department}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {heliport.elevation && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mountain className="size-3.5" />
              <span>{heliport.elevation}</span>
            </div>
          )}
          {getStatusBadge(heliport.status)}
        </div>
      </CardContent>
    </Card>
  )
}

export function HeliportListing({ onSelectHeliport }: HeliportListingProps) {
  const [heliports, setHeliports] = useState<Heliport[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchHeliports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter) params.set("type", typeFilter)
      const response = await fetch(`/api/heliports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setHeliports(Array.isArray(data) ? data : [])
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchHeliports()
  }, [fetchHeliports])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHeliports()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchHeliports])

  // Count by type
  const typeCounts = heliports.reduce<Record<string, number>>((acc, h) => {
    const key = h.type || "OTRO"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-navy rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-95" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8">
            <Crosshair className="size-32 text-white rotate-12" />
          </div>
          <div className="absolute bottom-4 left-8">
            <Crosshair className="size-20 text-white -rotate-45" />
          </div>
        </div>
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-500" />
            <Crosshair className="size-6 text-amber-500" />
            <div className="h-px w-12 bg-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Helipuertos del Perú
          </h1>
          <div className="mt-2">
            <span className="text-amber-500 text-xl sm:text-2xl lg:text-3xl font-bold tracking-widest">
              AIP PERÚ
            </span>
          </div>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Información oficial de helipuertos de la República del Perú.
            Consulte datos de ubicación, superficie, operaciones y comunicaciones.
          </p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ciudad o código ICAO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => {
            const config = filter.value ? TYPE_CONFIG[filter.value] : null
            const Icon = config ? config.icon : Crosshair
            const count = filter.value ? (typeCounts[filter.value] || 0) : heliports.length
            return (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(filter.value)}
                className={
                  typeFilter === filter.value
                    ? "bg-amber-500 text-navy hover:bg-amber-600 gap-1.5 text-xs"
                    : "gap-1.5 text-xs"
                }
              >
                <Icon className="size-3.5" />
                {filter.label}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 ml-0.5">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {loading
              ? "Buscando..."
              : `${heliports.length} helipuerto${heliports.length !== 1 ? "s" : ""} encontrado${heliports.length !== 1 ? "s" : ""}`}
          </span>
          {!loading && heliports.length > 0 && (
            <div className="hidden sm:flex items-center gap-3 flex-wrap">
              {Object.entries(typeCounts).map(([type, count]) => {
                const config = getTypeConfig(type)
                return (
                  <span key={type} className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${type === "HOSPITAL" ? "bg-red-500" : type === "OIL INDUSTRIAL" ? "bg-amber-500" : type === "MILITARY" ? "bg-green-500" : type === "COMMERCIAL" ? "bg-blue-500" : "bg-slate-500"}`} />
                    {count} {config.label.toLowerCase()}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Heliport Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : heliports.length === 0 ? (
        <div className="text-center py-16">
          <Crosshair className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron helipuertos</h3>
          <p className="text-muted-foreground mt-1">
            Intente con otros términos de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heliports.map((heliport) => (
            <HeliportCard
              key={heliport.icaoCode}
              heliport={heliport}
              onClick={onSelectHeliport}
            />
          ))}
        </div>
      )}
    </div>
  )
}
