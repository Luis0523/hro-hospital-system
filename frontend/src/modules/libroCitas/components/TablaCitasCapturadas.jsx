import { EmptyState, Icon } from '@/shared/components/ui'

/**
 * Tabla acumulada de citas capturadas. Muestra solo los datos mínimos
 * necesarios para la captura (expediente, nombre, fecha, especialidad); nunca
 * `pacienteId` ni `idLocal`.
 */
export default function TablaCitasCapturadas({ filas = [], onEliminar }) {
  if (filas.length === 0) {
    return (
      <EmptyState
        title="No hay citas agregadas."
        description="Agregue citas con el formulario de captura."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">Citas capturadas</caption>
        <thead>
          <tr className="border-b border-outline-variant text-on-surface-variant">
            <th scope="col" className="px-3 py-2 font-medium">
              Número de expediente
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Nombre del paciente
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Fecha
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Especialidad
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.idLocal}
              data-testid={`fila-cita-${fila.idLocal}`}
              className="border-b border-outline-variant/60"
            >
              <td className="px-3 py-2 tabular-nums text-on-surface">{fila.numeroExpediente}</td>
              <td className="px-3 py-2 text-on-surface">{fila.nombrePaciente}</td>
              <td className="px-3 py-2 tabular-nums text-on-surface-variant">{fila.fecha}</td>
              <td className="px-3 py-2 text-on-surface-variant">{fila.especialidadNombre}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEliminar(fila.idLocal)}
                  aria-label={`Eliminar expediente ${fila.numeroExpediente}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
                >
                  <Icon name="delete" className="text-[18px]" />
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
