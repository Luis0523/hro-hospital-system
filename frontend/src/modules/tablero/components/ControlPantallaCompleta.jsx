import { useCallback, useEffect, useState } from 'react'
import Icon from '@/shared/components/ui/Icon.jsx'

export function soportaPantallaCompleta(entorno = globalThis) {
  const documento = entorno?.document
  return Boolean(documento?.documentElement?.requestFullscreen && documento?.exitFullscreen)
}

export default function ControlPantallaCompleta({ entorno = globalThis }) {
  const [disponible] = useState(() => soportaPantallaCompleta(entorno))
  const [activo, setActivo] = useState(() => Boolean(entorno?.document?.fullscreenElement))

  useEffect(() => {
    if (!disponible) return undefined

    const documento = entorno.document
    const manejarCambio = () => setActivo(Boolean(documento.fullscreenElement))

    documento.addEventListener('fullscreenchange', manejarCambio)
    return () => documento.removeEventListener('fullscreenchange', manejarCambio)
  }, [disponible, entorno])

  const alternar = useCallback(async () => {
    const documento = entorno?.document
    if (!documento) return

    try {
      if (documento.fullscreenElement) {
        await documento.exitFullscreen()
      } else {
        await documento.documentElement.requestFullscreen()
      }
    } catch {
      // El navegador puede rechazar la solicitud: el tablero sigue funcionando.
    }
  }, [entorno])

  if (!disponible) {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-2 rounded-full bg-on-primary/10 px-3 py-1 text-label-md text-on-primary/60"
      >
        <Icon name="fullscreen" className="text-[18px]" />
        Pantalla completa no disponible
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={activo}
      className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/25 focus:outline-none focus:ring-2 focus:ring-on-primary/60"
    >
      <Icon name={activo ? 'fullscreen_exit' : 'fullscreen'} className="text-[18px]" />
      {activo ? 'Salir de pantalla completa' : 'Pantalla completa'}
    </button>
  )
}
