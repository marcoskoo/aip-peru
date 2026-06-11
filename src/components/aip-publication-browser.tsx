'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, FileText, Search, ChevronRight, ChevronDown, Globe, Plane,
  Building2, Shield, Clock, Phone, Mail, MapPin, Calendar,
  ArrowRight, Languages, BookMarked, Scale, Hash, Info, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ────────────────────────────────────────────────────────

interface AipPublicationBrowserProps {
  onNavigateAirports?: () => void
  onNavigateHeliports?: () => void
  onNavigateAirways?: () => void
  onNavigateAirspace?: () => void
}

interface AipSectionData {
  sectionCode: string
  title: string
  titleEn: string
  part: string
  subPart: string
  orderIndex: number
  content?: string
  contentEn?: string
  sourceFile?: string
  lastAmendment?: string
  effectiveDate?: string
}

// ─── Section Tree ────────────────────────────────────────────────

const sectionTree = [
  {
    part: 'GEN',
    label: 'GEN - General',
    labelEn: 'General',
    icon: BookOpen,
    groups: [
      {
        subPart: '1',
        label: 'GEN 1 - Reglamentos y Requisitos Nacionales',
        sections: [
          { code: 'GEN_1.1', title: 'Autoridades Designadas' },
          { code: 'GEN_1.2', title: 'Entrada, Tránsito y Salida de Aeronaves' },
          { code: 'GEN_1.4', title: 'Entrada, Tránsito y Salida de Mercancías' },
          { code: 'GEN_1.5', title: 'Instrumentos, Equipos y Documentos de Vuelo' },
          { code: 'GEN_1.6', title: 'Resumen de Reglamentos Nacionales' },
          { code: 'GEN_1.7', title: 'Diferencias respecto de las Normas OACI' },
        ]
      },
      {
        subPart: '2',
        label: 'GEN 2 - Tablas y Códigos',
        sections: [
          { code: 'GEN_2.1', title: 'Sistema de Medidas, Marcas, Días Feriados' },
          { code: 'GEN_2.2', title: 'Abreviaturas' },
          { code: 'GEN_2.3', title: 'Símbolos Cartográficos' },
        ]
      }
    ]
  },
  {
    part: 'ENR',
    label: 'ENR - En Ruta',
    labelEn: 'En Route',
    icon: Plane,
    groups: [
      {
        subPart: '3',
        label: 'ENR 3 - Rutas ATS',
        sections: [],
        action: 'airways' as const
      },
      {
        subPart: '4',
        label: 'ENR 4 - Radioayudas',
        sections: [],
      },
      {
        subPart: '5',
        label: 'ENR 5 - Zonas Prohibidas, Restringidas y Peligrosas',
        sections: [],
        action: 'airspace' as const
      }
    ]
  },
  {
    part: 'AD',
    label: 'AD - Aeródromos',
    labelEn: 'Aerodromes',
    icon: Building2,
    groups: [
      {
        subPart: '2',
        label: 'AD 2 - Aeródromos',
        sections: [],
        action: 'airports' as const
      },
      {
        subPart: '3',
        label: 'AD 3 - Heliportos',
        sections: [],
        action: 'heliports' as const
      }
    ]
  }
]

// ─── Main Component ──────────────────────────────────────────────

