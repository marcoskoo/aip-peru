"use client"

import { useState, useCallback, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { Moon, Sun, Plane, Map, FileText, Route, Settings, Crosshair, Navigation2, AlertTriangle, Shield, Calculator, Search, BookOpen, Menu, X, Bot } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { VersionHistoryDialog } from "@/components/version-history-dialog"
import { AirportListing } from "@/components/airport-listing"
import { AirportDetailView } from "@/components/airport-detail"
import { HeliportListing } from "@/components/heliport-listing"
import { HeliportDetail } from "@/components/heliport-detail"
import { FlightPlan } from "@/components/flight-plan"
import { RouteCalculator } from "@/components/route-calculator"
import { AirwaysListing } from "@/components/airways-listing"
import { GlobalSearch } from "@/components/global-search"
import { ErrorBoundary } from "@/components/error-boundary"
import { AdminGate } from "@/components/admin-gate"
import type { Airport, Heliport, RoutePoint, RouteSummary } from "@/lib/types"

// Dynamic imports for heavy components to reduce initial bundle
const AeronauticalChart = dynamic(
  () =>
    import("@/components/aeronautical-chart").then(
      (mod) => mod.AeronauticalChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

const AdminPanel = dynamic(
  () =>
    import("@/components/admin-panel").then(
      (mod) => mod.AdminPanel
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

const AirspaceRestrictions = dynamic(
  () =>
    import("@/components/airspace-restrictions").then(
      (mod) => mod.AirspaceRestrictions
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

const AeronauticalCalculator = dynamic(
  () =>
    import("@/components/aeronautical-calculator").then(
      (mod) => mod.AeronauticalCalculator
    ).catch(() => {
      // Return a fallback component if the calculator fails to load
      return function CalculatorFallback() {
        return (
          <div className="text-center py-12">
            <Calculator className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Error al cargar la calculadora</h3>
            <p className="text-muted-foreground mt-1">Intente recargar la página</p>
          </div>
        )
      }
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

const AipPublicationBrowser = dynamic(
  () =>
    import("@/components/aip-publication-browser").then(
      (mod) => mod.AipPublicationBrowser
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

const SpimBriefing = dynamic(
  () =>
    import("@/components/spim-briefing").then(
      (mod) => mod.SpimBriefing
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

type ViewMode = "airports" | "heliports" | "chart" | "flight-plan" | "route-calculator" | "airways" | "admin" | "notams" | "airspace" | "calculator" | "publications" | "spim-briefing"

export default function Home() {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
  const [selectedHeliport, setSelectedHeliport] = useState<Heliport | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("airports")
  const [flightPlanRoute, setFlightPlanRoute] = useState<RoutePoint[] | undefined>(undefined)
  const [flightPlanSummary, setFlightPlanSummary] = useState<RouteSummary | undefined>(undefined)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSelectAirport = (airport: Airport) => {
    setSelectedAirport(airport)
    setViewMode("airports")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSelectHeliport = (heliport: Heliport) => {
    setSelectedHeliport(heliport)
    setViewMode("heliports")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleHeliportBack = () => {
    setSelectedHeliport(null)
  }

  const handleBack = () => {
    setSelectedAirport(null)
  }

  const handleLogoClick = () => {
    setSelectedAirport(null)
    setSelectedHeliport(null)
    setViewMode("airports")
  }

  const handleGenerateFlightPlan = useCallback((route: RoutePoint[], summary: RouteSummary) => {
    setFlightPlanRoute(route)
    setFlightPlanSummary(summary)
    setViewMode("flight-plan")
  }, [])

  const handleSearchResult = useCallback((result: { type: string; id: string; name: string }) => {
    if (result.type === "airport") {
      // Fetch airport details and navigate
      fetch(`/api/airports/${result.name}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedAirport(data)
            setViewMode("airports")
          }
        })
        .catch(() => {})
    } else if (result.type === "heliport") {
      fetch(`/api/heliports/${result.id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedHeliport(data)
            setViewMode("heliports")
          }
        })
        .catch(() => {})
    } else if (result.type === "airway") {
      setViewMode("airways")
    } else if (result.type === "notam") {
      // NOTAMs are now managed inside INFO SPIM — redirect there
      setViewMode("spim-briefing")
    } else if (result.type === "airspace") {
      setViewMode("airspace")
    } else if (result.type === "abbreviation" || result.type === "regulation" || result.type === "authority" || result.type === "aipsection") {
      setViewMode("publications")
    }
  }, [])

  // Navigation buttons configuration
  // Each button always shows its own label. The active one is highlighted with amber styling.
  // NOTAMs section is now integrated into INFO SPIM — the standalone NOTAMs tab is hidden.
  const navButtons = [
    { mode: "publications" as ViewMode, icon: BookOpen, label: "Publicaciones AIP" },
    { mode: "heliports" as ViewMode, icon: Crosshair, label: "Helipuertos" },
    { mode: "airways" as ViewMode, icon: Navigation2, label: "Rutas" },
    { mode: "spim-briefing" as ViewMode, icon: Bot, label: "INFO SPIM" },
    { mode: "airspace" as ViewMode, icon: Shield, label: "Zonas" },
    { mode: "chart" as ViewMode, icon: Map, label: "Carta Aeronáutica" },
    { mode: "route-calculator" as ViewMode, icon: Route, label: "Calculadora" },
    { mode: "calculator" as ViewMode, icon: Calculator, label: "Calc. Aero" },
    { mode: "flight-plan" as ViewMode, icon: FileText, label: "Plan de Vuelo" },
    { mode: "admin" as ViewMode, icon: Settings, label: "Admin" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer shrink-0"
              onClick={handleLogoClick}
            >
              <Plane className="size-6 text-amber-500" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-lg tracking-tight">AIP</span>
                <span className="font-bold text-lg text-amber-500 tracking-wider">
                  PERÚ
                </span>
              </div>
            </div>

            {/* Desktop search (sm and up) */}
            {!selectedAirport && !selectedHeliport && (
              <div className="hidden sm:block flex-1 max-w-xs">
                <GlobalSearch onSelectResult={handleSearchResult} />
              </div>
            )}

            {/* Desktop navigation buttons (lg and up) — hidden on mobile/tablet */}
            {!selectedAirport && !selectedHeliport && (
              <div className="hidden lg:flex items-center gap-1.5">
                {navButtons.map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() =>
                      setViewMode(viewMode === mode ? "airports" : mode)
                    }
                    className={
                      viewMode === mode
                        ? "bg-amber-500 text-navy hover:bg-amber-600 gap-1 text-xs shrink-0"
                        : "text-white hover:bg-navy-light hover:text-amber-400 gap-1 text-xs shrink-0"
                    }
                  >
                    <Icon className="size-3.5" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Right-side action icons (always visible) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {selectedAirport && (
                <Badge className="hidden sm:inline-flex bg-navy-light text-amber-400 border border-amber-500/30 text-xs tracking-wider">
                  {selectedAirport.icaoCode}
                </Badge>
              )}
              {selectedHeliport && (
                <Badge className="hidden sm:inline-flex bg-navy-light text-amber-400 border border-amber-500/30 text-xs tracking-wider">
                  {selectedHeliport.icaoCode}
                </Badge>
              )}

              {/* Mobile search trigger */}
              {!selectedAirport && !selectedHeliport && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-white hover:bg-navy-light hover:text-amber-400"
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true })
                    document.dispatchEvent(event)
                  }}
                >
                  <Search className="size-4" />
                  <span className="sr-only">Buscar</span>
                </Button>
              )}

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-white hover:bg-navy-light hover:text-amber-400"
              >
                <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
              </Button>

              {/* Mobile hamburger menu (below lg) */}
              {!selectedAirport && !selectedHeliport && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-navy-light hover:text-amber-400"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Abrir menú de navegación</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[340px] bg-navy text-white border-amber-500/20 p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10">
            <SheetTitle className="text-white text-left flex items-center gap-2.5">
              <Plane className="size-5 text-amber-500" />
              <span className="font-bold">AIP <span className="text-amber-500">PERÚ</span></span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
              Navegación
            </p>
            {navButtons.map(({ mode, icon: Icon, label }) => {
              const active = viewMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(viewMode === mode ? "airports" : mode)
                    setMobileNavOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    active
                      ? "bg-amber-500 text-navy"
                      : "text-white hover:bg-navy-light hover:text-amber-400"
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{label}</span>
                </button>
              )
            })}


          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {viewMode === "heliports" && selectedHeliport ? (
          <HeliportDetail
            heliport={selectedHeliport}
            onBack={handleHeliportBack}
          />
        ) : viewMode === "heliports" && !selectedHeliport ? (
          <HeliportListing onSelectHeliport={handleSelectHeliport} />
        ) : viewMode === "airways" && !selectedAirport ? (
          <AirwaysListing
            onViewChart={() => setViewMode("chart")}
          />
        ) : viewMode === "spim-briefing" && !selectedAirport ? (
          <SpimBriefing />
        ) : viewMode === "airspace" && !selectedAirport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="size-6 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Zonas de Espacio Aéreo Restringido
                </h1>
                <p className="text-sm text-muted-foreground">
                  Zonas prohibidas, restringidas, de peligro y áreas de control — Perú
                </p>
              </div>
            </div>
            <AirspaceRestrictions />
          </div>
        ) : viewMode === "calculator" && !selectedAirport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calculator className="size-6 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Calculadora Aeronáutica
                </h1>
                <p className="text-sm text-muted-foreground">
                  Herramientas de cálculo para planificación de vuelo — Altitud de densidad, viento, QNH, amanecer/atardecer, conversión de unidades
                </p>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 ml-auto shrink-0">
                <Plane className="size-3" />
                Seleccionar Aeródromo
              </Badge>
            </div>
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <ErrorBoundary>
                <AeronauticalCalculator />
              </ErrorBoundary>
            </Suspense>
          </div>
        ) : viewMode === "publications" && !selectedAirport ? (
          <AipPublicationBrowser
            onNavigateAirports={() => setViewMode("airports")}
            onNavigateHeliports={() => setViewMode("heliports")}
            onNavigateAirways={() => setViewMode("airways")}
            onNavigateAirspace={() => setViewMode("airspace")}
          />
        ) : viewMode === "chart" && !selectedAirport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Map className="size-6 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Carta Aeronáutica
                </h1>
                <p className="text-sm text-muted-foreground">
                  Aerovías, waypoints, radioayudas y límites FIR – Región de
                  información de vuelo Lima (SPIM)
                </p>
              </div>
            </div>
            <AeronauticalChart />
          </div>
        ) : viewMode === "route-calculator" && !selectedAirport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Route className="size-6 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Calculadora de Ruta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Construye una ruta seleccionando waypoints y aerovías – Calcula distancias y tiempos
                </p>
              </div>
            </div>
            <RouteCalculator onGenerateFlightPlan={handleGenerateFlightPlan} />
          </div>
        ) : viewMode === "flight-plan" && !selectedAirport ? (
          <FlightPlan initialRoute={flightPlanRoute} initialSummary={flightPlanSummary} />
        ) : viewMode === "admin" && !selectedAirport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Settings className="size-6 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Panel de Administración
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de datos aeronáuticos — Waypoints, Radioayudas, Aerovías, FIR
                </p>
              </div>
            </div>
            <AdminGate>
              <AdminPanel />
            </AdminGate>
          </div>
        ) : selectedAirport ? (
          <AirportDetailView
            airport={selectedAirport}
            onBack={handleBack}
          />
        ) : (
          <AirportListing onSelectAirport={handleSelectAirport} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Plane className="size-4 text-amber-500" />
              <span className="text-sm font-medium">
                CORPAC S.A. — AIS PERÚ
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* Version history — shows all app versions including 25/06/2026 */}
              <VersionHistoryDialog />
              <p className="text-xs text-slate-400 text-center sm:text-right">
                © {new Date().getFullYear()} Publicación de Información
                Aeronáutica — AIP PERÚ. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
