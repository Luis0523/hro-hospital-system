import { Button, EmptyState, Icon } from '@/shared/components/ui'
import { useCarnetsCoex } from '../hooks/useCarnetsCoex'

function TablaCarnets({
  titulo,
  descripcion,
  filas,
  accion,
  etiquetaAccion,
  icono,
  enProceso,
  onAccion,
  onTodos,
  etiquetaTodos,
  procesandoTodos,
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-title-md text-on-surface">{titulo}</h2>
          {descripcion && <p className="break-words text-body-sm text-on-surface-variant">{descripcion}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-lg bg-surface-container px-3 py-1 text-label-md font-bold text-on-surface">
            {filas.length}
          </span>
          {filas.length > 0 && onTodos && (
            <Button size="sm" onClick={onTodos} disabled={procesandoTodos}>
              <Icon name={icono} className="text-[18px]" />
              {procesandoTodos ? 'Procesando…' : etiquetaTodos}
            </Button>
          )}
        </div>
      </div>

      {filas.length === 0 ? (
        <EmptyState title={`Sin carnets ${etiquetaAccion.toLowerCase()}`} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Correlativo</th>
                <th className="px-3 py-2">Expediente</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Especialidad</th>
                <th className="px-3 py-2 text-right">{etiquetaAccion}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filas.map((carnet) => (
                <tr key={carnet.id} className="bg-surface-container-lowest">
                  <td className="px-3 py-3">
                    <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-primary px-3 py-1 font-mono text-[26px] font-black leading-none text-on-primary">
                      {carnet.correlativo}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[28px] font-black tracking-tight text-primary">
                    {carnet.numeroExpediente}
                  </td>
                  <td className="px-3 py-3 text-title-sm font-semibold text-on-surface">
                    {carnet.pacienteNombre}
                  </td>
                  <td className="px-3 py-3 text-on-surface-variant">{carnet.especialidadNombre}</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      size="sm"
                      variant={accion === 'recibir' ? 'primary' : 'secondary'}
                      onClick={() => onAccion(carnet)}
                      disabled={procesandoTodos || enProceso === carnet.id}
                    >
                      <Icon name={icono} className="text-[18px]" />
                      {etiquetaAccion}
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

// Flujo de carnets en Mesa COEX: recibir lo despachado y devolver lo recibido.
export default function SeccionCarnetsCoex({ fecha, estacionId }) {
  const {
    cargando,
    enProceso,
    porRecibir,
    enUso,
    recibir,
    devolver,
    recibirTodos,
    devolverTodos,
  } = useCarnetsCoex({ fecha, estacionId })

  if (cargando) {
    return null
  }

  const procesandoTodos = enProceso === '__todos__'

  return (
    <div className="flex flex-col gap-4">
      <TablaCarnets
        titulo="Carnets por recibir"
        descripcion="Expedientes despachados por Archivo, pendientes de recibir en la estación."
        filas={porRecibir}
        accion="recibir"
        etiquetaAccion="Recibir"
        icono="inbox"
        enProceso={enProceso}
        onAccion={recibir}
        onTodos={recibirTodos}
        etiquetaTodos="Recibir todos"
        procesandoTodos={procesandoTodos}
      />
      <TablaCarnets
        titulo="Carnets en uso"
        descripcion="Expedientes recibidos en la estación, listos para devolver a Archivo."
        filas={enUso}
        accion="devolver"
        etiquetaAccion="Devolver"
        icono="undo"
        enProceso={enProceso}
        onAccion={devolver}
        onTodos={devolverTodos}
        etiquetaTodos="Devolver todos"
        procesandoTodos={procesandoTodos}
      />
    </div>
  )
}
