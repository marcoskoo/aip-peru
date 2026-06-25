'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook de polling determinista para refrescar datos de aviación.
 *
 * Diseñado para interrogar al sistema (METAR/TAF/NOTAM) en intervalos
 * regulares (por defecto 30s) sin causar hidratación mismatches ni
 * carreras entre mounts/unmounts.
 *
 * Características:
 *  - `enabled`: permite apagar/encender el polling desde la UI.
 *  - `intervalMs`: intervalo en ms (default 30000).
 *  - `tick`: número de ciclos transcurridos — útil para forzar re-fetches.
 *  - `secondsToNext`: cuántos segundos faltan para la próxima consulta
 *    (determinista: se calcula con `Math.floor` para evitar saltos).
 *  - `isFetching`: true mientras el callback asíncrono está en vuelo.
 *  - `refreshNow()` permite disparar una consulta inmediata sin esperar
 *    al siguiente tick; tras invocarse, el contador se reinicia.
 *
 * Uso típico:
 *   const { tick, secondsToNext, isFetching, refreshNow } = usePolling({
 *     fetcher: () => loadStation(icao),
 *     intervalMs: 30_000,
 *   })
 *   useEffect(() => { /* correr fetcher con tick *\/ }, [tick])
 */
export interface UsePollingOptions {
  /** Función asíncrona que se ejecuta en cada tick. */
  fetcher: () => void | Promise<void>
  /** Intervalo entre consultas, en milisegundos. Default: 30000. */
  intervalMs?: number
  /** Si es false, el polling se pausa (no se cancelan fetchers en vuelo). */
  enabled?: boolean
  /**
   * Si es true, ejecuta el fetcher inmediatamente al montar y cuando
   * cambia `enabled` de false→true. Default: true.
   */
  runOnMount?: boolean
}

export interface UsePollingResult {
  /** Número de ciclos de polling transcurridos desde el mount. */
  tick: number
  /** Segundos restantes hasta la próxima consulta (0..intervalMs/1000). */
  secondsToNext: number
  /** True mientras el fetcher está en ejecución. */
  isFetching: boolean
  /** Dispara una consulta inmediata y reinicia el contador. */
  refreshNow: () => void
}

export function usePolling({
  fetcher,
  intervalMs = 30_000,
  enabled = true,
  runOnMount = true,
}: UsePollingOptions): UsePollingResult {
  const [tick, setTick] = useState(0)
  const [secondsToNext, setSecondsToNext] = useState(Math.floor(intervalMs / 1000))
  const [isFetching, setIsFetching] = useState(false)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const runFetcher = useCallback(async () => {
    setIsFetching(true)
    try {
      await fetcherRef.current()
    } finally {
      setIsFetching(false)
    }
  }, [])

  // Tick inicial y cuando se re-activa el polling.
  useEffect(() => {
    if (!enabled) return
    if (runOnMount) {
      setTick((t) => t + 1)
    }
  }, [enabled])

  // Ejecutar fetcher cuando cambia `tick`.
  useEffect(() => {
    if (tick === 0) return // aún no ha empezado
    let cancelled = false
    ;(async () => {
      await runFetcher()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [tick, runFetcher])

  // Cuenta regresiva + disparo del siguiente tick.
  useEffect(() => {
    if (!enabled) return
    setSecondsToNext(Math.floor(intervalMs / 1000))

    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt
      const remainingMs = Math.max(0, intervalMs - elapsedMs)
      setSecondsToNext(Math.floor(remainingMs / 1000))
      if (remainingMs === 0) {
        window.clearInterval(intervalId)
        setTick((t) => t + 1)
      }
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, intervalMs, tick])

  const refreshNow = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  return { tick, secondsToNext, isFetching, refreshNow }
}
