"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Plane, MapPin, Globe, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AirportCard } from "@/components/airport-card"
import type { Airport } from "@/lib/types"

interface AirportListingProps {
  onSelectAirport: (airport: Airport) => void
}

export function AirportListing({ onSelectAirport }: AirportListingProps) {
  const [airports, setAirports] = useState<Airport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")

  const fetchAirports = useCallback(async () => {
    setLoading(true)
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
      }
    } catch {
      // Silently handle error - empty state will be shown
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

  // Group airports by category
  const internationalAirports = airports.filter(a => a.category === "INTERNACIONAL")
  const nationalAirports = airports.filter(a => a.category !== "INTERNACIONAL")

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
      {/* Hero Section */}
      <div className="relative bg-navy rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-95" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8">
            <Plane className="size-32 text-white rotate-12" />
          </div>
          <div className="absolute bottom-4 left-8">
            <Plane className="size-20 text-white -rotate-45" />
          </div>
        </div>
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-500" />
            <Plane className="size-6 text-amber-500" />
            <div className="h-px w-12 bg-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Publicación de Información Aeronáutica
          </h1>
          <div className="mt-2">
            <span className="text-amber-500 text-xl sm:text-2xl lg:text-3xl font-bold tracking-widest">
              AIP PERÚ
            </span>
          </div>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Información aeronáutica oficial de la República del Perú.
            Consulte datos de aeródromos, pistas, servicios y obstáculos.
          </p>
        </div>
      </div>

      {/* Search Section */}
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
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="h-11 pl-10 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
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
          <span>
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
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
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

          <TabsContent value="todos" className="mt-4">
            <div className="space-y-10">
              {/* Internacional Section */}
              {internationalAirports.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Globe className="size-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm tracking-wide">
                        AEROPUERTOS INTERNACIONALES
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {internationalAirports.length}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {renderAirportGrid(internationalAirports)}
                </div>
              )}

              {/* Nacional Section */}
              {nationalAirports.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <Flag className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm tracking-wide">
                        AEROPUERTOS NACIONALES
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {nationalAirports.length}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {renderAirportGrid(nationalAirports)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="internacionales" className="mt-4">
            {renderAirportGrid(internationalAirports)}
          </TabsContent>

          <TabsContent value="nacionales" className="mt-4">
            {renderAirportGrid(nationalAirports)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
