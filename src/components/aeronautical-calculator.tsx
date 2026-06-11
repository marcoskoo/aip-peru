"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Thermometer, Wind, Gauge, Sun, ArrowRightLeft, Calculator,
  RotateCcw, Mountain, Compass, Cloud, Clock, Plane,
  Building2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AerodromeSelector, type AerodromeOption } from "@/components/aerodrome-selector"

// ─── Parse DMS to Decimal ───────────────────────────────────────

function dmsToDecimal(dms: string | null | undefined): number | null {
  if (!dms) return null
  // Parse formats like: 12°00'23.00"S, 077°07'07.00"W
  const match = dms.match(/(\d+)°(?:(\d+)['′])?(?:(\d+(?:\.\d+)?)['″"])?\s*([NSEW])/i)
  if (!match) return null
  const degrees = parseFloat(match[1])
  const minutes = match[2] ? parseFloat(match[2]) : 0
  const seconds = match[3] ? parseFloat(match[3]) : 0
  const direction = match[4].toUpperCase()
  let decimal = degrees + minutes / 60 + seconds / 3600
  if (direction === 'S' || direction === 'W') decimal = -decimal
  return decimal
}

// ─── Parse Elevation String to Feet ─────────────────────────────

function parseElevationFt(elevation?: string): number {
  if (!elevation) return 0
  const ftMatch = elevation.match(/(\d+)\s*ft/)
  const mMatch = elevation.match(/(\d+)\s*m/)
  if (ftMatch) return parseFloat(ftMatch[1])
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 3.28084)
  return 0
}

// ─── Shared Aerodrome Data for Tabs ────────────────────────────

interface AerodromeData {
  icaoCode: string
  name: string
  elevationFt: number
  latitude: number | null
  longitude: number | null
  type: "airport" | "heliport"
}

function aerodromeOptionToData(opt: AerodromeOption): AerodromeData {
  const lat = dmsToDecimal(opt.arpLatitude)
  const lon = dmsToDecimal(opt.arpLongitude)
  return {
    icaoCode: opt.icaoCode,
    name: opt.name,
    elevationFt: parseElevationFt(opt.elevation),
    latitude: lat,
    longitude: lon,
    type: opt.type,
  }
}

// ─── Tab 1: Density Altitude ─────────────────────────────────────

function DensityAltitudeTab({ selectedAerodrome }: { selectedAerodrome: AerodromeData | null }) {
  const [pressureAltitude, setPressureAltitude] = useState("")
  const [temperature, setTemperature] = useState("")
  const [prevAerodromeIcao, setPrevAerodromeIcao] = useState<string | null>(null)

  // Auto-fill elevation when aerodrome changes (React-recommended pattern)
  if (selectedAerodrome?.icaoCode !== prevAerodromeIcao) {
    setPrevAerodromeIcao(selectedAerodrome?.icaoCode ?? null)
    if (selectedAerodrome && selectedAerodrome.elevationFt > 0) {
      setPressureAltitude(String(selectedAerodrome.elevationFt))
    }
  }

  const result = useMemo(() => {
    const pa = parseFloat(pressureAltitude)
    const temp = parseFloat(temperature)
    if (isNaN(pa) || isNaN(temp)) return null

    const isaTemp = 15 - (pa / 1000) * 2
    const da = pa + 120 * (temp - isaTemp)
    return {
      densityAltitude: Math.round(da),
      isaTemp: Math.round(isaTemp * 10) / 10,
      deviation: Math.round((temp - isaTemp) * 10) / 10,
    }
  }, [pressureAltitude, temperature])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mountain className="size-5 text-amber-500" />
            Datos de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedAerodrome && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              {selectedAerodrome.type === "airport" ? (
                <Plane className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <Building2 className="size-3.5 text-teal-500 shrink-0" />
              )}
              <Badge className="bg-navy text-white font-bold text-[10px] px-1.5 tracking-wider shrink-0">
                {selectedAerodrome.icaoCode}
              </Badge>
              <span className="text-xs truncate">{selectedAerodrome.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                Elev: {selectedAerodrome.elevationFt} ft
              </span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pa">Altitud de Presión (ft)</Label>
            <Input
              id="pa"
              type="number"
              placeholder="Ej: 5000"
              value={pressureAltitude}
              onChange={(e) => setPressureAltitude(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              29.92 inHg / 1013.25 hPa en el altímetro
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oat">Temperatura Exterior (°C)</Label>
            <Input
              id="oat"
              type="number"
              placeholder="Ej: 25"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              OAT — Temperatura real del aire
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { setPressureAltitude(""); setTemperature("") }}
          >
            <RotateCcw className="size-3" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <Card className={result ? "border-amber-300 dark:border-amber-700" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="size-5 text-amber-500" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Altitud de Densidad</div>
                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {result.densityAltitude.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">pies</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Temp. ISA</div>
                  <div className="text-lg font-semibold">{result.isaTemp}°C</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Desviación ISA</div>
                  <div className={`text-lg font-semibold ${result.deviation > 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {result.deviation > 0 ? "+" : ""}{result.deviation}°C
                  </div>
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
                <strong>Fórmula:</strong> DA = PA + 120 × (OAT − ISA_temp)<br />
                ISA_temp = 15 − (PA ÷ 1000 × 2)
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Thermometer className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingrese los datos para calcular</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 2: Wind Calculator ──────────────────────────────────────

function WindTab() {
  const [windDir, setWindDir] = useState("")
  const [windSpeed, setWindSpeed] = useState("")
  const [course, setCourse] = useState("")
  const [tas, setTas] = useState("")

  const result = useMemo(() => {
    const wd = parseFloat(windDir)
    const ws = parseFloat(windSpeed)
    const crs = parseFloat(course)
    const trueAirspeed = parseFloat(tas)
    if (isNaN(wd) || isNaN(ws) || isNaN(crs) || isNaN(trueAirspeed) || trueAirspeed === 0) return null

    const windAngleRad = ((wd - crs) * Math.PI) / 180
    const crosswind = ws * Math.sin(windAngleRad)
    const headwind = ws * Math.cos(windAngleRad)
    const wca = (Math.asin(crosswind / trueAirspeed) * 180) / Math.PI
    const heading = (crs + wca + 360) % 360
    const groundSpeed = trueAirspeed * Math.cos((wca * Math.PI) / 180) - headwind

    return {
      headwind: Math.round(headwind * 10) / 10,
      crosswind: Math.round(Math.abs(crosswind) * 10) / 10,
      groundSpeed: Math.round(groundSpeed * 10) / 10,
      wca: Math.round(wca * 10) / 10,
      heading: Math.round(heading),
      crosswindDirection: crosswind > 0 ? "Derecha" : crosswind < 0 ? "Izquierda" : "Nula",
      headwindType: headwind > 0 ? "Viento en cara" : headwind < 0 ? "Viento en cola" : "Nulo",
    }
  }, [windDir, windSpeed, course, tas])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wind className="size-5 text-amber-500" />
            Datos de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="windDir">Dir. Viento (°)</Label>
              <Input id="windDir" type="number" placeholder="270" value={windDir} onChange={(e) => setWindDir(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="windSpeed">Velocidad (kt)</Label>
              <Input id="windSpeed" type="number" placeholder="15" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="course">Rumbo (°)</Label>
              <Input id="course" type="number" placeholder="250" value={course} onChange={(e) => setCourse(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tas">TAS (kt)</Label>
              <Input id="tas" type="number" placeholder="120" value={tas} onChange={(e) => setTas(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setWindDir(""); setWindSpeed(""); setCourse(""); setTas("") }}>
            <RotateCcw className="size-3" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <Card className={result ? "border-amber-300 dark:border-amber-700" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="size-5 text-amber-500" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ResultBox label="Componente Cara/Cola" value={`${Math.abs(result.headwind)} kt`} sub={result.headwindType} accent={result.headwind > 0} />
                <ResultBox label="Componente Cruzado" value={`${result.crosswind} kt`} sub={`Desde ${result.crosswindDirection}`} accent />
                <ResultBox label="Velocidad en Tierra" value={`${result.groundSpeed} kt`} sub="Ground Speed" accent />
                <ResultBox label="Corrección (WCA)" value={`${result.wca > 0 ? "+" : ""}${result.wca}°`} sub="Wind Correction Angle" accent />
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-1">Heading a mantener</div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{result.heading}°</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wind className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingrese los datos para calcular</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 3: QNH / QFE ────────────────────────────────────────────

function QnhQfeTab({ selectedAerodrome }: { selectedAerodrome: AerodromeData | null }) {
  const [qnh, setQnh] = useState("")
  const [elevation, setElevation] = useState("")
  const [prevAerodromeIcao, setPrevAerodromeIcao] = useState<string | null>(null)

  // Auto-fill elevation when aerodrome changes (React-recommended pattern)
  if (selectedAerodrome?.icaoCode !== prevAerodromeIcao) {
    setPrevAerodromeIcao(selectedAerodrome?.icaoCode ?? null)
    if (selectedAerodrome && selectedAerodrome.elevationFt > 0) {
      setElevation(String(selectedAerodrome.elevationFt))
    }
  }

  const result = useMemo(() => {
    const q = parseFloat(qnh)
    const elev = parseFloat(elevation)
    if (isNaN(q) || isNaN(elev)) return null

    const qfe = q - elev / 30
    const pressureAltitude = (1013.25 - q) * 30
    return {
      qfe: Math.round(qfe * 10) / 10,
      pressureAltitude: Math.round(pressureAltitude),
      elevationHpa: Math.round((elev / 30) * 10) / 10,
    }
  }, [qnh, elevation])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="size-5 text-amber-500" />
            Datos de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedAerodrome && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              {selectedAerodrome.type === "airport" ? (
                <Plane className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <Building2 className="size-3.5 text-teal-500 shrink-0" />
              )}
              <Badge className="bg-navy text-white font-bold text-[10px] px-1.5 tracking-wider shrink-0">
                {selectedAerodrome.icaoCode}
              </Badge>
              <span className="text-xs truncate">{selectedAerodrome.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                Elev: {selectedAerodrome.elevationFt} ft
              </span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="qnh">QNH (hPa)</Label>
            <Input id="qnh" type="number" step="0.1" placeholder="1013.25" value={qnh} onChange={(e) => setQnh(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="elev">Elevación del aeródromo (ft)</Label>
            <Input id="elev" type="number" placeholder="516" value={elevation} onChange={(e) => setElevation(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setQnh(""); setElevation("") }}>
            <RotateCcw className="size-3" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <Card className={result ? "border-amber-300 dark:border-amber-700" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="size-5 text-amber-500" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-1">QFE</div>
                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">{result.qfe}</div>
                <div className="text-sm text-muted-foreground">hPa</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ResultBox label="Altitud de Presión" value={`${result.pressureAltitude} ft`} sub="PA desde QNH" accent />
                <ResultBox label="Corrección Elev." value={`${result.elevationHpa} hPa`} sub={`${elevation} ft ÷ 30`} accent />
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
                <strong>Fórmula:</strong> QFE = QNH − (Elevación ÷ 30)
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gauge className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingrese los datos para calcular</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 4: Sunrise / Sunset ─────────────────────────────────────

function SunriseSunsetTab({ selectedAerodrome }: { selectedAerodrome: AerodromeData | null }) {
  const [latitude, setLatitude] = useState("-12.0")
  const [longitude, setLongitude] = useState("-77.0")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [prevAerodromeIcao, setPrevAerodromeIcao] = useState<string | null>(null)

  // Auto-fill coordinates when aerodrome changes (React-recommended pattern)
  if (selectedAerodrome?.icaoCode !== prevAerodromeIcao) {
    setPrevAerodromeIcao(selectedAerodrome?.icaoCode ?? null)
    if (selectedAerodrome && selectedAerodrome.latitude !== null && selectedAerodrome.longitude !== null) {
      setLatitude(String(Math.round(selectedAerodrome.latitude * 100) / 100))
      setLongitude(String(Math.round(selectedAerodrome.longitude * 100) / 100))
    }
  }

  const result = useMemo(() => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const d = date ? new Date(date) : new Date()
    if (isNaN(lat) || isNaN(lon)) return null

    // Simplified NOAA Solar Calculator
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)

    // Solar declination (degrees)
    const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10))
    const decRad = (declination * Math.PI) / 180
    const latRad = (lat * Math.PI) / 180

    // Hour angle for sunrise/sunset (degrees)
    const cosHourAngle = (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad))

    // Civil twilight hour angle
    const cosCivilTwilight = (Math.sin((-6 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad))

    if (cosHourAngle > 1 || cosHourAngle < -1) {
      return {
        isPolar: true,
        message: cosHourAngle > 1 ? "Noche polar — sin amanecer" : "Día polar — sin atardecer",
      }
    }

    const hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI
    const civilTwilightAngle = (Math.acos(Math.min(1, Math.max(-1, cosCivilTwilight))) * 180) / Math.PI

    // Equation of time (minutes) — simplified
    const B = ((2 * Math.PI) / 365) * (dayOfYear - 81)
    const eotMin = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)

    // Solar noon (minutes from midnight UTC)
    const solarNoonUTC = 720 - 4 * lon - eotMin

    // Sunrise/sunset UTC (minutes)
    const sunriseUTC = solarNoonUTC - hourAngle * 4
    const sunsetUTC = solarNoonUTC + hourAngle * 4
    const civilDawnUTC = solarNoonUTC - civilTwilightAngle * 4
    const civilDuskUTC = solarNoonUTC + civilTwilightAngle * 4

    // Daylight duration
    const daylightMin = sunsetUTC - sunriseUTC
    const daylightH = Math.floor(daylightMin / 60)
    const daylightM = Math.round(daylightMin % 60)

    const formatUTC = (minutes: number) => {
      const h = Math.floor(((minutes % 1440) + 1440) % 1440 / 60)
      const m = Math.round(((minutes % 1440) + 1440) % 1440 % 60)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "3")} UTC`
    }

    return {
      sunrise: formatUTC(sunriseUTC),
      sunset: formatUTC(sunsetUTC),
      civilDawn: formatUTC(civilDawnUTC),
      civilDusk: formatUTC(civilDuskUTC),
      daylight: `${daylightH}h ${daylightM}m`,
      declination: Math.round(declination * 10) / 10,
      isPolar: false,
    }
  }, [latitude, longitude, date])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="size-5 text-amber-500" />
            Datos de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedAerodrome && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              {selectedAerodrome.type === "airport" ? (
                <Plane className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <Building2 className="size-3.5 text-teal-500 shrink-0" />
              )}
              <Badge className="bg-navy text-white font-bold text-[10px] px-1.5 tracking-wider shrink-0">
                {selectedAerodrome.icaoCode}
              </Badge>
              <span className="text-xs truncate">{selectedAerodrome.name}</span>
              {selectedAerodrome.latitude !== null && selectedAerodrome.longitude !== null && (
                <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                  {selectedAerodrome.latitude.toFixed(2)}°, {selectedAerodrome.longitude.toFixed(2)}°
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitud (°)</Label>
              <Input id="lat" type="number" step="0.01" placeholder="-12.00" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Negativo = Sur</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lon">Longitud (°)</Label>
              <Input id="lon" type="number" step="0.01" placeholder="-77.00" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Negativo = Oeste</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setLatitude("-12.0"); setLongitude("-77.0"); setDate(new Date().toISOString().split("T")[0]) }}>
            <RotateCcw className="size-3" />
            Reset (Lima)
          </Button>
        </CardContent>
      </Card>

      <Card className={result && !result.isPolar ? "border-amber-300 dark:border-amber-700" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            result.isPolar ? (
              <div className="text-center py-8">
                <Sun className="size-8 mx-auto mb-2 text-amber-500" />
                <p className="font-medium">{result.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-200 dark:border-amber-800">
                    <Sun className="size-5 mx-auto mb-1 text-amber-500" />
                    <div className="text-xs text-muted-foreground">Amanecer</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{result.sunrise}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center border border-orange-200 dark:border-orange-800">
                    <Cloud className="size-5 mx-auto mb-1 text-orange-500" />
                    <div className="text-xs text-muted-foreground">Atardecer</div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{result.sunset}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ResultBox label="Crepúsculo Matutino" value={result.civilDawn ?? "—"} sub="Civil" accent />
                  <ResultBox label="Crepúsculo Vespertino" value={result.civilDusk ?? "—"} sub="Civil" accent />
                </div>

                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Horas de Luz</div>
                  <div className="text-2xl font-bold">{result.daylight}</div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sun className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingrese coordenadas válidas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 5: Unit Converter ────────────────────────────────────────

type UnitCategory = "altitude" | "distance" | "speed" | "pressure" | "temperature" | "volume"

interface ConversionPair {
  from: string
  to: string
  fromLabel: string
  toLabel: string
  convert: (v: number) => number
  reverse: (v: number) => number
}

const conversions: Record<UnitCategory, { label: string; icon: React.ComponentType<{ className?: string }>; pairs: ConversionPair[] }> = {
  altitude: {
    label: "Altitud",
    icon: Mountain,
    pairs: [
      { from: "ft", to: "m", fromLabel: "Pies (ft)", toLabel: "Metros (m)", convert: (v) => v * 0.3048, reverse: (v) => v / 0.3048 },
    ],
  },
  distance: {
    label: "Distancia",
    icon: ArrowRightLeft,
    pairs: [
      { from: "NM", to: "km", fromLabel: "Millas Náuticas", toLabel: "Kilómetros", convert: (v) => v * 1.852, reverse: (v) => v / 1.852 },
      { from: "NM", to: "mi", fromLabel: "Millas Náuticas", toLabel: "Millas Estatutarias", convert: (v) => v * 1.15078, reverse: (v) => v / 1.15078 },
    ],
  },
  speed: {
    label: "Velocidad",
    icon: Wind,
    pairs: [
      { from: "kt", to: "kmh", fromLabel: "Nudos (kt)", toLabel: "km/h", convert: (v) => v * 1.852, reverse: (v) => v / 1.852 },
      { from: "kt", to: "mph", fromLabel: "Nudos (kt)", toLabel: "mph", convert: (v) => v * 1.15078, reverse: (v) => v / 1.15078 },
    ],
  },
  pressure: {
    label: "Presión",
    icon: Gauge,
    pairs: [
      { from: "hPa", to: "inHg", fromLabel: "HectoPascals", toLabel: "Pulgadas Hg", convert: (v) => v * 0.02953, reverse: (v) => v / 0.02953 },
    ],
  },
  temperature: {
    label: "Temperatura",
    icon: Thermometer,
    pairs: [
      { from: "°C", to: "°F", fromLabel: "Celsius", toLabel: "Fahrenheit", convert: (v) => (v * 9) / 5 + 32, reverse: (v) => ((v - 32) * 5) / 9 },
    ],
  },
  volume: {
    label: "Volumen",
    icon: ArrowRightLeft,
    pairs: [
      { from: "gal", to: "L", fromLabel: "Galones (US)", toLabel: "Litros", convert: (v) => v * 3.78541, reverse: (v) => v / 3.78541 },
    ],
  },
}

function UnitConverterTab() {
  const [category, setCategory] = useState<UnitCategory>("altitude")
  const [inputValue, setInputValue] = useState("")
  const [direction, setDirection] = useState<"forward" | "reverse">("forward")

  const currentCategory = conversions[category]
  const pair = currentCategory.pairs[0]

  const result = useMemo(() => {
    const v = parseFloat(inputValue)
    if (isNaN(v)) return null
    if (direction === "forward") {
      return Math.round(pair.convert(v) * 10000) / 10000
    }
    return Math.round(pair.reverse(v) * 10000) / 10000
  }, [inputValue, direction, pair])

  const fromLabel = direction === "forward" ? pair.fromLabel : pair.toLabel
  const toLabel = direction === "forward" ? pair.toLabel : pair.fromLabel
  const fromUnit = direction === "forward" ? pair.from : pair.to
  const toUnit = direction === "forward" ? pair.to : pair.from

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-amber-500" />
            Conversor
          </CardTitle>
          <CardDescription>Seleccione categoría y converse entre unidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as UnitCategory); setInputValue("") }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conversions).map(([key, cat]) => {
                  const CatIcon = cat.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <CatIcon className="size-3.5" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{fromLabel}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                placeholder="Ingrese valor"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Badge variant="outline" className="h-10 flex items-center px-3 text-xs font-mono">{fromUnit}</Badge>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setDirection(direction === "forward" ? "reverse" : "forward")}
            >
              <ArrowRightLeft className="size-3.5" />
              Invertir ({toLabel} → {fromLabel})
            </Button>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setInputValue("")}>
            <RotateCcw className="size-3" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <Card className={result !== null ? "border-amber-300 dark:border-amber-700" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="size-5 text-amber-500" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result !== null ? (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-6 text-center border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-1">{toLabel}</div>
                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-mono">{toUnit}</div>
              </div>

              <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground text-center">
                {parseFloat(inputValue).toLocaleString()} {fromUnit} = {result.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toUnit}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingrese un valor para convertir</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Result Box Sub-component ─────────────────────────────────────

function ResultBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${accent ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function AeronauticalCalculator() {
  const [selectedAerodrome, setSelectedAerodrome] = useState<AerodromeData | null>(null)

  const handleAerodromeSelect = useCallback((opt: AerodromeOption) => {
    setSelectedAerodrome(aerodromeOptionToData(opt))
  }, [])

  const handleAerodromeClear = useCallback(() => {
    setSelectedAerodrome(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-950/50">
            <Calculator className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Calculadora Aeronáutica</h2>
            <p className="text-sm text-muted-foreground">Herramientas de cálculo para operaciones de vuelo</p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <AerodromeSelector
            onSelect={handleAerodromeSelect}
            value={selectedAerodrome?.icaoCode}
            placeholder="Seleccionar aeródromo..."
            onClear={handleAerodromeClear}
          />
        </div>
      </div>

      {/* Selected aerodrome info badge */}
      {selectedAerodrome && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-navy/5 dark:bg-navy/20 rounded-lg border border-navy/10 dark:border-navy/30">
          {selectedAerodrome.type === "airport" ? (
            <Plane className="size-4 text-amber-500 shrink-0" />
          ) : (
            <Building2 className="size-4 text-teal-500 shrink-0" />
          )}
          <Badge className="bg-navy text-white font-bold text-xs px-2 py-0.5 tracking-wider shrink-0">
            {selectedAerodrome.icaoCode}
          </Badge>
          <span className="text-sm font-medium">{selectedAerodrome.name}</span>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span>Elev: {selectedAerodrome.elevationFt} ft</span>
            {selectedAerodrome.latitude !== null && selectedAerodrome.longitude !== null && (
              <span className="hidden sm:inline">
                {selectedAerodrome.latitude.toFixed(2)}°, {selectedAerodrome.longitude.toFixed(2)}°
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="density" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto gap-1 p-1">
          <TabsTrigger value="density" className="gap-1.5 text-xs sm:text-sm">
            <Mountain className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Alt. Densidad</span>
            <span className="sm:hidden">Densidad</span>
          </TabsTrigger>
          <TabsTrigger value="wind" className="gap-1.5 text-xs sm:text-sm">
            <Wind className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Viento</span>
            <span className="sm:hidden">Viento</span>
          </TabsTrigger>
          <TabsTrigger value="qnh" className="gap-1.5 text-xs sm:text-sm">
            <Gauge className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">QNH/QFE</span>
            <span className="sm:hidden">QNH</span>
          </TabsTrigger>
          <TabsTrigger value="sunrise" className="gap-1.5 text-xs sm:text-sm">
            <Sun className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Amanecer</span>
            <span className="sm:hidden">Sol</span>
          </TabsTrigger>
          <TabsTrigger value="converter" className="gap-1.5 text-xs sm:text-sm col-span-2 sm:col-span-1">
            <ArrowRightLeft className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Conversor</span>
            <span className="sm:hidden">Convertir</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="density" className="mt-4">
          <DensityAltitudeTab selectedAerodrome={selectedAerodrome} />
        </TabsContent>
        <TabsContent value="wind" className="mt-4">
          <WindTab />
        </TabsContent>
        <TabsContent value="qnh" className="mt-4">
          <QnhQfeTab selectedAerodrome={selectedAerodrome} />
        </TabsContent>
        <TabsContent value="sunrise" className="mt-4">
          <SunriseSunsetTab selectedAerodrome={selectedAerodrome} />
        </TabsContent>
        <TabsContent value="converter" className="mt-4">
          <UnitConverterTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
