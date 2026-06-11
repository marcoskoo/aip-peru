"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, X, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

// ─── Types ────────────────────────────────────────────────────────

interface WaypointRecord {
  id: string; name: string; type: string; lat: number; lon: number; description: string | null
}
interface NavaidRecord {
  id: string; name: string; type: string; frequency: string; lat: number; lon: number; elevation: number | null
}
interface AirwaySegmentRecord {
  id: string; orderIndex: number; fromPoint: string; toPoint: string; distance: number; bearing: number; minFL: number | null; maxFL: number | null
}
interface AirwayRecord {
  id: string; designator: string; type: string; level: string; segments: AirwaySegmentRecord[]
}
interface FIRRecord {
  id: string; name: string; type: string; centerLat: number; centerLon: number; polygon: string
}
interface AdjacentFIRRecord {
  id: string; icao: string; name: string; country: string; borderPoints: string | null; color: string | null
}
interface SegmentForm {
  from: string; to: string; distance: string; bearing: string; minFL: string; maxFL: string
}

// ─── Custom Hook ──────────────────────────────────────────────────

function useAirdata<T>(url: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      fetch(url)
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((j) => { if (!cancelled) setData(j) })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false) })
    })
    return () => { cancelled = true }
  }, [url, refreshKey])

  return { data, loading, refresh }
}

// ─── CRUD Helpers ─────────────────────────────────────────────────

async function apiPost(url: string, data: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Error al crear")
  return r.json()
}
async function apiPut(url: string, data: unknown) {
  const r = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Error al actualizar")
  return r.json()
}
async function apiDel(url: string) {
  const r = await fetch(url, { method: "DELETE" })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Error al eliminar")
}

// ─── Shared UI bits ──────────────────────────────────────────────

function Notif({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null
  const ok = msg.type === "ok"
  return (
    <div className={`mb-3 px-3 py-2 rounded text-sm font-medium ${ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"}`}>
      {ok ? "✓" : "✕"} {msg.text}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-9 h-9" />
    </div>
  )
}

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}><Pencil className="size-3.5" /></Button>
      <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-700" onClick={onDelete}><Trash2 className="size-3.5" /></Button>
    </div>
  )
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>
}

// ─── Waypoints Tab ────────────────────────────────────────────────

