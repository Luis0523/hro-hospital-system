import { Alert, Button, Icon, Modal } from '@/shared/components/ui'
import { etiquetaRango } from '../../utils/periodoDepuracion'

export default function ModalConsultaRangoLargo({ abierto, periodo, onConfirmar, onCancelar }) {
  if (!periodo) return null

  return (
    <Modal
      open={abierto}
      onClose={onCancelar}
      title="Confirmar consulta extensa"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onCancelar}
            autoFocus
          >
            Cancelar
          </Button>
          <Button size="lg" className="w-full sm:w-auto" onClick={onConfirmar}>
            <Icon name="cloud_download" className="text-[20px]" />
            Continuar consulta
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <dl className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
            <dt className="text-label-sm uppercase text-on-surface-variant">Período</dt>
            <dd className="min-w-0 break-words font-semibold text-on-surface sm:text-right">
              {etiquetaRango(periodo.desde, periodo.hasta)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
            <dt className="text-label-sm uppercase text-on-surface-variant">Consultas diarias</dt>
            <dd className="font-mono font-bold text-primary sm:text-right">
              {periodo.diasCalendario}
            </dd>
          </div>
        </dl>

        <Alert tone="warning" title="Consulta extensa">
          El backend actual no tiene un endpoint de rango. Se realizarán {periodo.diasCalendario}{' '}
          consultas diarias, con un máximo de cuatro simultáneas. La operación puede tardar.
        </Alert>

        <p className="text-label-sm text-on-surface-variant">
          No se iniciará ninguna consulta hasta confirmar esta acción.
        </p>
      </div>
    </Modal>
  )
}
