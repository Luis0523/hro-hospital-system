import { useEffect, useRef } from 'react'

// Intervalo por defecto del refresco automático (near-real-time por polling).
export const INTERVALO_REFRESCO_MS = 30000

// Programación del refresco automático. Responsabilidad única: disparar
// `refrescar` cada `intervaloMs` mientras la pestaña esté visible y no esté
// `pausado`. No conoce la API ni el lote.
//
// Usa `setTimeout` auto-reprogramado tras cada ciclo (en lugar de un
// `setInterval` fijo): así un ciclo nunca se solapa con el anterior.
export function useRefrescoAutomaticoCoex({
  refrescar,
  pausado = false,
  intervaloMs = INTERVALO_REFRESCO_MS,
} = {}) {
  const refrescarRef = useRef(refrescar)

  useEffect(() => {
    refrescarRef.current = refrescar
  }, [refrescar])

  useEffect(() => {
    let cancelado = false
    let timer = null

    const limpiar = () => {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
    }

    const visible = () => !document.hidden

    // Disparo sin bloquear el ciclo (p. ej. al volver a visible).
    const disparar = () => {
      try {
        const resultado = refrescarRef.current?.()
        if (resultado && typeof resultado.catch === 'function') resultado.catch(() => {})
      } catch {
        /* el refresco no debe romper el temporizador */
      }
    }

    const programar = () => {
      limpiar()
      if (cancelado || pausado) return
      timer = setTimeout(async () => {
        timer = null
        if (cancelado || pausado) return
        try {
          await refrescarRef.current?.()
        } finally {
          if (!cancelado && !pausado) programar()
        }
      }, intervaloMs)
    }

    const alCambiarVisibilidad = () => {
      if (cancelado || pausado) return
      if (visible()) {
        disparar()
        programar()
      } else {
        limpiar()
      }
    }

    if (!pausado && visible()) programar()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      cancelado = true
      limpiar()
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [pausado, intervaloMs])
}
