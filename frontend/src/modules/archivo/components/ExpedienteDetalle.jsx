import { Button, Modal, Spinner } from '@/shared/components/ui'
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

// Detalle compacto del ciclo de un expediente: estado actual, datos de la fila
// y, si el backend ya los devolvió, los movimientos (checkpoints). Las acciones
// se ejecutan desde la fila de la jornada, no desde aquí.
export default function ExpedienteDetalle({
  fila,
  ciclo,
  cargandoDatos = false,
  abierto,
  onCerrar,
}) {
  if (!fila) return null

  const estado = fila.estadoActual ?? fila.estado
  const meta = metadatosEstado(estado)
  const movimientos = ciclo?.movimientos ?? []

  return (
    <Modal open={abierto} onClose={onCerrar} title="Detalle del expediente">
      <div className="max-h-[80vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="text-title-md text-on-surface">{fila.pacienteNombre}</p>
          <p className="text-body-sm text-on-surface-variant">
            {fila.numeroExpediente
              ? `Expediente ${fila.numeroExpediente}`
              : 'Sin número de expediente'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-label-md font-semibold ${meta.color}`}
          >
            <Icon name={meta.icono} className="text-[16px]" />
            {meta.etiqueta}
          </span>
          {fila.cicloId && (
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
              ciclo {fila.cicloId}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-1 text-body-sm text-on-surface-variant">
          {fila.subespecialidadNombre && (
            <p className="flex items-center gap-1.5">
              <Icon name="local_hospital" className="text-[16px] text-primary" />
              {fila.subespecialidadNombre}
            </p>
          )}
          {fila.horaEstimada && (
            <p className="flex items-center gap-1.5">
              <Icon name="schedule" className="text-[16px] text-primary" />
              {fila.horaEstimada.slice(0, 5)}
            </p>
          )}
          {fila.ubicacion && (
            <p className="flex items-center gap-1.5">
              <Icon name="shelves" className="text-[16px] text-primary" />
              {fila.ubicacion}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Trazabilidad
          </p>
          <ExpedienteStepper estado={estado} />
        </div>

        <div>
          <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Movimientos
          </p>
          {cargandoDatos ? (
            <Spinner label="Cargando movimientos..." />
          ) : movimientos.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              {fila.cicloId ? 'Sin movimientos registrados.' : 'No hay movimientos para mostrar.'}
            </p>
          ) : (
            <ol className="space-y-2">
              {movimientos.map((movimiento) => {
                const metaEvento = metadatosEstado(movimiento.estadoNuevo)
                return (
                  <li key={movimiento.id} className="flex gap-2">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${metaEvento.punto}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-on-surface">
                        {metaEvento.etiqueta}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {formatearFechaHora(movimiento.fechaMovimiento)}
                        {movimiento.usuarioNombre ? ` · ${movimiento.usuarioNombre}` : ''}
                      </p>
                      {movimiento.observacion && (
                        <p className="text-label-sm text-on-surface-variant">
                          {movimiento.observacion}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
