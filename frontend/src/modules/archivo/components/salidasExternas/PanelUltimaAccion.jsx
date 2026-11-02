import { Icon } from '@/shared/components/ui'
import { formatearFechaHoraGuatemala } from '../../utils/fechaGuatemala'
import { numeroExpedienteVisible } from '../../utils/prestamosExternos'

const ETIQUETAS = {
  prestamo: 'Préstamo registrado',
  devolucion: 'Devolución registrada',
  recuperacion: 'Préstamo recuperado',
}

const ICONOS = {
  prestamo: 'assignment_add',
  devolucion: 'assignment_return',
  recuperacion: 'history',
}

/**
 * Panel de la última operación exitosa (independiente del modo activo) con la
 * opción de revertirla. Solo aplica a la simulación actual.
 */
export default function PanelUltimaAccion({ accion = null, onRevertir, revirtiendo = false }) {
  const registro = accion?.registro
  if (!registro) return null

  const tipo = accion.tipo ?? 'prestamo'
  const devuelto = Boolean(registro.fechaDevolucion)
  const operacionEn = formatearFechaHoraGuatemala(
    registro.fechaDevolucion ?? registro.creadoEn ?? registro.fechaSalida,
  )

  return (
    <section
      aria-labelledby="titulo-ultima-accion"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card sm:p-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name={ICONOS[tipo] ?? 'assignment'} className="text-[22px]" />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            id="titulo-ultima-accion"
            className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
          >
            Última acción realizada
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm">
            <span className="font-semibold text-on-surface">
              {ETIQUETAS[tipo] ?? 'Operación registrada'}
            </span>
            <span className="font-mono font-bold text-primary">
              {numeroExpedienteVisible(registro)}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
                devuelto
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {devuelto ? 'Devuelto' : 'Pendiente'}
            </span>
          </p>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            {registro.personaRetira} · {operacionEn}
          </p>
        </div>

        <button
          type="button"
          onClick={onRevertir}
          disabled={revirtiendo}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Icon name={revirtiendo ? 'hourglass_top' : 'undo'} className="text-[18px]" />
          {revirtiendo ? 'Revirtiendo…' : 'Revertir última acción'}
        </button>
      </div>
    </section>
  )
}
