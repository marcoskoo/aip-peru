"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plane,
  Radio,
  Navigation2,
  Map as MapIcon,
  Crosshair,
  Layers,
  Route,
  Trash2,
  MapPin,
  X,
  ChevronDown,
  ChevronRight,
  Gauge,
  Undo2,
  Pencil,
  Move,
  FileText,
} from "lucide-react"
import type {
  AirwaysData,
  Airway,
  AirwaySegment,
  Navaid,
  Waypoint,
  FIRBoundary,
  AdjacentFIR,
  Coord,
  RouteSummary,
} from "@/lib/types"
import { PERUVIAN_AIRPORTS, type PeruvianAirport } from "@/lib/aviation/peru-airports-static"
import { PERUVIAN_NAVAIDS, normalizeNavaidType } from "@/lib/aviation/peru-navaids-static"
import { INTERNATIONAL_NAVAIDS, type IntlNavaid } from "@/lib/aviation/peru-navaids-intl-static"
import { PERUVIAN_WAYPOINTS, PERUVIAN_AIRWAYS, type PeruvianWaypointExt } from "@/lib/aviation/peru-airways-static"
import { FIR_TRANSFERS, TRANSFER_POINT_IDS, type FirTransfer } from "@/lib/aviation/peru-fir-transfers"
import { TMA_SECTORS_DATA, RESTRICTED_AIRSPACE } from "@/lib/aviation/peru-airspace"
import {
  WORLD_WAYPOINTS,
  WORLD_AIRWAYS,
  type WorldWaypoint,
} from "@/lib/aviation/world-waypoints-static"

// ─── Color Palette (Light Aeronautical Chart Theme) ─────────────
// Based on classic aviation charts: white land, dark blue airways,
// magenta highlighted route, green waypoints, blue VOR/airports.
const C = {
  // Markers
  airport: "#1e40af",        // blue — international airport marker
  airportBorder: "#1e3a8a",  // darker blue border
  airportNat: "#3b82f6",     // lighter blue — national airport marker
  navaid: "#1d4ed8",         // blue — VOR/DME marker
  navaidBorder: "#1e3a8a",
  waypoint: "#16a34a",       // green — waypoint marker
  waypointBorder: "#15803d",
  transferPt: "#dc2626",     // red — FIR transfer / compulsory reporting point (filled star)
  transferPtBorder: "#7f1d1d",
  notifPt: "#ea580c",        // orange — other notification point (filled diamond)
  intlNavaid: "#0e7490",     // teal — international (adjacent FIR) navaid marker
  intlNavaidBorder: "#155e75",
  tma: "#7c3aed",            // violet — TMA/CTR polygon outline
  restricted: "#b91c1c",     // red — restricted/prohibited/danger zones
  // Routes & airways
  route: "#c026d3",          // magenta — user-built route (highlighted)
  routeGlow: "#e879f9",      // lighter magenta glow
  airwayConv: "#1e3c78",     // dark blue — conventional airways
  airwayRnav: "#64748b",     // slate gray — RNAV airways (dashed)
  // Boundaries
  fir: "#475569",            // slate — FIR Lima boundary
  adjacentFir: "#94a3b8",    // lighter slate — adjacent FIRs
  grid: "#cbd5e1",           // light gray — lat/lon grid
  // UI / text
  ink: "#0f172a",            // near-black — primary text on light bg
  inkSoft: "#475569",        // soft slate — secondary text
  panelBg: "#ffffff",        // white — panel background
  panelBorder: "#cbd5e1",    // light border
  panelAccent: "#eef2ff",    // very light blue — panel accent/header
  accent: "#1e40af",         // blue — buttons/badges accent
  orange: "#ea580c",         // orange — undo / action
  red: "#dc2626",            // red — clear / delete
  white: "#ffffff",
  mapBg: "#e8eef5",          // light blue-gray — map background
}

// ─── Constants ───────────────────────────────────────────────────
const MAP_CENTER: [number, number] = [-9.19, -75.0]
const MAP_ZOOM = 6

// ─── Basemap tile providers (SkyVector-style) ────────────────────
// World Hi  → CARTO light_all       (cleanest, white land / pale blue water — high IFR chart)
// World Lo  → CARTO voyager         (slightly more colorful detail — low IFR chart)
// World VFR → OpenTopoMap           (tan/beige topographic — VFR sectional feel)
type BasemapId = "hi" | "lo" | "vfr"

interface BasemapConfig {
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string
}

const BASEMAPS: Record<BasemapId, BasemapConfig> = {
  hi: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: "abcd",
  },
  lo: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: "abcd",
  },
  vfr: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    subdomains: "abc",
  },
}

// ─── Types ───────────────────────────────────────────────────────
interface RoutePoint {
  id: string
  name: string
  type: "AIRPORT" | "NAVAID" | "WAYPOINT" | "CUSTOM"
  lat: number
  lon: number
}

interface LayerState {
  aerodromos: boolean
  navaids: boolean
  intlNavaids: boolean
  waypoints: boolean
  transferPoints: boolean
  convAirways: boolean
  rnavAirways: boolean
  firBoundary: boolean
  adjacentFirs: boolean
  tmaSectors: boolean
  restricted: boolean
  grid: boolean
  // World layers (loaded via API on viewport change)
  worldAirports: boolean
  worldNavaids: boolean
  worldWaypoints: boolean
  worldAirways: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Great-circle distance in NM (haversine) */
function gcDistNM(a: Coord, b: Coord): number {
  const R = 3440.065 // Earth radius in NM
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

/** Initial bearing from a to b (degrees true) */
function bearingDeg(a: Coord, b: Coord): number {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return Math.round(((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360))
}

/** Format coords lookup */
function buildCoordLookup(
  waypoints: Waypoint[],
  navaids: Navaid[],
  airports: PeruvianAirport[]
): Map<string, Coord> {
  const m = new Map<string, Coord>()
  for (const wp of waypoints) m.set(wp.id, { lat: wp.lat, lon: wp.lon })
  for (const nv of navaids) m.set(nv.id, { lat: nv.lat, lon: nv.lon })
  for (const ap of airports) m.set(ap.icao, { lat: ap.lat, lon: ap.lng })
  return m
}

/** Find nearest known point (airport/navaid/waypoint) within threshold degrees */
function findNearestPoint(
  lat: number,
  lon: number,
  airports: PeruvianAirport[],
  navaids: Navaid[],
  waypoints: Waypoint[],
  threshold = 0.4
): RoutePoint | null {
  let nearest: RoutePoint | null = null
  let minDist = Infinity
  for (const ap of airports) {
    const d = Math.hypot(ap.lat - lat, ap.lng - lon)
    if (d < minDist && d < threshold) {
      minDist = d
      nearest = { id: ap.icao, name: ap.short || ap.city, type: "AIRPORT", lat: ap.lat, lon: ap.lng }
    }
  }
  for (const nv of navaids) {
    const d = Math.hypot(nv.lat - lat, nv.lon - lon)
    if (d < minDist && d < threshold) {
      minDist = d
      nearest = { id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon }
    }
  }
  if (waypoints) {
    for (const wp of waypoints) {
      const d = Math.hypot(wp.lat - lat, wp.lon - lon)
      if (d < minDist && d < threshold) {
        minDist = d
        nearest = { id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon }
      }
    }
  }
  return nearest
}

// ─── Airway Index & ICAO Route String Builder ──────────────────────
// For each pair of points (from,to), find the airways that contain a segment
// linking them in either direction. Used to compress a sequence of points
// into an ICAO route string like "SPJC DCT TAP V5 ISRES V321 SPCL".

interface AirwayIndex {
  // key: "FROM→TO" → list of { designator, level, type }
  pair: Map<string, { designator: string; level: string; type: string }[]>
}

function buildAirwayIndex(airways: { conventional: Airway[]; rnav: Airway[] }): AirwayIndex {
  const idx: AirwayIndex = { pair: new Map() }
  const all = [...airways.conventional, ...airways.rnav]
  for (const aw of all) {
    for (const seg of aw.segments) {
      const k1 = `${seg.from}→${seg.to}`
      const k2 = `${seg.to}→${seg.from}`
      const entry = { designator: aw.designator, level: aw.level, type: aw.type }
      for (const k of [k1, k2]) {
        if (!idx.pair.has(k)) idx.pair.set(k, [])
        const arr = idx.pair.get(k)!
        if (!arr.some(e => e.designator === entry.designator)) arr.push(entry)
      }
    }
  }
  return idx
}

/**
 * Build an ICAO flight plan route string from a sequence of route points.
 * Inserts DCT (direct) between points that don't share an airway, otherwise
 * inserts the airway designator. Compresses consecutive legs on the same
 * airway (e.g. A B1 C B1 D → "A B1 C D" — C stays because the airway changes
 * direction or the user keeps it as an intermediate).
 *
 * Example: SPJC, TAP, ISRES, SPCL  →  "SPJC DCT TAP V5 ISRES V321 SPCL"
 */
function buildIcaoRouteString(
  points: RoutePoint[],
  idx: AirwayIndex
): string {
  if (points.length === 0) return ""
  if (points.length === 1) return points[0].id
  const tokens: string[] = [points[0].id]
  let lastAirway: string | null = null
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    // Skip if same id (deduplicate just in case)
    if (prev.id === cur.id) continue
    const k = `${prev.id}→${cur.id}`
    const cands = idx.pair.get(k) || []
    if (cands.length > 0) {
      // Prefer RNAV T/UL/UM/UN/UP airways if both available, else first
      const pick =
        cands.find(c => /^(T|UL|UM|UN|UP)/.test(c.designator)) || cands[0]
      if (lastAirway !== pick.designator) {
        tokens.push(pick.designator)
        lastAirway = pick.designator
      }
    } else {
      if (lastAirway !== "DCT") {
        tokens.push("DCT")
        lastAirway = "DCT"
      }
    }
    tokens.push(cur.id)
  }
  return tokens.join(" ")
}

// ─── Airway Network Graph & BFS Path Finder ────────────────────────────
// Build a node→[neighbors] graph from the airway pair index, then use BFS
// to find the shortest path (in number of legs) between two idents.
// Each edge stores the airway designator so we can reconstruct the route.
//
// Example: findAirwayPath("SPJC", "SPCL", idx) might return:
//   ["SPJC", "V5", "TAP", "V5", "ISRES", "V321", "SPCL"]
// which is then turned into the ICAO string "SPJC V5 TAP ISRES V321 SPCL".

interface AirwayGraph {
  // node ident → list of { neighbor, designator }
  edges: Map<string, { neighbor: string; designator: string }[]>
}

function buildAirwayGraph(idx: AirwayIndex): AirwayGraph {
  const g: AirwayGraph = { edges: new Map() }
  for (const [k, airs] of idx.pair) {
    const [from, to] = k.split("→")
    if (!from || !to) continue
    // Use the first airway designator (pair index already dedupes)
    const designator = airs[0]?.designator || "DCT"
    if (!g.edges.has(from)) g.edges.set(from, [])
    g.edges.get(from)!.push({ neighbor: to, designator })
  }
  return g
}

/**
 * BFS pathfinder through the airway network.
 * Returns the sequence of idents to visit (without airway designators),
 * or null if no path found within maxDepth legs.
 *
 * The result includes intermediate waypoints that the route should pass
 * through. The caller can then look up coordinates for each ident via
 * coordLookup and build a RoutePoint[] for display.
 */
function findAirwayPath(
  start: string,
  end: string,
  idx: AirwayIndex,
  maxDepth = 4
): string[] | null {
  if (start === end) return [start]
  const g = buildAirwayGraph(idx)
  if (!g.edges.has(start) || !g.edges.has(end)) return null

  // BFS with path tracking
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }]
  const visited = new Set<string>([start])
  while (queue.length > 0) {
    const { node, path } = queue.shift()!
    if (path.length - 1 >= maxDepth) continue
    const edges = g.edges.get(node) || []
    for (const edge of edges) {
      if (visited.has(edge.neighbor)) continue
      const newPath = [...path, edge.neighbor]
      if (edge.neighbor === end) return newPath
      visited.add(edge.neighbor)
      queue.push({ node: edge.neighbor, path: newPath })
    }
  }
  return null
}

