import EmptyState from '@/shared/components/ui/EmptyState.jsx'

/**
 * Demanda por especialidad: tabla en escritorio y tarjetas en móvil.
 * Se respeta el orden devuelto por el backend (sin ranking).
 */
export default function ReporteDemandaEspecialidad({ items = [] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin datos"
        description="No hay demanda registrada en el rango seleccionado."
      />
    )
  }

  return (
    <div>
      <div data-testid="demanda-escritorio" className="hidden xl:block">
        <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
          <table className="min-w-full divide-y divide-outline-variant/60 text-sm">
            <caption className="sr-only">Demanda por especialidad</caption>
            <thead className="bg-surface-container-low">
              <tr>
                {['Especialidad', 'Total citas', 'Atendidas', 'Inasistencias'].map((titulo) => (
                  <th
                    key={titulo}
                    scope="col"
                    className="px-4 py-2 text-left text-label-sm uppercase tracking-wider text-outline"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
              {items.map((item) => (
                <tr key={item.especialidadId ?? item.especialidadNombre}>
                  <td className="px-4 py-2 font-medium text-on-surface">{item.especialidadNombre}</td>
                  <td className="px-4 py-2 text-on-surface">{item.totalCitas}</td>
                  <td className="px-4 py-2 text-on-surface">{item.atendidas}</td>
                  <td className="px-4 py-2 text-on-surface">{item.inasistencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div data-testid="demanda-movil" className="space-y-3 xl:hidden">
        {items.map((item) => (
          <div
            key={item.especialidadId ?? item.especialidadNombre}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-on-surface">{item.especialidadNombre}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Total</dt>
                <dd className="text-sm font-semibold text-on-surface">{item.totalCitas}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Atendidas</dt>
                <dd className="text-sm font-semibold text-on-surface">{item.atendidas}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Inasistencias</dt>
                <dd className="text-sm font-semibold text-on-surface">{item.inasistencias}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
