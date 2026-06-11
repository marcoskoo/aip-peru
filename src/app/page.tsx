"use client"

import { useState } from "react"
import { Moon, Sun, Plane } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AirportListing } from "@/components/airport-listing"
import { AirportDetailView } from "@/components/airport-detail"
import type { Airport } from "@/lib/types"

export default function Home() {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
  const { theme, setTheme } = useTheme()

  const handleSelectAirport = (airport: Airport) => {
    setSelectedAirport(airport)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    setSelectedAirport(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleBack}>
              <Plane className="size-6 text-amber-500" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-lg tracking-tight">AIP</span>
                <span className="font-bold text-lg text-amber-500 tracking-wider">
                  PERÚ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedAirport && (
                <Badge className="hidden sm:inline-flex bg-navy-light text-amber-400 border border-amber-500/30 text-xs tracking-wider">
                  {selectedAirport.icaoCode}
                </Badge>
              )}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedAirport ? (
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Plane className="size-4 text-amber-500" />
              <span className="text-sm font-medium">
                CORPAC S.A. - AIS PERÚ
              </span>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Publicación de Información
              Aeronáutica - AIP PERÚ. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
