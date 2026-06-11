"use client"

import { useEffect, useState, useCallback } from "react"
import { Plane, Building2, Search, Check, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────

export interface AerodromeOption {
  icaoCode: string
  name: string
  city: string
  elevation?: string
  id?: string
  type: "airport" | "heliport"
  category?: string | null
  arpLatitude?: string | null
  arpLongitude?: string | null
}

interface AerodromeSelectorProps {
  onSelect: (aerodrome: AerodromeOption) => void
  value?: string
  placeholder?: string
  className?: string
  /** Show "Todos los aeródromos" clear option */
  showClear?: boolean
  /** Called when the clear option is selected */
  onClear?: () => void
}

// ─── Component ────────────────────────────────────────────────────

export function AerodromeSelector({
  onSelect,
  value,
  placeholder = "Buscar aeródromo o helipuerto...",
  className,
  showClear = false,
  onClear,
}: AerodromeSelectorProps) {
  const [airports, setAirports] = useState<AerodromeOption[]>([])
  const [heliports, setHeliports] = useState<AerodromeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AerodromeOption | null>(null)

  // Fetch airports and heliports on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [airportsRes, heliportsRes] = await Promise.all([
          fetch("/api/airports"),
          fetch("/api/heliports"),
        ])

        const airportsData = airportsRes.ok ? await airportsRes.json() : []
        const heliportsData = heliportsRes.ok ? await heliportsRes.json() : []

        const airportList: AerodromeOption[] = (Array.isArray(airportsData) ? airportsData : airportsData.airports || []).map(
          (a: Record<string, unknown>) => ({
            icaoCode: a.icaoCode as string,
            name: a.name as string,
            city: a.city as string,
            elevation: a.elevation as string | undefined,
            id: a.id as string | undefined,
            type: "airport" as const,
            category: (a.category as string) || null,
            arpLatitude: (a.arpLatitude as string) || null,
            arpLongitude: (a.arpLongitude as string) || null,
          })
        )

        const heliportList: AerodromeOption[] = (Array.isArray(heliportsData) ? heliportsData : heliportsData.heliports || []).map(
          (h: Record<string, unknown>) => ({
            icaoCode: h.icaoCode as string,
            name: h.name as string,
            city: h.city as string,
            elevation: h.elevation as string | undefined,
            id: h.id as string | undefined,
            type: "heliport" as const,
            category: null,
            arpLatitude: (h.latitude as string) || null,
            arpLongitude: (h.longitude as string) || null,
          })
        )

        setAirports(airportList)
        setHeliports(heliportList)
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Sync external value
  useEffect(() => {
    if (value) {
      const found = [...airports, ...heliports].find((a) => a.icaoCode === value)
      if (found) setSelected(found)
    } else {
      setSelected(null)
    }
  }, [value, airports, heliports])

  const handleSelect = useCallback(
    (aerodrome: AerodromeOption) => {
      setSelected(aerodrome)
      setOpen(false)
      onSelect(aerodrome)
    },
    [onSelect]
  )

  const handleClear = useCallback(() => {
    setSelected(null)
    setOpen(false)
    onClear?.()
  }, [onClear])

  // Find the currently selected aerodrome label
  const selectedLabel = selected
    ? `${selected.icaoCode} — ${selected.name}`
    : null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Seleccionar aeródromo"
            className={cn(
              "justify-start gap-2 font-normal h-9 text-sm truncate",
              selected && "border-amber-300 dark:border-amber-700"
            )}
          >
            {selected ? (
              <>
                <Badge
                  className={cn(
                    "font-bold text-[10px] px-1.5 py-0 tracking-wider shrink-0",
                    selected.type === "airport"
                      ? "bg-navy text-white"
                      : "bg-teal-600 dark:bg-teal-700 text-white"
                  )}
                >
                  {selected.icaoCode}
                </Badge>
                <span className="truncate text-xs">{selected.name}</span>
              </>
            ) : (
              <>
                <Search className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs truncate">
                  {placeholder}
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por ICAO, nombre o ciudad..." />
            <CommandList className="max-h-72">
              <CommandEmpty>No se encontró aeródromo</CommandEmpty>

              {/* Clear / All option */}
              {showClear && (
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={handleClear}
                    className="flex items-center gap-2 text-amber-700 dark:text-amber-400"
                  >
                    <MapPin className="size-3.5" />
                    <span className="text-sm font-medium">Todos los aeródromos</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Airports Group */}
              {!loading && airports.length > 0 && (
                <CommandGroup heading="Aeródromos">
                  {airports.map((airport) => (
                    <CommandItem
                      key={airport.icaoCode}
                      value={`${airport.icaoCode} ${airport.name} ${airport.city}`}
                      onSelect={() => handleSelect(airport)}
                      className="flex items-center gap-2"
                    >
                      <Plane className="size-3.5 text-amber-500 shrink-0" />
                      <Badge
                        className={cn(
                          "font-bold text-[10px] px-1.5 py-0 tracking-wider shrink-0",
                          airport.category === "INTERNACIONAL"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                        )}
                      >
                        {airport.icaoCode}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{airport.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {airport.city}
                          {airport.elevation ? ` · ${airport.elevation}` : ""}
                        </p>
                      </div>
                      {selected?.icaoCode === airport.icaoCode && (
                        <Check className="size-3.5 text-amber-500 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Heliports Group */}
              {!loading && heliports.length > 0 && (
                <CommandGroup heading="Helipuertos">
                  {heliports.map((heliport) => (
                    <CommandItem
                      key={heliport.icaoCode}
                      value={`${heliport.icaoCode} ${heliport.name} ${heliport.city}`}
                      onSelect={() => handleSelect(heliport)}
                      className="flex items-center gap-2"
                    >
                      <Building2 className="size-3.5 text-teal-500 shrink-0" />
                      <Badge className="font-bold text-[10px] px-1.5 py-0 tracking-wider shrink-0 bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-400">
                        {heliport.icaoCode}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{heliport.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {heliport.city}
                          {heliport.elevation ? ` · ${heliport.elevation}` : ""}
                        </p>
                      </div>
                      {selected?.icaoCode === heliport.icaoCode && (
                        <Check className="size-3.5 text-amber-500 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {loading && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Cargando aeródromos...
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear button when something is selected */}
      {selected && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          aria-label="Limpiar selección"
        >
          <X className="size-3.5" />
        </Button>
      )}

      {/* Compact selected info for external use */}
      {selectedLabel && (
        <span className="sr-only">{selectedLabel}</span>
      )}
    </div>
  )
}
