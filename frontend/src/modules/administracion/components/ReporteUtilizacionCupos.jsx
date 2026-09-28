import EmptyState from '@/shared/components/ui/EmptyState.jsx'

/**
 * Utilización de cupos por subespecialidad. Cada fila usa DIRECTAMENTE el DTO del
 * backend (capacidadTotal, cuposOcupados, cuposDisponibles, utilizacionPorcentaje):
 * no se recalcula ni se suma. La fila TOTAL GENERAL usa el GET global del backend.
 * Una subespecialidad que no pudo cargarse se identifica como tal (nunca se muestra 0).
 */
function Valor({ valor }) {
  if (valor === null || valor === undefined) {
    return <span className="text-outline">—</span>
  }
  return <span>{valor}</span>
}

function FilaDato({ dato, campo }) {
  if (!dato) return <Valor valor={null} />
  return <Valor valor={dato[campo]} />
}

function Porcentaje({ dato }) {
  if (!dato) return <Valor valor={null} />
  return <span>{`${dato.utilizacionPorcentaje}%`}</span>
}

export default function ReporteUtilizacionCupos({ filas = [], total = null }) {
  if (filas.length === 0) {
    return (
      <EmptyState
        title="Sin datos"
        description="No hay subespecialidades activas para consultar en el rango seleccionado."
      />
    )
  }

  return (
    <div>
      <div data-testid="utilizacion-escritorio" className="hidden xl:block">
        <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
          <table className="min-w-full divide-y divide-outline-variant/60 text-sm">
            <caption className="sr-only">Utilización de cupos por subespecialidad</caption>
            <thead className="bg-surface-container-low">
              <tr>
                {['Subespecialidad', 'Capacidad total', 'Ocupados', 'Disponibles', 'Utilización'].map(
                  (titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="px-4 py-2 text-left text-label-sm uppercase tracking-wider text-outline"
                    >
                      {titulo}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
              {filas.map((fila) => (
                <tr key={fila.subespecialidadId}>
                  <td className="px-4 py-2 font-medium text-on-surface">{fila.nombre}</td>
                  {fila.error ? (
                    <td colSpan={4} className="px-4 py-2 text-sm text-error">
                      No se pudo cargar
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-on-surface">
                        <FilaDato dato={fila.dato} campo="capacidadTotal" />
                      </td>
                      <td className="px-4 py-2 text-on-surface">
                        <FilaDato dato={fila.dato} campo="cuposOcupados" />
                      </td>
                      <td className="px-4 py-2 text-on-surface">
                        <FilaDato dato={fila.dato} campo="cuposDisponibles" />
                      </td>
                      <td className="px-4 py-2 text-on-surface">
                        <Porcentaje dato={fila.dato} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot data-testid="utilizacion-total" className="bg-surface-container-low">
              <tr>
                <td className="px-4 py-2 font-semibold text-on-surface">TOTAL GENERAL</td>
                <td className="px-4 py-2 font-semibold text-on-surface">
                  <FilaDato dato={total} campo="capacidadTotal" />
                </td>
                <td className="px-4 py-2 font-semibold text-on-surface">
                  <FilaDato dato={total} campo="cuposOcupados" />
                </td>
                <td className="px-4 py-2 font-semibold text-on-surface">
                  <FilaDato dato={total} campo="cuposDisponibles" />
                </td>
                <td className="px-4 py-2 font-semibold text-on-surface">
                  <Porcentaje dato={total} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div data-testid="utilizacion-movil" className="space-y-3 xl:hidden">
        {filas.map((fila) => (
          <div
            key={fila.subespecialidadId}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-on-surface">{fila.nombre}</p>
            {fila.error ? (
              <p className="mt-2 text-sm text-error">No se pudo cargar</p>
            ) : (
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-outline">Capacidad</dt>
                  <dd className="text-sm font-semibold text-on-surface">
                    <FilaDato dato={fila.dato} campo="capacidadTotal" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-outline">Ocupados</dt>
                  <dd className="text-sm font-semibold text-on-surface">
                    <FilaDato dato={fila.dato} campo="cuposOcupados" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-outline">Disponibles</dt>
                  <dd className="text-sm font-semibold text-on-surface">
                    <FilaDato dato={fila.dato} campo="cuposDisponibles" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-outline">Utilización</dt>
                  <dd className="text-sm font-semibold text-on-surface">
                    <Porcentaje dato={fila.dato} />
                  </dd>
                </div>
              </dl>
            )}
          </div>
        ))}

        <div
          data-testid="utilizacion-total-movil"
          className="rounded-lg border border-primary/40 bg-surface-container-low p-4"
        >
          <p className="text-sm font-semibold text-primary">TOTAL GENERAL</p>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-outline">Capacidad</dt>
              <dd className="text-sm font-semibold text-on-surface">
                <FilaDato dato={total} campo="capacidadTotal" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-outline">Ocupados</dt>
              <dd className="text-sm font-semibold text-on-surface">
                <FilaDato dato={total} campo="cuposOcupados" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-outline">Disponibles</dt>
              <dd className="text-sm font-semibold text-on-surface">
                <FilaDato dato={total} campo="cuposDisponibles" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-outline">Utilización</dt>
              <dd className="text-sm font-semibold text-on-surface">
                <Porcentaje dato={total} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
