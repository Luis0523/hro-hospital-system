import { formatearExpediente } from '@/shared/utils/expediente'
import { Alert, Button, Icon, Input, Modal } from '@/shared/components/ui'

// Confirmación explícita de la baja lógica. El POST solo se ejecuta al pulsar
// "Confirmar depuración"; cerrar o cancelar no modifica nada.
export default function ModalConfirmacionDepuracion({
  abierto,
  expediente,
  motivo,
  onMotivo,
  onConfirmar,
  onCerrar,
  procesando = false,
  error = null,
}) {
  if (!expediente) return null

  function cerrar() {
    if (procesando) return
    onCerrar?.()
  }

  return (
    <Modal
      open={abierto}
      onClose={cerrar}
      title="Confirmar depuración"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={cerrar}
            disabled={procesando}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onConfirmar}
            disabled={procesando}
          >
            <Icon name="delete_sweep" className="text-[22px]" />
            {procesando ? 'Depurando…' : 'Confirmar depuración'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <dl className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <dt className="shrink-0 text-label-sm uppercase text-on-surface-variant">Paciente</dt>
            <dd className="min-w-0 break-words font-semibold text-on-surface sm:text-right">
              {expediente.pacienteNombre || 'Paciente sin nombre'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <dt className="shrink-0 text-label-sm uppercase text-on-surface-variant">Expediente</dt>
            <dd className="min-w-0 break-words font-mono font-bold text-primary sm:text-right">
              {formatearExpediente(expediente.numeroExpediente)}
            </dd>
          </div>
        </dl>

        <Alert tone="warning" title="Baja lógica">
          Este expediente quedará marcado como <strong>no existente</strong> en el sistema. No se
          elimina físicamente; la baja es lógica y queda registrada en la bitácora.
        </Alert>

        <Input
          label="Motivo (opcional)"
          name="motivo-depuracion"
          value={motivo}
          onChange={(event) => onMotivo(event.target.value)}
          placeholder="Ej. extraviado o fusionado"
          autoFocus
          disabled={procesando}
        />

        {error && (
          <Alert tone="error" title="No se pudo confirmar la depuración">
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  )
}
