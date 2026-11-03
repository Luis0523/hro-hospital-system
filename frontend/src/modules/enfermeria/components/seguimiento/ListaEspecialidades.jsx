import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'

function indicadoresPendientes(fila) {
  const etapas = new Set(
    fila.slots.map((slot) => slot.turno?.etapa).filter((etapa) => Boolean(etapa)),
  )
  return ETAPAS_SEGUIMIENTO.filter(
    (etapa) => (etapa.id === 'registrado' || etapa.id === 'devuelto') && etapas.has(etapa.id),
  )
}

// Columna izquierda con una especialidad por botón. Un toque solo selecciona;
// Enter conserva el atajo que ejecuta la acción de la etapa actual.
export default function ListaEspecialidades({ filas, especialidadActivaId, onActivar }) {
  function manejarTeclas(evento, fila) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      evento.stopPropagation()
      onActivar?.(fila.id, fila.codigo, { puntero: false })
      return
    }
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return

    evento.preventDefault()
    evento.stopPropagation()
    const botones = Array.from(
      evento.currentTarget
        .closest('[data-lista-especialidades]')
        ?.querySelectorAll('[data-especialidad-header="true"]') ?? [],
    )
    if (botones.length === 0) return
    const indice = botones.indexOf(evento.currentTarget)
    const delta = evento.key === 'ArrowDown' ? 1 : -1
    const siguiente = (indice + delta + botones.length) % botones.length
    const destino = botones[siguiente]
    destino?.focus()
    destino?.scrollIntoView?.({ block: 'nearest' })
  }

  return (
    <aside
      data-lista-especialidades="true"
      aria-label="Especialidades"
      className="flex min-h-0 flex-col border-r border-outline-variant bg-surface-container-lowest"
    >
      <div className="border-b border-outline-variant px-3 py-2">
        <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
          Especialidades
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain p-2">
        {filas.map((fila) => {
          const activa = String(especialidadActivaId) === String(fila.id)
          const pendientes = indicadoresPendientes(fila)
          return (
            <button
              key={fila.id}
              type="button"
              data-especialidad-header="true"
              data-especialidad-id={fila.id}
              data-nav-propia="true"
              aria-label={`${fila.nombre}. ${fila.registrados} de ${fila.maximo} registrados. Un toque registra el siguiente turno; doble toque lo registra como presentación.`}
              aria-pressed={activa}
              onClick={() => onActivar?.(fila.id, fila.codigo, { puntero: true })}
              onKeyDown={(evento) => manejarTeclas(evento, fila)}
              className={`flex min-h-14 w-full shrink-0 flex-col justify-center gap-0.5 rounded-lg border-2 px-2.5 py-1.5 text-left transition touch-manipulation select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue active:scale-[0.98] ${
                activa
                  ? 'border-primary bg-primary-container text-on-primary shadow-popover'
                  : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:bg-surface-container'
              }`}
            >
              <span className="line-clamp-2 text-title-sm font-bold leading-tight">
                {fila.nombre}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`text-label-md font-semibold tabular-nums ${
                    activa ? 'text-on-primary/90' : 'text-on-surface-variant'
                  }`}
                >
                  {fila.registrados}/{fila.maximo}
                </span>
                <span className="flex items-center gap-1" aria-hidden="true">
                  {pendientes.map((etapa) => (
                    <span
                      key={etapa.id}
                      title={etapa.nombre}
                      className={`h-2 w-2 rounded-full ${
                        etapa.id === 'registrado' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  ))}
                </span>
              </span>
            </button>
          )
        })}
        {filas.length === 0 && (
          <p className="p-3 text-body-sm text-on-surface-variant">
            Sin especialidades disponibles.
          </p>
        )}
      </div>
    </aside>
  )
}
