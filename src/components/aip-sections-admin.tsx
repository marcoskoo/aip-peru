"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  Code,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface AipSection {
  id: string;
  sectionCode: string;
  title: string;
  titleEn?: string | null;
  part: string;
  subPart: string;
  orderIndex: number;
  content?: string;
  contentEn?: string | null;
  lastAmendment?: string | null;
  effectiveDate?: string | null;
  sourceFile?: string | null;
}

interface UploadResultItem {
  file: string;
  sectionCode: string;
  title: string;
  status: "created" | "updated" | "error";
  error?: string;
}

const TEMPLATE_MARKDOWN = `---
sectionCode: ENR_3.1
title: Rutas ATS Convencionales - Espacio Aéreo Inferior
titleEn: Conventional ATS Routes - Lower Airspace
part: ENR
subPart: "3.1"
orderIndex: 31
lastAmendment: AMDT 33/2025
effectiveDate: 30 JUL 2025
---

# Rutas ATS Convencionales - Espacio Aéreo Inferior

## Descripción General

Esta sección describe las rutas ATS convencionales del espacio aéreo inferior del Perú.

## Tabla de Rutas

| Designador | Tipo | Clasificación | Límite Inferior | Límite Superior |
|------------|------|---------------|-----------------|-----------------|
| A301       | Convecional | A | FL 080 | FL 240 |
| A304       | Convecional | A | FL 080 | FL 240 |
| V1         | Convecional | G | GND  | FL 240 |

## Notas

- Las rutas están diseñadas para **navegación convencional** (VOR/NDB).
- Consultar ENR 4.1 para frecuencias de radioayudas.

> **Importante:** Verificar NOTAMs vigentes antes del vuelo.
`;

