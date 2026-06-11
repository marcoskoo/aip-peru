"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Plane, Crosshair, MapPin, Radio, Navigation2, AlertCircle, Shield, Search, BookOpen, Scale, BookMarked
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────

interface SearchResult {
  id: string
  name: string
  type: "airport" | "heliport" | "waypoint" | "navaid" | "airway" | "notam" | "airspace" | "abbreviation" | "regulation" | "aipsection"
  subtitle?: string
  extra?: string
}

interface SearchCategory {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  results: SearchResult[]
}

interface GlobalSearchProps {
  onSelectResult?: (result: SearchResult) => void
}

// ─── Category Config ─────────────────────────────────────────────

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  airport: { label: "Aeropuertos", icon: Plane },
  heliport: { label: "Helipuertos", icon: Crosshair },
  waypoint: { label: "Waypoints", icon: MapPin },
  navaid: { label: "Radioayudas", icon: Radio },
  airway: { label: "Aerovías", icon: Navigation2 },
  notam: { label: "NOTAMs", icon: AlertCircle },
  airspace: { label: "Zonas", icon: Shield },
  abbreviation: { label: "Abreviaturas", icon: BookMarked },
  regulation: { label: "Regulaciones", icon: Scale },
  aipsection: { label: "Secciones AIP", icon: BookOpen },
}

// ─── Component ────────────────────────────────────────────────────

export function GlobalSearch({ onSelectResult }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchCategory[]>([])
  const [loading, setLoading] = useState(false)

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (response.ok) {
        const data = await response.json()

        // Transform API response into grouped categories
        const categories: SearchCategory[] = []

        // Airports
        if (data.airports?.length > 0) {
          categories.push({
            key: "airport",
            label: "Aeropuertos",
            icon: Plane,
            results: data.airports.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: a.icaoCode as string,
              type: "airport" as const,
              subtitle: a.name as string,
              extra: (a.city as string) || "",
            })),
          })
        }

        // Heliports
        if (data.heliports?.length > 0) {
          categories.push({
            key: "heliport",
            label: "Helipuertos",
            icon: Crosshair,
            results: data.heliports.map((h: Record<string, unknown>) => ({
              id: h.id as string,
              name: h.icaoCode as string,
              type: "heliport" as const,
              subtitle: h.name as string,
              extra: (h.city as string) || "",
            })),
          })
        }

        // Waypoints
        if (data.waypoints?.length > 0) {
          categories.push({
            key: "waypoint",
            label: "Waypoints",
            icon: MapPin,
            results: data.waypoints.map((w: Record<string, unknown>) => ({
              id: w.id as string,
              name: w.id as string,
              type: "waypoint" as const,
              subtitle: (w.name as string) || (w.description as string) || "",
              extra: `${(w.lat as number)?.toFixed(2)}°, ${(w.lon as number)?.toFixed(2)}°`,
            })),
          })
        }

        // Navaids
        if (data.navaids?.length > 0) {
          categories.push({
            key: "navaid",
            label: "Radioayudas",
            icon: Radio,
            results: data.navaids.map((n: Record<string, unknown>) => ({
              id: n.id as string,
              name: n.id as string,
              type: "navaid" as const,
              subtitle: `${(n.name as string) || ""} ${(n.type as string) || ""}`,
              extra: (n.frequency as string) || "",
            })),
          })
        }

        // Airways
        if (data.airways?.length > 0) {
          categories.push({
            key: "airway",
            label: "Aerovías",
            icon: Navigation2,
            results: data.airways.map((aw: Record<string, unknown>) => ({
              id: aw.id as string,
              name: aw.designator as string,
              type: "airway" as const,
              subtitle: `${aw.type} ${aw.level}`,
              extra: "",
            })),
          })
        }

        // NOTAMs
        if (data.notams?.length > 0) {
          categories.push({
            key: "notam",
            label: "NOTAMs",
            icon: AlertCircle,
            results: data.notams.map((n: Record<string, unknown>) => ({
              id: n.id as string,
              name: n.notamId as string,
              type: "notam" as const,
              subtitle: `${n.subject} ${n.condition}`,
              extra: n.priority as string,
            })),
          })
        }

        // Airspace Restrictions
        if (data.restrictions?.length > 0) {
          categories.push({
            key: "airspace",
            label: "Zonas",
            icon: Shield,
            results: data.restrictions.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              name: r.designator as string,
              type: "airspace" as const,
              subtitle: r.name as string,
              extra: r.type as string,
            })),
          })
        }

        // Abbreviations
        if (data.abbreviations?.length > 0) {
          categories.push({
            key: "abbreviation",
            label: "Abreviaturas",
            icon: BookMarked,
            results: data.abbreviations.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: a.code as string,
              type: "abbreviation" as const,
              subtitle: a.meaning as string,
              extra: a.meaningEn as string || "",
            })),
          })
        }

        // Regulations
        if (data.regulations?.length > 0) {
          categories.push({
            key: "regulation",
            label: "Regulaciones",
            icon: Scale,
            results: data.regulations.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              name: r.code as string,
              type: "regulation" as const,
              subtitle: r.title as string,
              extra: r.type as string,
            })),
          })
        }

        // AIP Sections
        if (data.aipSections?.length > 0) {
          categories.push({
            key: "aipsection",
            label: "Secciones AIP",
            icon: BookOpen,
            results: data.aipSections.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.sectionCode as string,
              type: "aipsection" as const,
              subtitle: s.title as string,
              extra: s.part as string,
            })),
          })
        }

        setResults(categories)
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (result: SearchResult) => {
    onSelectResult?.(result)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 w-full sm:w-64 px-3 rounded-md border border-white/20 bg-white/10 text-sm text-white/80 hover:bg-white/20 hover:text-white transition-colors"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/60">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Búsqueda Global"
        description="Buscar aeropuertos, waypoints, radioayudas, NOTAMs y más..."
      >
        <CommandInput
          placeholder="Escriba al menos 2 caracteres..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <CommandEmpty>Escriba al menos 2 caracteres para buscar</CommandEmpty>
          ) : loading ? (
            <CommandEmpty>Buscando...</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>No se encontraron resultados para &quot;{query}&quot;</CommandEmpty>
          ) : (
            results.map((category, ci) => {
              const CatIcon = category.icon
              return (
                <div key={category.key}>
                  {ci > 0 && <CommandSeparator />}
                  <CommandGroup heading={category.label}>
                    {category.results.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.name} ${result.subtitle || ""} ${result.extra || ""}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3"
                      >
                        <CatIcon className="size-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{result.name}</span>
                            <Badge variant="outline" className="text-[9px] gap-0.5 h-4 px-1 shrink-0">
                              {category.label}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                        </div>
                        {result.extra && (
                          <span className="text-xs text-muted-foreground shrink-0 font-mono">{result.extra}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
