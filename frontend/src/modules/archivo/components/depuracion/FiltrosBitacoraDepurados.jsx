import { Button, Icon } from '@/shared/components/ui'
import { TIPOS_PERIODO } from '../../utils/periodoDepuracion'
import CampoFechaDepuracion from './CampoFechaDepuracion.jsx'

const OPCIONES = [
  { tipo: TIPOS_PERIODO.HOY, etiqueta: 'Hoy' },
  { tipo: TIPOS_PERIODO.SEMANA, etiqueta: 'Esta semana' },
  { tipo: TIPOS_PERIODO.PERSONALIZADO, etiqueta: 'Rango personalizado' },
]

export default function FiltrosBitacoraDepurados({
  filtroSeleccionado,
  filtroActivo,
  etiquetaActiva,
  rango,
  errorRango,
  onSeleccionar,
  onCambiarRango,
  onAplicarRango,
  onRestablecerRango,
}) {
  const personalizado = filtroSeleccionado === TIPOS_PERIODO.PERSONALIZADO
  const mostrarAplicado = filtroSeleccionado !== filtroActivo
  const idError = 'rango-personalizado-error'

  return (
    <section
      aria-labelledby="filtros-bitacora-titulo"
      className="space-y-3 rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3
            id="filtros-bitacora-titulo"
            className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
          >
            <Icon name="date_range" className="text-[20px] text-primary" />
            Período de la bitácora
          </h3>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            {personalizado
              ? 'Elija la fecha inicial y la fecha final.'
              : 'Consulte un día, la semana o un rango.'}
          </p>
        </div>
        <p className="text-label-sm text-on-surface-variant" aria-live="polite">
          {mostrarAplicado ? 'Mostrando: ' : 'Vista: '}
          <span className="font-semibold text-on-surface">{etiquetaActiva}</span>
        </p>
      </div>

      <div
        role="group"
        aria-label="Seleccionar período de la bitácora"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {OPCIONES.map((opcion) => {
          const seleccionado = filtroSeleccionado === opcion.tipo
          return (
            <button
              key={opcion.tipo}
              type="button"
              aria-pressed={seleccionado}
              onClick={() => onSeleccionar(opcion.tipo)}
              className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                seleccionado
                  ? 'border-primary-container bg-primary-container text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              {opcion.etiqueta}
            </button>
          )
        })}
      </div>

      {personalizado && (
        <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CampoFechaDepuracion
              label="Fecha inicial"
              name="rango-desde"
              value={rango.desde}
              onChange={(valor) => onCambiarRango('desde', valor)}
              error={Boolean(errorRango)}
              describedBy={errorRango ? idError : undefined}
            />
            <CampoFechaDepuracion
              label="Fecha final"
              name="rango-hasta"
              value={rango.hasta}
              onChange={(valor) => onCambiarRango('hasta', valor)}
              error={Boolean(errorRango)}
              describedBy={errorRango ? idError : undefined}
            />
          </div>

          {errorRango && (
            <p id={idError} role="alert" className="text-sm text-error">
              {errorRango}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              size="md"
              className="min-h-11 w-full sm:w-auto"
              onClick={onRestablecerRango}
            >
              <Icon name="restart_alt" className="text-[18px]" />
              Restablecer
            </Button>
            <Button
              size="md"
              className="min-h-11 w-full sm:w-auto"
              onClick={onAplicarRango}
            >
              <Icon name="filter_alt" className="text-[18px]" />
              Aplicar rango
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
