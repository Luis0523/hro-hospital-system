import SeccionTurnos from './SeccionTurnos.jsx'

export function dividirEnDos(asignaciones = []) {
  const mitad = Math.ceil(asignaciones.length / 2)
  return [asignaciones.slice(0, mitad), asignaciones.slice(mitad)]
}

export default function TablaTurnos({ asignaciones = [] }) {
  const [izquierda, derecha] = dividirEnDos(asignaciones)
  const hayDerecha = derecha.length > 0

  return (
    <div data-testid="tablero-tabla" className="flex-1 overflow-y-auto">
      <div className={`grid gap-6 ${hayDerecha ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <SeccionTurnos asignaciones={izquierda} etiqueta="Turnos, sección 1" />
        {hayDerecha && <SeccionTurnos asignaciones={derecha} etiqueta="Turnos, sección 2" />}
      </div>
    </div>
  )
}
