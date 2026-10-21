import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import { calcularEstadisticas } from '../api/doctorAcciones'

function fechaCierre(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return fecha.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ModalReabrirJornada({
  abierto,
  jornada,
  medico,
  clinica,
  onCancelar,
  onConfirmar,
}) {
  const estadisticas = calcularEstadisticas(jornada?.turnos ?? [])

  return (
    <Modal
      open={abierto}
      onClose={onCancelar}
      title="Jornada cerrada"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmar}>
            Reabrir jornada
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Icon name="lock_clock" className="mt-0.5 text-2xl text-primary" />
          <div>
            <p className="text-base font-semibold text-on-surface">
              {medico?.nombre} · Colegiado {medico?.colegiado}
            </p>
            <p className="text-sm text-on-surface-variant">
              Clínica {clinica?.numero} · {clinica?.nombre}
            </p>
            {jornada?.cerradaEn && (
              <p className="text-sm text-on-surface-variant">
                Cerrada el {fechaCierre(jornada.cerradaEn)}
              </p>
            )}
          </div>
        </div>

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

        <p className="text-sm text-on-surface-variant">
          Solo este médico puede reabrir esta jornada. Confirma para reactivar las acciones de la
          cola en esta pestaña.
        </p>
      </div>
    </Modal>
  )
}
