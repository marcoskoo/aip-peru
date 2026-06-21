"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plane,
  Eye,
  Pencil,
  Printer,
  RotateCcw,
  Map,
  Info,
  ChevronDown,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { RoutePoint, RouteSummary, ICAOFlightPlan } from "@/lib/types"
import {
  downloadFplHtml,
  isFlightPlanValid as isPlanValidPure,
} from "@/lib/fpl-generator"

interface FlightPlanProps {
  initialRoute?: RoutePoint[]
  initialSummary?: RouteSummary
}

const defaultFlightPlan: ICAOFlightPlan = {
  aircraftIdentification: "",
  flightRules: "I",
  typeOfFlight: "S",
  numberOfAircraft: "1",
  typeOfAircraft: "",
  wakeTurbulenceCat: "M",
  equipment: "S",
  transponder: "C",
  departureAerodrome: "",
  estimatedOffBlockTime: "",
  cruisingSpeed: "N0450",
  level: "FL350",
  route: "",
  destinationAerodrome: "",
  totalEET: "",
  alternateAerodrome1: "",
  alternateAerodrome2: "",
  otherInformation: "",
  endurance: "",
  personsOnBoard: "",
  emergencyRadio: "V",
  survivalEquipment: "",
  jackets: "",
  dinghies: "",
  aircraftColorAndMarkings: "",
  pilotInCommand: "",
  remarks: "",
}

function generateRouteString(points: RoutePoint[]): string {
  if (!points || points.length === 0) return ""

  const parts: string[] = []

  for (let i = 0; i < points.length; i++) {
    const point = points[i]

    if (i === 0) {
      // First point is the departure - skip it (it goes in field 13)
      continue
    }

    if (point.airwayUsed) {
      parts.push(point.airwayUsed)
      parts.push(point.name)
    } else {
      // Direct to this point
      if (i > 1) {
        parts.push("DCT")
      }
      parts.push(point.name)
    }
  }

  return parts.join(" ")
}

function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function FieldLabel({
  field,
  label,
  tooltip,
}: {
  field: string
  label: string
  tooltip?: string
}) {
  return (
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
      <Badge
        variant="outline"
        className="mr-1.5 text-[10px] px-1 py-0 font-mono border-amber-500/50 text-amber-600 dark:text-amber-400"
      >
        {field}
      </Badge>
      {label}
      {tooltip && <FieldTooltip text={tooltip} />}
    </Label>
  )
}

function buildInitialPlan(
  initialRoute?: RoutePoint[],
  initialSummary?: RouteSummary
): ICAOFlightPlan {
  const plan = { ...defaultFlightPlan }

  if (initialRoute && initialRoute.length > 0) {
    plan.route = generateRouteString(initialRoute)

    // Auto-fill departure aerodrome from first point
    if (initialRoute[0]?.type === "AIRPORT" && initialRoute[0]?.name) {
      plan.departureAerodrome = initialRoute[0].name
    }

    // Auto-fill destination from last point
    const lastPoint = initialRoute[initialRoute.length - 1]
    if (lastPoint?.type === "AIRPORT" && lastPoint?.name) {
      plan.destinationAerodrome = lastPoint.name
    }

    // Auto-fill total EET from summary
    if (initialSummary?.estimatedTime) {
      const hrs = Math.floor(initialSummary.estimatedTime / 60)
      const mins = Math.round(initialSummary.estimatedTime % 60)
      plan.totalEET = `${String(hrs).padStart(2, "0")}${String(mins).padStart(2, "0")}`
    }
  }

  return plan
}

