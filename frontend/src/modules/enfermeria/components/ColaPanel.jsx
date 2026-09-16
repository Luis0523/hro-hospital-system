import Icon from '@/shared/components/ui/Icon.jsx'
import EstadoBadge from '@/shared/components/ui/EstadoBadge.jsx'

const botonAccion =
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-sm font-semibold transition disabled:opacity-50'

function formatearSegundos(total) {
  const minutos = Math.floor(total / 60)
  const segundos = total % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

export default function ColaPanel({
  turnos = [],
  noRespondidos = [],
  turnoEnGraciaId,
  segundosRestantes = 0,
  cargandoId,
  onLlamar,
  onAtendido,
  onNoResponde,
  onReintegrar,
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Icon name="groups" className="text-[20px] text-primary" />
          <h2 className="text-title-md uppercase text-on-surface">Cola de la clínica</h2>
        </div>
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
          {turnos.length} en espera
        </span>
      </div>

      {turnos.length === 0 ? (
        <p className="rounded-lg bg-surface-container-low px-3 py-4 text-center text-body-sm text-on-surface-variant">
          No hay pacientes en espera.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {turnos.map((turno) => (
            <li key={turno.id} className="rounded-lg bg-surface-container-low p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-title-md font-bold text-primary">
                    #{String(turno.numeroTurno).padStart(3, '0')}
                  </span>
                  <span className="truncate text-body-sm text-on-surface">
                    {turno.pacienteNombre ?? 'Paciente'}
                  </span>
                </div>
                <EstadoBadge estado={turno.estado} />
              </div>

              {turnoEnGraciaId === turno.id && (
                <p className="mt-1 flex items-center gap-1 text-label-sm font-semibold text-error">
                  <Icon name="timer" className="text-[16px]" />
                  Tiempo de gracia: {formatearSegundos(segundosRestantes)}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {turno.estado === 'en_espera' && (
                  <button
                    type="button"
                    disabled={cargandoId === turno.id}
                    onClick={() => onLlamar(turno)}
                    className={`${botonAccion} bg-primary-container text-on-primary hover:bg-primary`}
                  >
                    <Icon name="campaign" className="text-[16px]" />
                    Llamar
                  </button>
                )}
                {turno.estado === 'llamado' && (
                  <>
                    <button
                      type="button"
                      disabled={cargandoId === turno.id}
                      onClick={() => onAtendido(turno)}
                      className={`${botonAccion} bg-emerald-600 text-white hover:bg-emerald-700`}
                    >
                      <Icon name="check_circle" className="text-[16px]" />
                      Atendido
                    </button>
                    <button
                      type="button"
                      disabled={cargandoId === turno.id}
                      onClick={() => onNoResponde(turno)}
                      className={`${botonAccion} bg-error text-on-error hover:brightness-95`}
                    >
                      <Icon name="person_off" className="text-[16px]" />
                      No responde
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
          No respondidos del día
        </h3>
        {noRespondidos.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Sin casos.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {noRespondidos.map((turno) => (
              <li
                key={turno.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-error-container/50 p-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-title-sm font-bold text-on-error-container">
                    #{String(turno.numeroTurno).padStart(3, '0')}
                  </span>
                  <span className="truncate text-body-sm text-on-surface">
                    {turno.pacienteNombre ?? 'Paciente'}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={cargandoId === turno.id}
                  onClick={() => onReintegrar(turno)}
                  className={`${botonAccion} bg-primary-container text-on-primary hover:bg-primary`}
                >
                  <Icon name="undo" className="text-[16px]" />
                  Reintegrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
