import Button from '@/shared/components/ui/Button.jsx'
import FichaPaciente from './FichaPaciente.jsx'

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
            <FichaPaciente paciente={paciente} cita={cita} />

            {!cita && (
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
