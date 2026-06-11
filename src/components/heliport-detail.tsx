"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Crosshair,
  MapPin,
  Mountain,
  Building2,
  Shield,
  Building,
  Landmark,
  Clock,
  AlertTriangle,
  Radio,
  Phone,
  User,
  Ruler,
  Sun,
  Plane,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Heliport as HeliportType } from "@/lib/types"

interface HeliportDetailProps {
  heliport: HeliportType
  onBack: () => void
}

const TYPE_CONFIG: Record<string, { label: string; color: string; darkColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  "HOSPITAL": { label: "Hospital", color: "bg-red-100 text-red-800 border-red-200", darkColor: "dark:bg-red-950/50 dark:text-red-400 dark:border-red-800", icon: Building2 },
  "OIL INDUSTRIAL": { label: "Petrolero", color: "bg-amber-100 text-amber-800 border-amber-200", darkColor: "dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800", icon: Landmark },
  "MILITARY": { label: "Militar", color: "bg-green-100 text-green-800 border-green-200", darkColor: "dark:bg-green-950/50 dark:text-green-400 dark:border-green-800", icon: Shield },
  "COMMERCIAL": { label: "Comercial", color: "bg-blue-100 text-blue-800 border-blue-200", darkColor: "dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800", icon: Building },
}

function getTypeConfig(type?: string) {
  if (!type) return { label: "Otro", color: "bg-slate-100 text-slate-800 border-slate-200", darkColor: "dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800", icon: Crosshair }
  return TYPE_CONFIG[type] || { label: type, color: "bg-slate-100 text-slate-800 border-slate-200", darkColor: "dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800", icon: Crosshair }
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

interface CommEntry {
  servicio?: string
  frecuencia?: string
  indicativo?: string
  horario?: string
  service?: string
  frequency?: string
  callsign?: string
  hours?: string
}

function parseCommunications(comm?: string): CommEntry[] {
  if (!comm) return []
  if (typeof comm !== "string") {
    // Already parsed by API
    if (Array.isArray(comm)) return comm as CommEntry[]
    return []
  }
  try {
    const parsed = JSON.parse(comm)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function HeliportDetail({ heliport, onBack }: HeliportDetailProps) {
  const [detail, setDetail] = useState<HeliportType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true)
      try {
        const response = await fetch(`/api/heliports?search=${heliport.icaoCode}`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const found = data.find((h: HeliportType) => h.icaoCode === heliport.icaoCode)
            setDetail(found || heliport)
          } else {
            setDetail(heliport)
          }
        } else {
          setDetail(heliport)
        }
      } catch {
        setDetail(heliport)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [heliport])

  const h = detail || heliport
  const typeConfig = getTypeConfig(h.type)
  const TypeIcon = typeConfig.icon
  const communications = parseCommunications(h.communications as string | undefined)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Helipuertos
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-navy rounded-xl p-6 text-white">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center justify-center size-14 rounded-xl bg-amber-500/20 shrink-0">
            <Crosshair className="size-7 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {h.icaoCode}
              </h1>
              <Badge className={`${typeConfig.color} ${typeConfig.darkColor} text-[10px] px-2 py-0.5 font-bold tracking-wider gap-0.5`}>
                <TypeIcon className="size-3" />
                {typeConfig.label}
              </Badge>
              {h.status === "OPERATIVO" ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 font-bold tracking-wider">
                  OPERATIVO
                </Badge>
              ) : h.status === "INACTIVO" ? (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 font-bold tracking-wider">
                  INACTIVO
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 font-bold tracking-wider">
                  {h.status}
                </Badge>
              )}
            </div>
            <p className="text-slate-300 text-sm mt-1 truncate">{h.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {h.city}{h.department ? `, ${h.department}` : ""}{h.country ? ` — ${h.country}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Datos Geográficos */}
        <SectionCard title="Datos Geográficos" icon={MapPin}>
          <div className="space-y-1">
            <InfoRow label="Código ICAO" value={h.icaoCode} icon={Crosshair} />
            <InfoRow
              label="Coordenadas"
              value={h.latitude && h.longitude ? `${h.latitude} / ${h.longitude}` : undefined}
              icon={MapPin}
            />
            {(h.lat != null && h.lon != null) && (
              <div className="flex items-start gap-3 py-2">
                <MapPin className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Coordenadas (decimal)</p>
                  <p className="text-sm font-medium">{h.lat.toFixed(6)}°, {h.lon.toFixed(6)}°</p>
                </div>
              </div>
            )}
            <InfoRow label="Elevación" value={h.elevation} icon={Mountain} />
            <InfoRow label="Ciudad" value={h.city} icon={Building2} />
            <InfoRow label="Departamento" value={h.department} icon={MapPin} />
            <InfoRow label="Provincia" value={h.province} />
            <InfoRow label="Distrito" value={h.district} />
          </div>
        </SectionCard>

        {/* Información */}
        <SectionCard title="Información" icon={Ruler}>
          <div className="space-y-1">
            <InfoRow label="Tipo" value={typeConfig.label} icon={TypeIcon} />
            <InfoRow label="Superficie" value={h.surface} icon={Ruler} />
            <InfoRow label="Dimensiones" value={h.dimensions} icon={Ruler} />
            <InfoRow label="Marcaciones" value={h.markings} icon={Crosshair} />
            <InfoRow label="Iluminación" value={h.lighting} icon={Sun} />
          </div>
        </SectionCard>

        {/* Operaciones */}
        <SectionCard title="Operaciones" icon={Clock}>
          <div className="space-y-1">
            <InfoRow label="Horario de Operación" value={h.operatingHours} icon={Clock} />
            <InfoRow label="Tráfico Autorizado" value={h.authorizedTraffic} icon={Plane} />
            <InfoRow label="Restricciones" value={h.restrictions} icon={AlertTriangle} />
          </div>
        </SectionCard>

        {/* Administración */}
        <SectionCard title="Administración" icon={User}>
          <div className="space-y-1">
            <InfoRow label="Operador" value={h.operator} icon={User} />
            <InfoRow label="Teléfono" value={h.phone} icon={Phone} />
            <InfoRow label="Observaciones" value={h.remarks} icon={AlertTriangle} />
          </div>
        </SectionCard>
      </div>

      {/* Comunicaciones - full width */}
      {communications.length > 0 && (
        <SectionCard title="Comunicaciones" icon={Radio}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Servicio</TableHead>
                  <TableHead className="text-xs">Frecuencia</TableHead>
                  <TableHead className="text-xs">Indicativo</TableHead>
                  <TableHead className="text-xs">Horario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications.map((comm, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{comm.servicio || comm.service || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">{comm.frecuencia || comm.frequency || "—"}</TableCell>
                    <TableCell className="text-sm">{comm.indicativo || comm.callsign || "—"}</TableCell>
                    <TableCell className="text-sm">{comm.horario || comm.hours || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <Separator />
    </div>
  )
}
