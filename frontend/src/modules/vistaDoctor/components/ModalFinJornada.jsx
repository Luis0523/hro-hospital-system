import { useEffect, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'

function MetricasCierre({ estadisticas }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3 text-center">
      <div>
        <p className="text-metric-sub text-on-surface">{estadisticas.pendientes}</p>
        <p className="text-sm text-on-surface-variant">Pendientes</p>
      </div>
      <div>
        <p className="text-metric-sub text-on-surface">{estadisticas.enEspera}</p>
        <p className="text-sm text-on-surface-variant">En espera</p>
      </div>
      <div>
        <p className="text-metric-sub text-on-surface">{estadisticas.atendidos}</p>
        <p className="text-sm text-on-surface-variant">Atendidos</p>
      </div>
    </div>
  )
}

export default function ModalFinJornada({
  abierto,
  medico,
  clinica,
  estadisticas,
  procesando = false,
  onCancelar,
  onConfirmar,
}) {
  const [paso, setPaso] = useState(1)

  useEffect(() => {
    if (abierto) setPaso(1)
  }, [abierto])

  function cerrar() {
    if (!procesando) onCancelar?.()
  }

  const pie = (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {paso === 1 ? (
        <>
          <Button type="button" variant="secondary" onClick={cerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => setPaso(2)} disabled={procesando}>
            Continuar
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPaso(1)}
            disabled={procesando}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirmar}
            disabled={procesando}
            aria-busy={procesando}
          >
            {procesando ? 'Finalizando…' : 'Finalizar jornada y cerrar sesión'}
          </Button>
        </>
      )}
    </div>
  )

  return (
    <Modal
      open={abierto}
      onClose={cerrar}
      title={paso === 1 ? 'Finalizar jornada' : 'Confirmar cierre de jornada'}
      footer={pie}
    >
      {paso === 1 ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Icon name="flag" className="mt-0.5 text-2xl text-error" />
            <div>
              <p className="text-base font-semibold text-on-surface">Jornada de {medico?.nombre}</p>
              <p className="text-sm text-on-surface-variant">
                Clínica {clinica?.numero} · {clinica?.nombre}
              </p>
            </div>
          </div>
          <MetricasCierre estadisticas={estadisticas} />
          <p className="text-sm text-on-surface-variant">
            Al finalizar se bloquearán las acciones de esta jornada y se cerrará la sesión local del
            médico en esta pestaña. No se modifica la jornada institucional.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-base font-semibold text-on-surface">
            ¿Confirma que desea finalizar su jornada y cerrar sesión?
          </p>
          <p className="text-sm text-on-surface-variant">
            Para volver a operar deberá identificarse de nuevo y confirmar la reapertura de la
            jornada.
          </p>
        </div>
      )}
    </Modal>
  )
}
