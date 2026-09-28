import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import { horaCorta } from '../utils/dias.js'
import { formatearFechaLarga } from '../utils/fechas.js'

/**
 * Muestra las citas activas devueltas por el backend (409 DIA_NO_LABORABLE_CON_CITAS)
 * y pide confirmación explícita antes de reintentar con `forzar=true`.
 * No reprograma nada: al forzar, el día se bloquea y las citas quedan pendientes.
 */
export default function ModalConflictoCitas({
  abierto,
  conflicto,
  onCancelar,
  onConfirmar,
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
            {procesando ? 'Procesando...' : 'Confirmar día no laborable'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p>
          La fecha <strong>{formatearFechaLarga(conflicto?.fecha)}</strong> tiene{' '}
          <strong>{total}</strong> cita(s) activa(s). Si confirmas, el día se marcará como no
          laborable.
        </p>
        <p className="text-amber-800">
          Las citas existentes <strong>no se reprogramarán automáticamente</strong> y quedarán
          pendientes de gestión manual.
        </p>

        {citas.length > 0 && (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {citas.map((cita) => (
              <li
                key={cita.id}
                className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"
              >
                <p className="text-sm font-semibold text-on-surface">
                  {horaCorta(cita.horaEstimada)} — {cita.pacienteNombre}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {cita.medicoNombre} · {cita.subespecialidadNombre}
                </p>
                <p className="text-xs uppercase tracking-wide text-outline">{cita.estado}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
