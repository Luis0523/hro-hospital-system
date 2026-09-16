import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'

export default function ConfirmacionCita({
  resultado,
  turno,
  enviando = false,
  error,
  onConfirmar,
  onCancelar,
}) {
  const { paciente, cita } = resultado

  return (
    <div className="fixed bottom-24 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-modal">
        {turno ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Paciente agregado a la cola
            </p>
            <p className="text-[56px] font-bold leading-none text-primary">
              #{String(turno.numeroTurno).padStart(3, '0')}
            </p>
            <p className="text-title-sm text-on-surface">
              {cita.clinicaNombre} • {cita.medicoNombre}
            </p>
            <Button className="mt-3" onClick={onCancelar}>
              Listo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-container">
                <Icon name="person_check" className="text-[24px]" />
              </div>
              <div className="min-w-0">
                <p className="text-headline-sm text-on-surface">
                  {paciente.nombres} {paciente.apellidos}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  DPI {paciente.dpi} • {paciente.numeroExpediente}
                </p>
              </div>
            </div>

            {cita ? (
              <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-container-low p-3 text-body-sm">
                <div>
                  <dt className="text-on-surface-variant">Clínica</dt>
                  <dd className="font-semibold text-on-surface">{cita.clinicaNombre}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Médico</dt>
                  <dd className="font-semibold text-on-surface">{cita.medicoNombre}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Fecha</dt>
                  <dd className="font-semibold text-on-surface">
                    {formatearFechaLarga(cita.fechaCita)}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Hora estimada</dt>
                  <dd className="font-semibold text-on-surface">
                    {cita.horaEstimada ? cita.horaEstimada.slice(0, 5) : 'Sin hora estimada'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
                El paciente no tiene una cita registrada para el día de hoy.
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancelar}>
                Cancelar
              </Button>
              <Button disabled={!cita || enviando} onClick={onConfirmar}>
                {enviando ? 'Registrando...' : 'Confirmar llegada'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
