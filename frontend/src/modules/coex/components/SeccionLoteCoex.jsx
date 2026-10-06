import { useEffect, useRef } from 'react'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import FilaExpedienteCoex from './FilaExpedienteCoex.jsx'

// Checkbox maestro con soporte para estado indeterminado (selección parcial).
// El indeterminado es una propiedad imperativa del DOM, de ahí el ref.
function CheckboxMaestro({ marcado, indeterminado, onChange, etiqueta }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminado
  }, [indeterminado])

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-5 w-5 cursor-pointer rounded accent-hro-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
      checked={marcado}
      onChange={onChange}
      aria-label={etiqueta}
    />
  )
}

// Sección del lote. Por defecto es de solo lectura; cuando `mostrarSeleccion`
// está activo habilita el checklist (maestro + por fila). Los slots `acciones`
// y `alerta` permiten a la página inyectar la barra de recepción y el resumen de
// fallos sin acoplar el módulo.
export default function SeccionLoteCoex({
  titulo,
  descripcion,
  filas = [],
  vacio,
  mostrarSeleccion = false,
  todasSeleccionadas = false,
  seleccionParcial = false,
  onToggleTodas,
  estaSeleccionada,
  onToggleFila,
  etiquetaSeleccionarTodo = 'Seleccionar todos los expedientes pendientes de recibir',
  acciones,
  alerta,
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-title-md text-on-surface">{titulo}</h2>
          {descripcion && <p className="break-words text-body-sm text-on-surface-variant">{descripcion}</p>}
        </div>
        <span className="shrink-0 rounded-lg bg-surface-container px-3 py-1 text-label-md font-bold text-on-surface">
          {filas.length}
        </span>
      </div>

      {mostrarSeleccion && filas.length > 0 && (
        <div className="mb-3 flex flex-col gap-3 border-b border-outline-variant pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-body-sm text-on-surface">
            <CheckboxMaestro
              marcado={todasSeleccionadas}
              indeterminado={seleccionParcial}
              onChange={onToggleTodas}
              etiqueta={etiquetaSeleccionarTodo}
            />
            Seleccionar todo
          </label>
          {acciones}
        </div>
      )}

      {alerta && <div className="mb-3">{alerta}</div>}

      {filas.length === 0 ? (
        <EmptyState title={vacio?.title} description={vacio?.description} />
      ) : (
        <ul className="flex flex-col gap-2">
          {filas.map((fila) => (
            <FilaExpedienteCoex
              key={fila.cicloId ?? fila.citaId}
              fila={fila}
              seleccionable={mostrarSeleccion}
              seleccionada={mostrarSeleccion ? !!estaSeleccionada?.(fila.cicloId) : false}
              onToggle={onToggleFila}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
