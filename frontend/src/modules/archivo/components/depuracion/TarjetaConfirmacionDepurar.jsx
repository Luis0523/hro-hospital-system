import { formatearExpediente } from '@/shared/utils/expediente'
import { Alert, Button, Icon } from '@/shared/components/ui'

// Resumen del expediente encontrado. No confirma nada por sí mismo: solo abre
// el modal de confirmación cuando el operador lo solicita explícitamente.
export default function TarjetaConfirmacionDepurar({
  expediente,
  onSolicitarDepuracion,
  yaDepurado = false,
}) {
  if (!expediente) return null

  return (
    <section className="space-y-3 rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon
            name={yaDepurado ? 'history_toggle_off' : 'person_search'}
            className="text-[22px]"
          />
        </span>
        <dl className="min-w-0 flex-1 space-y-2">
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
      </div>

      {yaDepurado ? (
        <Alert tone="warning" title="Expediente ya depurado">
          Este expediente figura como “ya no existe en el sistema”. No se puede iniciar otra baja.
        </Alert>
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Icon name="check_circle" className="text-[14px]" />
              Vigente
            </span>
            Revisa los datos antes de continuar.
          </p>
          <Button variant="danger" size="lg" className="w-full" onClick={onSolicitarDepuracion}>
            <Icon name="delete_sweep" className="text-[24px]" />
            Depurar expediente
          </Button>
        </>
      )}
    </section>
  )
}
