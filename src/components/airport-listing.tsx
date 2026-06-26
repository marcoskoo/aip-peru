"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Plane, MapPin, Globe, Flag, Navigation, Clock, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AirportCard } from "@/components/airport-card"
import type { Airport } from "@/lib/types"
import { isInternationalAirport } from "@/lib/utils"

interface AirportListingProps {
  onSelectAirport: (airport: Airport) => void
}

export function AirportListing({ onSelectAirport }: AirportListingProps) {
  const [airports, setAirports] = useState<Airport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")

  const fetchAirports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (selectedDepartment) params.set("department", selectedDepartment)
      const response = await fetch(`/api/airports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const airportList = Array.isArray(data) ? data : data.airports || []
        setAirports(airportList)
        const depts = [...new Set(airportList.map((a: Airport) => a.department).filter(Boolean))] as string[]
        setDepartments(depts.sort())
      } else {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.detail || errData?.error || `Error HTTP ${response.status}`
        setError(msg)
        console.error('[AirportListing] API error:', response.status, errData)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de red'
      setError(msg)
      console.error('[AirportListing] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [search, selectedDepartment])

  useEffect(() => {
    fetchAirports()
  }, [fetchAirports])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAirports()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchAirports])

  // Group airports by category.
  const internationalAirports = airports.filter(a => isInternationalAirport(a))
  const nationalAirports = airports.filter(a => !isInternationalAirport(a))

  const renderAirportGrid = (list: Airport[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <Plane className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron aeródromos</h3>
          <p className="text-muted-foreground mt-1">
            Intente con otros términos de búsqueda
          </p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((airport) => (
          <AirportCard
            key={airport.icaoCode}
            airport={airport}
            onClick={onSelectAirport}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Aviation themed with gradient and decorative elements */}
      <div className="relative bg-navy rounded-2xl overflow-hidden shadow-lg">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light" />

        {/* Decorative aviation pattern - subtle flight paths */}
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="flightGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 0 40 L 80 40 M 40 0 L 40 80" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#flightGrid)" />
          </svg>
        </div>

        {/* Decorative planes */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <Plane className="absolute top-6 right-10 size-28 text-amber-400 rotate-[20deg]" strokeWidth={1.2} />
          <Plane className="absolute bottom-4 left-12 size-16 text-white -rotate-45" strokeWidth={1.2} />
        </div>

        {/* Amber accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

        {/* Content */}
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="max-w-3xl mx-auto text-center">
            {/* Top badge with amendment info */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-5">
              <Clock className="size-3 text-amber-400" />
              <span className="text-[11px] font-medium text-slate-200 tracking-wide">
                AMDT 33/2025 · Vigente desde 30 JUL 2025
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-10 bg-amber-500/60 hidden sm:block" />
              <Plane className="size-6 text-amber-500" />
              <div className="h-px w-10 bg-amber-500/60 hidden sm:block" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
              Publicación de Información Aeronáutica
            </h1>
            <div className="mt-2">
              <span className="text-amber-500 text-xl sm:text-2xl lg:text-3xl font-bold tracking-[0.3em]">
                AIP PERÚ
              </span>
            </div>
            <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Información aeronáutica oficial de la República del Perú.
              Consulte datos de aeródromos, pistas, servicios y obstáculos.
            </p>

            {/* Stats row */}
            <div className="mt-7 flex items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {airports.length || 32}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
                  Aeródromos
                </div>
              </div>
              <div className="h-10 w-px bg-white/15" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
                  {internationalAirports.length || 11}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
                  Internacionales
                </div>
              </div>
              <div className="h-10 w-px bg-white/15" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                  {nationalAirports.length || 21}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
                  Nacionales
                </div>
              </div>
            </div>
          </div>
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
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="h-11 pl-10 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
              suppressHydrationWarning
            >
              <option value="">Todos los departamentos</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Navigation className="size-3.5 text-amber-600" />
            {loading
              ? "Buscando..."
              : `${airports.length} aeródromo${airports.length !== 1 ? "s" : ""} encontrado${airports.length !== 1 ? "s" : ""}`}
          </span>
          {!loading && airports.length > 0 && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-amber-600" />
                {internationalAirports.length} internacional{internationalAirports.length !== 1 ? "es" : ""}
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Flag className="size-3.5 text-emerald-600" />
                {nationalAirports.length} nacional{nationalAirports.length !== 1 ? "es" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab-based Airport Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3 border-l-4 border-l-muted">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="size-9 rounded-lg" />
              </div>
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-3 pt-2 border-t">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-red-100 dark:bg-red-950/40 mb-4">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium">Error al cargar aeródromos</h3>
          <p className="text-muted-foreground mt-1 text-sm max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={() => fetchAirports()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      ) : airports.length === 0 ? (
        <div className="text-center py-16">
          <Plane className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No se encontraron aeródromos</h3>
          <p className="text-muted-foreground mt-1">
            Intente con otros términos de búsqueda
          </p>
        </div>
      ) : (
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto gap-1 p-1">
            <TabsTrigger value="todos" className="gap-1.5 text-xs sm:text-sm">
              <Plane className="size-3.5 sm:size-4" />
              <span>Todos</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4">
                {airports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="internacionales" className="gap-1.5 text-xs sm:text-sm">
              <Globe className="size-3.5 sm:size-4" />
              <span>Internacionales</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4">
                {internationalAirports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="nacionales" className="gap-1.5 text-xs sm:text-sm">
              <Flag className="size-3.5 sm:size-4" />
              <span>Nacionales</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4">
                {nationalAirports.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-6">
            <div className="space-y-12">
              {/* Internacional Section */}
              {internationalAirports.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Globe className="size-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm tracking-wider">
                        AEROPUERTOS INTERNACIONALES
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {internationalAirports.length}
                    </Badge>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </div>
                  {renderAirportGrid(internationalAirports)}
                </div>
              )}

              {/* Nacional Section */}
              {nationalAirports.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <Flag className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm tracking-wider">
                        AEROPUERTOS NACIONALES
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {nationalAirports.length}
                    </Badge>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </div>
                  {renderAirportGrid(nationalAirports)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="internacionales" className="mt-6">
            {renderAirportGrid(internationalAirports)}
          </TabsContent>

          <TabsContent value="nacionales" className="mt-6">
            {renderAirportGrid(nationalAirports)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
