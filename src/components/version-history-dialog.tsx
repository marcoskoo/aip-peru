"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, GitBranch, Wrench, Sparkles, Database, Palette, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { VERSION_HISTORY, CURRENT_VERSION, formatVersionDate, type VersionEntry } from "@/lib/version-history"

// ─── Tag config ────────────────────────────────────────────────────────

const tagConfig: Record<
  VersionEntry["tag"],
  { label: string; icon: typeof GitBranch; color: string }
> = {
  feature: { label: "Nueva función", icon: Sparkles, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  fix: { label: "Corrección", icon: Wrench, color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  improvement: { label: "Mejora", icon: GitBranch, color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  data: { label: "Datos", icon: Database, color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  ui: { label: "Interfaz", icon: Palette, color: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/30" },
}

// ─── Component ────────────────────────────────────────────────────────

export function VersionHistoryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10"
          title="Ver historial de versiones del aplicativo"
        >
          <History className="size-3.5" />
          <span className="hidden sm:inline">Historial</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono border-amber-500/40 text-amber-400">
            {CURRENT_VERSION.version}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-amber-600" />
            Historial de Versiones
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Registro de cambios del aplicativo AIP PERÚ — versión actual{" "}
            <span className="font-mono font-semibold text-amber-600">
              {CURRENT_VERSION.version}
            </span>{" "}
            ({formatVersionDate(CURRENT_VERSION.date)})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-500/40 via-slate-200 dark:via-slate-700 to-transparent" />

              {VERSION_HISTORY.map((entry, idx) => {
                const tag = tagConfig[entry.tag]
                const TagIcon = tag.icon
                const isLatest = idx === 0

                return (
                  <div key={`${entry.version}-${entry.date}`} className="relative pl-10 pb-5 last:pb-0">
                    {/* Dot on timeline */}
                    <div
                      className={cn(
                        "absolute left-0 top-1.5 rounded-full p-1.5 border-2 bg-white dark:bg-slate-900",
                        isLatest
                          ? "border-amber-500 text-amber-600"
                          : "border-slate-300 dark:border-slate-600 text-slate-400"
                      )}
                    >
                      <TagIcon className="size-3" />
                    </div>

                    {/* Card */}
                    <div
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        isLatest
                          ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      )}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {entry.version}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] gap-1", tag.color)}>
                          <TagIcon className="size-2.5" />
                          {tag.label}
                        </Badge>
                        {isLatest && (
                          <Badge className="text-[10px] bg-amber-500 text-white gap-1">
                            <Sparkles className="size-2.5" />
                            Actual
                          </Badge>
                        )}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-auto font-mono">
                          {formatVersionDate(entry.date)}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {entry.title}
                      </p>

                      {/* Changes list */}
                      <ul className="space-y-1">
                        {entry.changes.map((change, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
