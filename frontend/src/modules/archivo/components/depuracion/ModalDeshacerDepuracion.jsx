import { Alert, Button, Icon, Modal } from '@/shared/components/ui'
import { formatearExpediente } from '@/shared/utils/expediente'

export default function ModalDeshacerDepuracion({
  abierto,
  depuracion,
  onConfirmar,
  onCerrar,
  deshaciendo = false,
  error = null,
}) {
  if (!depuracion) return null

  const paciente = String(depuracion.pacienteNombre ?? '').trim()

  function cerrar() {
    if (deshaciendo) return
    onCerrar?.()
  }

  return (
    <Modal
      open={abierto}
      onClose={cerrar}
      title="Deshacer última depuración"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={cerrar}
            disabled={deshaciendo}
            autoFocus
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onConfirmar}
            disabled={deshaciendo}
          >
            <Icon name="undo" className="text-[22px]" />
            {deshaciendo ? 'Revirtiendo…' : 'Confirmar reversión'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <dl className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <dt className="shrink-0 text-label-sm uppercase text-on-surface-variant">Expediente</dt>
            <dd className="min-w-0 break-words font-mono font-bold text-primary sm:text-right">
              {formatearExpediente(depuracion.numeroExpediente)}
            </dd>
          </div>
          {paciente && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <dt className="shrink-0 text-label-sm uppercase text-on-surface-variant">Paciente</dt>
              <dd className="min-w-0 break-words font-semibold text-on-surface sm:text-right">
                {paciente}
              </dd>
            </div>
          )}
        </dl>

        <Alert tone="warning" title="Reversión simulada">
          Se revertirá únicamente la última depuración simulada de esta sesión. No se modifica una
          depuración real del hospital ni los registros históricos iniciales.
        </Alert>

        {error && (
          <Alert tone="error" title="No se pudo deshacer la depuración">
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  )
}
