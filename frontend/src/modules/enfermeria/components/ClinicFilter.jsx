import Icon from '@/shared/components/ui/Icon.jsx'

export default function ClinicFilter({
  clinicas = [],
  seleccionadas = [],
  onToggle,
  onTodas,
  resumen,
  colaEnEspera = 0,
  promedioMin = 0,
}) {
  const todas = seleccionadas.length === 0

  return (
    <aside className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon name="domain" className="text-[20px] text-primary" />
            <h2 className="text-title-md uppercase text-on-surface">Filtrar por clínica</h2>
          </div>
          <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
            {clinicas.length} redes
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2 text-on-surface-variant">
          <Icon name="info" className="text-[18px] text-primary" />
          <span className="text-label-sm leading-tight">
            Días con cupo resaltados según selección actual
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onTodas}
            className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-title-sm transition ${
              todas
                ? 'bg-primary-container text-on-primary shadow-card'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="select_all" className="text-[18px]" />
              Todas las clínicas
            </span>
            {todas && <Icon name="check" className="text-[18px]" />}
          </button>

          {clinicas.map((clinica) => {
            const activa = seleccionadas.includes(clinica.id)
            const sinCupo = clinica.cupos === 0
            return (
              <button
                key={clinica.id}
                type="button"
                onClick={() => onToggle(clinica.id)}
                className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition ${
                  activa
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded ${
                      activa
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container-highest'
                    }`}
                  >
                    {activa && <Icon name="check" className="text-[12px]" />}
                  </span>
                  <span className="text-title-sm">{clinica.nombre}</span>
                </span>
                <span
                  className={`text-label-sm ${sinCupo ? 'text-outline' : 'text-on-surface-variant'}`}
                >
                  {clinica.cupos} cupos
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-1 flex flex-col gap-1 rounded-xl bg-surface-container-low p-3">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Citas disponibles mes
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-metric-sub text-primary">{resumen?.cuposMes ?? 0} cupos</span>
            <span className="text-label-sm font-bold text-secondary">
              {resumen?.ocupacion ?? 0}% ocupación
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full bg-primary-container"
              style={{ width: `${Math.min(100, resumen?.ocupacion ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3 shadow-card">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-secondary-container" />
          <span className="text-title-sm text-on-surface">
            Cola en espera: {colaEnEspera} pacientes
          </span>
        </div>
        <span className="text-label-sm font-bold text-primary">Promedio: {promedioMin} min</span>
      </div>
    </aside>
  )
}