// ─── Icons ───────────────────────────────────────────────────────

function createAirportIcon(icao: string, isIntl: boolean, isSelected: boolean) {
  const color = isSelected ? C.route : isIntl ? C.airport : C.airportNat
  const border = isSelected ? C.route : isIntl ? C.airportBorder : C.airportBorder
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid ${border};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : ""}
        "></div>
        <span style="
          position:absolute;top:12px;
          font-size:8px;font-weight:700;
          color:${C.ink};white-space:nowrap;
          text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
          letter-spacing:0.5px;pointer-events:none;
        ">${icao}</span>
      </div>`,
    iconSize: [14, 24],
    iconAnchor: [7, 7],
  })
}

function createNavaidIcon(id: string, freq: string, isSelected: boolean) {
  const color = isSelected ? C.route : C.navaid
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:12px;height:12px;
          background:transparent;
          border:2.5px solid ${color};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : ""}
        "></div>
        <div style="position:absolute;top:2px;left:14px;display:flex;flex-direction:column;pointer-events:none;">
          <span style="
            font-size:9px;font-weight:700;
            color:${C.ink};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;
          ">${id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:${C.inkSoft};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;
          ">${freq.replace(" MHz", "")}</span>
        </div>
      </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function createWaypointIcon(id: string, isSelected: boolean, isNotif?: boolean, isTransfer?: boolean) {
  // Transfer point: filled red diamond with star — most prominent
  if (isTransfer) {
    return L.divIcon({
      className: "",
      html: `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="
            width:11px;height:11px;
            background:${isSelected ? C.route : C.transferPt};
            border:1.5px solid ${isSelected ? C.route : C.transferPtBorder};
            transform:rotate(45deg);
            ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : `box-shadow:0 0 4px ${C.transferPt}66;`}
          "></div>
          <span style="
            position:absolute;top:9px;
            font-size:8px;font-weight:700;
            color:${C.transferPtBorder};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            pointer-events:none;letter-spacing:0.3px;
          ">${id}★</span>
        </div>`,
      iconSize: [11, 22],
      iconAnchor: [5, 5],
    })
  }
  // Notification point: filled orange diamond — slightly larger than waypoint
  if (isNotif) {
    return L.divIcon({
      className: "",
      html: `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="
            width:9px;height:9px;
            background:${isSelected ? C.route : C.notifPt};
            border:1.5px solid ${isSelected ? C.route : "#7c2d12"};
            transform:rotate(45deg);
            ${isSelected ? `box-shadow:0 0 6px ${C.route}aa;` : ""}
          "></div>
          <span style="
            position:absolute;top:8px;
            font-size:7.5px;font-weight:700;
            color:${"#7c2d12"};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            pointer-events:none;
          ">${id}</span>
        </div>`,
      iconSize: [9, 20],
      iconAnchor: [4, 4],
    })
  }
  // Regular waypoint: small green diamond outline
  const color = isSelected ? C.route : C.waypoint
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:8px;height:8px;
          background:transparent;
          border:1.5px solid ${color};
          transform:rotate(45deg);
          ${isSelected ? `box-shadow:0 0 6px ${C.route}aa;` : ""}
        "></div>
        <span style="
          position:absolute;top:7px;
          font-size:7px;font-weight:600;
          color:${C.inkSoft};white-space:nowrap;
          text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
          pointer-events:none;
        ">${id}</span>
      </div>`,
    iconSize: [8, 18],
    iconAnchor: [4, 4],
  })
}

function createIntlNavaidIcon(id: string, freq: string, isSelected: boolean) {
  const color = isSelected ? C.route : C.intlNavaid
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:11px;height:11px;
          background:transparent;
          border:2px dashed ${color};
          border-radius:50%;
          ${isSelected ? `box-shadow:0 0 8px ${C.route}aa;` : ""}
        "></div>
        <div style="position:absolute;top:1px;left:13px;display:flex;flex-direction:column;pointer-events:none;">
          <span style="
            font-size:9px;font-weight:700;
            color:${C.ink};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;letter-spacing:0.3px;
          ">${id}</span>
          <span style="
            font-size:7.5px;font-weight:500;
            color:${C.intlNavaidBorder};white-space:nowrap;
            text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff;
            line-height:1;
          ">${freq.replace(" MHz", "")}</span>
        </div>
      </div>`,
    iconSize: [11, 11],
    iconAnchor: [5, 5],
  })
}

function createRoutePointIcon(label: string, index: number, editable: boolean) {
  const isEndpoint = index === 0
  const size = editable ? 18 : (isEndpoint ? 16 : 12)
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;${editable ? "cursor:grab;" : "cursor:pointer;"}">
        <div style="
          width:${size}px;height:${size}px;
          background:${C.route};
          border:2px solid ${C.white};
          border-radius:50%;
          box-shadow:0 0 ${editable ? 10 : 6}px ${C.routeGlow}${editable ? "cc" : "88"};
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:700;color:${C.white};
          ${editable ? "border-style:dashed;" : ""}
        ">${index + 1}</div>
        <span style="
          position:absolute;top:-12px;
          font-size:8px;font-weight:700;
          color:${C.white};background:${C.route};
          padding:1px 4px;border-radius:2px;white-space:nowrap;
          pointer-events:none;
          box-shadow:0 0 4px ${C.routeGlow}88;
        ">${label}</span>
        ${editable ? `<div style="position:absolute;top:-2px;right:-6px;font-size:7px;color:${C.route};pointer-events:none;">✥</div>` : ""}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Point Combobox (searchable, replaces Radix Select for 360-item lists) ──
interface PointComboboxProps {
  value: string
  onChange: (id: string) => void
  points: RoutePoint[]
  placeholder?: string
  label?: string
}

function PointCombobox({ value, onChange, points, placeholder, label }: PointComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Show selected point's display text when not searching
  const selected = points.find(p => p.id === value)
  const displayText = selected
    ? `${selected.id} — ${selected.name.split("—")[1]?.trim() || selected.name}`
    : ""

  // Filter points by query (case-insensitive, match id or name)
  const filtered = useMemo(() => {
    if (!query.trim()) return points.slice(0, 50) // show first 50 if no query
    const q = query.toLowerCase().trim()
    return points.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [query, points])

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {label && <span className="text-[10px] text-slate-600 font-mono mr-1 hidden md:inline">{label}</span>}
      <input
        ref={inputRef}
        type="text"
        value={open ? query : displayText}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); setQuery("") }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setQuery("") }
          if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault()
            onChange(filtered[0].id)
            setOpen(false)
            setQuery("")
            inputRef.current?.blur()
          }
        }}
        className="w-[150px] h-8 text-xs bg-[#eef2ff]/40 border border-[#1e40af]/40 text-[#1e40af] rounded-md px-2 font-mono outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 transition-colors"
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 w-[280px] max-h-[260px] overflow-y-auto bg-white border border-[#1e40af]/40 rounded-md shadow-lg"
          style={{ zIndex: 1000 }}
        >
          {filtered.map((p) => (
            <button
              key={p.type + p.id}
              type="button"
              onClick={() => {
                onChange(p.id)
                setOpen(false)
                setQuery("")
                inputRef.current?.blur()
              }}
              className={`w-full text-left px-2 py-1.5 text-xs hover:bg-[#eef2ff] transition-colors border-b border-slate-100 last:border-b-0 ${p.id === value ? 'bg-[#eef2ff] text-[#1e40af] font-bold' : 'text-slate-600'}`}
            >
              <span className="font-mono text-[#1e40af]">{p.id}</span>
              <span className="text-slate-600/70 ml-1 truncate">— {p.name.split("—")[1]?.trim() || p.name}</span>
            </button>
          ))}
          {filtered.length === 50 && (
            <div className="px-2 py-1 text-[10px] text-slate-500 text-center bg-slate-50">Mostrando primeros 50 — afine la búsqueda</div>
          )}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div
          className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-[#1e40af]/40 rounded-md shadow-lg p-2 text-xs text-slate-500 text-center"
          style={{ zIndex: 1000 }}
        >
          Sin resultados para &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}

// ─── Map Click Handler ───────────────────────────────────────────
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ─── Viewport Tracker ────────────────────────────────────────────
// Fires onMapMove callback whenever the map is moved/zoomed.
// Used to fetch world airports/navaids in the new viewport.
function ViewportTracker({ onMapMove, enabled }: {
  onMapMove: (bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }, zoom: number) => void
  enabled: boolean
}) {
  const map = useMap()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const b = map.getBounds()
        onMapMove({
          minLat: b.getSouth(),
          maxLat: b.getNorth(),
          minLon: b.getWest(),
          maxLon: b.getEast(),
        }, map.getZoom())
      }, 350)
    }
    // Initial fire on mount
    handler()
    map.on("moveend", handler)
    map.on("zoomend", handler)
    return () => {
      map.off("moveend", handler)
      map.off("zoomend", handler)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [map, onMapMove, enabled])
  return null
}

