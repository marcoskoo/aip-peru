"use client"

import { useEffect, useState } from "react"
import { Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseIsoMs, formatCountdown, notamStatus } from "@/lib/aviation/notam-parser"

/**
 * Reloj de cuenta regresiva en vivo para NOTAMs.
 *
 * Comportamiento visual:
 *  - Estado normal (> 30 min restantes): azul, negrita, tamaño compacto.
 *  - Estado crítico (≤ 30 min restantes): rojo, negrita, tamaño de fuente
 *    aumentado, con animación de pulso para llamar la atención.
 *  - PERMANENTE: verde, "PERM".
 *  - PRÓXIMO (vigente en el futuro): ámbar, "PRÓXIMO".
 *  - EXPIRADO: rojo, "EXPIRADO".
 *
 * El umbral crítico son 30 minutos (1 800 000 ms) — cuando el reloj llega
 * a 30 minutos antes de la hora de vencimiento, cambia a rojo y crece.
 */
export function NotamCountdownClock({
  effectiveFrom,
  effectiveTo,
  isPermanent,
  className,
}: {
  effectiveFrom?: string | null
  effectiveTo?: string | null
  isPermanent?: boolean
  className?: string
}) {
  const [, setTick] = useState(0)

  // Tick cada segundo para que el reloj sea "descendente" en vivo.
  useEffect(() => {
    if (!effectiveTo || effectiveTo === "PERM" || isPermanent) return
    const target = parseIsoMs(effectiveTo)
    if (target === null) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [effectiveTo, isPermanent])

  // PRÓXIMO: todavía no entra en vigencia.
  const status = notamStatus(
    effectiveFrom ?? undefined,
    effectiveTo ?? (isPermanent ? "PERM" : undefined),
  )
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
        <Timer className="h-3.5 w-3.5" />
        PRÓXIMO
      </span>
    )
  }

  // PERMANENTE: no tiene fecha de fin.
  if (!effectiveTo || effectiveTo === "PERM" || isPermanent) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
        <Timer className="h-3.5 w-3.5" />
        PERM
      </span>
    )
  }

  const target = parseIsoMs(effectiveTo)
  if (target === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
        <Timer className="h-3.5 w-3.5" />
        —
      </span>
    )
  }

  const diff = target - Date.now()

  // EXPIRADO.
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-red-600 dark:text-red-400">
        <Timer className="h-3.5 w-3.5" />
        EXPIRADO
      </span>
    )
  }

  // CRÍTICO: ≤ 30 min restantes → rojo, negrita, tamaño aumentado, pulso.
  const CRITICAL_THRESHOLD_MS = 30 * 60 * 1000
  const critical = diff <= CRITICAL_THRESHOLD_MS

  if (critical) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-bold tabular-nums animate-pulse",
          "text-red-600 dark:text-red-400 text-base sm:text-lg",
          className,
        )}
        title={`Vence: ${new Date(effectiveTo).toLocaleString("es-PE")}`}
      >
        <Timer className="h-4 w-4 animate-pulse" />
        {formatCountdown(diff)}
      </span>
    )
  }

  // NORMAL: azul, negrita, tamaño compacto.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold tabular-nums",
        "text-blue-600 dark:text-blue-400 text-xs sm:text-sm",
        className,
      )}
      title={`Vence: ${new Date(effectiveTo).toLocaleString("es-PE")}`}
    >
      <Timer className="h-3.5 w-3.5" />
      {formatCountdown(diff)}
    </span>
  )
}

// ─── Sort helper ──────────────────────────────────────────────────────

/**
 * Ordena los NOTAMs por jerarquía de vencimiento:
 *  1. Activos con fecha de fin (effectiveTo) — ascendente (el más próximo
 *     a vencer primero).
 *  2. Próximos (vigente en el futuro, effectiveFrom > ahora).
 *  3. Permanentes (PERM en el campo C, sin fecha de fin o isPermanent=true)
 *     — van al FINAL de la lista de prioridad porque no tienen vencimiento.
 *  4. Expirados (al fondo, cuando se muestran).
 *
 * Dentro de cada grupo, se ordena secundariamente por notamId para
 * estabilidad.
 */
export function sortByExpiry<T extends {
  effectiveFrom?: string | null
  effectiveTo?: string | null
  isPermanent?: boolean | null
  notamId: string
}>(notams: T[]): T[] {
  const now = Date.now()
  const rank = (n: T): number => {
    // Permanentes (PERM en C) → van al final de la prioridad (rank 3).
    // No tienen vencimiento, así que no compiten con los que sí tienen.
    if (n.isPermanent) return 3
    if (!n.effectiveTo || n.effectiveTo === "PERM") return 3
    const to = parseIsoMs(n.effectiveTo)
    if (to === null) return 3
    if (to < now) return 4 // expirado
    // ¿Próximo (no ha empezado)?
    if (n.effectiveFrom) {
      const from = parseIsoMs(n.effectiveFrom)
      if (from !== null && from > now) return 2 // próximo
    }
    return 1 // activo con vencimiento
  }
  return [...notams].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    // Dentro del grupo 1 (activos con vencimiento), ordenar por effectiveTo ASC.
    if (ra === 1) {
      const ta = a.effectiveTo ? parseIsoMs(a.effectiveTo) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY
      const tb = b.effectiveTo ? parseIsoMs(b.effectiveTo) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY
      if (ta !== tb) return ta - tb
    }
    // Orden secundario: notamId ascendente (estabilidad).
    return a.notamId.localeCompare(b.notamId)
  })
}
