import { useEffect, useMemo, useRef } from 'react'
import { Icon } from '@/shared/components/ui'
import { ordenarClinicasPorUso } from './ordenClinicas'

// Clínicas físicas con el conteo de expedientes que permanecen en cada una.
// En modo en_clinica, la clínica elegida queda como destino de los turnos.
export default function ClinicasSeguimiento({
  clinicas,
  modoAsignacion = false,
  modoRegistro = false,
  modoCambio = false,
  clinicaSeleccionadaId = null,
  onElegir,
  esElegible = () => true,
  focusToken = 0,
  mensaje = null,
}) {
  const botonesRef = useRef([])
  const esElegibleRef = useRef(esElegible)
  const ordenadas = useMemo(() => ordenarClinicasPorUso(clinicas), [clinicas])

  useEffect(() => {
    esElegibleRef.current = esElegible
  }, [esElegible])

  useEffect(() => {
    if (focusToken === 0) return
    const indice = ordenadas.findIndex((clinica) => esElegibleRef.current(clinica))
    if (indice >= 0) botonesRef.current[indice]?.focus()
  }, [focusToken, ordenadas])

  const instruccion = modoCambio
    ? 'Elija la nueva clínica para el turno seleccionado'
    : modoRegistro
      ? 'Elija la clínica para registrar el turno'
      : modoAsignacion
        ? 'Seleccione una clínica si el turno no la tiene; si ya está asignada, se usará automáticamente'
        : 'Pulse una clínica para consultar su detalle'

  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Clínicas físicas</h2>
        <p className="text-body-sm text-on-surface-variant">
          Expedientes que permanecen actualmente en cada clínica
        </p>
        <span className="inline-block rounded-md bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant">
          {instruccion}
        </span>
        {mensaje && <p className="text-label-sm text-primary">{mensaje}</p>}
      </div>

      <div className="mt-3 flex max-h-[58vh] flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
        {ordenadas.map((clinica, indice) => {
          const conteo = clinica.expedientesEnClinica ?? 0
          const seleccionada = String(clinicaSeleccionadaId) === String(clinica.id)
          const elegible = esElegible(clinica)
          return (
            <button
              key={clinica.id}
              ref={(elemento) => {
                botonesRef.current[indice] = elemento
              }}
              type="button"
              data-clinica-id={clinica.id}
              aria-label={`${clinica.nombre}: ${conteo} expedientes en clínica`}
              aria-pressed={seleccionada}
              aria-disabled={!elegible}
              disabled={!elegible}
              onClick={() => onElegir(clinica)}
              className={`min-h-[104px] rounded-xl border-2 bg-surface-container-lowest p-3 text-left transition-all hover:border-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-inherit disabled:hover:bg-surface-container-lowest ${
                seleccionada
                  ? 'scale-[1.02] border-primary bg-primary-container/15 shadow-popover ring-4 ring-primary/40'
                  : modoAsignacion || modoRegistro || modoCambio
                    ? 'border-primary-container/60 ring-1 ring-primary-container/30'
                    : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-headline-md font-bold leading-tight text-on-surface">
                  {clinica.nombre}
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                    seleccionada
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-primary'
                  }`}
                >
                  <Icon name={seleccionada ? 'check' : 'local_hospital'} className="text-[18px]" />
                </span>
              </div>
              <p
                className={`mt-1 text-body-sm ${
                  seleccionada ? 'font-bold text-primary' : 'text-on-surface-variant'
                }`}
              >
                {seleccionada
                  ? modoCambio
                    ? 'Nueva clínica seleccionada'
                    : 'Destino activo · clínica seleccionada'
                  : !elegible
                    ? 'No asignada a esta especialidad'
                    : modoRegistro || modoCambio
                      ? 'Pulse para seleccionar esta clínica'
                      : modoAsignacion
                        ? 'Pulse para fijar como clínica destino'
                        : 'Atención en consultorio'}
              </p>
              {clinica.especialidadesFijas?.length > 0 && (
                <p
                  className="mt-1 flex items-center gap-1 text-label-md font-semibold text-primary"
                  title={clinica.especialidadesFijas
                    .map((especialidad) => especialidad.nombre)
                    .join(' · ')}
                >
                  <Icon name="link" className="shrink-0 text-[14px]" />
                  <span className="truncate">
                    {clinica.especialidadesFijas
                      .map((especialidad) => especialidad.nombre)
                      .join(' · ')}
                  </span>
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-surface-container-high px-1.5 py-0.5 text-label-md font-bold text-on-surface-variant">
                  {String(conteo).padStart(2, '0')}
                </span>
                <span className="text-label-sm text-on-surface-variant">
                  expedientes en clínica
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded bg-surface-container-high">
                <div
                  className="h-full rounded bg-gradient-to-r from-hro-blue to-hro-celeste"
                  style={{ width: `${Math.min(100, (conteo / 12) * 100)}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {clinicas.length === 0 && (
        <p className="mt-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-3 text-body-sm text-on-surface-variant">
          No hay clínicas disponibles para la fecha seleccionada.
        </p>
      )}
    </section>
  )
}
