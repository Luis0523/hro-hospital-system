// Día operativo del hospital (America/Guatemala).
//
// Mantiene la fecha vigente y la refresca cuando el día cambia, sin exigir
// recargar la página: comprobación periódica + eventos de foco/visibilidad.
// No borra ni reinicia datos: solo indica qué fecha es "hoy".

import { useCallback, useEffect, useRef, useState } from 'react'
import { fechaGuatemalaDe } from '../utils/fechaGuatemala'

const INTERVALO_POR_DEFECTO_MS = 30 * 1000

export function useDiaOperativo({ intervaloMs = INTERVALO_POR_DEFECTO_MS } = {}) {
  const leerFecha = useCallback(() => fechaGuatemalaDe(new Date()), [])
  const [hoy, setHoy] = useState(leerFecha)
  const hoyRef = useRef(hoy)

  const sincronizar = useCallback(() => {
    const fecha = leerFecha()
    // No se actualiza el estado si el día no cambió: evita renders inútiles.
    if (!fecha || fecha === hoyRef.current) return

    hoyRef.current = fecha
    setHoy(fecha)
  }, [leerFecha])

  useEffect(() => {
    const intervalo = setInterval(sincronizar, intervaloMs)
    const alEnfocar = () => sincronizar()
    const alCambiarVisibilidad = () => {
      if (!document.hidden) sincronizar()
    }
    const alMostrar = () => sincronizar()

    window.addEventListener('focus', alEnfocar)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    window.addEventListener('pageshow', alMostrar)

    // Cobre el caso de montar la pantalla después de una suspensión larga.
    sincronizar()

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('focus', alEnfocar)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      window.removeEventListener('pageshow', alMostrar)
    }
  }, [sincronizar, intervaloMs])

  return { hoy, sincronizar }
}
