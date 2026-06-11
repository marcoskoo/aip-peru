"use client"

import { useEffect, useState, useMemo } from "react"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import type { RoutePoint } from "@/lib/types"

// Fix default marker icons
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Custom orange marker for route waypoints
const routeMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [22, 35],
  iconAnchor: [11, 35],
  popupAnchor: [0, -30],
  className: "route-marker-icon",
})

interface AirwayLabel {
  lat: number
  lon: number
  name: string
}

interface ContextAirwayLines {
  conventional: [number, number][][]
  rnav: [number, number][][]
}

interface RouteCalculatorMapProps {
  route: RoutePoint[]
  routePositions: [number, number][]
  contextAirwayLines: ContextAirwayLines
  airwayLabels: AirwayLabel[]
  mapCenter: [number, number]
  mapZoom: number
}

// ─── FitBounds helper ────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(
        positions.map(([lat, lon]) => L.latLng(lat, lon))
      )
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [positions, map])

  return null
}

// ─── Airway Label Marker ─────────────────────────────────────────────

function AirwayLabelMarker({ lat, lon, name }: AirwayLabel) {
  const icon = useMemo(
    () =>
      new L.DivIcon({
        className: "airway-label-icon",
        html: `<div style="
          background: rgba(255,255,255,0.9);
          color: #059669;
          font-size: 10px;
          font-weight: 700;
          font-family: monospace;
          padding: 1px 5px;
          border-radius: 3px;
          border: 1px solid rgba(5,150,105,0.4);
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        ">${name}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, -8],
      }),
    [name]
  )

  return (
    <Marker position={[lat, lon]} icon={icon}>
      <Popup>
        <span className="text-xs font-mono font-semibold">Airway: {name}</span>
      </Popup>
    </Marker>
  )
}

// ─── Route name label at each waypoint ────────────────────────────────

function WaypointLabelMarker({ lat, lon, name, type }: { lat: number; lon: number; name: string; type: string }) {
  const icon = useMemo(
    () =>
      new L.DivIcon({
        className: "waypoint-label-icon",
        html: `<div style="
          background: ${type === "NAVAID" ? "rgba(5,150,105,0.9)" : "rgba(217,119,6,0.9)"};
          color: white;
          font-size: 10px;
          font-weight: 700;
          font-family: monospace;
          padding: 1px 5px;
          border-radius: 3px;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          position: relative;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
        ">${name}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    [name, type]
  )

  return <Marker position={[lat, lon]} icon={icon} interactive={false} />
}

// ─── Main Map Component ──────────────────────────────────────────────

export function RouteCalculatorMap({
  route,
  routePositions,
  contextAirwayLines,
  airwayLabels,
  mapCenter,
  mapZoom,
}: RouteCalculatorMapProps) {
  const [cssLoaded, setCssLoaded] = useState(false)

  // Load Leaflet CSS
  useEffect(() => {
    const existingLink = document.querySelector('link[href*="leaflet.css"]')
    if (existingLink) {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setCssLoaded(true))
      return
    }
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    link.onload = () => setCssLoaded(true)
    document.head.appendChild(link)
  }, [])

  if (!cssLoaded) {
    return (
      <div className="h-full min-h-[400px] lg:min-h-[600px] bg-muted/30 animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Cargando mapa...</span>
      </div>
    )
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className="h-full min-h-[400px] lg:min-h-[600px] w-full"
      scrollWheelZoom={true}
      key={route.length === 0 ? "empty-route" : `route-${route.length}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Context: Conventional Airways (faint green) */}
      {contextAirwayLines.conventional.map((positions, i) => (
        <Polyline
          key={`conv-${i}`}
          positions={positions}
          pathOptions={{ color: "#22c55e", weight: 1, opacity: 0.25 }}
        />
      ))}

      {/* Context: RNAV Airways (faint magenta) */}
      {contextAirwayLines.rnav.map((positions, i) => (
        <Polyline
          key={`rnav-${i}`}
          positions={positions}
          pathOptions={{ color: "#d946ef", weight: 1, opacity: 0.2 }}
        />
      ))}

      {/* Route Trajectory (bold orange) */}
      {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#f97316",
            weight: 4,
            opacity: 0.9,
          }}
        />
      )}

      {/* Route Waypoint Markers */}
      {route.map((point, idx) => (
        <Marker
          key={`marker-${idx}-${point.id}`}
          position={[point.lat, point.lon]}
          icon={routeMarkerIcon}
        >
          <Popup>
            <div className="text-xs font-mono min-w-[120px]">
              <div className="font-bold text-sm mb-1">{point.name}</div>
              <div className="text-muted-foreground">{point.type}</div>
              <div className="text-muted-foreground">
                {point.lat.toFixed(4)}°, {point.lon.toFixed(4)}°
              </div>
              {point.distanceFromPrev !== undefined && idx > 0 && (
                <div className="mt-1 pt-1 border-t border-border">
                  <div>Dist: {point.distanceFromPrev} NM</div>
                  <div>Brng: {point.bearingFromPrev}°</div>
                  {point.airwayUsed && <div>AWY: {point.airwayUsed}</div>}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Waypoint Name Labels */}
      {route.map((point, idx) => (
        <WaypointLabelMarker
          key={`label-${idx}-${point.id}`}
          lat={point.lat}
          lon={point.lon}
          name={point.name}
          type={point.type}
        />
      ))}

      {/* Airway Labels along segments */}
      {airwayLabels.map((label, i) => (
        <AirwayLabelMarker
          key={`awy-label-${i}-${label.name}`}
          lat={label.lat}
          lon={label.lon}
          name={label.name}
        />
      ))}

      {/* Auto-fit bounds when route changes */}
      {routePositions.length > 1 && <FitBounds positions={routePositions} />}
    </MapContainer>
  )
}
