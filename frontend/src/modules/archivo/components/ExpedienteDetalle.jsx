import { Button, Modal } from '@/shared/components/ui'
import Icon from '@/shared/components/ui/Icon.jsx'
import ExpedienteStepper from './ExpedienteStepper.jsx'
import { metadatosEstado } from '../estadosExpediente'

function formatearFechaHora(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExpedienteDetalle({
  expediente,
  abierto,
  onCerrar,
  onAvanzar,
  onNoLocalizado,
  onCrear,
  procesando = false,
}) {
  if (!expediente) return null

  const esNuevo = Boolean(expediente.expedienteNuevo) || !expediente.numeroExpediente
  const meta = metadatosEstado(expediente.estado)
  const esExcepcion = !esNuevo && meta.excepcion
  const esTerminal = !esNuevo && expediente.estado === 'entregado'
  const puedeAvanzar = !esNuevo && !esExcepcion && !esTerminal

  return (
    <Modal open={abierto} onClose={onCerrar} title="Detalle del expediente">
      <div className="max-h-[80vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="text-title-md text-on-surface">{expediente.pacienteNombre}</p>
          <p className="text-body-sm text-on-surface-variant">
            {esNuevo
              ? 'Paciente nuevo · sin expediente físico'
              : `Expediente ${expediente.numeroExpediente}`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1 text-body-sm text-on-surface-variant">
          <p className="flex items-center gap-1.5">
            <Icon name="local_hospital" className="text-[16px] text-primary" />
            {expediente.clinicaNombre}
          </p>
          <p className="flex items-center gap-1.5">
            <Icon name="stethoscope" className="text-[16px] text-primary" />
            {expediente.medicoNombre}
          </p>
          <p className="flex items-center gap-1.5">
            <Icon name="schedule" className="text-[16px] text-primary" />
            {expediente.fechaCita} · {expediente.horaEstimada?.slice(0, 5)}
          </p>
          {expediente.ubicacion && (
            <p className="flex items-center gap-1.5">
              <Icon name="shelves" className="text-[16px] text-primary" />
              {expediente.ubicacion}
            </p>
          )}
        </div>

        {!esNuevo && (
          <>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                Trazabilidad
              </p>
              <ExpedienteStepper estado={expediente.estado} />
            </div>

            <div>
              <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                Historial de movimientos
              </p>
              {expediente.historial.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Sin movimientos registrados.</p>
              ) : (
                <ol className="space-y-2">
                  {expediente.historial.map((evento) => {
                    const metaEvento = metadatosEstado(evento.estado)
                    return (
                      <li key={evento.id} className="flex gap-2">
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${metaEvento.punto}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-on-surface">
                            {metaEvento.etiqueta}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {formatearFechaHora(evento.fechaHora)} · {evento.usuario}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </>
        )}

        {esExcepcion && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700"
          >
            Expediente marcado como no localizado. Requiere búsqueda por otro medio o preparar un
            expediente provisional.
          </div>
        )}

        {esTerminal && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-body-sm text-emerald-800">
            Expediente entregado en la clínica; no hay más acciones en esta fase.
          </div>
        )}

        {esNuevo ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-body-sm text-amber-900">
              <p className="font-semibold">Expediente nuevo</p>
              <p className="mt-1">Este paciente todavía no cuenta con expediente físico.</p>
              <p className="mt-1">
                Debe prepararse el expediente antes de iniciar su trazabilidad.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" disabled={procesando} onClick={onCrear}>
                <Icon name="create_new_folder" className="text-[20px]" />
                Crear expediente físico
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={onCerrar}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            {puedeAvanzar && (
              <Button size="lg" className="w-full" disabled={procesando} onClick={onAvanzar}>
                <Icon name="arrow_forward" className="text-[20px]" />
                Avanzar al siguiente estado
              </Button>
            )}
            {!esExcepcion && !esTerminal && (
              <Button
                variant="danger"
                size="lg"
                className="w-full"
                disabled={procesando}
                onClick={onNoLocalizado}
              >
                <Icon name="report" className="text-[20px]" />
                Marcar no localizado
              </Button>
            )}
            <Button variant="secondary" size="lg" className="w-full" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
