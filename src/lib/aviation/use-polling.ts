'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook de polling para refrescar datos de aviación (METAR/TAF/NOTAM).
 *
 * API:
 *   const { secondsToNext, isFetching, refreshNow, autoOn, setAutoOn } =
 *     usePolling(fetchDetail, 30)
 *
 * - `fetcher`: función asíncrona que se ejecuta en cada tick.
 * - `intervalSeconds`: intervalo entre consultas, en segundos. Default: 30.
 * - `autoOn` / `setAutoOn`: estado del auto-refresh (toggle desde la UI).
 *   Cuando `autoOn` es false, el polling se pausa.
 * - `secondsToNext`: cuenta regresiva hasta la próxima consulta (0..N).
 * - `isFetching`: true mientras el fetcher está en vuelo.
 * - `refreshNow()`: dispara una consulta inmediata y reinicia el contador.
 *
 * Implementación: un único intervalo de 1s que decrementa la cuenta
 * regresiva; cuando llega a 0, ejecuta el fetcher y reinicia la cuenta.
 * Esto evita tener múltiples timers y race conditions.
 */
export function usePolling(
  fetcher: () => void | Promise<void>,
  intervalSeconds = 30,
) {
  const [autoOn, setAutoOn] = useState(true)
  const [secondsToNext, setSecondsToNext] = useState(intervalSeconds)
  const [isFetching, setIsFetching] = useState(false)

  // Ref siempre fresco al fetcher para no reiniciar el timer en cada render.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Ref al estado autoOn para que el intervalo lo lea sin reiniciarse.
  const autoOnRef = useRef(autoOn)
  autoOnRef.current = autoOn

  const runFetcher = useCallback(async () => {
    setIsFetching(true)
    try {
      await fetcherRef.current?.()
    } finally {
      setIsFetching(false)
    }
  }, [])

  // Fetch inicial al montar.
  useEffect(() => {
    runFetcher()
  }, [runFetcher])

  // Único intervalo de 1s: decrementa la cuenta y dispara el fetcher al llegar a 0.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      // Si el auto-refresh está apagado, no hacer nada (pero seguir vivo
      // para reanudarse cuando se encienda).
      if (!autoOnRef.current) return

      setSecondsToNext((prev) => {
        if (prev <= 1) {
          // Llegó a 0: ejecutar fetcher y reiniciar la cuenta.
          runFetcher()
          return intervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [intervalSeconds, runFetcher])

  // Cuando se enciende el auto-refresh tras estar apagado, reiniciar la cuenta.
  useEffect(() => {
    if (autoOn) {
      setSecondsToNext(intervalSeconds)
    }
  }, [autoOn, intervalSeconds])

  const refreshNow = useCallback(() => {
    runFetcher()
    setSecondsToNext(intervalSeconds)
  }, [runFetcher, intervalSeconds])

  return { secondsToNext, isFetching, refreshNow, autoOn, setAutoOn }
}