export function AipSectionsTab() {
  const [sections, setSections] = useState<AipSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<AipSection | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AipSection | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResultItem[] | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aip-sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      } else {
        toast.error("Error al cargar las secciones AIP");
      }
    } catch {
      toast.error("Error de conexión al cargar secciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleUpload = async (files: FileList | File[]) => {
    if (!files || (files instanceof FileList && files.length === 0)) {
      toast.error("Selecciona al menos un archivo .md");
      return;
    }

    const fileArray = Array.from(files);
    const invalidFiles = fileArray.filter(
      (f) => !f.name.toLowerCase().endsWith(".md") && !f.name.toLowerCase().endsWith(".markdown")
    );
    if (invalidFiles.length > 0) {
      toast.error(`Archivos no válidos: ${invalidFiles.map((f) => f.name).join(", ")}`);
      return;
    }

    setUploadingFiles(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      fileArray.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/aip-sections/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResults(data.results || []);
        const { created = 0, updated = 0, errors = 0 } = data.summary || {};
        if (errors === 0) {
          toast.success(`${created} creada(s), ${updated} actualizada(s)`);
        } else {
          toast.warning(`${created} creadas, ${updated} actualizadas, ${errors} con error`);
        }
        fetchSections();
      } else {
        toast.error(data.error || "Error al subir archivos");
      }
    } catch (err) {
      toast.error("Error de conexión al subir archivos");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSaveSection = async (section: Partial<AipSection> & { content?: string }) => {
    try {
      const isUpdate = !!selectedSection;
      const url = isUpdate
        ? `/api/aip-sections/${selectedSection!.sectionCode}`
        : "/api/aip-sections";
      const method = isUpdate ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        sectionCode: section.sectionCode,
        title: section.title,
        titleEn: section.titleEn || null,
        part: section.part,
        subPart: String(section.subPart),
        orderIndex: section.orderIndex ?? 0,
        content: section.content || "",
        contentEn: section.contentEn || null,
        lastAmendment: section.lastAmendment || null,
        effectiveDate: section.effectiveDate || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isUpdate ? "Sección actualizada" : "Sección creada");
        setIsEditorOpen(false);
        setSelectedSection(null);
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (section: AipSection) => {
    try {
      const res = await fetch(`/api/aip-sections/${section.sectionCode}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Sección ${section.sectionCode} eliminada`);
        setDeleteTarget(null);
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_MARKDOWN], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-aip-seccion.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  };

  const handleDownloadSection = async (section: AipSection) => {
    try {
      // Fetch full content
      const res = await fetch(`/api/aip-sections/${section.sectionCode}`);
      const data = await res.json();
      const content = data.content || "";

      const fm = [
        "---",
        `sectionCode: ${section.sectionCode}`,
        `title: ${section.title}`,
        section.titleEn ? `titleEn: ${section.titleEn}` : null,
        `part: ${section.part}`,
        `subPart: "${section.subPart}"`,
        `orderIndex: ${section.orderIndex}`,
        section.lastAmendment ? `lastAmendment: ${section.lastAmendment}` : null,
        section.effectiveDate ? `effectiveDate: ${section.effectiveDate}` : null,
        "---",
        "",
        content,
      ].filter(Boolean).join("\n");

      const blob = new Blob([fm], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${section.sectionCode}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar");
    }
  };

  // Group sections by part
  const sectionsByPart = sections.reduce<Record<string, AipSection[]>>((acc, s) => {
    if (!acc[s.part]) acc[s.part] = [];
    acc[s.part].push(s);
    return acc;
  }, {});

  const partOrder = ["GEN", "ENR", "AD"];
  const sortedParts = Object.keys(sectionsByPart).sort(
    (a, b) => partOrder.indexOf(a) - partOrder.indexOf(b)
  );

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="size-4" />
            Secciones AIP
            <Badge variant="secondary" className="text-xs">
              {sections.length}
            </Badge>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs gap-1.5"
          >
            <Download className="size-3.5" />
            Plantilla
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs gap-1.5"
          >
            <Upload className="size-3.5" />
            Subir .md
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedSection(null);
              setIsEditorOpen(true);
            }}
            className="text-xs gap-1.5 bg-navy hover:bg-navy/90"
          >
            <Plus className="size-3.5" />
            Nueva sección
          </Button>
        </div>
      </div>

      {/* Sections list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No hay secciones AIP cargadas
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Sube archivos .md o crea una sección manualmente
            </p>
            <Button
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="gap-1.5"
            >
              <Upload className="size-4" />
              Subir primer archivo .md
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedParts.map((part) => (
            <Card key={part}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className="bg-navy text-white">{part}</Badge>
                  <span className="text-muted-foreground font-normal text-xs">
                    {sectionsByPart[part].length} sección(es)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {sectionsByPart[part]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                      >
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {section.sectionCode}
                        </Badge>
                        <span className="text-sm flex-1 truncate">{section.title}</span>
                        {section.sourceFile && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:inline-flex">
                            <FileUp className="size-2.5 mr-1" />
                            {section.sourceFile}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleDownloadSection(section)}
                            title="Descargar .md"
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                              setSelectedSection(section);
                              setIsEditorOpen(true);
                            }}
                            title="Editar"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(section)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Subir archivos Markdown (.md)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info about frontmatter */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs">
              <p className="font-semibold mb-1 text-amber-900 dark:text-amber-200">
                Formato soportado:
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                Cada archivo puede incluir <strong>frontmatter YAML</strong> al inicio (entre <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">---</code>) con los campos:{" "}
                <code>sectionCode</code>, <code>title</code>, <code>part</code>, <code>subPart</code>, etc.
                Si no se incluye, se deriva del nombre del archivo.
              </p>
            </div>

            {/* Drag & drop zone */}
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length > 0) {
                  handleUpload(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              {uploadingFiles ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-amber-600" />
                  <p className="text-sm text-muted-foreground">Procesando archivos...</p>
                </div>
              ) : (
                <>
                  <FileUp className="size-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Arrastra archivos .md aquí
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    o haz clic para seleccionar
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar archivos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                </>
              )}
            </div>

            {/* Upload results */}
            {uploadResults && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-muted px-3 py-2 text-xs font-semibold flex items-center justify-between">
                  <span>Resultados ({uploadResults.length})</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setUploadResults(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="divide-y">
                  {uploadResults.map((r, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 flex items-center gap-2 text-xs"
                    >
                      {r.status === "created" && (
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      )}
                      {r.status === "updated" && (
                        <RefreshCw className="size-4 text-blue-600 shrink-0" />
                      )}
                      {r.status === "error" && (
                        <AlertCircle className="size-4 text-red-600 shrink-0" />
                      )}
                      <span className="font-mono shrink-0">{r.sectionCode || "—"}</span>
                      <span className="flex-1 truncate">{r.title || r.error}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          r.status === "error"
                            ? "border-red-300 text-red-700"
                            : r.status === "created"
                            ? "border-emerald-300 text-emerald-700"
                            : "border-blue-300 text-blue-700"
                        }`}
                      >
                        {r.status === "created"
                          ? "Creada"
                          : r.status === "updated"
                          ? "Actualizada"
                          : "Error"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5" />
              {selectedSection ? "Editar sección" : "Nueva sección AIP"}
            </DialogTitle>
          </DialogHeader>
          <SectionEditor
            section={selectedSection}
            onSave={handleSaveSection}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la sección{" "}
              <strong className="font-mono">{deleteTarget?.sectionCode}</strong> -{" "}
              {deleteTarget?.title}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Editor subcomponent ──────────────────────────────────────────

function SectionEditor({
  section,
  onSave,
  viewMode,
  onViewModeChange,
}: {
  section: AipSection | null;
  onSave: (section: Partial<AipSection> & { content?: string }) => void;
  viewMode: "preview" | "code";
  onViewModeChange: (mode: "preview" | "code") => void;
}) {
  const [form, setForm] = useState({
    sectionCode: section?.sectionCode || "",
    title: section?.title || "",
    titleEn: section?.titleEn || "",
    part: section?.part || "GEN",
    subPart: section?.subPart || "1",
    orderIndex: section?.orderIndex ?? 0,
    content: section?.content || "",
    lastAmendment: section?.lastAmendment || "",
    effectiveDate: section?.effectiveDate || "",
  });

  // Reset form when section changes
  const sectionId = section?.id;
  const [lastSectionId, setLastSectionId] = useState<string | null>(sectionId);
  if (sectionId !== lastSectionId) {
    setLastSectionId(sectionId);
    setForm({
      sectionCode: section?.sectionCode || "",
      title: section?.title || "",
      titleEn: section?.titleEn || "",
      part: section?.part || "GEN",
      subPart: section?.subPart || "1",
      orderIndex: section?.orderIndex ?? 0,
      content: section?.content || "",
      lastAmendment: section?.lastAmendment || "",
      effectiveDate: section?.effectiveDate || "",
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sectionCode || !form.title || !form.part) {
      toast.error("sectionCode, title y part son obligatorios");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Metadata fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Código *</Label>
          <Input
            value={form.sectionCode}
            onChange={(e) => setForm({ ...form, sectionCode: e.target.value })}
            placeholder="ENR_3.1"
            className="font-mono text-xs"
            disabled={!!section}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Parte *</Label>
          <Input
            value={form.part}
            onChange={(e) => setForm({ ...form, part: e.target.value.toUpperCase() })}
            placeholder="GEN / ENR / AD"
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sub-parte</Label>
          <Input
            value={form.subPart}
            onChange={(e) => setForm({ ...form, subPart: e.target.value })}
            placeholder="3.1"
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Orden</Label>
          <Input
            type="number"
            value={form.orderIndex}
            onChange={(e) =>
              setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })
            }
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Título *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Rutas ATS Convencionales"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Título (EN)</Label>
          <Input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder="Conventional ATS Routes"
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Enmienda</Label>
          <Input
            value={form.lastAmendment}
            onChange={(e) =>
              setForm({ ...form, lastAmendment: e.target.value })
            }
            placeholder="AMDT 33/2025"
            className="text-xs"
          />
        </div>
      </div>

      {/* Content editor with preview toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Contenido (Markdown)</Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={viewMode === "code" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onViewModeChange("code")}
            >
              <Code className="size-3.5" />
              Código
            </Button>
            <Button
              type="button"
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onViewModeChange("preview")}
            >
              <Eye className="size-3.5" />
              Vista previa
            </Button>
          </div>
        </div>

        {viewMode === "code" ? (
          <Textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Escribe contenido en Markdown..."
            className="font-mono text-xs min-h-[300px] resize-y"
          />
        ) : (
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {form.content ? (
              <MarkdownRenderer content={form.content} />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Sin contenido para previsualizar
              </p>
            )}
          </ScrollArea>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onViewModeChange(viewMode === "code" ? "preview" : "code")}
          className="text-xs gap-1.5"
        >
          {viewMode === "code" ? <Eye className="size-3.5" /> : <Code className="size-3.5" />}
          {viewMode === "code" ? "Vista previa" : "Editar código"}
        </Button>
        <Button type="submit" className="gap-1.5 bg-navy hover:bg-navy/90">
          <Save className="size-4" />
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
