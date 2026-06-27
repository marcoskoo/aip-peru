"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Search, Plane, MapPin, Globe, Flag, Navigation, Clock, AlertTriangle, CloudSun, CloudFog } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AirportCard } from "@/components/airport-card"
import type { Airport } from "@/lib/types"
import { isInternationalAirport } from "@/lib/utils"

interface AirportListingProps {
  onSelectAirport: (airport: Airport) => void
}

export function AirportListing({ onSelectAirport }: AirportListingProps) {
  const [airports, setAirports] = useState<Airport[]>([])
  const [weatherStatus, setWeatherStatus] = useState<Record<string, boolean>>({})
  const [weatherStatusLoading, setWeatherStatusLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")

  // Fetch airports list
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

  // Fetch weather status (one batched call for all airports)
  const fetchWeatherStatus = useCallback(async () => {
    setWeatherStatusLoading(true)
    try {
      const response = await fetch('/api/airports/weather-status')
      if (response.ok) {
        const data = await response.json()
        setWeatherStatus(data || {})
      }
    } catch (e) {
      console.error('[AirportListing] weather-status fetch error:', e)
    } finally {
      setWeatherStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAirports()
  }, [fetchAirports])

  // Fetch weather status once on mount (independent of search/dept filters)
  useEffect(() => {
    fetchWeatherStatus()
  }, [fetchWeatherStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAirports()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchAirports])

  // Determinar si un aeropuerto tiene METAR/TAF disponible
  const hasWeather = useCallback(
    (icao: string): boolean => {
      return Boolean(weatherStatus[icao.toUpperCase()])
    },
    [weatherStatus]
  )

  // Agrupar aeropuertos según la nueva estructura solicitada:
  //   Grupo 1 — Con METAR/TAF
  //     1a. Internacionales (ordenados por ICAO)
  //     1b. Nacionales (ordenados por ICAO)
  //   Grupo 2 — Sin METAR/TAF
  //     Todos los demás (ordenados por ICAO)
  const {
    weatherIntl,
    weatherNatl,
    noWeather,
  } = useMemo(() => {
    const withWeather: Airport[] = []
    const withoutWeather: Airport[] = []

    for (const a of airports) {
      if (hasWeather(a.icaoCode)) {
        withWeather.push(a)
      } else {
        withoutWeather.push(a)
      }
    }

    const weatherIntl = withWeather
      .filter((a) => isInternationalAirport(a))
      .sort((a, b) => a.icaoCode.localeCompare(b.icaoCode))
    const weatherNatl = withWeather
      .filter((a) => !isInternationalAirport(a))
      .sort((a, b) => a.icaoCode.localeCompare(b.icaoCode))
    const noWeather = withoutWeather
      .sort((a, b) => a.icaoCode.localeCompare(b.icaoCode))

    return { weatherIntl, weatherNatl, noWeather }
  }, [airports, hasWeather])

  const totalWithWeather = weatherIntl.length + weatherNatl.length

  // Totales por categoría (independientemente de si tienen METAR o no)
  const internationalAirports = airports.filter((a) => isInternationalAirport(a))
  const nationalAirports = airports.filter((a) => !isInternationalAirport(a))

  const renderAirportGrid = (list: Airport[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-10">
          <Plane className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-medium">No se encontraron aeródromos</h3>
          <p className="text-muted-foreground mt-1 text-xs">
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

            {/* Stats row — Total / Internacionales / Nacionales
                Cada bloque muestra el total y, debajo, cuántos tienen METAR */}
            <div className="mt-7 flex items-stretch justify-center gap-4 sm:gap-8">
              {/* Total de Aeródromos */}
              <div className="text-center px-2 sm:px-4">
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
                  {airports.length || 32}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-300 mt-1.5 font-semibold">
                  Aeródromos
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                  Total registrados
                </div>
              </div>

              <div className="w-px bg-white/15" />

              {/* Internacionales — total + cuántos con METAR */}
              <div className="text-center px-2 sm:px-4">
                <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums leading-none">
                  {internationalAirports.length || 0}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300/80 mt-1.5 font-semibold">
                  Internacionales
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-400/70 mt-0.5">
                  {weatherIntl.length} con METAR
                </div>
              </div>

              <div className="w-px bg-white/15" />

              {/* Nacionales — total + cuántos con METAR */}
              <div className="text-center px-2 sm:px-4">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-400 tabular-nums leading-none">
                  {nationalAirports.length || 0}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-300/80 mt-1.5 font-semibold">
                  Nacionales
                </div>
                <div className="text-[9px] sm:text-[10px] text-emerald-400/70 mt-0.5">
                  {weatherNatl.length} con METAR
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
                <CloudSun className="size-3.5 text-amber-600" />
                {totalWithWeather} con METAR/TAF
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <CloudFog className="size-3.5 text-slate-500" />
                {noWeather.length} sin METAR/TAF
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Airport Groups — Dos grupos principales */}
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
        <div className="space-y-12">
          {/* ═══════════════════════════════════════════════════
              GRUPO 1 — Aeródromos CON información METAR / TAF
              (Internacionales primero, luego Nacionales)
              ═══════════════════════════════════════════════════ */}
          {totalWithWeather > 0 && (
            <section className="space-y-8">
              {/* Encabezado del Grupo 1 */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <CloudSun className="size-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-amber-800 dark:text-amber-300 text-sm sm:text-base tracking-wider">
                    CON INFORMACIÓN METAR / TAF
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {totalWithWeather}
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-300/60 to-transparent dark:from-amber-700/60" />
              </div>

              {/* Grupo 1a — Internacionales con METAR/TAF */}
              {weatherIntl.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pl-2 border-l-4 border-amber-500">
                    <Globe className="size-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-xs sm:text-sm tracking-wider uppercase">
                      Aeropuertos Internacionales
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      {weatherIntl.length}
                    </Badge>
                  </div>
                  {renderAirportGrid(weatherIntl)}
                </div>
              )}

              {/* Grupo 1b — Nacionales con METAR/TAF */}
              {weatherNatl.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pl-2 border-l-4 border-emerald-500">
                    <Flag className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm tracking-wider uppercase">
                      Aeropuertos Nacionales
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                      {weatherNatl.length}
                    </Badge>
                  </div>
                  {renderAirportGrid(weatherNatl)}
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════════════════════════════════════
              GRUPO 2 — Aeródromos SIN información METAR / TAF
              ═══════════════════════════════════════════════════ */}
          {noWeather.length > 0 && (
            <section className="space-y-5">
              {/* Encabezado del Grupo 2 */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                  <CloudFog className="size-5 text-slate-500 dark:text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm sm:text-base tracking-wider">
                    SIN INFORMACIÓN METAR / TAF
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {noWeather.length}
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-300/60 to-transparent dark:from-slate-700/60" />
              </div>

              {/* Sub-división opcional — Internacionales sin METAR/TAF */}
              {noWeather.filter((a) => isInternationalAirport(a)).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pl-2 border-l-4 border-amber-400/60">
                    <Globe className="size-4 text-amber-600/70 dark:text-amber-400/70" />
                    <h3 className="font-semibold text-amber-800/80 dark:text-amber-300/70 text-xs sm:text-sm tracking-wider uppercase">
                      Aeropuertos Internacionales
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-amber-300/60 text-amber-700/80 dark:border-amber-700/60 dark:text-amber-400/70">
                      {noWeather.filter((a) => isInternationalAirport(a)).length}
                    </Badge>
                  </div>
                  {renderAirportGrid(noWeather.filter((a) => isInternationalAirport(a)))}
                </div>
              )}

              {/* Sub-división — Nacionales sin METAR/TAF */}
              {noWeather.filter((a) => !isInternationalAirport(a)).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pl-2 border-l-4 border-emerald-400/60">
                    <Flag className="size-4 text-emerald-600/70 dark:text-emerald-400/70" />
                    <h3 className="font-semibold text-emerald-800/80 dark:text-emerald-300/70 text-xs sm:text-sm tracking-wider uppercase">
                      Aeropuertos Nacionales
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-emerald-300/60 text-emerald-700/80 dark:border-emerald-700/60 dark:text-emerald-400/70">
                      {noWeather.filter((a) => !isInternationalAirport(a)).length}
                    </Badge>
                  </div>
                  {renderAirportGrid(noWeather.filter((a) => !isInternationalAirport(a)))}
                </div>
              )}
            </section>
          )}

          {/* Indicador de carga del estado METAR/TAF */}
          {weatherStatusLoading && airports.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <div className="size-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Verificando disponibilidad de METAR / TAF…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
