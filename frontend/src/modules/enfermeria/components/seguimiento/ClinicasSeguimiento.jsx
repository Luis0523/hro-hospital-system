import { Icon } from '@/shared/components/ui'

// Clínicas físicas con el conteo de expedientes que permanecen en cada una.
// Si hay un turno recibido seleccionado, pulsar una clínica lo reparte.
export default function ClinicasSeguimiento({ clinicas, puedeRepartir, onElegir }) {
  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Clínicas físicas</h2>
        <p className="text-body-sm text-on-surface-variant">
          Expedientes que permanecen actualmente en cada clínica
        </p>
        <span className="inline-block rounded-md bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant">
          {puedeRepartir
            ? 'Pulse una clínica para repartir el expediente'
            : 'Pulse una clínica para consultar su detalle'}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {clinicas.map((clinica) => {
          const conteo = clinica.expedientesEnClinica ?? 0
          return (
            <button
              key={clinica.id}
              type="button"
              aria-label={`${clinica.nombre}: ${conteo} expedientes en clínica`}
              onClick={() => onElegir(clinica)}
              className={`min-h-[100px] rounded-xl border bg-surface-container-lowest p-2.5 text-left transition hover:border-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                puedeRepartir
                  ? 'border-primary-container shadow-card ring-1 ring-primary-container/40'
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
                {puedeRepartir ? 'Pulse para enviar expediente' : 'Atención en consultorio'}
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
    </section>
  )
}