// ─── Main Component ──────────────────────────────────────────────
interface InteractiveMapProps {
  onSendToFlightPlan?: (route: RoutePoint[], summary: RouteSummary) => void
}
export function InteractiveMap({ onSendToFlightPlan }: InteractiveMapProps = {}) {
  const [data, setData] = useState<AirwaysData | null>(null)
  const [loading, setLoading] = useState(true)
  const [layers, setLayers] = useState<LayerState>({
    aerodromos: true,
    navaids: true,
    intlNavaids: true,
    waypoints: false, // 185 waypoints — off by default to reduce clutter
    transferPoints: true, // FIR handoff / compulsory reporting points — on by default
    convAirways: true,
    rnavAirways: true,
    firBoundary: true,
    adjacentFirs: true,
    tmaSectors: false, // TMA/CTR polygons — off by default
    restricted: false, // restricted/prohibited/danger zones — off by default
    grid: false,
    // World layers — on by default so worldwide data shows when panning away from Peru
    worldAirports: true,
    worldNavaids: true,
    worldWaypoints: true, // now includes 157+ FIR transfer/notif points + curated set
    worldAirways: true,
  })
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [origin, setOrigin] = useState<string>("")
  const [dest, setDest] = useState<string>("")
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null)
  const [showLayerPanel, setShowLayerPanel] = useState(true)
  const [routeMode, setRouteMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [history, setHistory] = useState<RoutePoint[][]>([])
  // SkyVector-style basemap selector ("World Hi" / "World Lo" / "World VFR")
  const [basemap, setBasemap] = useState<BasemapId>("hi")

  // ─── World data state (loaded via API based on viewport) ─────────
  // These are worldwide airports/navaids that load when the user pans
  // outside Peru. They're fetched from /api/world/* with bbox filtering.
  interface WorldAirportFeature {
    icao: string
    name: string
    country: string
    type: string
    lat: number
    lon: number
    elevation: number | null
    iata: string | null
    city: string | null
  }
  interface WorldNavaidFeature {
    ident: string
    name: string
    type: string
    frequency: string
    country: string
    lat: number
    lon: number
    elevation: number | null
  }
  // World airway (resolved with coordinates) returned by /api/world/airways
  interface WorldAirwayFeature {
    designator: string
    type: "CONVENTIONAL" | "RNAV"
    level: "LOWER" | "UPPER" | "BOTH"
    points: { ident: string; lat: number; lon: number }[]
    totalDistance: number
  }
  // World extra waypoint (FIR transfer / notification / oceanic fix)
  // returned by /api/world/waypoints
  interface WorldWaypointFeature {
    id: string
    name: string
    lat: number
    lon: number
    country: string
    region: string
    description: string
    transfer: boolean
    notif: boolean
  }
  const [worldAirports, setWorldAirports] = useState<WorldAirportFeature[]>([])
  const [worldNavaids, setWorldNavaids] = useState<WorldNavaidFeature[]>([])
  const [worldAirwaysData, setWorldAirwaysData] = useState<WorldAirwayFeature[]>([])
  const [worldExtraWaypoints, setWorldExtraWaypoints] = useState<WorldWaypointFeature[]>([])
  const [worldCounts, setWorldCounts] = useState<{ airports: number; navaids: number; airways: number; waypoints: number; countries: number } | null>(null)
  // Track the current viewport bbox to avoid redundant fetches
  const lastFetchedBboxRef = useRef<string>("")
  // Track if world data layers are enabled (so we don't fetch when all are off)
  const worldLayersEnabled = layers.worldAirports || layers.worldNavaids || layers.worldAirways || layers.worldWaypoints

  // Refs to avoid stale closures in drag handlers (updated in effect, not during render)
  const routeRef = useRef(route)
  const dataRef = useRef<AirwaysData | null>(null)
  useEffect(() => { routeRef.current = route }, [route])
  useEffect(() => { dataRef.current = data }, [data])

  // Fetch airdata
  useEffect(() => {
    let cancelled = false
    fetch("/api/airdata/all")
      .then((r) => r.json())
      .then((raw: Partial<AirwaysData> & { error?: string }) => {
        if (cancelled) return
        // Validate the response has the expected shape; if not, use fallback
        const hasNavaids = raw.navaids && raw.navaids.length > 0
        const hasWaypoints = raw.waypoints && raw.waypoints.length > 0
        const hasAirways =
          raw.airways &&
          ((raw.airways.conventional && raw.airways.conventional.length > 0) ||
            (raw.airways.rnav && raw.airways.rnav.length > 0))
        const d: AirwaysData = {
          firBoundaries: raw.firBoundaries ?? {},
          adjacentFirs: raw.adjacentFirs ?? [],
          navaids: hasNavaids
            ? raw.navaids!.map((n) => ({
                ...n,
                // Normaliza el tipo al formato canónico "VOR DME" / "DVOR DME"
                type: normalizeNavaidType(n.type),
                // Limpia el nombre: reemplaza VOR/DME → VOR DME en el nombre también
                name: (n.name || "").replace(/\s*\/\s*/g, " ").replace(/VOR DME/gi, "VOR DME").replace(/DVOR DME/gi, "DVOR DME").trim(),
              }))
            : PERUVIAN_NAVAIDS.map((n) => ({
                id: n.id, name: n.name, type: n.type, frequency: n.frequency,
                lat: n.lat, lon: n.lon, elevation: n.elevation ?? undefined,
              })),
          waypoints: hasWaypoints ? raw.waypoints! : PERUVIAN_WAYPOINTS,
          airways: hasAirways
            ? raw.airways!
            : { conventional: PERUVIAN_AIRWAYS.conventional, rnav: PERUVIAN_AIRWAYS.rnav },
        }
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        // Fallback: use static data only
        if (cancelled) return
        setData({
          firBoundaries: {},
          adjacentFirs: [],
          navaids: PERUVIAN_NAVAIDS.map((n) => ({
            id: n.id, name: n.name, type: n.type, frequency: n.frequency,
            lat: n.lat, lon: n.lon, elevation: n.elevation ?? undefined,
          })),
          waypoints: PERUVIAN_WAYPOINTS,
          airways: { conventional: PERUVIAN_AIRWAYS.conventional, rnav: PERUVIAN_AIRWAYS.rnav },
        })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Build coord lookup for airway resolution
  const coordLookup = useMemo(() => {
    if (!data) return new Map<string, Coord>()
    const m = buildCoordLookup(data.waypoints, data.navaids, PERUVIAN_AIRPORTS)
    // Also index international navaids so airways crossing the border resolve
    for (const nv of INTERNATIONAL_NAVAIDS) m.set(nv.id, { lat: nv.lat, lon: nv.lon })
    // Index world airports and navaids so world airways segments resolve too
    for (const a of worldAirports) m.set(a.icao, { lat: a.lat, lon: a.lon })
    for (const n of worldNavaids) m.set(n.ident, { lat: n.lat, lon: n.lon })
    // Index world waypoints (curated set)
    for (const w of WORLD_WAYPOINTS) m.set(w.id, { lat: w.lat, lon: w.lon })
    // Index world extra waypoints (FIR transfers, oceanic fixes from API)
    for (const w of worldExtraWaypoints) m.set(w.id, { lat: w.lat, lon: w.lon })
    // Index all points from world airways (so any airway endpoint is resolvable)
    for (const aw of worldAirwaysData) {
      for (const p of aw.points) m.set(p.ident, { lat: p.lat, lon: p.lon })
    }
    return m
  }, [data, worldAirports, worldNavaids, worldExtraWaypoints, worldAirwaysData])

  // ─── World data fetcher (viewport-based) ────────────────────────
  // Fetches worldwide airports/navaids/airways/waypoints in the current viewport.
  // Skips if bbox hasn't changed meaningfully. Also fetches total counts once.
  const handleViewportChange = useCallback((bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }, _zoom: number) => {
    // Build a coarse bbox key to avoid refetching on tiny moves
    const round = (v: number) => Math.round(v * 10) / 10
    const key = `${round(bbox.minLat)},${round(bbox.minLon)},${round(bbox.maxLat)},${round(bbox.maxLon)}`
    if (key === lastFetchedBboxRef.current) return
    lastFetchedBboxRef.current = key

    const bboxStr = `${bbox.minLat.toFixed(3)},${bbox.minLon.toFixed(3)},${bbox.maxLat.toFixed(3)},${bbox.maxLon.toFixed(3)}`

    // Fetch airports in viewport (if layer enabled)
    if (layers.worldAirports) {
      fetch(`/api/world/airports?bbox=${bboxStr}`)
        .then(r => r.json())
        .then(j => {
          if (j && Array.isArray(j.airports)) {
            setWorldAirports(j.airports as WorldAirportFeature[])
          }
        })
        .catch(err => console.error("[world-airports] fetch failed:", err))
    }
    // Fetch navaids in viewport (if layer enabled)
    if (layers.worldNavaids) {
      fetch(`/api/world/navaids?bbox=${bboxStr}`)
        .then(r => r.json())
        .then(j => {
          if (j && Array.isArray(j.navaids)) {
            setWorldNavaids(j.navaids as WorldNavaidFeature[])
          }
        })
        .catch(err => console.error("[world-navaids] fetch failed:", err))
    }
    // Fetch airways in viewport (if layer enabled)
    if (layers.worldAirways) {
      fetch(`/api/world/airways?bbox=${bboxStr}`)
        .then(r => r.json())
        .then(j => {
          if (j && Array.isArray(j.airways)) {
            setWorldAirwaysData(j.airways as WorldAirwayFeature[])
          }
        })
        .catch(err => console.error("[world-airways] fetch failed:", err))
    }
    // Fetch extra waypoints in viewport (if layer enabled)
    if (layers.worldWaypoints) {
      fetch(`/api/world/waypoints?bbox=${bboxStr}`)
        .then(r => r.json())
        .then(j => {
          if (j && Array.isArray(j.waypoints)) {
            setWorldExtraWaypoints(j.waypoints as WorldWaypointFeature[])
          }
        })
        .catch(err => console.error("[world-waypoints] fetch failed:", err))
    }
  }, [layers.worldAirports, layers.worldNavaids, layers.worldAirways, layers.worldWaypoints])

  // Fetch total world counts once on mount
  useEffect(() => {
    fetch("/api/world/counts")
      .then(r => r.json())
      .then(j => {
        if (j && typeof j.airports === "number") {
          setWorldCounts(j)
        }
      })
      .catch(err => console.error("[world-counts] fetch failed:", err))
  }, [])

  // Airway pair index (used for ICAO route string construction)
  // Includes: Peruvian airways (static) + curated WORLD_AIRWAYS (static)
  // + world airways from the API (fetched per viewport, much more comprehensive)
  const airwayIndex = useMemo<AirwayIndex>(() => {
    if (!data) return { pair: new Map() }
    const peruvianIdx = buildAirwayIndex(data.airways)
    const worldStaticIdx = buildAirwayIndex({ conventional: WORLD_AIRWAYS, rnav: [] })
    // Build index from world airways fetched via API (resolved with coords already)
    const worldApiIdx: AirwayIndex = { pair: new Map() }
    for (const aw of worldAirwaysData) {
      for (let i = 0; i < aw.points.length - 1; i++) {
        const from = aw.points[i].ident
        const to = aw.points[i + 1].ident
        const k1 = `${from}→${to}`
        const k2 = `${to}→${from}`
        const entry = { designator: aw.designator, level: aw.level, type: aw.type }
        for (const k of [k1, k2]) {
          if (!worldApiIdx.pair.has(k)) worldApiIdx.pair.set(k, [])
          const arr = worldApiIdx.pair.get(k)!
          if (!arr.some(e => e.designator === entry.designator)) arr.push(entry)
        }
      }
    }
    // Merge all three indexes: peruvian + world static + world API
    const merged: AirwayIndex = { pair: new Map() }
    for (const [k, v] of peruvianIdx.pair) merged.pair.set(k, [...v])
    for (const [k, v] of worldStaticIdx.pair) {
      const existing = merged.pair.get(k) || []
      for (const e of v) {
        if (!existing.some(x => x.designator === e.designator)) existing.push(e)
      }
      merged.pair.set(k, existing)
    }
    for (const [k, v] of worldApiIdx.pair) {
      const existing = merged.pair.get(k) || []
      for (const e of v) {
        if (!existing.some(x => x.designator === e.designator)) existing.push(e)
      }
      merged.pair.set(k, existing)
    }
    return merged
  }, [data, worldAirwaysData])

  // ICAO route string built from current route points (e.g. "SPJC DCT TAP V5 ISRES V321 SPCL")
  const icaoRouteString = useMemo(
    () => buildIcaoRouteString(route, airwayIndex),
    [route, airwayIndex]
  )

  // All selectable points for dropdowns
  // Includes Peruvian airports/navaids/waypoints + world airports/navaids in viewport
  // + world waypoints (curated) + international navaids (adjacent FIRs)
  const allPoints = useMemo<RoutePoint[]>(() => {
    const pts: RoutePoint[] = []
    for (const ap of PERUVIAN_AIRPORTS) {
      pts.push({
        id: ap.icao, name: `${ap.icao} — ${ap.short || ap.city}`,
        type: "AIRPORT", lat: ap.lat, lon: ap.lng,
      })
    }
    if (data) {
      for (const nv of data.navaids) {
        pts.push({
          id: nv.id, name: `${nv.id} — ${nv.name}`,
          type: "NAVAID", lat: nv.lat, lon: nv.lon,
        })
      }
      // International (adjacent-FIR) navaids — also selectable for cross-border routes
      for (const nv of INTERNATIONAL_NAVAIDS) {
        pts.push({
          id: nv.id, name: `${nv.id} — ${nv.name} [${nv.country}]`,
          type: "NAVAID", lat: nv.lat, lon: nv.lon,
        })
      }
      // Include waypoints too — they're now available as a static fallback
      for (const wp of data.waypoints) {
        pts.push({
          id: wp.id, name: `${wp.id}${wp.description ? ` — ${wp.description}` : ""}`,
          type: "WAYPOINT", lat: wp.lat, lon: wp.lon,
        })
      }
    }
    // World airports (loaded via API in current viewport)
    for (const a of worldAirports) {
      if (a.country === "PE") continue // already in PERUVIAN_AIRPORTS
      pts.push({
        id: a.icao, name: `${a.icao} — ${a.name}${a.city ? ` (${a.city})` : ""} [${a.country}]`,
        type: "AIRPORT", lat: a.lat, lon: a.lon,
      })
    }
    // World navaids (loaded via API in current viewport)
    for (const n of worldNavaids) {
      if (n.country === "PE") continue // already in PERUVIAN_NAVAIDS
      pts.push({
        id: n.ident, name: `${n.ident} — ${n.name} [${n.country}]`,
        type: "NAVAID", lat: n.lat, lon: n.lon,
      })
    }
    // World waypoints (curated global set)
    for (const w of WORLD_WAYPOINTS) {
      pts.push({
        id: w.id, name: `${w.id}${w.description ? ` — ${w.description}` : ""}${w.country ? ` [${w.country}]` : ""}`,
        type: "WAYPOINT", lat: w.lat, lon: w.lon,
      })
    }
    // World extra waypoints from API (FIR transfers, oceanic fixes, major intersections)
    for (const w of worldExtraWaypoints) {
      // Skip if already added (e.g., duplicate with WORLD_WAYPOINTS)
      if (pts.some(p => p.id === w.id)) continue
      pts.push({
        id: w.id, name: `${w.id}${w.description ? ` — ${w.description}` : ""} [${w.country}]`,
        type: "WAYPOINT", lat: w.lat, lon: w.lon,
      })
    }
    // Deduplicate by id (in case waypoints overlap with navaids/airports)
    const seen = new Set<string>()
    return pts
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [data, worldAirports, worldNavaids, worldExtraWaypoints])

  // Route calculations
  const routeStats = useMemo(() => {
    if (route.length < 2) return { totalNM: 0, legs: [] as { from: string; to: string; nm: number; brg: number }[] }
    const legs: { from: string; to: string; nm: number; brg: number }[] = []
    let total = 0
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i]
      const b = route[i + 1]
      const nm = gcDistNM({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
      const brg = bearingDeg({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
      legs.push({ from: a.id, to: b.id, nm, brg })
      total += nm
    }
    return { totalNM: total, legs }
  }, [route])

  // Estimated flight time (assume 240 KTAS default)
  const flightTime = useMemo(() => {
    if (routeStats.totalNM <= 0) return null
    const mins = Math.round((routeStats.totalNM / 240) * 60)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}H${m.toString().padStart(2, "0")}MIN`
  }, [routeStats.totalNM])

  // Build a RouteSummary object for the FPL callback. The strict RouteSummary
  // type in lib/types.ts has a different shape (segments/levels/trajectory),
  // so we cast via `as RouteSummary` — the consumer (flight-plan.tsx → fpl.html
  // postMessage) only reads our extended fields via `as any` lookups.
  const routeSummary = useMemo<RouteSummary | null>(() => {
    if (route.length < 2) return null
    return {
      totalDistance: routeStats.totalNM,
      totalSegments: routeStats.legs.length,
      waypoints: route.filter(p => p.type === "WAYPOINT").length,
      navaids: route.filter(p => p.type === "NAVAID").length,
      estimatedTime: Math.round((routeStats.totalNM / 240) * 60),
      flightLevels: { min: 0, max: 0 },
      trajectory: [],
      // Extended fields (consumed by flight-plan.tsx via `as any`):
      ...({
        totalNM: routeStats.totalNM,
        totalEET: flightTime || "00H00MIN",
        legs: routeStats.legs,
        points: route.length,
        departure: route[0]?.id || "",
        destination: route[route.length - 1]?.id || "",
      } as object),
    } as RouteSummary
  }, [route, routeStats, flightTime])

  // Direct distance between origin and dest
  const directDist = useMemo(() => {
    if (!origin || !dest) return null
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (!a || !b) return null
    const nm = gcDistNM({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
    const brg = bearingDeg({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
    return { nm, brg, a, b }
  }, [origin, dest, allPoints])

  // ─── Route handlers ───────────────────────────────────────────
  const addToRoute = useCallback((pt: RoutePoint) => {
    setRoute((prev) => {
      // Avoid duplicates
      if (prev.length > 0 && prev[prev.length - 1].id === pt.id) return prev
      return [...prev, pt]
    })
  }, [])

  const removeFromRoute = useCallback((index: number) => {
    setHistory((h) => [...h, routeRef.current])
    setRoute((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearRoute = useCallback(() => {
    if (route.length > 0) setHistory((h) => [...h, routeRef.current])
    setRoute([])
    setOrigin("")
    setDest("")
  }, [route.length])

  // Undo last change
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const last = h[h.length - 1]
      setRoute(last)
      return h.slice(0, -1)
    })
  }, [])

  // Handle route point drag — update position with optional snapping
  const handleRoutePointDrag = useCallback((index: number, newLat: number, newLon: number) => {
    const d = dataRef.current
    // Save current state to history before modifying
    setHistory((h) => [...h, routeRef.current])
    // Try snapping to nearest known point
    const snap = d ? findNearestPoint(newLat, newLon, PERUVIAN_AIRPORTS, d.navaids, d.waypoints || [], 0.35) : null
    setRoute((prev) => prev.map((p, i) => {
      if (i !== index) return p
      if (snap) {
        return { ...p, id: snap.id, name: snap.name, type: snap.type, lat: snap.lat, lon: snap.lon }
      }
      // No snap — keep as custom point with coords
      return {
        ...p,
        id: `LAT${newLat.toFixed(2)} LON${newLon.toFixed(2)}`,
        name: `Lat ${newLat.toFixed(4)}° Lon ${newLon.toFixed(4)}°`,
        type: "CUSTOM" as const,
        lat: newLat,
        lon: newLon,
      }
    }))
  }, [])

  // Quick route: set origin+dest and build direct
  const buildDirectRoute = useCallback(() => {
    if (!origin || !dest) return
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (a && b) {
      if (route.length > 0) setHistory((h) => [...h, routeRef.current])
      setRoute([a, b])
    }
  }, [origin, dest, allPoints, route.length])

  // Smart route: find a path through the airway network between origin and dest.
  // Uses BFS (max depth 4 legs) to find intermediate waypoints.
  // Falls back to direct route if no airway path found.
  const buildAirwayRoute = useCallback(() => {
    if (!origin || !dest) return
    const a = allPoints.find((p) => p.id === origin)
    const b = allPoints.find((p) => p.id === dest)
    if (!a || !b) return
    // Try to find a path through airways
    const path = findAirwayPath(origin, dest, airwayIndex, 4)
    if (!path || path.length < 2) {
      // No airway path — fall back to direct
      if (route.length > 0) setHistory((h) => [...h, routeRef.current])
      setRoute([a, b])
      return
    }
    // Resolve each ident in the path to a RoutePoint
    const newRoute: RoutePoint[] = []
    for (const ident of path) {
      if (ident === origin) {
        newRoute.push(a)
      } else if (ident === dest) {
        newRoute.push(b)
      } else {
        // Look up coordinates for the intermediate ident
        const c = coordLookup.get(ident)
        if (c) {
          // Find the original point to get its type/name
          const original = allPoints.find(p => p.id === ident)
          newRoute.push({
            id: ident,
            name: original?.name || ident,
            type: original?.type || "WAYPOINT",
            lat: c.lat,
            lon: c.lon,
          })
        }
      }
    }
    if (newRoute.length >= 2) {
      if (route.length > 0) setHistory((h) => [...h, routeRef.current])
      setRoute(newRoute)
    } else {
      // Fallback to direct
      if (route.length > 0) setHistory((h) => [...h, routeRef.current])
      setRoute([a, b])
    }
  }, [origin, dest, allPoints, airwayIndex, coordLookup, route.length])

  // Handle map click in route mode — find nearest point
  // Searches Peruvian + world airports/navaids + waypoints
  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (!routeMode || !data) return
    // Build a combined list of world airports/navaids for nearest-point search
    const worldAirportsAsPeruvian: PeruvianAirport[] = worldAirports.map(a => ({
      icao: a.icao, name: a.name, city: a.city || "",
      dept: "",
      lat: a.lat, lng: a.lon,
      elev: a.elevation ?? undefined,
      cert: a.type === "large_airport" ? "INTERNACIONAL" : "NACIONAL",
    }))
    const worldNavaidsAsNavaid: Navaid[] = worldNavaids.map(n => ({
      id: n.ident, name: n.name, type: n.type,
      frequency: n.frequency, lat: n.lat, lon: n.lon,
    }))
    // Combine Peruvian + world (Peruvian first for priority)
    const allAirports = [...PERUVIAN_AIRPORTS, ...worldAirportsAsPeruvian]
    const allNavaids = [...data.navaids, ...worldNavaidsAsNavaid]
    // Combine Peruvian waypoints + world waypoints + world extra waypoints
    const worldWpsAsWaypoint: Waypoint[] = WORLD_WAYPOINTS.map(w => ({
      id: w.id, name: w.name, type: w.type, lat: w.lat, lon: w.lon, description: w.description,
    }))
    const worldExtraWpsAsWaypoint: Waypoint[] = worldExtraWaypoints.map(w => ({
      id: w.id, name: w.id, type: "WAYPOINT", lat: w.lat, lon: w.lon, description: w.description,
    }))
    const allWaypoints = [...(data.waypoints || []), ...worldWpsAsWaypoint, ...worldExtraWpsAsWaypoint]
    const nearest = findNearestPoint(lat, lon, allAirports, allNavaids, allWaypoints, 0.5)
    if (nearest) {
      addToRoute(nearest)
    } else {
      // No nearby navaid/airport — add as custom coordinate point
      addToRoute({
        id: `${lat.toFixed(2)}N ${lon.toFixed(2)}W`,
        name: `Lat ${lat.toFixed(4)}° Lon ${lon.toFixed(4)}°`,
        type: "CUSTOM",
        lat, lon,
      })
    }
  }, [routeMode, data, addToRoute, worldAirports, worldNavaids, worldExtraWaypoints])

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />
  }

  return (
    <div className="space-y-3">
      {/* ─── Toolbar ─────────────────────────────── */}
      <Card className="border-[#cbd5e1] bg-white/80 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Route builder */}
            <div className="flex items-center gap-1.5">
              <Route className="size-4 text-[#1e40af]" style={{ filter: "drop-shadow(0 0 3px #1e40af)" }} />
              <span className="text-xs font-bold text-[#1e40af] hidden sm:inline tracking-wider">RUTA:</span>
            </div>

            <PointCombobox value={origin} onChange={setOrigin} points={allPoints} placeholder="Origen" label="ORIGEN" />

            <span className="text-[#1e40af] font-bold" style={{ textShadow: "0 0 4px #1e40af" }}>→</span>

            <PointCombobox value={dest} onChange={setDest} points={allPoints} placeholder="Destino" label="DESTINO" />

            {/* Distance display */}
            {directDist && (
              <Badge variant="outline" className="border-[#1e40af]/50 text-[#1e40af] font-mono text-xs gap-1 bg-[#eef2ff]/30" style={{ textShadow: "0 0 3px #1e40af" }}>
                <Gauge className="size-3" />
                {directDist.nm} NM · {directDist.brg}°
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={buildDirectRoute}
              disabled={!origin || !dest}
              className="h-8 text-xs border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 hover:text-[#1e40af] bg-[#eef2ff]/30"
            >
              <MapPin className="size-3 mr-1" />
              Ruta Directa
            </Button>

            {/* RUTA POR AEROVÍA — uses BFS pathfinder through the airway network */}
            <Button
              size="sm"
              variant="outline"
              onClick={buildAirwayRoute}
              disabled={!origin || !dest}
              className="h-8 text-xs border-[#0e7490]/50 text-[#0e7490] hover:bg-[#0e7490]/15 hover:text-[#0e7490] bg-[#ecfeff]/40"
              title="Busca automáticamente una ruta a través de la red de aerovías (BFS, máx. 4 legs). Si no encuentra ruta, usa directa."
            >
              <Route className="size-3 mr-1" />
              Ruta por Aerovía
            </Button>

            {/* EDITAR RUTA toggle — enables drag-and-drop of route points */}
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
              disabled={route.length === 0}
              className={`h-8 text-xs ${editMode ? "bg-[#c026d3] text-white hover:bg-[#a21caf] font-bold" : "border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 bg-[#eef2ff]/30"}`}
              style={editMode ? { boxShadow: "0 0 8px #c026d388" } : {}}
            >
              <Pencil className="size-3 mr-1" />
              {editMode ? "Editar Ruta ON" : "Editar Ruta"}
            </Button>

            {/* DESHACER (undo) */}
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={history.length === 0}
              className="h-8 text-xs border-[#ea580c]/50 text-[#ea580c] hover:bg-[#ea580c]/10 bg-[#fff7ed] disabled:opacity-30"
            >
              <Undo2 className="size-3 mr-1" />
              Deshacer
            </Button>

            {routeMode && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setRouteMode(false)}
                className="h-8 text-xs bg-[#c026d3] text-white hover:bg-[#a21caf] font-bold"
                style={{ boxShadow: "0 0 8px #c026d388" }}
              >
                <Crosshair className="size-3 mr-1" />
                Click en mapa ON
              </Button>
            )}
            {!routeMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRouteMode(true)}
                className="h-8 text-xs border-[#1e40af]/50 text-[#1e40af] hover:bg-[#1e40af]/15 bg-[#eef2ff]/30"
              >
                <Crosshair className="size-3 mr-1" />
                Click en mapa
              </Button>
            )}

            {route.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearRoute}
                className="h-8 text-xs border-[#dc2626]/50 text-[#dc2626] hover:bg-[#dc2626]/10 bg-[#3a0000]/30"
              >
                <Trash2 className="size-3 mr-1" />
                Limpiar
              </Button>
            )}

            {/* Enviar al FPL — send the built route to the flight plan iframe */}
            {route.length >= 2 && onSendToFlightPlan && (
              <Button
                size="sm"
                onClick={() => onSendToFlightPlan(route, routeSummary!)}
                className="h-8 text-xs bg-[#1e40af] text-white hover:bg-[#1e3a8a] font-bold gap-1"
                title="Enviar la ruta construida al Plan de Vuelo (calcula EET y Autonomía automáticamente)"
              >
                <FileText className="size-3 mr-1" />
                Enviar al FPL
              </Button>
            )}

            {/* Layer panel toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="h-8 text-xs ml-auto text-slate-600 hover:bg-[#1e40af]/10"
            >
              <Layers className="size-3 mr-1" />
              Capas
              {showLayerPanel ? <ChevronDown className="size-3 ml-1" /> : <ChevronRight className="size-3 ml-1" />}
            </Button>
          </div>

          {/* Route summary */}
          {route.length >= 2 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <Badge className="bg-[#1e40af] text-white gap-1 text-xs font-bold" >
                <Route className="size-3" />
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scroll">
                {route.map((p, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] font-mono cursor-pointer hover:bg-[#dc2626]/10 hover:border-[#dc2626]/50 hover:text-[#dc2626] border-[#1e40af]/40 text-[#1e40af] bg-[#eef2ff]/20"
                    onClick={() => removeFromRoute(i)}
                    title={`Click para eliminar ${p.id}`}
                  >
                    {i + 1}. {p.id.length > 14 ? p.id.slice(0, 12) + ".." : p.id}
                    {i < route.length - 1 && (
                      <span className="text-slate-600 ml-1">
                        →{routeStats.legs[i]?.nm}NM
                      </span>
                    )}
                    <X className="size-2.5 ml-1 opacity-50" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ICAO Route String — auto-built from selected points + airway index */}
          {route.length >= 2 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#1e40af] tracking-wider uppercase">Ruta ICAO</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard?.writeText(icaoRouteString)}
                  className="h-5 text-[10px] px-2 text-[#1e40af] hover:bg-[#1e40af]/10"
                  title="Copiar ruta al portapapeles"
                >
                  <FileText className="size-2.5 mr-1" />
                  Copiar
                </Button>
              </div>
              <code className="block text-[11px] font-mono text-[#0f172a] bg-[#eef2ff]/70 border border-[#1e40af]/30 rounded px-2 py-1.5 break-all leading-relaxed">
                {icaoRouteString}
              </code>
            </div>
          )}

          {(routeMode || editMode) && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              {routeMode && (
                <p className="text-[10px] text-[#1e40af] font-mono" >
                  ✛ Modo construcción: Click cerca de un aeródromo, radioayuda o waypoint para agregarlo a la ruta.
                </p>
              )}
              {editMode && (
                <p className="text-[10px] text-[#1e40af] font-mono flex items-center gap-1" >
                  <Move className="size-3" />
                  Modo edición: Arrastra y suelta los puntos de la ruta (números verdes) al punto deseado por donde quieres la trayectoria. Se ajustan automáticamente a radioayudas/aeródromos cercanos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Layer Panel ─────────────────────────── */}
      {showLayerPanel && (
        <Card className="border-slate-200 bg-white/60 backdrop-blur">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {([
                { key: "aerodromos", label: "Aeródromos PE", icon: Plane },
                { key: "navaids", label: "Radioayudas PE", icon: Radio },
                { key: "intlNavaids", label: "Radioay. Intl", icon: Radio },
                { key: "waypoints", label: "Waypoints PE", icon: Navigation2 },
                { key: "transferPoints", label: "Pts. Notificac.", icon: Crosshair },
                { key: "convAirways", label: "Aerovías Conv.", icon: Route },
                { key: "rnavAirways", label: "Aerovías RNAV", icon: Route },
                { key: "firBoundary", label: "FIR Lima", icon: MapIcon },
                { key: "adjacentFirs", label: "FIRs Adyac.", icon: Crosshair },
                { key: "tmaSectors", label: "TMA / CTR", icon: MapIcon },
                { key: "restricted", label: "Zonas Rest.", icon: Crosshair },
                { key: "grid", label: "Grilla", icon: Layers },
              ] as const).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`layer-${key}`}
                    checked={layers[key]}
                    onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [key]: !!v }))}
                  />
                  <Label htmlFor={`layer-${key}`} className="text-[10px] cursor-pointer flex items-center gap-1 leading-tight text-slate-600">
                    <Icon className="size-3 text-[#1e40af]" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            {/* World layers — separate row for clarity */}
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-bold text-[#0e7490] tracking-wider uppercase">🌐 Datos Mundiales</span>
                {worldCounts && (
                  <span className="text-[9px] font-mono text-slate-500">
                    {worldCounts.airports.toLocaleString()} aeródromos · {worldCounts.navaids.toLocaleString()} radioayudas · {worldCounts.airways.toLocaleString()} aerovías · {worldCounts.waypoints} waypoints · {worldCounts.countries} países
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {([
                  { key: "worldAirports", label: "Aeródromos Mundo", icon: Plane },
                  { key: "worldNavaids", label: "Radioayudas Mundo", icon: Radio },
                  { key: "worldWaypoints", label: "Waypoints / Transf.", icon: Navigation2 },
                  { key: "worldAirways", label: "Aerovías Mundo", icon: Route },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`layer-${key}`}
                      checked={layers[key]}
                      onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [key]: !!v }))}
                    />
                    <Label htmlFor={`layer-${key}`} className="text-[10px] cursor-pointer flex items-center gap-1 leading-tight text-slate-600">
                      <Icon className="size-3 text-[#0e7490]" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Live counts for current viewport */}
              {(worldAirwaysData.length > 0 || worldExtraWaypoints.length > 0 || worldAirports.length > 0 || worldNavaids.length > 0) && (
                <div className="mt-1.5 text-[9px] font-mono text-slate-400">
                  En viewport: {worldAirports.filter(a => a.country !== "PE").length} aeródromos · {worldNavaids.filter(n => n.country !== "PE").length} radioayudas · {worldAirwaysData.length} aerovías · {worldExtraWaypoints.length} waypoints
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Map ─────────────────────────────────── */}
      <div className="relative rounded-lg overflow-hidden border border-[#cbd5e1]" style={{ height: "70vh", minHeight: "500px" }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="w-full h-full"
          style={{ background: C.mapBg }}
          zoomControl={false}
        >
          <ZoomControl position="bottomleft" />
          <TileLayer
            key={basemap}
            url={BASEMAPS[basemap].url}
            attribution={BASEMAPS[basemap].attribution}
            maxZoom={BASEMAPS[basemap].maxZoom}
            subdomains={BASEMAPS[basemap].subdomains ?? "abc"}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <ViewportTracker onMapMove={handleViewportChange} enabled={worldLayersEnabled} />

          {/* Grid */}
          {layers.grid && <GridLayer />}

          {/* FIR Boundary */}
          {layers.firBoundary && data?.firBoundaries && Object.values(data.firBoundaries).map((fir) => (
            <Polygon
              key={fir.name}
              positions={fir.polygon.map((p) => [p.lat, p.lon] as [number, number])}
              pathOptions={{ color: C.fir, weight: 2, dashArray: "8,4", opacity: 0.75, fillColor: C.fir, fillOpacity: 0.04 }}
            >
              <Tooltip sticky className="leaflet-tooltip-skyvector">{fir.name} ({fir.type})</Tooltip>
            </Polygon>
          ))}

          {/* Adjacent FIRs */}
          {layers.adjacentFirs && data?.adjacentFirs?.map((fir) => (
            fir.borderPoints && fir.borderPoints.length > 0 ? (
              <Polygon
                key={fir.icao}
                positions={fir.borderPoints.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.adjacentFir, weight: 1, dashArray: "4,4", opacity: 0.6, fillColor: C.adjacentFir, fillOpacity: 0.02 }}
              >
                <Tooltip sticky className="leaflet-tooltip-skyvector">{fir.icao} — {fir.name} ({fir.country})</Tooltip>
              </Polygon>
            ) : null
          ))}

          {/* TMA / CTR polygonal sectors (violet outline, light fill) */}
          {layers.tmaSectors && TMA_SECTORS_DATA.map((t) => (
            <Polygon
              key={t.id}
              positions={t.polygon.map((p) => [p.lat, p.lon] as [number, number])}
              pathOptions={{ color: C.tma, weight: 1.5, dashArray: "5,3", opacity: 0.8, fillColor: C.tma, fillOpacity: 0.06 }}
            >
              <Tooltip sticky className="leaflet-tooltip-skyvector">
                <div className="font-mono">
                  <div className="font-bold">{t.name}</div>
                  <div>Clase {t.cls} · {t.lo} → {t.hi}</div>
                </div>
              </Tooltip>
            </Polygon>
          ))}

          {/* Restricted / Prohibited / Danger zones — red outline */}
          {layers.restricted && (
            <>
              {/* For now these come without polygon coords in the AIP; show a badge
                  list in the corner panel instead. If we had coords, we'd render
                  <Polygon> here. Kept as a placeholder so the toggle exists. */}
              {RESTRICTED_AIRSPACE.length === 0 && (
                <></>
              )}
            </>
          )}

          {/* Conventional Airways */}
          {layers.convAirways && data?.airways?.conventional?.map((aw) => {
            const positions: [number, number][] = []
            for (const seg of aw.segments) {
              const fromC = coordLookup.get(seg.from)
              const toC = coordLookup.get(seg.to)
              if (fromC && toC) {
                if (positions.length === 0) positions.push([fromC.lat, fromC.lon])
                positions.push([toC.lat, toC.lon])
              }
            }
            if (positions.length < 2) return null
            return (
              <Polyline
                key={aw.designator + "-" + aw.type}
                positions={positions}
                pathOptions={{ color: C.airwayConv, weight: 1.5, opacity: 0.7 }}
              >
                <Tooltip sticky className="leaflet-tooltip-skyvector">{aw.designator} ({aw.type}, {aw.level})</Tooltip>
              </Polyline>
            )
          })}

          {/* RNAV Airways */}
          {layers.rnavAirways && data?.airways?.rnav?.map((aw) => {
            const positions: [number, number][] = []
            for (const seg of aw.segments) {
              const fromC = coordLookup.get(seg.from)
              const toC = coordLookup.get(seg.to)
              if (fromC && toC) {
                if (positions.length === 0) positions.push([fromC.lat, fromC.lon])
                positions.push([toC.lat, toC.lon])
              }
            }
            if (positions.length < 2) return null
            return (
              <Polyline
                key={aw.designator + "-" + aw.type}
                positions={positions}
                pathOptions={{ color: C.airwayRnav, weight: 1.5, opacity: 0.7, dashArray: "6,4" }}
              >
                <Tooltip sticky className="leaflet-tooltip-skyvector">{aw.designator} (RNAV, {aw.level})</Tooltip>
              </Polyline>
            )
          })}

          {/* World Airways — fetched via API based on viewport.
              Includes 1854+ airways covering all major world routes:
              US J/V/Q/T routes, Europe UZ/UM routes, Asia A/B/R routes,
              Africa A routes, Middle East M routes, South America UZ/A routes,
              NAT/PACOT oceanic tracks, plus procedural regional connectors. */}
          {layers.worldAirways && worldAirwaysData.map((aw, idx) => {
            if (aw.points.length < 2) return null
            const positions: [number, number][] = aw.points.map(p => [p.lat, p.lon] as [number, number])
            const isRnav = aw.type === "RNAV"
            const isLow = aw.level === "LOWER"
            return (
              <Polyline
                key={`world-aw-${aw.designator}-${idx}`}
                positions={positions}
                pathOptions={{
                  color: isRnav ? C.airwayRnav : "#0e7490",
                  weight: isLow ? 1 : 1.5,
                  opacity: 0.55,
                  dashArray: isRnav ? "6,4" : undefined,
                }}
              >
                <Tooltip sticky className="leaflet-tooltip-skyvector">
                  <div className="font-mono">
                    <div className="font-bold">{aw.designator}</div>
                    <div>{aw.type} · {aw.level} · {aw.totalDistance} NM · {aw.points.length} pts</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {aw.points.slice(0, 6).map(p => p.ident).join(" → ")}
                      {aw.points.length > 6 ? ` → … → ${aw.points[aw.points.length - 1].ident}` : ""}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            )
          })}

          {/* World Airways (curated static global routes — NAT, PACOT, EUR, NAM, SAM).
              Kept as a fallback/supplement for routes not in the API-fetched set. */}
          {layers.worldAirways && WORLD_AIRWAYS.map((aw) => {
            const positions: [number, number][] = []
            for (const seg of aw.segments) {
              const fromC = coordLookup.get(seg.from)
              const toC = coordLookup.get(seg.to)
              if (fromC && toC) {
                if (positions.length === 0) positions.push([fromC.lat, fromC.lon])
                positions.push([toC.lat, toC.lon])
              }
            }
            if (positions.length < 2) return null
            const isRnav = aw.type === "RNAV"
            return (
              <Polyline
                key={`world-aw-static-${aw.designator}`}
                positions={positions}
                pathOptions={{
                  color: isRnav ? C.airwayRnav : "#0e7490",
                  weight: 1.5,
                  opacity: 0.6,
                  dashArray: isRnav ? "6,4" : undefined,
                }}
              >
                <Tooltip sticky className="leaflet-tooltip-skyvector">
                  {aw.designator} ({aw.type}, {aw.level}) — World
                </Tooltip>
              </Polyline>
            )
          })}

          {/* World Airports (loaded via API based on viewport) */}
          {layers.worldAirports && worldAirports.map((a, idx) => {
            // Skip Peruvian airports (they're rendered above with full AIP data)
            if (a.country === "PE") return null
            const isInRoute = route.some((r) => r.id === a.icao)
            const isLarge = a.type === "large_airport"
            return (
              <Marker
                key={`world-ap-${a.icao}-${idx}-${a.lat.toFixed(3)}`}
                position={[a.lat, a.lon]}
                icon={createAirportIcon(a.icao, isLarge, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#1e40af]">{a.icao}</span>
                      <Badge variant="outline" className="text-[9px] border-[#0e7490]/40 text-[#0e7490]">
                        {a.country} · {a.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{a.name}</p>
                    {a.city && <p className="text-[10px] text-slate-600/70 mb-2">{a.city}</p>}
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#1e40af]">IATA:</b> {a.iata || "—"}</span>
                      <span><b className="text-[#1e40af]">Elev:</b> {a.elevation ?? "—"} ft</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {a.lat.toFixed(4)}, {a.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(a.icao)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(a.icao)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: a.icao, name: a.name, type: "AIRPORT", lat: a.lat, lon: a.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* World Navaids (loaded via API based on viewport) */}
          {layers.worldNavaids && worldNavaids.map((n, idx) => {
            // Skip Peruvian navaids (they're rendered above with full AIP data)
            if (n.country === "PE") return null
            const isInRoute = route.some((r) => r.id === n.ident)
            return (
              <Marker
                key={`world-nav-${n.ident}-${n.country}-${idx}-${n.lat.toFixed(3)}`}
                position={[n.lat, n.lon]}
                icon={createIntlNavaidIcon(n.ident, n.frequency, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#0e7490]">{n.ident}</span>
                      <Badge variant="outline" className="text-[9px] border-[#0e7490]/50 text-[#0e7490]">
                        {n.country} · {n.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{n.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#0e7490]">Freq:</b> {n.frequency}</span>
                      <span><b className="text-[#0e7490]">Elev:</b> {n.elevation ?? "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {n.lat.toFixed(4)}, {n.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setOrigin(n.ident)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setDest(n.ident)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => addToRoute({ id: n.ident, name: n.name, type: "NAVAID", lat: n.lat, lon: n.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* World Waypoints (curated global set — NAT, PACOT, EUR, NAM, etc.) */}
          {layers.worldWaypoints && WORLD_WAYPOINTS.map((wp) => {
            // Skip Peruvian waypoints (rendered above)
            if (wp.country === "PE") return null
            const isInRoute = route.some((r) => r.id === wp.id)
            return (
              <Marker
                key={`world-wp-${wp.id}-${wp.region}`}
                position={[wp.lat, wp.lon]}
                icon={createWaypointIcon(wp.id, isInRoute, wp.notif, wp.transfer)}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#0e7490]">{wp.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#0e7490]/50 text-[#0e7490]">
                        {wp.region}{wp.country ? ` · ${wp.country}` : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{wp.name}</p>
                    {wp.description && <p className="text-[10px] text-slate-600/70 mt-1">{wp.description}</p>}
                    {wp.transfer && (
                      <Badge className="text-[9px] bg-[#dc2626] text-white mt-1">TRANSFERENCIA FIR</Badge>
                    )}
                    {wp.notif && (
                      <Badge className="text-[9px] bg-[#ea580c] text-white mt-1">NOTIFICACIÓN</Badge>
                    )}
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setOrigin(wp.id)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setDest(wp.id)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => addToRoute({ id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* World Extra Waypoints (FIR transfers, oceanic fixes, major intersections
              from the comprehensive worldwide dataset — 157+ waypoints loaded via API
              based on viewport. Includes NAT/PACOT entry-exit fixes, US/CA/MX border
              crossings, Europe FIR transfers, Africa/ME/Asia/Oceania transfer points. */}
          {layers.worldWaypoints && worldExtraWaypoints.map((wp) => {
            // Skip if already in WORLD_WAYPOINTS static set (avoid duplicate markers)
            if (WORLD_WAYPOINTS.some(w => w.id === wp.id)) return null
            const isInRoute = route.some((r) => r.id === wp.id)
            return (
              <Marker
                key={`world-xwp-${wp.id}-${wp.country}`}
                position={[wp.lat, wp.lon]}
                icon={createWaypointIcon(wp.id, isInRoute, wp.notif, wp.transfer)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#0e7490]">{wp.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#0e7490]/50 text-[#0e7490]">
                        {wp.region} · {wp.country}
                      </Badge>
                    </div>
                    {wp.description && <p className="text-[10px] text-slate-600/70 mt-1">{wp.description}</p>}
                    {wp.transfer && (
                      <Badge className="text-[9px] bg-[#dc2626] text-white mt-1">TRANSFERENCIA FIR ★</Badge>
                    )}
                    {wp.notif && (
                      <Badge className="text-[9px] bg-[#ea580c] text-white mt-1">NOTIFICACIÓN</Badge>
                    )}
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setOrigin(wp.id)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setDest(wp.id)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => addToRoute({ id: wp.id, name: wp.id, type: "WAYPOINT", lat: wp.lat, lon: wp.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Airports */}
          {layers.aerodromos && PERUVIAN_AIRPORTS?.map((ap) => {
            const isInRoute = route.some((r) => r.id === ap.icao)
            return (
              <Marker
                key={ap.icao}
                position={[ap.lat, ap.lng]}
                icon={createAirportIcon(ap.icao, ap.cert === "INTERNACIONAL", isInRoute)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#1e40af]">{ap.icao}</span>
                      <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{ap.cert}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{ap.name}</p>
                    <p className="text-[10px] text-slate-600/70 mb-2">{ap.city}, {ap.dept}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#1e40af]">IATA:</b> {ap.iata || "—"}</span>
                      <span><b className="text-[#1e40af]">Elev:</b> {ap.elev || "—"} ft</span>
                      <span><b className="text-[#1e40af]">Var:</b> {ap.magVar || "—"}°</span>
                      <span><b className="text-[#1e40af]">TA:</b> {ap.transAlt || "—"}</span>
                      <span><b className="text-[#1e40af]">TL:</b> {ap.transLvl || "—"}</span>
                      <span><b className="text-[#1e40af]">AFTN:</b> {ap.aftn || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {ap.lat.toFixed(4)}, {ap.lng.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(ap.icao)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(ap.icao)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: ap.icao, name: ap.short || ap.city, type: "AIRPORT", lat: ap.lat, lon: ap.lng })}
                      >
                        + Ruta
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Navaids */}
          {layers.navaids && data?.navaids?.map((nv) => {
            const isInRoute = route.some((r) => r.id === nv.id)
            return (
              <Marker
                key={nv.id}
                position={[nv.lat, nv.lon]}
                icon={createNavaidIcon(nv.id, nv.frequency, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#1e40af]">{nv.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{normalizeNavaidType(nv.type)}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{nv.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#1e40af]">Freq:</b> {nv.frequency}</span>
                      <span><b className="text-[#1e40af]">Elev:</b> {nv.elevation || "—"}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {nv.lat.toFixed(4)}, {nv.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(nv.id)}
                      >
                        + ORIG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(nv.id)}
                      >
                        + DEST
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon })}
                      >
                        + Ruta
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* International (adjacent-FIR) navaids — Ecuador/Colombia/Brasil/Bolivia/Chile */}
          {layers.intlNavaids && INTERNATIONAL_NAVAIDS.map((nv) => {
            const isInRoute = route.some((r) => r.id === nv.id)
            return (
              <Marker
                key={`intl-${nv.id}`}
                position={[nv.lat, nv.lon]}
                icon={createIntlNavaidIcon(nv.id, nv.frequency, isInRoute)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#0e7490]">{nv.id}</span>
                      <Badge variant="outline" className="text-[9px] border-[#0e7490]/50 text-[#0e7490]">
                        {nv.country || "INTL"} · {nv.fir || "FIR"}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-slate-600">{nv.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600">
                      <span><b className="text-[#0e7490]">Freq:</b> {nv.frequency}</span>
                      <span><b className="text-[#0e7490]">Tipo:</b> {nv.type}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {nv.lat.toFixed(4)}, {nv.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setOrigin(nv.id)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => setDest(nv.id)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#0e7490]/40 text-[#0e7490] hover:bg-[#0e7490]/10"
                        onClick={() => addToRoute({ id: nv.id, name: nv.name, type: "NAVAID", lat: nv.lat, lon: nv.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Waypoints — distinct markers for transfer/notification/regular points.
              The transferPoints layer controls ALL waypoint visibility (since
              transfer/notif flags are waypoint attributes). The plain "waypoints"
              toggle controls regular (non-transfer, non-notif) waypoints. */}
          {(layers.waypoints || layers.transferPoints) && data?.waypoints?.map((wp) => {
            const isInRoute = route.some((r) => r.id === wp.id)
            const ext = wp as PeruvianWaypointExt
            const isTransfer = !!ext.transfer
            const isNotif = !!ext.notif && !isTransfer
            // Hide transfer points unless transferPoints layer is on
            if (isTransfer && !layers.transferPoints) return null
            // Hide plain notification points unless transferPoints layer is on
            // (we treat them together — they're both "compulsory reporting")
            if (isNotif && !layers.transferPoints) return null
            // Hide regular waypoints unless waypoints layer is on
            if (!isTransfer && !isNotif && !layers.waypoints) return null

            // For transfer points, find which FIR(s) they transfer to
            const transferInfo = isTransfer
              ? FIR_TRANSFERS.filter(t => t.points.includes(wp.id))
              : []

            return (
              <Marker
                key={wp.id}
                position={[wp.lat, wp.lon]}
                icon={createWaypointIcon(wp.id, isInRoute, isNotif, isTransfer)}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#1e40af]">{wp.id}</span>
                      {isTransfer && (
                        <Badge className="text-[9px] bg-[#dc2626] text-white">TRANSFERENCIA FIR</Badge>
                      )}
                      {isNotif && (
                        <Badge className="text-[9px] bg-[#ea580c] text-white">NOTIFICACIÓN</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{wp.name}</p>
                    {wp.description && <p className="text-[10px] text-slate-600/70 mt-1">{wp.description}</p>}
                    {transferInfo.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                        {transferInfo.map((t, i) => (
                          <div key={i} className="text-[10px] font-mono text-[#7f1d1d] bg-[#dc2626]/5 rounded px-1.5 py-1">
                            <b>{t.firFrom} → {t.firTo}</b><br />
                            ACC Lima: {t.freqLima} MHz · ACC {t.firTo}: {t.freqAdjacent} MHz
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[9px] font-mono text-slate-600/60 mt-2 pt-2 border-t border-slate-200">
                      {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setOrigin(wp.id)}
                      >+ ORIG</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => setDest(wp.id)}
                      >+ DEST</Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af]/15"
                        onClick={() => addToRoute({ id: wp.id, name: wp.name, type: "WAYPOINT", lat: wp.lat, lon: wp.lon })}
                      >+ Ruta</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}


          {/* Route polyline with glow (two layers: wide glow + sharp line) */}
          {route.length >= 2 && (
            <>
              {/* Glow underlay */}
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.routeGlow, weight: 8, opacity: 0.25, lineCap: "round" }}
                interactive={false}
              />
              {/* Main line — solid magenta (SkyVector-style highlighted route) */}
              <Polyline
                positions={route.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: C.route, weight: 3, opacity: 0.95, lineCap: "round" }}
              />
              {/* Route point markers — draggable when editMode is ON */}
              {route.map((p, i) => (
                <Marker
                  key={`route-${i}-${p.id}`}
                  position={[p.lat, p.lon]}
                  icon={createRoutePointIcon(p.id.length > 10 ? `PT${i + 1}` : p.id, i, editMode)}
                  draggable={editMode}
                  eventHandlers={editMode ? {
                    dragend: (e) => {
                      const marker = e.target as L.Marker
                      const ll = marker.getLatLng()
                      handleRoutePointDrag(i, ll.lat, ll.lng)
                    },
                  } : undefined}
                >
                  <Popup>
                    <div className="min-w-[170px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#1e40af]">{i + 1}. {p.id}</span>
                        <Badge variant="outline" className="text-[9px] border-[#1e40af]/40 text-[#1e40af]">{p.type}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-600">{p.name}</p>
                      <div className="text-[9px] font-mono text-slate-600/70 mt-1">
                        {p.lat.toFixed(4)}°, {p.lon.toFixed(4)}°
                      </div>
                      {i < route.length - 1 && (
                        <div className="text-[10px] font-mono mt-1 text-slate-600">
                          → {route[i + 1].id.length > 14 ? "PT" + (i + 2) : route[i + 1].id}: <b className="text-[#1e40af]">{routeStats.legs[i]?.nm} NM</b> · {routeStats.legs[i]?.brg}°
                        </div>
                      )}
                      {editMode && (
                        <p className="text-[9px] text-[#ea580c] mt-1 font-mono">
                          ✦ Arrastra este punto para moverlo
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-[#dc2626]/40 text-[#dc2626] hover:bg-[#dc2626]/10"
                          onClick={() => removeFromRoute(i)}
                        >
                          <Trash2 className="size-2.5 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Distance labels at midpoints */}
              {routeStats.legs.map((leg, i) => {
                const a = route[i]
                const b = route[i + 1]
                const midLat = (a.lat + b.lat) / 2
                const midLon = (a.lon + b.lon) / 2
                return (
                  <Marker
                    key={`dist-${i}`}
                    position={[midLat, midLon]}
                    icon={L.divIcon({
                      className: "",
                      html: `<div style="
                        background:${C.route};color:${C.white};
                        font-size:9px;font-weight:700;font-family:monospace;
                        padding:1px 5px;border-radius:3px;
                        border:1px solid ${C.white};white-space:nowrap;
                        box-shadow:0 0 4px ${C.routeGlow}aa;
                      ">${leg.brg}° / ${leg.nm}nm</div>`,
                      iconSize: [60, 14],
                      iconAnchor: [30, 7],
                    })}
                    interactive={false}
                  />
                )
              })}
            </>
          )}
        </MapContainer>

        {/* Map info badge */}
        <div className="absolute bottom-2 right-2 bg-white/90 text-slate-500 text-[9px] font-mono px-2 py-1 rounded border border-[#cbd5e1] pointer-events-none">
          WGS84 · ICAO · AIP Perú + OurAirports (CC0) + Worldwide Airways
        </div>

        {/* SkyVector-style basemap toggle (top-left, horizontal stack) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-[500]">
          <div className="flex flex-row bg-white/95 backdrop-blur rounded border border-[#cbd5e1] shadow-sm overflow-hidden">
            {([
              { id: "hi" as BasemapId, label: "World Hi" },
              { id: "lo" as BasemapId, label: "World Lo" },
              { id: "vfr" as BasemapId, label: "World VFR" },
            ]).map(({ id, label }) => {
              const active = basemap === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBasemap(id)}
                  className={`text-[10px] font-bold tracking-wide px-2 py-1 transition-colors ${
                    active
                      ? "bg-[#1e40af] text-white"
                      : "bg-white text-slate-600 hover:bg-[#eef2ff] hover:text-[#1e40af]"
                  }`}
                  aria-pressed={active}
                  title={`Basemap: ${label}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-2 right-2 bg-white/90 text-slate-600 text-[10px] font-mono px-3 py-2 rounded border border-[#cbd5e1] space-y-1 max-w-[220px] backdrop-blur z-[500] max-h-[80vh] overflow-y-auto custom-scroll">
          <div className="font-bold text-[#1e40af] mb-1">LEYENDA</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1e40af] border-2 border-[#1e3a8a] inline-block rounded-full"></span> Aeródromo Intl PE</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#3b82f6] border-2 border-[#1e3a8a] inline-block rounded-full"></span> Aeródromo Nacional PE</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-[#1d4ed8] inline-block"></span> Radioayuda (VOR/DME) PE</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-dashed border-[#0e7490] inline-block"></span> Radioayuda Mundo</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-[#16a34a] inline-block transform rotate-45"></span> Waypoint PE</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#dc2626] border border-[#7f1d1d] inline-block transform rotate-45"></span> Pto. Transferencia FIR ★</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#ea580c] border border-[#7c2d12] inline-block transform rotate-45"></span> Pto. Notificación</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#1e3c78] inline-block"></span> Aerovía Conv. PE</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#64748b] inline-block border-dashed"></span> Aerovía RNAV PE</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#0e7490] inline-block"></span> Aerovía Mundo</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#475569] inline-block" style={{ borderTop: "2px dashed #475569" }}></span> FIR Lima</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#7c3aed] inline-block" style={{ borderTop: "2px dashed #7c3aed" }}></span> TMA / CTR</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#c026d3] inline-block"></span> Ruta construida</div>
          {editMode && <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 text-[#ea580c]"><Move className="size-2.5" /> Arrastrar puntos</div>}
        </div>
      </div>

      {/* Route details table */}
      {route.length >= 2 && (
        <Card className="border-[#cbd5e1] bg-white/60">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="size-4 text-[#1e40af]" style={{ filter: "drop-shadow(0 0 3px #1e40af)" }} />
              <h3 className="text-sm font-bold text-[#1e40af]">Detalle de Ruta</h3>
              <Badge variant="outline" className="ml-auto text-xs font-mono border-[#1e40af]/40 text-[#1e40af]">
                {route.length} pts · {routeStats.totalNM} NM{flightTime ? ` · ${flightTime}` : ""}
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-48 custom-scroll">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[#eef2ff] text-[#1e40af]">
                  <tr>
                    <th className="text-left p-1.5">#</th>
                    <th className="text-left p-1.5">Punto</th>
                    <th className="text-left p-1.5">Tipo</th>
                    <th className="text-left p-1.5">Coordenadas</th>
                    <th className="text-right p-1.5">Leg NM</th>
                    <th className="text-right p-1.5">Rumbo°</th>
                    <th className="text-right p-1.5">Acum NM</th>
                  </tr>
                </thead>
                <tbody>
                  {route.map((p, i) => {
                    const leg = i > 0 ? routeStats.legs[i - 1] : null
                    const acum = routeStats.legs.slice(0, i).reduce((s, l) => s + l.nm, 0)
                    return (
                      <tr key={i} className="border-b border-slate-200 hover:bg-[#1e40af]/10 text-slate-600">
                        <td className="p-1.5 text-[#1e40af] font-bold">{i + 1}</td>
                        <td className="p-1.5 font-bold text-[#1e40af]">{p.id.length > 18 ? p.id.slice(0, 16) + ".." : p.id}</td>
                        <td className="p-1.5 text-slate-600/70 text-[10px]">{p.type}</td>
                        <td className="p-1.5 text-[10px] text-slate-600/70">
                          {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                        </td>
                        <td className="p-1.5 text-right">{leg?.nm ?? "—"}</td>
                        <td className="p-1.5 text-right">{leg?.brg ?? "—"}</td>
                        <td className="p-1.5 text-right text-[#1e40af] font-bold">{acum}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#1e40af]/15 font-bold">
                    <td colSpan={4} className="p-1.5 text-right text-[#1e40af]">TOTAL</td>
                    <td className="p-1.5 text-right text-[#1e40af]">{routeStats.totalNM} NM</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Grid Layer Component ────────────────────────────────────────
function GridLayer() {
  const map = useMap()
  const linesRef = useRef<L.Polyline[]>([])
  const labelsRef = useRef<L.Marker[]>([])

  useEffect(() => {
    const bounds = map.getBounds()
    const south = Math.floor(bounds.getSouth())
    const north = Math.ceil(bounds.getNorth())
    const west = Math.floor(bounds.getWest())
    const east = Math.ceil(bounds.getEast())

    const lines: L.Polyline[] = []
    const labels: L.Marker[] = []

    for (let lat = south; lat <= north; lat++) {
      const line = L.polyline(
        [[lat, west], [lat, east]],
        { color: C.grid, weight: 0.5, opacity: 0.5, interactive: false }
      ).addTo(map)
      lines.push(line)
    }
    for (let lon = west; lon <= east; lon++) {
      const line = L.polyline(
        [[south, lon], [north, lon]],
        { color: C.grid, weight: 0.5, opacity: 0.5, interactive: false }
      ).addTo(map)
      lines.push(line)
    }

    linesRef.current = lines
    labelsRef.current = labels

    return () => {
      lines.forEach((l) => map.removeLayer(l))
      labels.forEach((l) => map.removeLayer(l))
    }
  }, [map])

  return null
}
