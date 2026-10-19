import { useEffect, useState } from 'react'
import SeccionTurnos from './SeccionTurnos.jsx'
import SeccionUltimosLlamados from './SeccionUltimosLlamados.jsx'
import { ListaTurnosMovil } from './TarjetaTurnoMovil.jsx'

export function dividirEnDos(asignaciones = []) {
  const mitad = Math.ceil(asignaciones.length / 2)
  return [asignaciones.slice(0, mitad), asignaciones.slice(mitad)]
}

function useAnchoViewport() {
  const [ancho, setAncho] = useState(() => {
    if (typeof window === 'undefined') return 1920
    const valor = Number(window.innerWidth)
    return Number.isFinite(valor) && valor > 0 ? valor : 1920
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const actualizar = () => setAncho(window.innerWidth)
    window.addEventListener('resize', actualizar)
    return () => window.removeEventListener('resize', actualizar)
  }, [])

  return ancho
}

export default function TablaTurnos({ asignaciones = [], ultimosLlamados = [] }) {
  const ancho = useAnchoViewport()
  const esMovil = ancho < 768
  const esTablet = ancho >= 768 && ancho < 1024
  const hayRecientes = ultimosLlamados.length > 0
  const [izquierda, derecha] = dividirEnDos(asignaciones)
  const hayDerecha = derecha.length > 0

  if (esMovil) {
    return (
      <div data-testid="tablero-tabla" className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <ListaTurnosMovil asignaciones={asignaciones} />
          {hayRecientes && <SeccionUltimosLlamados ultimosLlamados={ultimosLlamados} />}
        </div>
      </div>
    )
  }

  if (esTablet) {
    return (
      <div data-testid="tablero-tabla" className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <SeccionTurnos asignaciones={asignaciones} etiqueta="Turnos" anchoCompleto />
          {hayRecientes && <SeccionUltimosLlamados ultimosLlamados={ultimosLlamados} />}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="tablero-tabla" className="flex-1 overflow-y-auto">
      <div
        className={`grid gap-6 ${
          hayRecientes || hayDerecha ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        <SeccionTurnos asignaciones={izquierda} etiqueta="Turnos, sección 1" />
        {hayRecientes ? (
          <SeccionUltimosLlamados ultimosLlamados={ultimosLlamados} />
        ) : (
          hayDerecha && <SeccionTurnos asignaciones={derecha} etiqueta="Turnos, sección 2" />
        )}
      </div>
    </div>
  )
}
