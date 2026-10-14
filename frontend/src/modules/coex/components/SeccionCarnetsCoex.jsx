import { Button, EmptyState, Icon } from '@/shared/components/ui'
import { codigoCarnet } from '@/modules/carnets/utils/codigoCarnet'
import { formatearExpediente } from '@/shared/utils/expediente'
import { useCarnetsCoex } from '../hooks/useCarnetsCoex'

// Flujo de carnets en Mesa COEX: los expedientes con salida de archivo se
// listan aquí y se marca su salida de enfermería (devolución a archivo).
export default function SeccionCarnetsCoex({ fecha, estacionId, recargaKey }) {
  const { cargando, enProceso, porSalida, salidaEnfermeria, salidaEnfermeriaTodos } =
    useCarnetsCoex({ fecha, estacionId, recargaKey })

  if (cargando) {
    return null
  }

  const procesandoTodos = enProceso === '__todos__'

  return (
    <section
      aria-label="Expedientes en enfermería"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-title-md text-on-surface">Expedientes en enfermería</h2>
          <p className="break-words text-body-sm text-on-surface-variant">
            Expedientes con salida de archivo registrada. Marque su salida de enfermería al
            devolverlos a archivo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-lg bg-surface-container px-3 py-1 text-label-md font-bold text-on-surface">
            {porSalida.length}
          </span>
          {porSalida.length > 0 && (
            <Button size="sm" onClick={salidaEnfermeriaTodos} disabled={procesandoTodos}>
              <Icon name="logout" className="text-[18px]" />
              {procesandoTodos ? 'Procesando…' : 'Salida de todos'}
            </Button>
          )}
        </div>
      </div>

      {porSalida.length === 0 ? (
        <EmptyState title="Sin expedientes con salida de archivo" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Correlativo</th>
                <th className="px-3 py-2">Expediente</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Especialidad</th>
                <th className="px-3 py-2 text-right">Salida de enfermería</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {porSalida.map((carnet) => (
                <tr key={carnet.id} className="bg-surface-container-lowest">
                  <td className="px-3 py-3">
                    <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-primary px-3 py-1 font-mono text-[26px] font-black leading-none text-on-primary">
                      {codigoCarnet(carnet)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[28px] font-black tracking-tight text-primary">
                    {formatearExpediente(carnet.numeroExpediente)}
                  </td>
                  <td className="px-3 py-3 text-title-sm font-semibold text-on-surface">
                    {carnet.pacienteNombre}
                  </td>
                  <td className="px-3 py-3 text-on-surface-variant">{carnet.especialidadNombre}</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => salidaEnfermeria(carnet)}
                      disabled={procesandoTodos || enProceso === carnet.id}
                    >
                      <Icon name="logout" className="text-[18px]" />
                      Marcar salida
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
