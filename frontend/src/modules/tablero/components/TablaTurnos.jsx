import SeccionTurnos from './SeccionTurnos.jsx'
import SeccionUltimosLlamados from './SeccionUltimosLlamados.jsx'

export function dividirEnDos(asignaciones = []) {
  const mitad = Math.ceil(asignaciones.length / 2)
  return [asignaciones.slice(0, mitad), asignaciones.slice(mitad)]
}

export default function TablaTurnos({ asignaciones = [], ultimosLlamados = [] }) {
  const [izquierda, derecha] = dividirEnDos(asignaciones)
  const hayRecientes = ultimosLlamados.length > 0
  const hayDerecha = derecha.length > 0

  return (
    <div data-testid="tablero-tabla" className="flex-1 overflow-y-auto">
      <div
        className={`grid gap-6 ${
          hayRecientes || hayDerecha ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
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
