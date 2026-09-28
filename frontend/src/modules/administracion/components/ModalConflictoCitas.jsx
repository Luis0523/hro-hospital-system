import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import { horaCorta } from '../utils/dias.js'
import { formatearFechaLarga } from '../utils/fechas.js'

/**
 * Muestra las citas activas devueltas por el backend (409 DIA_NO_LABORABLE_CON_CITAS)
 * y pide confirmación explícita antes de reintentar con `forzar=true`.
 * No reprograma nada por sí solo: ofrece "Reprogramar" por cita (flujo manual) y,
 * al forzar, el día se bloquea y las citas restantes quedan pendientes.
 */
export default function ModalConflictoCitas({
  abierto,
  conflicto,
  onCancelar,
  onConfirmar,
  onReprogramar,
  procesando = false,
}) {
  const citas = conflicto?.citas ?? []
  const total = conflicto?.totalCitas ?? citas.length

  return (
    <Modal
      open={abierto}
      onClose={onCancelar}
      title="Citas afectadas por el bloqueo"
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirmar} disabled={procesando}>
            {procesando
              ? 'Procesando...'
              : citas.length > 0
                ? 'Confirmar día no laborable'
                : 'Registrar día no laborable'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {citas.length === 0 ? (
          <p className="text-emerald-800">
            Ya no quedan citas pendientes de gestionar para esta fecha. Puedes registrar el día no
            laborable.
          </p>
        ) : (
          <>
            <p>
              La fecha <strong>{formatearFechaLarga(conflicto?.fecha)}</strong> tiene{' '}
              <strong>{total}</strong> cita(s) activa(s). Si confirmas, el día se marcará como no
              laborable.
            </p>
            <p className="text-amber-800">
              Las citas existentes <strong>no se reprogramarán automáticamente</strong> y quedarán
              pendientes de gestión manual.
            </p>

            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {citas.map((cita) => (
                <li
                  key={cita.id}
                  className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">
                        {horaCorta(cita.horaEstimada)} — {cita.pacienteNombre}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {cita.medicoNombre} · {cita.subespecialidadNombre}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-outline">{cita.estado}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onReprogramar?.(cita)}
                      disabled={procesando}
                      aria-label={`Reprogramar la cita de ${cita.pacienteNombre}`}
                    >
                      Reprogramar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}
