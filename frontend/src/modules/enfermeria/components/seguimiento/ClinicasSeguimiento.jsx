import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/components/ui'

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

  useEffect(() => {
    esElegibleRef.current = esElegible
  }, [esElegible])

  useEffect(() => {
    if (focusToken === 0) return
    const indice = clinicas.findIndex((clinica) => esElegibleRef.current(clinica))
    if (indice >= 0) botonesRef.current[indice]?.focus()
  }, [focusToken, clinicas])

  const instruccion = modoCambio
    ? 'Elija la nueva clínica para el turno seleccionado'
    : modoRegistro
      ? 'Elija la clínica para registrar el turno'
      : modoAsignacion
        ? 'Seleccione la clínica destino y luego marque los turnos registrados'
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

      <div className="mt-3 flex flex-col gap-2">
        {clinicas.map((clinica, indice) => {
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
              className={`min-h-[100px] rounded-xl border bg-surface-container-lowest p-2.5 text-left transition hover:border-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-inherit disabled:hover:bg-surface-container-lowest ${
                seleccionada
                  ? 'border-primary-container shadow-card ring-2 ring-primary-container/60'
                  : modoAsignacion || modoRegistro || modoCambio
                    ? 'border-primary-container/60 ring-1 ring-primary-container/30'
                    : 'border-outline-variant'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-title-sm text-on-surface">{clinica.nombre}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                  <Icon name="local_hospital" className="text-[16px]" />
                </span>
              </div>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                {seleccionada
                  ? modoCambio
                    ? 'Nueva clínica seleccionada'
                    : 'Destino activo'
                  : !elegible
                    ? 'No asignada a esta especialidad'
                    : modoRegistro || modoCambio
                      ? 'Pulse para seleccionar esta clínica'
                      : modoAsignacion
                        ? 'Pulse para fijar como clínica destino'
                        : 'Atención en consultorio'}
              </p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <strong className="text-metric-display leading-none text-on-surface">
                  {String(conteo).padStart(2, '0')}
                </strong>
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
