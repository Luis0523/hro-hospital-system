import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { NOMBRES_DIA_CORTO, construirMatrizMes, formatearFechaLarga, hoyISO } from '../utils/fechas.js'
import SelectorMesAnio from './SelectorMesAnio.jsx'

const CELDA_BASE =
  'flex min-h-[44px] w-full flex-col items-center justify-center rounded-lg border px-1 py-1 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

/**
 * Cuadrícula mensual propia (lunes a domingo). Presenta datos y delega las
 * acciones: navegar mes/año, seleccionar un día libre o consultar uno marcado.
 */
export default function CalendarioNoLaborables({
  anio,
  mes,
  diasNoLaborables = [],
  onMesAnterior,
  onMesSiguiente,
  onCambiarMes,
  onCambiarAnio,
  onSeleccionarDia,
  onVerDia,
}) {
  const semanas = construirMatrizMes(anio, mes)
  const porFecha = new Map(diasNoLaborables.map((dia) => [dia.fecha, dia]))
  const hoy = hoyISO()

  return (
    <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 self-center sm:self-auto"
          onClick={onMesAnterior}
          aria-label="Mes anterior"
        >
          <Icon name="chevron_left" className="text-[20px]" />
        </Button>

        <SelectorMesAnio
          anio={anio}
          mes={mes}
          onCambiarMes={onCambiarMes}
          onCambiarAnio={onCambiarAnio}
          className="order-first sm:order-none"
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 self-center sm:self-auto"
          onClick={onMesSiguiente}
          aria-label="Mes siguiente"
        >
          <Icon name="chevron_right" className="text-[20px]" />
        </Button>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {NOMBRES_DIA_CORTO.map((dia) => (
          <div
            key={dia}
            className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-outline"
          >
            {dia}
          </div>
        ))}

        {semanas.flat().map((celda, indice) => {
          if (!celda) {
            return <div key={`relleno-${indice}`} aria-hidden="true" />
          }

          const esHoy = celda.iso === hoy
          const registro = porFecha.get(celda.iso)

          if (registro) {
            return (
              <button
                key={celda.iso}
                type="button"
                onClick={() => onVerDia?.(registro)}
                aria-label={`Consultar ${formatearFechaLarga(celda.iso)}: ${registro.motivo}${
                  esHoy ? ' (hoy)' : ''
                }`}
                className={`${CELDA_BASE} border-amber-300 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100`}
              >
                <span>{celda.dia}</span>
                {esHoy ? (
                  <span className="text-[9px] font-bold leading-none">HOY</span>
                ) : (
                  <span
                    className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          }

          return (
            <button
              key={celda.iso}
              type="button"
              onClick={() => onSeleccionarDia?.(celda.iso)}
              aria-label={`Registrar día no laborable el ${formatearFechaLarga(celda.iso)}${
                esHoy ? ' (hoy)' : ''
              }`}
              className={`${CELDA_BASE} ${
                esHoy
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:bg-surface-container-low'
              }`}
            >
              <span>{celda.dia}</span>
              {esHoy && <span className="text-[9px] font-bold leading-none">HOY</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