export function FlightPlan({ initialRoute, initialSummary }: FlightPlanProps) {
  const [mode, setMode] = useState<"fill" | "preview">("fill")
  const [plan, setPlan] = useState<ICAOFlightPlan>(() =>
    buildInitialPlan(initialRoute, initialSummary)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const updateField = useCallback(
    (field: keyof ICAOFlightPlan, value: string) => {
      setPlan((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    },
    [errors]
  )

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Field 7 - Aircraft identification: up to 7 alphanumeric
    if (!plan.aircraftIdentification) {
      newErrors.aircraftIdentification = "Requerido"
    } else if (!/^[A-Z0-9]{1,7}$/.test(plan.aircraftIdentification)) {
      newErrors.aircraftIdentification =
        "Máximo 7 caracteres alfanuméricos"
    }

    // Field 13 - Departure aerodrome: 4-letter ICAO
    if (!plan.departureAerodrome) {
      newErrors.departureAerodrome = "Requerido"
    } else if (!/^[A-Z]{4}$/.test(plan.departureAerodrome)) {
      newErrors.departureAerodrome = "Código ICAO de 4 letras"
    }

    // Field 13 - EOBT: HHMM
    if (!plan.estimatedOffBlockTime) {
      newErrors.estimatedOffBlockTime = "Requerido"
    } else if (!/^\d{4}$/.test(plan.estimatedOffBlockTime)) {
      newErrors.estimatedOffBlockTime = "Formato HHMM"
    }

    // Field 16 - Destination: 4-letter ICAO
    if (!plan.destinationAerodrome) {
      newErrors.destinationAerodrome = "Requerido"
    } else if (!/^[A-Z]{4}$/.test(plan.destinationAerodrome)) {
      newErrors.destinationAerodrome = "Código ICAO de 4 letras"
    }

    // Field 16 - Total EET: HHMM
    if (!plan.totalEET) {
      newErrors.totalEET = "Requerido"
    } else if (!/^\d{4}$/.test(plan.totalEET)) {
      newErrors.totalEET = "Formato HHMM"
    }

    // Field 9 - Type of aircraft
    if (!plan.typeOfAircraft) {
      newErrors.typeOfAircraft = "Requerido"
    }

    // Alternates validation (if provided, must be 4 letters)
    if (
      plan.alternateAerodrome1 &&
      !/^[A-Z]{4}$/.test(plan.alternateAerodrome1)
    ) {
      newErrors.alternateAerodrome1 = "Código ICAO de 4 letras"
    }
    if (
      plan.alternateAerodrome2 &&
      !/^[A-Z]{4}$/.test(plan.alternateAerodrome2)
    ) {
      newErrors.alternateAerodrome2 = "Código ICAO de 4 letras"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [plan])

  const handlePreview = useCallback(() => {
    if (validate()) {
      setMode("preview")
    }
  }, [validate])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleClear = useCallback(() => {
    setPlan({ ...defaultFlightPlan })
    setErrors({})
  }, [])

  // Validación pura (sin side-effects) para habilitar el botón Descargar FPL
  const isFormComplete = useMemo(() => isPlanValidPure(plan), [plan])

  const handleDownloadFpl = useCallback(async () => {
    if (!isFormComplete) {
      toast({
        title: "Plan incompleto",
        description:
          "Complete todos los campos requeridos antes de descargar el FPL.",
        variant: "destructive",
      })
      // Marcar errores para guiar al usuario
      validate()
      return
    }

    setIsDownloading(true)
    try {
      await downloadFplHtml(plan)
      toast({
        title: "FPL generado",
        description:
          "Se ha descargado el formato FPL oficial CORPAC con los datos del plan de vuelo.",
      })
    } catch (err) {
      console.error("[FPL] Error generando FPL:", err)
      toast({
        title: "Error al generar FPL",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo generar el archivo FPL.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }, [isFormComplete, plan, toast, validate])

  const hasErrors = Object.keys(errors).length > 0

  // ── Fill Mode ──────────────────────────────────────────────────────────
  const fillMode = (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handlePreview}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Eye className="size-4 mr-1.5" />
          Vista Previa
        </Button>
        <Button
          onClick={handleDownloadFpl}
          disabled={!isFormComplete || isDownloading}
          className={
            isFormComplete && !isDownloading
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : ""
          }
          title={
            isFormComplete
              ? "Descargar formato FPL oficial CORPAC con los datos del plan"
              : "Complete los campos requeridos para habilitar la descarga"
          }
        >
          {isDownloading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="size-4 mr-1.5" />
          )}
          {isDownloading ? "Generando..." : "Descargar FPL"}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <RotateCcw className="size-4 mr-1.5" />
          Limpiar
        </Button>
        <Button variant="outline" asChild>
          <button type="button">
            <Map className="size-4 mr-1.5" />
            Generar Ruta
          </button>
        </Button>
        {hasErrors && (
          <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1">
            <AlertTriangle className="size-3" />
            {Object.keys(errors).length} error(es)
          </Badge>
        )}
        {isFormComplete && !hasErrors && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
          >
            <Download className="size-3" />
            FPL listo para descargar
          </Badge>
        )}
      </div>

      {/* Route summary */}
      {initialSummary && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Map className="size-4 text-amber-600" />
              <span className="font-semibold text-sm">
                Resumen de Ruta Calculada
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  Distancia
                </span>
                <p className="font-mono font-medium">
                  {initialSummary.totalDistance.toFixed(0)} NM
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Tiempo Est.
                </span>
                <p className="font-mono font-medium">
                  {Math.floor(initialSummary.estimatedTime / 60)}h{" "}
                  {Math.round(initialSummary.estimatedTime % 60)}m
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Waypoints
                </span>
                <p className="font-mono font-medium">
                  {initialSummary.waypoints}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Niveles</span>
                <p className="font-mono font-medium">
                  FL{initialSummary.flightLevels.min}-FL
                  {initialSummary.flightLevels.max}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="section1" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="section1" className="text-xs">
            Secc. 1 - General
          </TabsTrigger>
          <TabsTrigger value="section2" className="text-xs">
            Secc. 2 - Equipo
          </TabsTrigger>
          <TabsTrigger value="section3" className="text-xs">
            Secc. 3 - Ruta
          </TabsTrigger>
          <TabsTrigger value="section4" className="text-xs">
            Secc. 4 - Adicional
          </TabsTrigger>
        </TabsList>

        {/* ── SECCIÓN 1 - INFORMACIÓN GENERAL ── */}
        <TabsContent value="section1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="size-4 text-amber-600" />
                Sección 1 - Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Campo 7 */}
              <div className="space-y-2">
                <FieldLabel
                  field="F7"
                  label="Identificación de Aeronave"
                  tooltip="Identificación de la aeronave (máximo 7 caracteres alfanuméricos). Ej: TAP123, OB1234"
                />
                <Input
                  value={plan.aircraftIdentification}
                  onChange={(e) =>
                    updateField(
                      "aircraftIdentification",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Ej: OB1234"
                  maxLength={7}
                  className={`font-mono uppercase ${errors.aircraftIdentification ? "border-destructive" : ""}`}
                />
                {errors.aircraftIdentification && (
                  <p className="text-xs text-destructive">
                    {errors.aircraftIdentification}
                  </p>
                )}
              </div>

              {/* Campo 8 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F8"
                    label="Reglas de Vuelo"
                    tooltip="I=IFR, V=VFR, Y=IFR primero luego VFR, Z=VFR primero luego IFR"
                  />
                  <Select
                    value={plan.flightRules}
                    onValueChange={(v) =>
                      updateField("flightRules", v as ICAOFlightPlan["flightRules"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">
                        <span className="font-mono mr-1">I</span> - IFR
                      </SelectItem>
                      <SelectItem value="V">
                        <span className="font-mono mr-1">V</span> - VFR
                      </SelectItem>
                      <SelectItem value="Y">
                        <span className="font-mono mr-1">Y</span> - IFR
                        primero
                      </SelectItem>
                      <SelectItem value="Z">
                        <span className="font-mono mr-1">Z</span> - VFR
                        primero
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F8"
                    label="Tipo de Vuelo"
                    tooltip="S=Servicio Aéreo Regular, N=No Regular, G=Aviación General, M=Militar, X=Otro"
                  />
                  <Select
                    value={plan.typeOfFlight}
                    onValueChange={(v) =>
                      updateField(
                        "typeOfFlight",
                        v as ICAOFlightPlan["typeOfFlight"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">
                        <span className="font-mono mr-1">S</span> - Regular
                      </SelectItem>
                      <SelectItem value="N">
                        <span className="font-mono mr-1">N</span> - No Regular
                      </SelectItem>
                      <SelectItem value="G">
                        <span className="font-mono mr-1">G</span> - General
                      </SelectItem>
                      <SelectItem value="M">
                        <span className="font-mono mr-1">M</span> - Militar
                      </SelectItem>
                      <SelectItem value="X">
                        <span className="font-mono mr-1">X</span> - Otro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Flight rules legend */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground mb-1">
                  Referencia de Reglas de Vuelo:
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">I</kbd> =
                    IFR (Instrumentos)
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">V</kbd> =
                    VFR (Visual)
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">Y</kbd> =
                    IFR → VFR
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">Z</kbd> =
                    VFR → IFR
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECCIÓN 2 - EQUIPO ── */}
        <TabsContent value="section2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="size-4 text-amber-600" />
                Sección 2 - Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Campo 9 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F9"
                    label="N° Aeronaves"
                    tooltip="Número de aeronaves si es más de una (raro)"
                  />
                  <Input
                    value={plan.numberOfAircraft}
                    onChange={(e) =>
                      updateField("numberOfAircraft", e.target.value)
                    }
                    placeholder="1"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F9"
                    label="Tipo de Aeronave"
                    tooltip="Designador OACI de tipo de aeronave. Ej: B738, A320, C172"
                  />
                  <Input
                    value={plan.typeOfAircraft}
                    onChange={(e) =>
                      updateField(
                        "typeOfAircraft",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: B738"
                    className={`font-mono uppercase ${errors.typeOfAircraft ? "border-destructive" : ""}`}
                  />
                  {errors.typeOfAircraft && (
                    <p className="text-xs text-destructive">
                      {errors.typeOfAircraft}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F9"
                    label="Cat. Estela"
                    tooltip="Categoría de turbulencia de estela: H=Pesada, M=Media, L=Ligera"
                  />
                  <Select
                    value={plan.wakeTurbulenceCat}
                    onValueChange={(v) =>
                      updateField(
                        "wakeTurbulenceCat",
                        v as ICAOFlightPlan["wakeTurbulenceCat"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H">
                        <span className="font-mono mr-1">H</span> - Pesada
                        (Heavy)
                      </SelectItem>
                      <SelectItem value="M">
                        <span className="font-mono mr-1">M</span> - Media
                        (Medium)
                      </SelectItem>
                      <SelectItem value="L">
                        <span className="font-mono mr-1">L</span> - Ligera
                        (Light)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Campo 10 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F10"
                    label="Equipo / Capacidades"
                    tooltip="S=Standard, o lista de equipo: D=DME, G=GNSS, I=Inercial, L=ILS, O=VOR, R=RNP, Y=RVSM. Ej: SDGRY"
                  />
                  <Input
                    value={plan.equipment}
                    onChange={(e) =>
                      updateField("equipment", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: SDGRY"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F10"
                    label="Transpondedor"
                    tooltip="A=Modo A (4 dígitos), C=Modo A+C, S=Modo S, X=Modo S sin identificación de aeronave. Ej: AC, SC, S"
                  />
                  <Input
                    value={plan.transponder}
                    onChange={(e) =>
                      updateField("transponder", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: S, AC, SC"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              {/* Equipment legend */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground mb-1">
                  Códigos de Equipo Comunes:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">S</kbd> =
                    Standard
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">D</kbd> =
                    DME
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">G</kbd> =
                    GNSS
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">R</kbd> =
                    RNP
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">Y</kbd> =
                    RVSM
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">I</kbd> =
                    Inercial
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">L</kbd> =
                    ILS
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">O</kbd> =
                    VOR
                  </span>
                  <span>
                    <kbd className="font-mono bg-muted px-1 rounded">W</kbd> =
                    PBN aprobado
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECCIÓN 3 - RUTA ── */}
        <TabsContent value="section3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="size-4 text-amber-600" />
                Sección 3 - Ruta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Campo 13 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F13"
                    label="Aeródromo de Salida"
                    tooltip="Indicador ICAO de 4 letras del aeródromo de salida. Ej: SPJC, SPZO"
                  />
                  <Input
                    value={plan.departureAerodrome}
                    onChange={(e) =>
                      updateField(
                        "departureAerodrome",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: SPJC"
                    maxLength={4}
                    className={`font-mono uppercase ${errors.departureAerodrome ? "border-destructive" : ""}`}
                  />
                  {errors.departureAerodrome && (
                    <p className="text-xs text-destructive">
                      {errors.departureAerodrome}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F13"
                    label="Hora Estimada de Bloque (EOBT)"
                    tooltip="Hora estimada de fuera de bloques en UTC (HHMM)"
                  />
                  <Input
                    value={plan.estimatedOffBlockTime}
                    onChange={(e) =>
                      updateField("estimatedOffBlockTime", e.target.value)
                    }
                    placeholder="Ej: 1430"
                    maxLength={4}
                    className={`font-mono ${errors.estimatedOffBlockTime ? "border-destructive" : ""}`}
                  />
                  {errors.estimatedOffBlockTime && (
                    <p className="text-xs text-destructive">
                      {errors.estimatedOffBlockTime}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Campo 15 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F15"
                    label="Velocidad de Crucero"
                    tooltip="N=Knots (N0450), M=Mach (M082), K=km/h (K0800). Incluir prefijo."
                  />
                  <Input
                    value={plan.cruisingSpeed}
                    onChange={(e) =>
                      updateField("cruisingSpeed", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: N0450, M082"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F15"
                    label="Nivel de Crucero"
                    tooltip="FL=Flight Level (FL350), S=Standard metric (S1130), A=Altitud en centenas de pies (A045). Incluir prefijo."
                  />
                  <Input
                    value={plan.level}
                    onChange={(e) =>
                      updateField("level", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: FL350, S1130"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              {/* Campo 15 - Route */}
              <div className="space-y-2">
                <FieldLabel
                  field="F15"
                  label="Ruta"
                  tooltip="Descripción de la ruta: SID, aerovías, waypoints, STAR. Ej: LIM1A ISKAR G679 ESKAL UB673 PIRAT"
                />
                <textarea
                  value={plan.route}
                  onChange={(e) =>
                    updateField("route", e.target.value.toUpperCase())
                  }
                  placeholder="Ej: LIM1A ISKAR G679 ESKAL UB673 PIRAT DCT LIM VOR"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                  rows={3}
                />
                {initialRoute && initialRoute.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-green-500/50 text-green-600 dark:text-green-400"
                    >
                      Ruta auto-generada desde calculadora
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => {
                        const routeStr = generateRouteString(initialRoute)
                        updateField("route", routeStr)
                      }}
                    >
                      Regenerar
                    </Button>
                  </div>
                )}
              </div>

              {/* Route points display */}
              {initialRoute && initialRoute.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Puntos de Ruta ({initialRoute.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {initialRoute.map((point, idx) => (
                      <div key={point.id} className="flex items-center gap-1">
                        {idx > 0 && (
                          <ChevronDown className="size-3 text-muted-foreground rotate-[-90deg]" />
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            point.type === "AIRPORT"
                              ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                              : point.type === "NAVAID"
                                ? "border-cyan-500/50 text-cyan-600 dark:text-cyan-400"
                                : "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {point.name}
                          {point.airwayUsed && (
                            <span className="ml-1 opacity-60">
                              ({point.airwayUsed})
                            </span>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Campo 16 */}
              <div className="space-y-2">
                <FieldLabel
                  field="F16"
                  label="Aeródromo de Destino"
                  tooltip="Indicador ICAO de 4 letras del aeródromo de destino"
                />
                <Input
                  value={plan.destinationAerodrome}
                  onChange={(e) =>
                    updateField(
                      "destinationAerodrome",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Ej: SPZO"
                  maxLength={4}
                  className={`font-mono uppercase ${errors.destinationAerodrome ? "border-destructive" : ""}`}
                />
                {errors.destinationAerodrome && (
                  <p className="text-xs text-destructive">
                    {errors.destinationAerodrome}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="F16"
                    label="Tiempo Total Est. (EET)"
                    tooltip="Tiempo total estimado de vuelo en HHMM"
                  />
                  <Input
                    value={plan.totalEET}
                    onChange={(e) =>
                      updateField("totalEET", e.target.value)
                    }
                    placeholder="Ej: 0230"
                    maxLength={4}
                    className={`font-mono ${errors.totalEET ? "border-destructive" : ""}`}
                  />
                  {errors.totalEET && (
                    <p className="text-xs text-destructive">
                      {errors.totalEET}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F16"
                    label="Alternativa 1"
                    tooltip="Aeródromo de alternativa ICAO. Requerido para IFR."
                  />
                  <Input
                    value={plan.alternateAerodrome1}
                    onChange={(e) =>
                      updateField(
                        "alternateAerodrome1",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: SPCL"
                    maxLength={4}
                    className={`font-mono uppercase ${errors.alternateAerodrome1 ? "border-destructive" : ""}`}
                  />
                  {errors.alternateAerodrome1 && (
                    <p className="text-xs text-destructive">
                      {errors.alternateAerodrome1}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="F16"
                    label="Alternativa 2"
                    tooltip="Segundo aeródromo de alternativa (opcional)"
                  />
                  <Input
                    value={plan.alternateAerodrome2}
                    onChange={(e) =>
                      updateField(
                        "alternateAerodrome2",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: SPUR"
                    maxLength={4}
                    className={`font-mono uppercase ${errors.alternateAerodrome2 ? "border-destructive" : ""}`}
                  />
                  {errors.alternateAerodrome2 && (
                    <p className="text-xs text-destructive">
                      {errors.alternateAerodrome2}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECCIÓN 4 - INFORMACIÓN ADICIONAL ── */}
        <TabsContent value="section4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="size-4 text-amber-600" />
                Sección 4 - Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Campo 18 */}
              <div className="space-y-2">
                <FieldLabel
                  field="F18"
                  label="Otra Información"
                  tooltip="Indicadores OACI: PBN/, NAV/, DAT/, DOF/, REG/, EET/, SEL/, TYP/, CODE/. Ej: PBN/A1B1 NAV/GPS DAT/V DOF/240115"
                />
                <textarea
                  value={plan.otherInformation}
                  onChange={(e) =>
                    updateField("otherInformation", e.target.value)
                  }
                  placeholder="Ej: PBN/A1B1 NAV/GPS DAT/V DOF/240115"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Campo 19 */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 font-mono border-amber-500/50 text-amber-600 dark:text-amber-400 mr-1.5"
                >
                  F19
                </Badge>
                Información Suplementaria
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="E/"
                    label="Autonomía (Endurance)"
                    tooltip="Autonomía de combustible en HHMM"
                  />
                  <Input
                    value={plan.endurance}
                    onChange={(e) => updateField("endurance", e.target.value)}
                    placeholder="Ej: 0450"
                    maxLength={4}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="P/"
                    label="Personas a Bordo"
                    tooltip="Número total de personas a bordo. Dejar en blanco si no se conoce al momento de presentar el plan."
                  />
                  <Input
                    value={plan.personsOnBoard}
                    onChange={(e) =>
                      updateField("personsOnBoard", e.target.value)
                    }
                    placeholder="Ej: 180"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="R/"
                    label="Radio de Emergencia"
                    tooltip="U=UHF, V=VHF, E=ELT. Se pueden combinar. Ej: VE"
                  />
                  <Select
                    value={plan.emergencyRadio}
                    onValueChange={(v) =>
                      updateField(
                        "emergencyRadio",
                        v as ICAOFlightPlan["emergencyRadio"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U">
                        <span className="font-mono mr-1">U</span> - UHF
                      </SelectItem>
                      <SelectItem value="V">
                        <span className="font-mono mr-1">V</span> - VHF
                      </SelectItem>
                      <SelectItem value="E">
                        <span className="font-mono mr-1">E</span> - ELT
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="S/"
                    label="Equipo de Supervivencia"
                    tooltip="POLAR, DESERT, MARITIME, JUNGLE. Separar con barra. Ej: POLAR/MARITIME"
                  />
                  <Input
                    value={plan.survivalEquipment}
                    onChange={(e) =>
                      updateField(
                        "survivalEquipment",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: POLAR/MARITIME"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="J/"
                    label="Chalecos"
                    tooltip="LIGHT, FLUO, ORANGE + V/U/Radio. Ej: LIGHT/FLUO/V"
                  />
                  <Input
                    value={plan.jackets}
                    onChange={(e) =>
                      updateField("jackets", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: LIGHT/FLUO/V"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="D/"
                    label="Balsas"
                    tooltip="Número/capacidad/cubierta/orange. Ej: 2 8 C ORANGE"
                  />
                  <Input
                    value={plan.dinghies}
                    onChange={(e) =>
                      updateField("dinghies", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: 2 8 C ORANGE"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel
                    field="A/"
                    label="Color y Marcas de Aeronave"
                    tooltip="Color y marcas significativas de la aeronave"
                  />
                  <Input
                    value={plan.aircraftColorAndMarkings}
                    onChange={(e) =>
                      updateField(
                        "aircraftColorAndMarkings",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ej: WHITE/BLUE"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    field="N/"
                    label="Piloto al Mando"
                    tooltip="Nombre del piloto al mando"
                  />
                  <Input
                    value={plan.pilotInCommand}
                    onChange={(e) => updateField("pilotInCommand", e.target.value)}
                    placeholder="Ej: J. PEREZ"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <FieldLabel
                  field="RMK/"
                  label="Observaciones"
                  tooltip="Observaciones adicionales si son necesarias"
                />
                <Input
                  value={plan.remarks}
                  onChange={(e) => updateField("remarks", e.target.value)}
                  placeholder="Observaciones adicionales"
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // ── Preview Mode ─────────────────────────────────────────────────────
  const flightRulesLabel: Record<string, string> = {
    I: "IFR",
    V: "VFR",
    Y: "IFR/VFR",
    Z: "VFR/IFR",
  }
  const typeOfFlightLabel: Record<string, string> = {
    S: "REGULAR",
    N: "NO REGULAR",
    G: "GENERAL",
    M: "MILITAR",
    X: "OTRO",
  }
  const wakeTurbulenceLabel: Record<string, string> = {
    H: "PESADA",
    M: "MEDIA",
    L: "LIGERA",
  }

  const previewMode = (
    <div className="space-y-4">
      {/* Action bar (not printed) */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button
          variant="outline"
          onClick={() => setMode("fill")}
        >
          <Pencil className="size-4 mr-1.5" />
          Editar
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Printer className="size-4 mr-1.5" />
          Imprimir
        </Button>
        <Button
          onClick={handleDownloadFpl}
          disabled={isDownloading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          title="Descargar formato FPL oficial CORPAC con los datos del plan"
        >
          {isDownloading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="size-4 mr-1.5" />
          )}
          {isDownloading ? "Generando..." : "Descargar FPL"}
        </Button>
      </div>

      {/* Official ICAO Flight Plan Form */}
      <div className="print-area bg-white text-black border-2 border-gray-800 rounded-lg overflow-hidden shadow-lg">
        {/* Header */}
        <div className="border-b-2 border-gray-800 bg-gray-100 px-4 py-3 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-600 mb-0.5">
            República del Perú
          </p>
          <p className="text-[9px] tracking-wide text-gray-500 mb-1.5">
            Corporación Peruana de Aeropuertos y Aviación Comercial S.A. -
            CORPAC
          </p>
          <h1 className="text-lg font-bold tracking-wider text-gray-900">
            PLAN DE VUELO OACI / ICAO FLIGHT PLAN
          </h1>
          <div className="flex items-center justify-center gap-4 mt-1.5">
            <Badge className="bg-gray-800 text-white text-[9px] px-2 py-0.5 tracking-wider">
              AIP PERÚ
            </Badge>
            <span className="text-[9px] text-gray-500">
              Formato OACI 4444
            </span>
          </div>
        </div>

        {/* Flight plan type indicator */}
        <div className="flex border-b border-gray-400">
          <div className="flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">FPL</span>
          </div>
          <div className="border-l border-gray-400 flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">CHG</span>
          </div>
          <div className="border-l border-gray-400 flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">CNL</span>
          </div>
          <div className="border-l border-gray-400 flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">DLA</span>
          </div>
          <div className="border-l border-gray-400 flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">ARR</span>
          </div>
          <div className="border-l border-gray-400 flex-1 px-4 py-2 text-center text-[10px] font-mono tracking-wider">
            <span className="font-bold">DEP</span>
          </div>
        </div>

        {/* Field 7 & 8 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F7</span>
          </div>
          <div className="flex-1 px-3 py-2 border-r border-gray-400 font-mono text-sm font-bold min-h-[36px] flex items-center">
            {plan.aircraftIdentification || "—"}
          </div>
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F8</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-sm min-h-[36px] flex items-center gap-2">
            <span className="font-bold">
              {flightRulesLabel[plan.flightRules] || plan.flightRules}
            </span>
            <span className="text-gray-400">|</span>
            <span className="font-bold">
              {typeOfFlightLabel[plan.typeOfFlight] || plan.typeOfFlight}
            </span>
            <span className="text-gray-400 text-xs">
              ({plan.flightRules}/{plan.typeOfFlight})
            </span>
          </div>
        </div>

        {/* Field 9 & 10 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F9</span>
          </div>
          <div className="flex-1 px-3 py-2 border-r border-gray-400 font-mono text-sm min-h-[36px] flex items-center gap-2">
            <span>{plan.numberOfAircraft !== "1" ? plan.numberOfAircraft : ""}</span>
            <span className="font-bold">{plan.typeOfAircraft || "—"}</span>
            <span className="text-gray-400">|</span>
            <span className="text-xs text-gray-500">
              {wakeTurbulenceLabel[plan.wakeTurbulenceCat] ||
                plan.wakeTurbulenceCat}
            </span>
            <span className="text-gray-400 text-xs">
              ({plan.wakeTurbulenceCat})
            </span>
          </div>
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F10</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-sm min-h-[36px] flex items-center gap-2">
            <span className="font-bold">{plan.equipment || "—"}</span>
            <span className="text-gray-400">/</span>
            <span className="font-bold">{plan.transponder || "—"}</span>
          </div>
        </div>

        {/* Field 13 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F13</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-sm min-h-[36px] flex items-center gap-2">
            <span className="font-bold">
              {plan.departureAerodrome || "—"}
            </span>
            <span className="text-gray-400">|</span>
            <span>EOBT:</span>
            <span className="font-bold">
              {plan.estimatedOffBlockTime || "—"}
            </span>
            <span className="text-gray-400 text-xs">UTC</span>
          </div>
        </div>

        {/* Field 15 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F15</span>
          </div>
          <div className="flex-1 px-3 py-2 min-h-[50px]">
            <div className="font-mono text-sm flex items-center gap-2 mb-1">
              <span className="font-bold">{plan.cruisingSpeed || "—"}</span>
              <span className="text-gray-400">|</span>
              <span className="font-bold">{plan.level || "—"}</span>
            </div>
            {plan.route && (
              <div className="font-mono text-xs text-gray-700 leading-relaxed break-all">
                {plan.route}
              </div>
            )}
          </div>
        </div>

        {/* Field 16 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F16</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-sm min-h-[36px] flex items-center gap-2 flex-wrap">
            <span className="font-bold">
              {plan.destinationAerodrome || "—"}
            </span>
            <span className="text-gray-400">|</span>
            <span>EET:</span>
            <span className="font-bold">{plan.totalEET || "—"}</span>
            <span className="text-gray-400 text-xs">UTC</span>
            {plan.alternateAerodrome1 && (
              <>
                <span className="text-gray-400">|</span>
                <span>ALTN1:</span>
                <span className="font-bold">{plan.alternateAerodrome1}</span>
              </>
            )}
            {plan.alternateAerodrome2 && (
              <>
                <span className="text-gray-400">|</span>
                <span>ALTN2:</span>
                <span className="font-bold">{plan.alternateAerodrome2}</span>
              </>
            )}
          </div>
        </div>

        {/* Field 18 */}
        <div className="flex border-b border-gray-400">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F18</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-xs min-h-[36px] flex items-center break-all">
            {plan.otherInformation || "—"}
          </div>
        </div>

        {/* Field 19 */}
        <div className="flex border-b-2 border-gray-800">
          <div className="w-14 border-r border-gray-400 bg-gray-50 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">F19</span>
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-xs min-h-[36px] leading-relaxed">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {plan.endurance && (
                <span>
                  <span className="text-gray-500">E/</span>
                  {plan.endurance}
                </span>
              )}
              {plan.personsOnBoard && (
                <span>
                  <span className="text-gray-500">P/</span>
                  {plan.personsOnBoard}
                </span>
              )}
              {plan.emergencyRadio && (
                <span>
                  <span className="text-gray-500">R/</span>
                  {plan.emergencyRadio}
                </span>
              )}
              {plan.survivalEquipment && (
                <span>
                  <span className="text-gray-500">S/</span>
                  {plan.survivalEquipment}
                </span>
              )}
              {plan.jackets && (
                <span>
                  <span className="text-gray-500">J/</span>
                  {plan.jackets}
                </span>
              )}
              {plan.dinghies && (
                <span>
                  <span className="text-gray-500">D/</span>
                  {plan.dinghies}
                </span>
              )}
              {plan.aircraftColorAndMarkings && (
                <span>
                  <span className="text-gray-500">A/</span>
                  {plan.aircraftColorAndMarkings}
                </span>
              )}
              {plan.pilotInCommand && (
                <span>
                  <span className="text-gray-500">N/</span>
                  {plan.pilotInCommand}
                </span>
              )}
            </div>
            {plan.remarks && (
              <div className="mt-1">
                <span className="text-gray-500">RMK/</span>
                {plan.remarks}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-[9px] text-gray-500">
          <span>OACI Doc 4444 - PANS-ATM</span>
          <span>
            Generado: {new Date().toISOString().replace("T", " ").slice(0, 19)}{" "}
            UTC
          </span>
        </div>
      </div>

      {/* Raw flight plan string */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Mensaje del Plan de Vuelo (Formato AFTN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-xs leading-relaxed overflow-x-auto">
            <span className="text-gray-500">(FPL</span>
            <br />
            <span className="text-yellow-400">
              -{plan.aircraftIdentification || "???????"}
            </span>
            <span className="text-cyan-400">
              -{plan.flightRules}{plan.typeOfFlight}
            </span>
            <br />
            <span className="text-gray-500">-</span>
            <span>
              {plan.numberOfAircraft !== "1" ? plan.numberOfAircraft : ""}
              {plan.typeOfAircraft || "????"}
              {plan.wakeTurbulenceCat}
            </span>
            <span className="text-gray-500">-</span>
            <span className="text-cyan-300">
              {plan.equipment || "?"}/{plan.transponder || "?"}
            </span>
            <br />
            <span className="text-gray-500">-</span>
            <span className="text-yellow-400">
              {plan.departureAerodrome || "????"}
            </span>
            <span className="text-gray-500">-</span>
            <span>{plan.estimatedOffBlockTime || "????"}</span>
            <br />
            <span className="text-gray-500">-</span>
            <span className="text-cyan-300">
              {plan.cruisingSpeed || "N?????"}
            </span>
            <span className="text-gray-500">-</span>
            <span className="text-cyan-300">{plan.level || "FL???"}</span>
            <span className="text-gray-500">-</span>
            <span className="text-white">
              {plan.route || "DCT"}
            </span>
            <br />
            <span className="text-gray-500">-</span>
            <span className="text-yellow-400">
              {plan.destinationAerodrome || "????"}
            </span>
            <span className="text-gray-500">-</span>
            <span>{plan.totalEET || "????"}</span>
            {plan.alternateAerodrome1 && (
              <>
                <span className="text-gray-500">-</span>
                <span className="text-yellow-400">
                  {plan.alternateAerodrome1}
                </span>
              </>
            )}
            {plan.alternateAerodrome2 && (
              <>
                <span className="text-gray-500">-</span>
                <span className="text-yellow-400">
                  {plan.alternateAerodrome2}
                </span>
              </>
            )}
            <br />
            {plan.otherInformation && (
              <>
                <span className="text-gray-500">-</span>
                <span className="text-cyan-300">{plan.otherInformation}</span>
                <br />
              </>
            )}
            <span className="text-gray-500">)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plane className="size-5 text-amber-600" />
            Plan de Vuelo OACI
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Formato oficial de plan de vuelo ICAO para presentación
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400"
        >
          {mode === "fill" ? "Modo Edición" : "Vista Previa"}
        </Badge>
      </div>

      {mode === "fill" ? fillMode : previewMode}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