function WaypointsTab() {
  const { data, loading, refresh } = useAirdata<WaypointRecord>("/api/airdata/waypoints")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<WaypointRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fid, setFid] = useState("")
  const [fname, setFname] = useState("")
  const [ftype, setFtype] = useState("WAYPOINT")
  const [flat, setFlat] = useState("")
  const [flon, setFlon] = useState("")
  const [fdesc, setFdesc] = useState("")
  const [notif, setNotif] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setNotif({ type, text })
    setTimeout(() => setNotif(null), 3000)
  }, [])

  const openCreate = () => {
    setEditing(null); setFid(""); setFname(""); setFtype("WAYPOINT"); setFlat(""); setFlon(""); setFdesc(""); setShowForm(true)
  }
  const openEdit = (w: WaypointRecord) => {
    setEditing(w); setFid(w.id); setFname(w.name); setFtype(w.type); setFlat(String(w.lat)); setFlon(String(w.lon)); setFdesc(w.description || ""); setShowForm(true)
  }

  const handleSave = async () => {
    if (!fid || !fname || !flat || !flon) { notify("err", "Complete los campos requeridos"); return }
    setSaving(true)
    try {
      const p = { id: fid, name: fname, type: ftype, lat: parseFloat(flat), lon: parseFloat(flon), description: fdesc || null }
      if (editing) { await apiPut(`/api/airdata/waypoints/${editing.id}`, p); notify("ok", "Waypoint actualizado") }
      else { await apiPost("/api/airdata/waypoints", p); notify("ok", "Waypoint creado") }
      setShowForm(false); refresh()
    } catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
    setSaving(false)
  }

  const handleDel = async (w: WaypointRecord) => {
    if (!confirm(`¿Eliminar waypoint ${w.id} (${w.name})?`)) return
    try { await apiDel(`/api/airdata/waypoints/${w.id}`); notify("ok", "Waypoint eliminado"); refresh() }
    catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
  }

  const filtered = data.filter((w) => w.id.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()))
  const typeBadge = (t: string) => {
    const c = t === "NAVAID" ? "border-blue-300 text-blue-700" : t === "AIRPORT" ? "border-amber-300 text-amber-700" : "border-cyan-300 text-cyan-700"
    return <Badge variant="outline" className={`text-[10px] ${c}`}>{t}</Badge>
  }

  return (
    <div className="space-y-3">
      <Notif msg={notif} />
      <div className="flex items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar waypoint..." />
        <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" />Agregar</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{editing ? "Editar Waypoint" : "Nuevo Waypoint"}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
          </div>
          <FormRow>
            <Field label="ID"><Input value={fid} onChange={(e) => setFid(e.target.value)} placeholder="ISKAR" disabled={!!editing} /></Field>
            <Field label="Nombre"><Input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="ISKAR" /></Field>
          </FormRow>
          <Field label="Tipo">
            <Select value={ftype} onValueChange={setFtype}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="WAYPOINT">WAYPOINT</SelectItem><SelectItem value="NAVAID">NAVAID</SelectItem><SelectItem value="AIRPORT">AIRPORT</SelectItem></SelectContent></Select>
          </Field>
          <FormRow>
            <Field label="Latitud"><Input type="number" value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="-10.2167" step="0.0001" /></Field>
            <Field label="Longitud"><Input type="number" value={flon} onChange={(e) => setFlon(e.target.value)} placeholder="-77.0833" step="0.0001" /></Field>
          </FormRow>
          <Field label="Descripción"><Input value={fdesc} onChange={(e) => setFdesc(e.target.value)} placeholder="ENR intersection..." /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin mr-1" />}Guardar</Button>
          </div>
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin mr-2" />Cargando...</div> : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No se encontraron waypoints</p>}
            {filtered.map((w) => (
              <div key={w.id} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-medium">{w.id}</span>
                  <span className="text-sm truncate">{w.name}</span>
                  {typeBadge(w.type)}
                  <span className="hidden md:inline text-xs text-muted-foreground font-mono">{w.lat.toFixed(4)}, {w.lon.toFixed(4)}</span>
                </div>
                <ActionBtns onEdit={() => openEdit(w)} onDelete={() => handleDel(w)} />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

// ─── Navaids Tab ──────────────────────────────────────────────────

function NavaidsTab() {
  const { data, loading, refresh } = useAirdata<NavaidRecord>("/api/airdata/navaids")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<NavaidRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fid, setFid] = useState("")
  const [fname, setFname] = useState("")
  const [ftype, setFtype] = useState("DVOR/DME")
  const [ffreq, setFfreq] = useState("")
  const [flat, setFlat] = useState("")
  const [flon, setFlon] = useState("")
  const [felev, setFelev] = useState("")
  const [notif, setNotif] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setNotif({ type, text }); setTimeout(() => setNotif(null), 3000)
  }, [])

  const openCreate = () => {
    setEditing(null); setFid(""); setFname(""); setFtype("DVOR/DME"); setFfreq(""); setFlat(""); setFlon(""); setFelev(""); setShowForm(true)
  }
  const openEdit = (n: NavaidRecord) => {
    setEditing(n); setFid(n.id); setFname(n.name); setFtype(n.type); setFfreq(n.frequency); setFlat(String(n.lat)); setFlon(String(n.lon)); setFelev(n.elevation !== null ? String(n.elevation) : ""); setShowForm(true)
  }

  const handleSave = async () => {
    if (!fid || !fname || !ffreq || !flat || !flon) { notify("err", "Complete los campos requeridos"); return }
    setSaving(true)
    try {
      const p = { id: fid, name: fname, type: ftype, frequency: ffreq, lat: parseFloat(flat), lon: parseFloat(flon), elevation: felev ? parseFloat(felev) : null }
      if (editing) { await apiPut(`/api/airdata/navaids/${editing.id}`, p); notify("ok", "Radioayuda actualizada") }
      else { await apiPost("/api/airdata/navaids", p); notify("ok", "Radioayuda creada") }
      setShowForm(false); refresh()
    } catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
    setSaving(false)
  }

  const handleDel = async (n: NavaidRecord) => {
    if (!confirm(`¿Eliminar radioayuda ${n.id} (${n.name})?`)) return
    try { await apiDel(`/api/airdata/navaids/${n.id}`); notify("ok", "Radioayuda eliminada"); refresh() }
    catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
  }

  const filtered = data.filter((n) => n.id.toLowerCase().includes(search.toLowerCase()) || n.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      <Notif msg={notif} />
      <div className="flex items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar radioayuda..." />
        <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" />Agregar</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{editing ? "Editar Radioayuda" : "Nueva Radioayuda"}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
          </div>
          <FormRow>
            <Field label="ID"><Input value={fid} onChange={(e) => setFid(e.target.value)} placeholder="LIM" disabled={!!editing} /></Field>
            <Field label="Nombre"><Input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="LIMA" /></Field>
          </FormRow>
          <FormRow>
            <Field label="Tipo"><Select value={ftype} onValueChange={setFtype}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="DVOR/DME">DVOR/DME</SelectItem><SelectItem value="VOR/DME">VOR/DME</SelectItem><SelectItem value="NDB">NDB</SelectItem><SelectItem value="VOR">VOR</SelectItem><SelectItem value="DME">DME</SelectItem><SelectItem value="TACAN">TACAN</SelectItem></SelectContent></Select></Field>
            <Field label="Frecuencia"><Input value={ffreq} onChange={(e) => setFfreq(e.target.value)} placeholder="116.1 MHz" /></Field>
          </FormRow>
          <FormRow>
            <Field label="Latitud"><Input type="number" value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="-12.0086" step="0.0001" /></Field>
            <Field label="Longitud"><Input type="number" value={flon} onChange={(e) => setFlon(e.target.value)} placeholder="-77.1228" step="0.0001" /></Field>
          </FormRow>
          <Field label="Elevación (ft)"><Input type="number" value={felev} onChange={(e) => setFelev(e.target.value)} placeholder="33" /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin mr-1" />}Guardar</Button>
          </div>
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin mr-2" />Cargando...</div> : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No se encontraron radioayudas</p>}
            {filtered.map((n) => (
              <div key={n.id} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-medium">{n.id}</span>
                  <span className="text-sm truncate">{n.name}</span>
                  <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">{n.type}</Badge>
                  <span className="hidden sm:inline text-xs font-mono text-muted-foreground">{n.frequency}</span>
                  <span className="hidden md:inline text-xs text-muted-foreground font-mono">{n.lat.toFixed(4)}, {n.lon.toFixed(4)}</span>
                </div>
                <ActionBtns onEdit={() => openEdit(n)} onDelete={() => handleDel(n)} />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

// ─── Airways Tab ──────────────────────────────────────────────────

function AirwaysTab() {
  const { data, loading, refresh } = useAirdata<AirwayRecord>("/api/airdata/airways")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<AirwayRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [fDesignator, setFDesignator] = useState("")
  const [fType, setFType] = useState("CONVENTIONAL")
  const [fLevel, setFLevel] = useState("LOWER")
  const [fSegments, setFSegments] = useState<SegmentForm[]>([])
  const [notif, setNotif] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setNotif({ type, text }); setTimeout(() => setNotif(null), 3000)
  }, [])

  const toggleExpand = (id: string) => setExpanded((p) => { const n = new Set(p); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })

  const openCreate = () => {
    setEditing(null); setFDesignator(""); setFType("CONVENTIONAL"); setFLevel("LOWER"); setFSegments([]); setShowForm(true)
  }
  const openEdit = (a: AirwayRecord) => {
    setEditing(a); setFDesignator(a.designator); setFType(a.type); setFLevel(a.level)
    setFSegments(a.segments.map((s) => ({ from: s.fromPoint, to: s.toPoint, distance: String(s.distance), bearing: String(s.bearing), minFL: s.minFL !== null ? String(s.minFL) : "", maxFL: s.maxFL !== null ? String(s.maxFL) : "" })))
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!fDesignator || !fType || !fLevel) { notify("err", "Complete los campos requeridos"); return }
    setSaving(true)
    try {
      const p = {
        designator: fDesignator, type: fType, level: fLevel,
        segments: fSegments.filter((s) => s.from && s.to).map((s) => ({
          from: s.from, to: s.to, distance: parseFloat(s.distance) || 0, bearing: parseFloat(s.bearing) || 0,
          minFL: s.minFL ? parseInt(s.minFL) : null, maxFL: s.maxFL ? parseInt(s.maxFL) : null,
        })),
      }
      if (editing) { await apiPut(`/api/airdata/airways/${editing.id}`, p); notify("ok", "Aerovía actualizada") }
      else { await apiPost("/api/airdata/airways", p); notify("ok", "Aerovía creada") }
      setShowForm(false); refresh()
    } catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
    setSaving(false)
  }

  const handleDel = async (a: AirwayRecord) => {
    if (!confirm(`¿Eliminar aerovía ${a.designator}?`)) return
    try { await apiDel(`/api/airdata/airways/${a.id}`); notify("ok", "Aerovía eliminada"); refresh() }
    catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
  }

  const addSeg = () => setFSegments((p) => [...p, { from: "", to: "", distance: "", bearing: "", minFL: "", maxFL: "" }])
  const rmSeg = (i: number) => setFSegments((p) => p.filter((_, j) => j !== i))
  const updSeg = (i: number, f: keyof SegmentForm, v: string) => setFSegments((p) => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u })

  const filtered = data.filter((a) => a.designator.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
  const typeColor = (t: string) => t === "CONVENTIONAL" ? "border-green-300 text-green-700" : "border-fuchsia-300 text-fuchsia-700"

  return (
    <div className="space-y-3">
      <Notif msg={notif} />
      <div className="flex items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar aerovía..." />
        <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" />Agregar</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{editing ? "Editar Aerovía" : "Nueva Aerovía"}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
          </div>
          <FormRow>
            <Field label="Designador"><Input value={fDesignator} onChange={(e) => setFDesignator(e.target.value)} placeholder="G679" /></Field>
            <Field label="Nivel"><Select value={fLevel} onValueChange={setFLevel}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="LOWER">LOWER</SelectItem><SelectItem value="UPPER">UPPER</SelectItem></SelectContent></Select></Field>
          </FormRow>
          <Field label="Tipo"><Select value={fType} onValueChange={setFType}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="CONVENTIONAL">CONVENTIONAL</SelectItem><SelectItem value="RNAV">RNAV</SelectItem></SelectContent></Select></Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Segmentos ({fSegments.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSeg}><Plus className="size-3 mr-1" />Segmento</Button>
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-1.5">
                {fSegments.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_60px_60px_50px_50px_28px] gap-1 items-end text-xs border rounded p-1.5 bg-muted/30">
                    <Input value={s.from} onChange={(e) => updSeg(i, "from", e.target.value)} placeholder="Desde" className="h-6 text-xs" />
                    <Input value={s.to} onChange={(e) => updSeg(i, "to", e.target.value)} placeholder="Hasta" className="h-6 text-xs" />
                    <Input type="number" value={s.distance} onChange={(e) => updSeg(i, "distance", e.target.value)} placeholder="NM" className="h-6 text-xs" step="0.1" />
                    <Input type="number" value={s.bearing} onChange={(e) => updSeg(i, "bearing", e.target.value)} placeholder="°" className="h-6 text-xs" step="0.1" />
                    <Input type="number" value={s.minFL} onChange={(e) => updSeg(i, "minFL", e.target.value)} placeholder="mn" className="h-6 text-xs" />
                    <Input type="number" value={s.maxFL} onChange={(e) => updSeg(i, "maxFL", e.target.value)} placeholder="mx" className="h-6 text-xs" />
                    <Button type="button" variant="ghost" size="icon" className="size-6 text-red-500" onClick={() => rmSeg(i)}><Trash2 className="size-3" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin mr-1" />}Guardar</Button>
          </div>
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin mr-2" />Cargando...</div> : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No se encontraron aerovías</p>}
            {filtered.map((a) => (
              <div key={a.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => toggleExpand(a.id)}>
                      {expanded.has(a.id) ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </Button>
                    <span className="font-mono text-sm font-medium">{a.designator}</span>
                    <Badge variant="outline" className={`text-[10px] ${typeColor(a.type)}`}>{a.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.level}</Badge>
                    <span className="text-xs text-muted-foreground">{a.segments.length} seg.</span>
                  </div>
                  <ActionBtns onEdit={() => openEdit(a)} onDelete={() => handleDel(a)} />
                </div>
                {expanded.has(a.id) && a.segments.length > 0 && (
                  <div className="border-t bg-muted/20 px-4 py-2">
                    <div className="text-[10px] grid grid-cols-[1fr_1fr_60px_60px_50px_50px] gap-1 text-muted-foreground mb-1 px-1">
                      <span>Desde</span><span>Hasta</span><span>NM</span><span>°</span><span>Min</span><span>Max</span>
                    </div>
                    {a.segments.map((s, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_60px_60px_50px_50px] gap-1 text-xs py-0.5 px-1">
                        <span className="font-mono">{s.fromPoint}</span>
                        <span className="font-mono">{s.toPoint}</span>
                        <span>{s.distance}</span>
                        <span>{s.bearing}</span>
                        <span>{s.minFL ?? "—"}</span>
                        <span>{s.maxFL ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

// ─── FIR Tab ──────────────────────────────────────────────────────

function FIRTab() {
  const { data, loading, refresh } = useAirdata<FIRRecord>("/api/airdata/fir")
  const [editing, setEditing] = useState<FIRRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fid, setFid] = useState("")
  const [fname, setFname] = useState("")
  const [ftype, setFtype] = useState("FIR")
  const [fcLat, setFcLat] = useState("")
  const [fcLon, setFcLon] = useState("")
  const [fpoly, setFpoly] = useState("")
  const [notif, setNotif] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setNotif({ type, text }); setTimeout(() => setNotif(null), 3000)
  }, [])

  const openCreate = () => {
    setEditing(null); setFid(""); setFname(""); setFtype("FIR"); setFcLat(""); setFcLon(""); setFpoly("[]"); setShowForm(true)
  }
  const openEdit = (f: FIRRecord) => {
    setEditing(f); setFid(f.id); setFname(f.name); setFtype(f.type); setFcLat(String(f.centerLat)); setFcLon(String(f.centerLon)); setFpoly(f.polygon); setShowForm(true)
  }

  const handleSave = async () => {
    if (!fid || !fname || !fcLat || !fcLon) { notify("err", "Complete los campos requeridos"); return }
    setSaving(true)
    try {
      const p = { id: fid, name: fname, type: ftype, centerLat: parseFloat(fcLat), centerLon: parseFloat(fcLon), polygon: fpoly }
      if (editing) { await apiPut(`/api/airdata/fir/${editing.id}`, p); notify("ok", "FIR actualizado") }
      else { await apiPost("/api/airdata/fir", p); notify("ok", "FIR creado") }
      setShowForm(false); refresh()
    } catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
    setSaving(false)
  }

  const handleDel = async (f: FIRRecord) => {
    if (!confirm(`¿Eliminar FIR ${f.name}?`)) return
    try { await apiDel(`/api/airdata/fir/${f.id}`); notify("ok", "FIR eliminado"); refresh() }
    catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
  }

  return (
    <div className="space-y-3">
      <Notif msg={notif} />
      <div className="flex items-center justify-end gap-3">
        <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" />Agregar</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{editing ? "Editar FIR" : "Nuevo FIR"}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
          </div>
          <FormRow>
            <Field label="ID"><Input value={fid} onChange={(e) => setFid(e.target.value)} placeholder="SPIM" disabled={!!editing} /></Field>
            <Field label="Nombre"><Input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Lima" /></Field>
          </FormRow>
          <FormRow>
            <Field label="Centro Lat"><Input type="number" value={fcLat} onChange={(e) => setFcLat(e.target.value)} step="0.0001" /></Field>
            <Field label="Centro Lon"><Input type="number" value={fcLon} onChange={(e) => setFcLon(e.target.value)} step="0.0001" /></Field>
          </FormRow>
          <Field label="Polígono (JSON)">
            <textarea value={fpoly} onChange={(e) => setFpoly(e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin mr-1" />}Guardar</Button>
          </div>
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin mr-2" />Cargando...</div> : (
        <div className="space-y-2">
          {data.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No hay FIRs</p>}
          {data.map((f) => (
            <div key={f.id} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-medium">{f.id}</span>
                <span className="text-sm">{f.name}</span>
                <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
                <span className="hidden md:inline text-xs text-muted-foreground font-mono">{f.centerLat}, {f.centerLon}</span>
                <span className="hidden lg:inline text-xs text-muted-foreground">{JSON.parse(f.polygon || "[]").length} pts</span>
              </div>
              <ActionBtns onEdit={() => openEdit(f)} onDelete={() => handleDel(f)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Adjacent FIRs Tab ────────────────────────────────────────────

function AdjacentFIRsTab() {
  const { data, loading, refresh } = useAirdata<AdjacentFIRRecord>("/api/airdata/adjacent-fir")
  const [editing, setEditing] = useState<AdjacentFIRRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ficao, setFicao] = useState("")
  const [fname, setFname] = useState("")
  const [fcountry, setFcountry] = useState("")
  const [fcolor, setFcolor] = useState("")
  const [fborder, setFborder] = useState("")
  const [notif, setNotif] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setNotif({ type, text }); setTimeout(() => setNotif(null), 3000)
  }, [])

  const openCreate = () => {
    setEditing(null); setFicao(""); setFname(""); setFcountry(""); setFcolor("#ff6600"); setFborder("[]"); setShowForm(true)
  }
  const openEdit = (a: AdjacentFIRRecord) => {
    setEditing(a); setFicao(a.icao); setFname(a.name); setFcountry(a.country); setFcolor(a.color || "#ff6600"); setFborder(a.borderPoints || "[]"); setShowForm(true)
  }

  const handleSave = async () => {
    if (!ficao || !fname || !fcountry) { notify("err", "Complete los campos requeridos"); return }
    setSaving(true)
    try {
      const p = { icao: ficao, name: fname, country: fcountry, color: fcolor || null, borderPoints: fborder }
      if (editing) { await apiPut(`/api/airdata/adjacent-fir/${editing.id}`, p); notify("ok", "FIR adyacente actualizado") }
      else { await apiPost("/api/airdata/adjacent-fir", p); notify("ok", "FIR adyacente creado") }
      setShowForm(false); refresh()
    } catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
    setSaving(false)
  }

  const handleDel = async (a: AdjacentFIRRecord) => {
    if (!confirm(`¿Eliminar FIR adyacente ${a.icao} (${a.name})?`)) return
    try { await apiDel(`/api/airdata/adjacent-fir/${a.id}`); notify("ok", "FIR adyacente eliminado"); refresh() }
    catch (e) { notify("err", e instanceof Error ? e.message : "Error") }
  }

  return (
    <div className="space-y-3">
      <Notif msg={notif} />
      <div className="flex items-center justify-end gap-3">
        <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" />Agregar</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{editing ? "Editar FIR Adyacente" : "Nuevo FIR Adyacente"}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X className="size-4" /></Button>
          </div>
          <FormRow>
            <Field label="ICAO"><Input value={ficao} onChange={(e) => setFicao(e.target.value)} placeholder="SEGU" disabled={!!editing} /></Field>
            <Field label="Nombre"><Input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Guayaquil" /></Field>
          </FormRow>
          <FormRow>
            <Field label="País"><Input value={fcountry} onChange={(e) => setFcountry(e.target.value)} placeholder="Ecuador" /></Field>
            <Field label="Color">
              <div className="flex gap-2 items-center">
                <input type="color" value={fcolor} onChange={(e) => setFcolor(e.target.value)} className="size-9 rounded border cursor-pointer" />
                <Input value={fcolor} onChange={(e) => setFcolor(e.target.value)} className="flex-1" />
              </div>
            </Field>
          </FormRow>
          <Field label="Puntos frontera (JSON)">
            <textarea value={fborder} onChange={(e) => setFborder(e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin mr-1" />}Guardar</Button>
          </div>
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin mr-2" />Cargando...</div> : (
        <div className="space-y-2">
          {data.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No hay FIRs adyacentes</p>}
          {data.map((a) => (
            <div key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-medium">{a.icao}</span>
                <span className="text-sm">{a.name}</span>
                <Badge variant="outline" className="text-[10px]">{a.country}</Badge>
                {a.color && <span className="size-4 rounded-full border" style={{ backgroundColor: a.color }} />}
                <span className="hidden lg:inline text-xs text-muted-foreground">{JSON.parse(a.borderPoints || "[]").length} pts</span>
              </div>
              <ActionBtns onEdit={() => openEdit(a)} onDelete={() => handleDel(a)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function AdminPanel() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Tabs defaultValue="waypoints">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="waypoints" className="text-xs">Waypoints</TabsTrigger>
          <TabsTrigger value="navaids" className="text-xs">Radioayudas</TabsTrigger>
          <TabsTrigger value="airways" className="text-xs">Aerovías</TabsTrigger>
          <TabsTrigger value="fir" className="text-xs">FIR</TabsTrigger>
          <TabsTrigger value="adj-fir" className="text-xs">FIRs Adj.</TabsTrigger>
        </TabsList>
        <TabsContent value="waypoints"><WaypointsTab /></TabsContent>
        <TabsContent value="navaids"><NavaidsTab /></TabsContent>
        <TabsContent value="airways"><AirwaysTab /></TabsContent>
        <TabsContent value="fir"><FIRTab /></TabsContent>
        <TabsContent value="adj-fir"><AdjacentFIRsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
