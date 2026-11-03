import { useMemo } from 'react'
import { Icon } from '@/shared/components/ui'
import { ordenarClinicas } from './ordenClinicas'

// Barra inferior de destino. En Recibir/Repartir muestra todas las clínicas
// como cuadros táctiles, sin abrir un modal.
export default function BarraDestino({
  clinicas = [],
  clinicaSeleccionadaId = null,
  onElegir,
  esElegible = () => true,
}) {
  const ordenadas = useMemo(() => ordenarClinicas(clinicas), [clinicas])

  return (
    <div className="shrink-0 border-t border-outline-variant bg-surface-container-lowest px-2 py-1.5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
          Destino
        </span>
        <span className="text-label-sm text-on-surface-variant">
          {clinicaSeleccionadaId == null
            ? 'sin fijar · elija una clínica'
            : 'clínica fijada para repartir'}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
        {ordenadas.map((clinica) => {
          const conteo = clinica.expedientesEnClinica ?? 0
          const seleccionada = String(clinicaSeleccionadaId) === String(clinica.id)
          const elegible = esElegible(clinica)
          return (
            <button
              key={clinica.id}
              type="button"
              data-clinica-id={clinica.id}
              aria-label={`${clinica.nombre}: ${conteo} expedientes en clínica`}
              aria-pressed={seleccionada}
              aria-disabled={!elegible}
              disabled={!elegible}
              onClick={() => onElegir?.(clinica)}
              className={`flex min-h-14 min-w-[116px] shrink-0 flex-col justify-center rounded-lg border-2 px-2 py-1 text-left transition touch-manipulation select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
                seleccionada
                  ? 'border-primary bg-primary text-on-primary shadow-popover'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="max-w-[90px] truncate text-label-md font-bold leading-tight">
                  {clinica.nombre}
                </span>
                <Icon
                  name={seleccionada ? 'check_circle' : 'local_hospital'}
                  className="shrink-0 text-[16px]"
                />
              </span>
              <span
                className={`mt-0.5 text-label-sm font-semibold tabular-nums ${
                  seleccionada ? 'text-on-primary/90' : 'text-on-surface-variant'
                }`}
              >
                {String(conteo).padStart(2, '0')} exp.
              </span>
            </button>
          )
        })}
        {ordenadas.length === 0 && (
          <span className="px-2 py-3 text-body-sm text-on-surface-variant">
            No hay clínicas disponibles para esta fecha.
          </span>
        )}
      </div>
    </div>
  )
}
