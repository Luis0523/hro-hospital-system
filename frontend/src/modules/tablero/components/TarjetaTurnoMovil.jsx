import { formatearTurno } from './FilaTurno.jsx'

export default function TarjetaTurnoMovil({ asignacion }) {
  const {
    asignacionDiariaEspacioId,
    espacioNumero,
    turnoActual,
    turnoSiguiente,
    turnosEnEspera,
  } = asignacion
  const cola = Array.isArray(turnosEnEspera) ? turnosEnEspera : []

  return (
    <article
      data-testid={`tarjeta-turno-${asignacionDiariaEspacioId}`}
      className="flex w-full min-w-0 flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-card ring-1 ring-outline-variant/40 dark:bg-slate-900 dark:ring-slate-700"
    >
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant dark:text-slate-300">
            Turno actual
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums text-primary dark:text-sky-400">
            {formatearTurno(turnoActual)}
          </p>
        </div>

        <div className="min-w-0 text-right">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant dark:text-slate-300">
            Consultorio
          </p>
          <p className="break-words text-2xl font-bold leading-none tabular-nums text-on-surface dark:text-slate-100">
            {espacioNumero ?? '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/50 pt-3 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant dark:text-slate-300">
            Siguiente
          </p>
          <p className="text-xl font-bold leading-none tabular-nums text-on-surface-variant dark:text-slate-300">
            {formatearTurno(turnoSiguiente)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant dark:text-slate-300">
            En espera
          </p>
          {cola.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1">
              {cola.map((numero) => (
                <li
                  key={numero}
                  className="rounded-lg bg-surface-container px-2 py-0.5 text-sm font-bold tabular-nums text-primary dark:bg-slate-800 dark:text-sky-400"
                >
                  {formatearTurno(numero)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl font-bold leading-none text-on-surface-variant dark:text-slate-300">
              —
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export function ListaTurnosMovil({ asignaciones = [] }) {
  return (
    <div data-testid="tablero-turnos-movil" className="flex w-full min-w-0 flex-col gap-3">
      {asignaciones.map((asignacion) => (
        <TarjetaTurnoMovil
          key={asignacion.asignacionDiariaEspacioId}
          asignacion={asignacion}
        />
      ))}
    </div>
  )
}