export function AipPublicationBrowser({ onNavigateAirports, onNavigateHeliports, onNavigateAirways, onNavigateAirspace }: AipPublicationBrowserProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [sectionData, setSectionData] = useState<AipSectionData | null>(null)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['GEN']))

  // Fetch section data
  const fetchSectionData = useCallback(async (code: string) => {
    setSectionLoading(true)
    try {
      const r = await fetch(`/api/aip-sections/${code}`)
      const d = r.ok ? await r.json() : null
      setSectionData(d)
    } catch {
      setSectionData(null)
    } finally {
      setSectionLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCode) {
      fetchSectionData(selectedCode)
    }
  }, [selectedCode, fetchSectionData])

  const toggleGroup = (part: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(part)) next.delete(part)
      else next.add(part)
      return next
    })
  }

  const handleSectionClick = (code: string) => {
    setSelectedCode(code)
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'airports': onNavigateAirports?.(); break
      case 'heliports': onNavigateHeliports?.(); break
      case 'airways': onNavigateAirways?.(); break
      case 'airspace': onNavigateAirspace?.(); break
    }
  }

  // Filter sections by search
  const filteredTree = searchQuery
    ? sectionTree.map(part => ({
        ...part,
        groups: part.groups.map(g => ({
          ...g,
          sections: g.sections.filter(s =>
            s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        })).filter(g => g.sections.length > 0 || g.action)
      })).filter(p => p.groups.length > 0)
    : sectionTree

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-10rem)]">
      {/* Left Sidebar - Section Tree */}
      <div className="w-full lg:w-80 shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-amber-500" />
                AIP PERÚ
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="h-7 gap-1 text-xs"
              >
                <Languages className="size-3" />
                {lang === 'es' ? 'EN' : 'ES'}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar sección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)] lg:h-[calc(100vh-16rem)]">
              <div className="px-2 pb-2">
                {filteredTree.map(part => {
                  const PartIcon = part.icon
                  const isExpanded = expandedGroups.has(part.part)
                  return (
                    <div key={part.part} className="mb-1">
                      <button
                        onClick={() => toggleGroup(part.part)}
                        className="flex items-center gap-2 w-full px-2 py-2 rounded-md hover:bg-muted/50 text-left transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <PartIcon className="size-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold truncate">{part.label}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-4 border-l border-border/50 pl-2">
                          {part.groups.map(group => (
                            <div key={group.subPart}>
                              <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {group.label}
                              </div>
                              {group.sections.map(section => (
                                <button
                                  key={section.code}
                                  onClick={() => handleSectionClick(section.code)}
                                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-xs transition-colors ${
                                    selectedCode === section.code
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
                                      : 'hover:bg-muted/50 text-foreground/80'
                                  }`}
                                >
                                  <Hash className="size-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{section.title}</span>
                                </button>
                              ))}
                              {group.action && (
                                <button
                                  onClick={() => handleAction(group.action!)}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                >
                                  <ArrowRight className="size-3 shrink-0" />
                                  <span>Ver en la aplicación</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          {!selectedCode ? (
            // Welcome View
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md space-y-6 p-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="size-8 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Publicación de Información Aeronáutica</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Seleccione una sección del panel izquierdo para ver su contenido. La AIP PERÚ contiene información aeronáutica oficial de la República del Perú.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BookOpen, label: 'GEN', desc: 'General' },
                    { icon: Plane, label: 'ENR', desc: 'En Ruta' },
                    { icon: Building2, label: 'AD', desc: 'Aeródromos' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-muted/30">
                      <item.icon className="size-5 mx-auto text-amber-500 mb-1" />
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">AMDT 33/2025</Badge>
                  <span>•</span>
                  <span>30 JUL 2025</span>
                  <span>•</span>
                  <span>CORPAC S.A.</span>
                </div>
              </div>
            </div>
          ) : sectionLoading ? (
            // Loading
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Cargando sección...</p>
              </div>
            </div>
          ) : sectionData ? (
            // Section Content
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {sectionData.sectionCode}
                    </Badge>
                    {sectionData.lastAmendment && (
                      <Badge variant="secondary" className="text-[10px]">
                        {sectionData.lastAmendment}
                      </Badge>
                    )}
                    {sectionData.effectiveDate && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="size-3 mr-1" />
                        {sectionData.effectiveDate}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">
                    {lang === 'en' && sectionData.titleEn ? sectionData.titleEn : sectionData.title}
                  </h2>
                  {lang === 'es' && sectionData.titleEn && (
                    <p className="text-xs text-muted-foreground mt-1">{sectionData.titleEn}</p>
                  )}
                  {lang === 'en' && sectionData.title && (
                    <p className="text-xs text-muted-foreground mt-1">{sectionData.title}</p>
                  )}
                  {sectionData.sourceFile && (
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <FileText className="size-3" />
                      Fuente: {sectionData.sourceFile}
                    </p>
                  )}
                </div>

                {/* Specialized Views */}
                {selectedCode === 'GEN_1.1' && <AuthoritiesView lang={lang} />}
                {selectedCode === 'GEN_1.6' && <RegulationsView lang={lang} />}
                {selectedCode === 'GEN_2.1' && <HolidaysView lang={lang} />}
                {selectedCode === 'GEN_2.2' && <AbbreviationsView lang={lang} />}

                {/* Generic HTML Content */}
                {!['GEN_1.1', 'GEN_1.6', 'GEN_2.1', 'GEN_2.2'].includes(selectedCode) && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: lang === 'en' && sectionData.contentEn
                          ? sectionData.contentEn
                          : sectionData.content || '<p>Contenido no disponible</p>'
                      }}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            // Error
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Info className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No se pudo cargar la sección</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── Authorities View ────────────────────────────────────────────

function AuthoritiesView({ lang }: { lang: 'es' | 'en' }) {
  const [authorities, setAuthorities] = useState<Record<string, Array<{
    name: string; nameEn?: string; address?: string; phone?: string; email?: string; aftn?: string
  }>> | null>(null)

  useEffect(() => {
    fetch('/api/authorities')
      .then(r => r.ok ? r.json() : null)
      .then(d => setAuthorities(d))
      .catch(() => {})
  }, [])

  if (!authorities) return <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-amber-500" /></div>

  const categoryIcons: Record<string, React.ComponentType<{className?: string}>> = {
    'Aviación Civil': Plane,
    'Meteorología Aeronáutica': Cloud,
    'Aduanas': Shield,
    'Sanidad': Heart,
    'Investigación de Accidentes': AlertCircle,
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {lang === 'en'
          ? 'Designated authorities responsible for facilitating international air navigation'
          : 'Autoridades designadas que se encargan de facilitar la navegación aérea internacional'}
      </p>
      {Object.entries(authorities).map(([category, auths]) => {
        const Icon = categoryIcons[category] || Building2
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Icon className="size-4 text-amber-500" />
              {category}
            </h3>
            <div className="grid gap-2">
              {auths.map((auth, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium">
                      {lang === 'en' && auth.nameEn ? auth.nameEn : auth.name}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {auth.address && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="size-3 shrink-0" />{auth.address}
                        </p>
                      )}
                      {auth.phone && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Phone className="size-3 shrink-0" />{auth.phone}
                        </p>
                      )}
                      {auth.email && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Mail className="size-3 shrink-0" />{auth.email}
                        </p>
                      )}
                      {auth.aftn && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Hash className="size-3 shrink-0" />AFTN: {auth.aftn}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Regulations View ────────────────────────────────────────────

function RegulationsView({ lang }: { lang: 'es' | 'en' }) {
  const [regulations, setRegulations] = useState<Array<{
    code: string; title: string; titleEn?: string; type: string
  }>>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/regulations')
      .then(r => r.ok ? r.json() : [])
      .then(d => setRegulations(d))
      .catch(() => {})
  }, [])

  const types = ['all', ...new Set(regulations.map(r => r.type))]
  const filtered = filter === 'all' ? regulations : regulations.filter(r => r.type === filter)

  const typeColors: Record<string, string> = {
    'LEY': 'bg-red-500/10 text-red-600 dark:text-red-400',
    'REGLAMENTO': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'RAP': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'CONVENIO': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {lang === 'en'
          ? 'Summary of national regulations and international agreements'
          : 'Resumen de reglamentos nacionales y acuerdos/convenios internacionales'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {types.map(t => (
          <Button
            key={t}
            variant={filter === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(t)}
            className={`h-7 text-[11px] ${filter === t ? 'bg-amber-500 text-white' : ''}`}
          >
            {t === 'all' ? 'Todos' : t}
          </Button>
        ))}
      </div>
      <div className="space-y-1">
        {filtered.map(reg => (
          <div
            key={reg.code}
            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors"
          >
            <Badge variant="outline" className="text-[10px] font-mono shrink-0 mt-0.5">
              {reg.code}
            </Badge>
            <div className="min-w-0">
              <p className="text-xs font-medium">
                {lang === 'en' && reg.titleEn ? reg.titleEn : reg.title}
              </p>
              <Badge className={`text-[10px] mt-1 ${typeColors[reg.type] || 'bg-gray-500/10'}`}>
                {reg.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Holidays View ───────────────────────────────────────────────

function HolidaysView({ lang }: { lang: 'es' | 'en' }) {
  const [holidays, setHolidays] = useState<Array<{
    name: string; nameEn?: string; date: string; dateEn?: string; month: number; day: number; isVariable: boolean
  }>>([])

  useEffect(() => {
    fetch('/api/holidays')
      .then(r => r.ok ? r.json() : [])
      .then(d => setHolidays(d))
      .catch(() => {})
  }, [])

  const fixed = holidays.filter(h => !h.isVariable)
  const variable = holidays.filter(h => h.isVariable)
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {lang === 'en'
          ? 'Public holidays in Peru - Administrative services may not be available'
          : 'Días feriados en Perú - Es posible que no se presten algunos servicios administrativos'}
      </p>
      <div className="grid gap-2">
        {fixed.map(h => (
          <div
            key={h.name}
            className={`flex items-center gap-3 p-2.5 rounded-md transition-colors ${
              h.month === currentMonth ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30'
            }`}
          >
            <div className="w-12 text-center shrink-0">
              <Calendar className={`size-4 mx-auto ${h.month === currentMonth ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="text-[10px] text-muted-foreground">{h.month}/{h.day}</span>
            </div>
            <div>
              <p className="text-xs font-medium">
                {lang === 'en' && h.nameEn ? h.nameEn : h.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'en' && h.dateEn ? h.dateEn : h.date}
              </p>
            </div>
            {h.month === currentMonth && (
              <Badge className="ml-auto text-[10px] bg-amber-500 text-white">Este mes</Badge>
            )}
          </div>
        ))}
      </div>
      {variable.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-500" />
            {lang === 'en' ? 'Variable Date Holidays' : 'Feriados de Fecha Variable'}
          </h4>
          <div className="grid gap-2">
            {variable.map(h => (
              <div key={h.name} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium">
                    {lang === 'en' && h.nameEn ? h.nameEn : h.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'en' && h.dateEn ? h.dateEn : h.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Abbreviations View ──────────────────────────────────────────

function AbbreviationsView({ lang }: { lang: 'es' | 'en' }) {
  const [abbreviations, setAbbreviations] = useState<Array<{
    code: string; meaning: string; meaningEn?: string; radioUsage?: string
  }>>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const url = search ? `/api/abbreviations?q=${encodeURIComponent(search)}&limit=100` : '/api/abbreviations?limit=100'
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(d => setAbbreviations(d))
      .catch(() => {})
  }, [search])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {lang === 'en'
          ? 'Abbreviations used in AIS publications (ICAO Doc 8400)'
          : 'Abreviaturas utilizadas en las publicaciones del AIS (Doc. 8400 OACI)'}
      </p>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          placeholder={lang === 'en' ? 'Search abbreviations...' : 'Buscar abreviatura...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {abbreviations.length} {lang === 'en' ? 'abbreviations' : 'abreviaturas'}
      </div>
      <ScrollArea className="h-[calc(100vh-30rem)]">
        <div className="space-y-0.5">
          {abbreviations.map(abbr => (
            <div
              key={abbr.code}
              className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 transition-colors"
            >
              <div className="w-16 shrink-0">
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {abbr.code}
                </span>
                {abbr.radioUsage && (
                  <span className="text-[9px] text-blue-500 ml-1">{abbr.radioUsage}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] leading-tight">
                  {lang === 'en' && abbr.meaningEn ? abbr.meaningEn : abbr.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Aliases for icons used in the component
const Cloud = Calendar
const Heart = Phone
const AlertCircle = Info
