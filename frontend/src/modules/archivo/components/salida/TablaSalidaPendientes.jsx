import { Button, Icon } from '@/shared/components/ui'
import { ETIQUETAS_ESTADO_CARNET } from '@/modules/carnets/api/carnetsApi'
import { formatearExpediente } from '@/shared/utils/expediente'

// Lista de expedientes aún sin salida (registrados desde enfermería). La
// marcación principal es por Enter; aquí queda la referencia visual del trabajo
// pendiente con un botón como alternativa de ratón.
export default function TablaSalidaPendientes({ pendientes, onMarcar }) {
  return (
    <section
      aria-label="Expedientes pendientes de salida"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <h2 className="mb-2 flex items-center gap-1 text-title-md font-bold text-on-surface">
        <Icon name="pending_actions" className="text-[20px] text-primary" />
        Pendientes de salida ({pendientes.length})
      </h2>

      {pendientes.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          No hay expedientes pendientes para la fecha.
        </p>
      ) : (
        <div className="max-h-[42vh] overflow-y-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="sticky top-0 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Expediente</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Especialidad</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {pendientes.map((carnet) => (
                <tr key={carnet.id} className="bg-surface-container-lowest">
                  <td className="px-3 py-2">
                    <span className="font-mono text-title-md font-bold text-primary">
                      {formatearExpediente(carnet.numeroExpediente)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-on-surface">
                    {carnet.pacienteNombre}
                  </td>
                  <td className="px-3 py-2 text-on-surface-variant">{carnet.especialidadNombre}</td>
                  <td className="px-3 py-2">
                    <span className="text-label-sm text-on-surface-variant">
                      {ETIQUETAS_ESTADO_CARNET[carnet.estado] ?? carnet.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="secondary" onClick={() => onMarcar(carnet)}>
                      <Icon name="logout" className="text-[18px]" />
                      Salida
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
