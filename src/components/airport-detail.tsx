"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Plane,
  MapPin,
  Clock,
  Building2,
  Phone,
  Mail,
  Globe,
  Flag,
  Ruler,
  Thermometer,
  Flame,
  CloudSun,
  Fuel,
  Snowflake,
  Warehouse,
  Shield,
  AlertTriangle,
  Info,
  Radio,
  MessageSquare,
  Compass,
  Mountain,
  Map,
  Navigation,
  PlaneTakeoff,
  PlaneLanding,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Eye,
  Cog,
  Volume2,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { Airport, AirportDetail, Obstacle } from "@/lib/types"
import dynamic from "next/dynamic"
import { HighResChartViewer } from "@/components/high-res-chart-viewer"

const WeatherPanel = dynamic(
  () => import("@/components/weather-panel").then((mod) => mod.WeatherPanel),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
)

interface AirportDetailProps {
  airport: Airport
  onBack: () => void
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon?: React.ComponentType<{ className?: string }>
}) {
  if (!value || value === "NIL" || value === "NO AVBL") return null
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="size-4 text-amber-600 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-5 text-amber-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function JsonInfoDisplay({
  data,
}: {
  data: Record<string, unknown> | unknown[] | string | undefined | null
}) {
  if (!data) return <p className="text-sm text-muted-foreground">Sin información disponible</p>
  if (typeof data === "string") return <p className="text-sm text-muted-foreground">{data === "NIL" ? "Sin información disponible" : data}</p>

  // Handle array of objects (e.g. taxiway data with multiple entries)
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-sm text-muted-foreground">Sin información disponible</p>
    return (
      <div className="space-y-3">
        {data.map((item, idx) => {
          if (typeof item !== "object" || item === null) return null
          const entries = Object.entries(item as Record<string, unknown>).filter(
            ([, v]) => v && v !== "NIL"
          )
          if (entries.length === 0) return null
          return (
            <div key={idx} className="rounded-lg border bg-muted/30 p-3">
              {entries.map(([key, value]) => (
                <div key={key} className="py-1 flex justify-between gap-4">
                  <span className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm font-medium text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // Handle simple object
  const entries = Object.entries(data).filter(([, v]) => v && v !== "NIL")
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">Sin información disponible</p>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="py-1.5">
          <p className="text-xs text-muted-foreground capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </p>
          <p className="text-sm font-medium">{String(value)}</p>
        </div>
      ))}
    </div>
  )
}

interface ChartData {
  type: string
  name: string
  file: string
  url: string
}

interface ChartsResponse {
  icaoCode: string
  totalCharts: number
  charts: ChartData[]
  grouped: Record<string, ChartData[]>
}

interface DocumentData {
  type: string
  code: string
  name: string
  description: string
  file: string
  category: string
  url: string
}

interface DocumentsResponse {
  icaoCode: string
  totalDocuments: number
  documents: DocumentData[]
  grouped: Record<string, DocumentData[]>
}

export function AirportDetailView({ airport, onBack }: AirportDetailProps) {
  const [detail, setDetail] = useState<AirportDetail | null>(null)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [chartsData, setChartsData] = useState<ChartsResponse | null>(null)
  const [documentsData, setDocumentsData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [obstaclesLoading, setObstaclesLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [chartFilter, setChartFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true)
      try {
        const response = await fetch(`/api/airports/${airport.icaoCode}`)
        if (response.ok) {
          const data = await response.json()
          setDetail(data)
        }
      } catch {
        // Will show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [airport.icaoCode])

  useEffect(() => {
    async function fetchObstacles() {
      setObstaclesLoading(true)
      try {
        const response = await fetch(
          `/api/airports/${airport.icaoCode}/obstacles`
        )
        if (response.ok) {
          const data = await response.json()
          setObstacles(data.obstacles || [])
        }
      } catch {
        // Will show empty state
      } finally {
        setObstaclesLoading(false)
      }
    }
    fetchObstacles()
  }, [airport.icaoCode])

  useEffect(() => {
    async function fetchCharts() {
      setChartsLoading(true)
      try {
        const response = await fetch(
          `/api/airports/${airport.icaoCode}/charts`
        )
        if (response.ok) {
          const data = await response.json()
          setChartsData(data)
        }
      } catch {
        // Will show empty state
      } finally {
        setChartsLoading(false)
      }
    }
    fetchCharts()
  }, [airport.icaoCode])

  useEffect(() => {
    async function fetchDocuments() {
      setDocumentsLoading(true)
      try {
        const response = await fetch(
          `/api/airports/${airport.icaoCode}/documents`
        )
        if (response.ok) {
          const data = await response.json()
          setDocumentsData(data)
        }
      } catch {
        // Will show empty state
      } finally {
        setDocumentsLoading(false)
      }
    }
    fetchDocuments()
  }, [airport.icaoCode])

  const chartTypes = ["SID", "STAR", "IAC", "ADC", "TMA", "VAC", "HELO", "NADP"]
  const chartTypeLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    SID: { label: "Salida Normalizada (SID)", icon: PlaneTakeoff },
    STAR: { label: "Llegada Normalizada (STAR)", icon: PlaneLanding },
    IAC: { label: "Aproximación por Instrumentos", icon: Navigation },
    ADC: { label: "Plano de Aeródromo", icon: Map },
    TMA: { label: "Área de Control Terminal", icon: Globe },
    VAC: { label: "Carta de Aproximación Visual", icon: Eye },
    HELO: { label: "Circuitos de Helicópteros", icon: Plane },
    NADP: { label: "Procedimiento de Atenuación de Ruido", icon: Volume2 },
  }

  const filteredCharts = chartFilter === "all"
    ? (chartsData?.charts || [])
    : (chartsData?.grouped?.[chartFilter] || [])

  const airportData = detail || airport
  const runways = detail?.runways || []
  const declaredDistances = detail?.declaredDistances || []
  const detailObstacles = detail?.obstacles || obstacles
  const radioNavAids = detail?.radioNavAids || []
  const communications = detail?.communications || []

  // Merge runway data with declared distances
  const runwayData = runways.map((rw) => {
    const dd = declaredDistances.find((d) => d.rwy === rw.designator)
    return { ...rw, declaredDistance: dd }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-navy text-white font-bold text-base px-4 py-1 tracking-wider">
              {airportData.icaoCode}
            </Badge>
            {airportData.category === "INTERNACIONAL" ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-700 font-semibold text-xs px-2.5 py-1 tracking-wider gap-1">
                <Globe className="size-3" />
                INTERNACIONAL
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 font-semibold text-xs px-2.5 py-1 tracking-wider gap-1">
                <Flag className="size-3" />
                NACIONAL
              </Badge>
            )}
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700">
              {airportData.authorizedTraffic}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            {airportData.name}
          </h2>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="size-4" />
            {airportData.city}, {airportData.department}
          </p>
        </div>
      </div>

      <Separator />

      {/* Tabbed Content */}
      <Tabs defaultValue="general" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="general" className="flex-1 min-w-0">
              <Info className="size-4" />
              <span className="hidden sm:inline ml-1.5">General</span>
            </TabsTrigger>
            <TabsTrigger value="pista" className="flex-1 min-w-0">
              <Ruler className="size-4" />
              <span className="hidden sm:inline ml-1.5">Pista</span>
            </TabsTrigger>
            <TabsTrigger value="plataforma" className="flex-1 min-w-0">
              <Building2 className="size-4" />
              <span className="hidden sm:inline ml-1.5">Plataforma</span>
            </TabsTrigger>
            <TabsTrigger value="servicios" className="flex-1 min-w-0">
              <Shield className="size-4" />
              <span className="hidden sm:inline ml-1.5">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="obstaculos" className="flex-1 min-w-0">
              <AlertTriangle className="size-4" />
              <span className="hidden sm:inline ml-1.5">Obstáculos</span>
            </TabsTrigger>
            <TabsTrigger value="cartas" className="flex-1 min-w-0">
              <Map className="size-4" />
              <span className="hidden sm:inline ml-1.5">Cartas</span>
            </TabsTrigger>
            <TabsTrigger value="clima" className="flex-1 min-w-0">
              <CloudSun className="size-4" />
              <span className="hidden sm:inline ml-1.5">Clima</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos Geográficos */}
              <SectionCard title="Datos Geográficos" icon={MapPin}>
                <div className="space-y-0.5">
                  <InfoRow label="Código ICAO" value={airportData.icaoCode} icon={Plane} />
                  <InfoRow label="Latitud ARP" value={detail?.arpLatitude} icon={Compass} />
                  <InfoRow label="Longitud ARP" value={detail?.arpLongitude} icon={Compass} />
                  <InfoRow label="Elevación" value={airportData.elevation} icon={Mountain} />
                  <InfoRow label="Temperatura de Referencia" value={detail?.temperature} icon={Thermometer} />
                  <InfoRow label="Undulación Geoidal" value={detail?.geoidalUndulation} icon={Mountain} />
                  <InfoRow label="Declinación Magnética" value={detail?.magneticDeclination} icon={Compass} />
                  <InfoRow label="Cambio Anual" value={detail?.annualChange} icon={Clock} />
                  <InfoRow label="Distancia a la Ciudad" value={detail?.distanceFromCity} icon={MapPin} />
                </div>
              </SectionCard>

              {/* Administración */}
              <SectionCard title="Administración" icon={Building2}>
                <div className="space-y-0.5">
                  <InfoRow label="Tipo de Administración" value={detail?.administrationType} icon={Building2} />
                  <InfoRow label="Dirección" value={detail?.address} icon={MapPin} />
                  <InfoRow label="Teléfono" value={detail?.phone} icon={Phone} />
                  <InfoRow label="Fax" value={detail?.fax} icon={Phone} />
                  <InfoRow label="AFTN" value={detail?.aftn} icon={Radio} />
                  <InfoRow label="Correo Electrónico" value={detail?.email} icon={Mail} />
                </div>
              </SectionCard>

              {/* Horario de Operación */}
              <SectionCard title="Horario de Operación" icon={Clock}>
                {detail?.operatingHours && typeof detail.operatingHours === "object" ? (
                  <JsonInfoDisplay data={detail.operatingHours as Record<string, unknown>} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin información disponible</p>
                )}
              </SectionCard>

              {/* Observaciones */}
              <SectionCard title="Observaciones" icon={Info}>
                <p className="text-sm text-muted-foreground">
                  {airportData.remarks && airportData.remarks !== "NIL"
                    ? airportData.remarks
                    : "Sin observaciones"}
                </p>
              </SectionCard>

              {/* Comunicaciones */}
              {communications.length > 0 && (
                <SectionCard title="Comunicaciones" icon={MessageSquare} className="md:col-span-2">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Frecuencia</TableHead>
                          <TableHead>Indicativo</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communications.map((comm) => (
                          <TableRow key={comm.id}>
                            <TableCell className="font-medium">{comm.service || "—"}</TableCell>
                            <TableCell>{comm.frequency || "—"}</TableCell>
                            <TableCell>{comm.callsign || "—"}</TableCell>
                            <TableCell>{comm.hours || "—"}</TableCell>
                            <TableCell>{comm.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </SectionCard>
              )}

              {/* Ayudas Radioeléctricas */}
              {radioNavAids.length > 0 && (
                <SectionCard title="Ayudas Radioeléctricas de Navegación" icon={Radio} className="md:col-span-2">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Identificador</TableHead>
                          <TableHead>Frecuencia</TableHead>
                          <TableHead>Coordenadas</TableHead>
                          <TableHead>Elevación</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {radioNavAids.map((nav) => (
                          <TableRow key={nav.id}>
                            <TableCell className="font-medium">{nav.type || "—"}</TableCell>
                            <TableCell>{nav.identifier || "—"}</TableCell>
                            <TableCell>{nav.frequency || "—"}</TableCell>
                            <TableCell>{nav.coordinates || "—"}</TableCell>
                            <TableCell>{nav.elevation || "—"}</TableCell>
                            <TableCell>{nav.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </SectionCard>
              )}
            </div>
          )}
        </TabsContent>

        {/* Pista Tab */}
        <TabsContent value="pista" className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ) : runwayData.length > 0 ? (
            <div className="space-y-4">
              {/* Runway Characteristics Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ruler className="size-5 text-amber-600" />
                    Características Físicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Designación</TableHead>
                          <TableHead>Rumbo Geo.</TableHead>
                          <TableHead>Rumbo Mag.</TableHead>
                          <TableHead>Dimensiones (m)</TableHead>
                          <TableHead>Superficie</TableHead>
                          <TableHead>PCN</TableHead>
                          <TableHead>Elev. Umbral</TableHead>
                          <TableHead>Coord. Umbral</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runwayData.map((runway) => (
                          <TableRow key={runway.designator}>
                            <TableCell className="font-medium">{runway.designator}</TableCell>
                            <TableCell>{runway.brgGeo || "—"}</TableCell>
                            <TableCell>{runway.brgMag || "—"}</TableCell>
                            <TableCell>{runway.dimensions || "—"}</TableCell>
                            <TableCell>{runway.surface || "—"}</TableCell>
                            <TableCell>{runway.pcn || "—"}</TableCell>
                            <TableCell>{runway.thrElevation || "—"}</TableCell>
                            <TableCell className="max-w-48 text-xs">{runway.thrCoords || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Declared Distances Table */}
              {declaredDistances.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Ruler className="size-5 text-amber-600" />
                      Distancias Declaradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PISTA</TableHead>
                            <TableHead>TORA (m)</TableHead>
                            <TableHead>TODA (m)</TableHead>
                            <TableHead>ASDA (m)</TableHead>
                            <TableHead>LDA (m)</TableHead>
                            <TableHead>Observaciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {declaredDistances.map((dd) => (
                            <TableRow key={dd.rwy}>
                              <TableCell className="font-medium">{dd.rwy}</TableCell>
                              <TableCell>{dd.tora}</TableCell>
                              <TableCell>{dd.toda}</TableCell>
                              <TableCell>{dd.asda}</TableCell>
                              <TableCell>{dd.lda}</TableCell>
                              <TableCell>{dd.remarks || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Individual Runway Details */}
              {runwayData.map((runway) => (
                <Card key={runway.designator}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Pista {runway.designator} — Detalles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <InfoRow label="SWY (m)" value={runway.swyDimensions} icon={Ruler} />
                      <InfoRow label="CWY (m)" value={runway.cwyDimensions} icon={Ruler} />
                      <InfoRow label="Franja (m)" value={runway.stripDimensions} icon={Ruler} />
                      <InfoRow label="OFZ" value={runway.ofz} icon={Building2} />
                      <InfoRow label="RESA" value={runway.resa} icon={Shield} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Ruler className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Sin información de pista</h3>
                <p className="text-muted-foreground mt-1">
                  No hay datos de pista disponibles para este aeródromo
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plataforma Tab */}
        <TabsContent value="plataforma" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Platform Data */}
              <SectionCard title="Plataforma" icon={Building2}>
                {detail?.platformData ? (
                  <JsonInfoDisplay data={detail.platformData as Record<string, unknown> | unknown[] | string} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin información disponible</p>
                )}
                {detail?.platformRemarks && detail.platformRemarks !== "NIL" && (
                  <div className="mt-3 pt-3 border-t">
                    <InfoRow label="Observaciones" value={detail.platformRemarks} icon={Info} />
                  </div>
                )}
              </SectionCard>

              {/* Taxiway Data */}
              <SectionCard title="Calles de Rodaje" icon={Plane}>
                {detail?.taxiwayData ? (
                  <JsonInfoDisplay data={detail.taxiwayData as Record<string, unknown> | unknown[] | string} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin información disponible</p>
                )}
              </SectionCard>

              {/* Checkpoints */}
              <SectionCard title="Puntos de Verificación" icon={MapPin}>
                {detail?.checkpointData ? (
                  <JsonInfoDisplay data={detail.checkpointData as Record<string, unknown> | unknown[] | string} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin información disponible</p>
                )}
              </SectionCard>

              {/* Surface Guidance */}
              <SectionCard title="Guía de Movimiento en Superficie" icon={Info}>
                <div className="space-y-0.5">
                  <InfoRow label="Guía de Rodaje" value={detail?.surfaceGuidance} icon={Info} />
                  <InfoRow label="Señales en Pista" value={detail?.runwaySigns} icon={Info} />
                  <InfoRow label="Señales en Calles de Rodaje" value={detail?.taxiwaySigns} icon={Info} />
                  <InfoRow label="Barras de Parada" value={detail?.stopBars} icon={Info} />
                  <InfoRow label="Observaciones" value={detail?.guidanceRemarks} icon={Info} />
                </div>
              </SectionCard>
            </div>
          )}
        </TabsContent>

        {/* Servicios Tab */}
        <TabsContent value="servicios" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scale Installations */}
              <SectionCard title="Instalaciones de Escala" icon={Building2}>
                <div className="space-y-0.5">
                  <InfoRow label="Instalaciones de Carga" value={detail?.cargoHandlingFacilities} icon={Building2} />
                  <InfoRow label="Observaciones" value={detail?.scaleRemarks} icon={Info} />
                </div>
              </SectionCard>

              {/* Refueling */}
              <SectionCard title="Reabastecimiento de Combustible" icon={Fuel}>
                <div className="space-y-0.5">
                  <InfoRow label="Tipos de Combustible" value={detail?.fuelTypes} icon={Fuel} />
                  <InfoRow label="Tipos de Lubricantes" value={detail?.lubricantTypes} icon={Fuel} />
                  {detail?.refuelingFacilities ? (
                    typeof detail.refuelingFacilities === "object" ? (
                      <JsonInfoDisplay data={detail.refuelingFacilities as Record<string, unknown>} />
                    ) : (
                      <InfoRow label="Instalaciones" value={detail.refuelingFacilities as string} icon={Fuel} />
                    )
                  ) : null}
                </div>
              </SectionCard>

              {/* Passenger Facilities */}
              <SectionCard title="Instalaciones para Pasajeros" icon={Plane}>
                <div className="space-y-0.5">
                  <InfoRow label="Hoteles" value={detail?.hotels} icon={Building2} />
                  <InfoRow label="Restaurantes" value={detail?.restaurants} icon={Building2} />
                  <InfoRow label="Transporte" value={detail?.transport} icon={Plane} />
                  <InfoRow label="Instalaciones Médicas" value={detail?.medicalFacilities} icon={Shield} />
                  <InfoRow label="Banco / Correo" value={detail?.bankingPost} icon={Building2} />
                  <InfoRow label="Oficina de Turismo" value={detail?.tourismOffice} icon={Info} />
                  <InfoRow label="Observaciones" value={detail?.passengerRemarks} icon={Info} />
                </div>
              </SectionCard>

              {/* Fire Fighting */}
              <SectionCard title="Servicio de Extinción de Incendios" icon={Flame}>
                <div className="space-y-0.5">
                  <InfoRow label="Categoría" value={airportData.fireCategory} icon={Flame} />
                  <InfoRow label="Equipo de Salvamento" value={detail?.rescueEquipment} icon={Shield} />
                  <InfoRow label="Capacidad de Remoción de Aeronaves" value={detail?.aircraftRemovalCapacity} icon={Info} />
                  <InfoRow label="Observaciones" value={detail?.rescueRemarks} icon={Info} />
                </div>
              </SectionCard>

              {/* Hangars & Maintenance */}
              <SectionCard title="Hangares y Mantenimiento" icon={Warehouse}>
                <div className="space-y-0.5">
                  <InfoRow label="Espacio de Hangar" value={detail?.hangarSpace} icon={Warehouse} />
                  <InfoRow label="Instalaciones de Reparación" value={detail?.repairFacilities} icon={Warehouse} />
                  <InfoRow label="Servicio de Deshielo" value={detail?.deIcingFacilities} icon={Snowflake} />
                </div>
              </SectionCard>

              {/* Meteorological Info */}
              <SectionCard title="Información Meteorológica" icon={CloudSun}>
                <div className="space-y-0.5">
                  <InfoRow label="Oficina Meteorológica" value={detail?.metOffice} icon={CloudSun} />
                  <InfoRow label="Horario" value={detail?.metHours} icon={Clock} />
                  <InfoRow label="Oficina de Pronóstico" value={detail?.metForecastOffice} icon={CloudSun} />
                  <InfoRow label="Validez" value={detail?.metValidity} icon={Clock} />
                  <InfoRow label="Pronóstico de Aterrizaje" value={detail?.metLandingForecast} icon={CloudSun} />
                  <InfoRow label="Intervalo de Tendencia" value={detail?.metTrendInterval} icon={Clock} />
                  <InfoRow label="Briefing" value={detail?.metBriefing} icon={Info} />
                  <InfoRow label="Consultas" value={detail?.metConsultation} icon={Info} />
                  <InfoRow label="Documentación" value={detail?.metDocumentation} icon={Info} />
                  <InfoRow label="Idioma" value={detail?.metLanguage} icon={Info} />
                  <InfoRow label="Cartas" value={detail?.metCharts} icon={Info} />
                  <InfoRow label="Información Suplementaria" value={detail?.metSupplementary} icon={Info} />
                  <InfoRow label="Dependencias ATS" value={detail?.metAtsDependencies} icon={Info} />
                  <InfoRow label="Información Adicional" value={detail?.metAdditionalInfo} icon={Info} />
                </div>
              </SectionCard>
            </div>
          )}
        </TabsContent>

        {/* Obstáculos Tab */}
        <TabsContent value="obstaculos" className="mt-4">
          {obstaclesLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ) : detailObstacles.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-5 text-amber-600" />
                  Obstáculos del Aeródromo ({detailObstacles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Área de Pista</TableHead>
                        <TableHead>Tipo de Obstáculo</TableHead>
                        <TableHead>Elevación</TableHead>
                        <TableHead>Marcación / Iluminación</TableHead>
                        <TableHead>Coordenadas</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailObstacles.map((obs) => (
                        <TableRow key={obs.id}>
                          <TableCell className="font-medium">
                            {obs.runwayArea || "—"}
                          </TableCell>
                          <TableCell>{obs.obstacleType || "—"}</TableCell>
                          <TableCell>{obs.elevation || "—"}</TableCell>
                          <TableCell>{obs.markingLighting || "—"}</TableCell>
                          <TableCell className="text-xs">{obs.coordinates || "—"}</TableCell>
                          <TableCell>{obs.remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Sin obstáculos</h3>
                <p className="text-muted-foreground mt-1">
                  No hay obstáculos registrados para este aeródromo
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Cartas Tab */}
        <TabsContent value="cartas" className="mt-4">
          {/* Documentos Oficiales (PDF) */}
          {documentsLoading ? (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : documentsData && documentsData.totalDocuments > 0 ? (
            <Card className="mb-6 border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-5 text-amber-600" />
                  Documentos Oficiales AIP (PDF)
                  <Badge variant="secondary" className="ml-1">
                    {documentsData.totalDocuments}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Documentos PDF oficiales de la publicación AIP para {airport.icaoCode}. Descarga directa.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documentsData.documents.map((doc) => {
                    const TypeIcon =
                      chartTypeLabels[doc.type]?.icon || FileText
                    return (
                      <a
                        key={doc.code}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="group flex items-start gap-3 p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-slate-900 hover:ring-2 hover:ring-amber-400 transition-all"
                      >
                        <div className="shrink-0 mt-0.5">
                          <div className="size-10 rounded-md bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                            <TypeIcon className="size-5 text-amber-700 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-1.5 py-0 ${
                                doc.type === "SID"
                                  ? "border-green-500 text-green-700 dark:text-green-400"
                                  : doc.type === "STAR"
                                  ? "border-blue-500 text-blue-700 dark:text-blue-400"
                                  : doc.type === "IAC"
                                  ? "border-red-500 text-red-700 dark:text-red-400"
                                  : doc.type === "VAC"
                                  ? "border-cyan-500 text-cyan-700 dark:text-cyan-400"
                                  : doc.type === "HELO"
                                  ? "border-orange-500 text-orange-700 dark:text-orange-400"
                                  : "border-purple-500 text-purple-700 dark:text-purple-400"
                              }`}
                            >
                              {doc.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              {doc.category}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {doc.description}
                          </p>
                        </div>
                        <div className="shrink-0 self-center flex flex-col gap-1">
                          <Download className="size-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                          <ExternalLink className="size-3 text-muted-foreground/60 group-hover:text-amber-600/80 transition-colors" />
                        </div>
                      </a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Charts (imágenes) */}
          {chartsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : chartsData && chartsData.totalCharts > 0 ? (
            <div className="space-y-4">
              {/* Chart type filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={chartFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartFilter("all")}
                >
                  Todas ({chartsData.totalCharts})
                </Button>
                {chartTypes.filter(t => chartsData.grouped[t]).map(type => {
                  const TypeIcon = chartTypeLabels[type]?.icon || Map
                  return (
                    <Button
                      key={type}
                      variant={chartFilter === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartFilter(type)}
                      className="gap-1.5"
                    >
                      <TypeIcon className="size-3.5" />
                      {type} ({chartsData.grouped[type].length})
                    </Button>
                  )
                })}
              </div>

              {/* Chart grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharts.map((chart) => {
                  const TypeIcon = chartTypeLabels[chart.type]?.icon || Map
                  return (
                    <Card
                      key={chart.file}
                      className="cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all overflow-hidden group"
                      onClick={() => setSelectedChart(chart)}
                    >
                      <div className="relative bg-slate-100 dark:bg-slate-800">
                        <img
                          src={chart.url}
                          alt={`${chart.type} - ${chart.name}`}
                          className="w-full h-48 object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="size-4" />
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold ${
                              chart.type === "SID" ? "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30" :
                              chart.type === "STAR" ? "border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" :
                              chart.type === "IAC" ? "border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30" :
                              chart.type === "ADC" ? "border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30" :
                              chart.type === "TMA" ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" :
                              chart.type === "VAC" ? "border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30" :
                              chart.type === "HELO" ? "border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30" :
                              chart.type === "NADP" ? "border-slate-500 text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30" :
                              "border-gray-500 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30"
                            }`}
                          >
                            <TypeIcon className="size-3 mr-1" />
                            {chart.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium leading-tight">{chart.name}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Map className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Sin cartas disponibles</h3>
                <p className="text-muted-foreground mt-1">
                  No hay cartas SID/STAR/IAC disponibles para este aeródromo
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Clima Tab */}
        <TabsContent value="clima" className="mt-4">
          <WeatherPanel icaoCode={airport.icaoCode} />
        </TabsContent>
      </Tabs>

      {/* High-Resolution Chart Viewer with Zoom/Pan/Rotate */}
      <HighResChartViewer
        charts={filteredCharts}
        initialIndex={selectedChart ? Math.max(0, filteredCharts.findIndex(c => c.file === selectedChart.file)) : 0}
        isOpen={!!selectedChart}
        onClose={() => setSelectedChart(null)}
        airportIcao={airport.icaoCode}
        airportName={airport.name}
      />
    </div>
  )
}
