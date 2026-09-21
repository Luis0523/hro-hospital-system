import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  NOMBRES_DIA_CORTO,
  construirMatrizMes,
  formatearFechaLarga,
  nombreMes,
} from '../utils/fechas.js'

const CELDA_BASE =
  'flex min-h-[44px] w-full flex-col items-center justify-center rounded-lg border px-1 py-1 text-xs transition'

/**
 * Cuadrícula mensual propia (lunes a domingo). Solo presenta datos y delega las
 * acciones: seleccionar un día libre para registrar o consultar uno marcado.
 */
export default function CalendarioNoLaborables({
  anio,
  mes,
  diasNoLaborables = [],
  onMesAnterior,
  onMesSiguiente,
  onSeleccionarDia,
  onVerDia,
}) {
  const semanas = construirMatrizMes(anio, mes)
  const porFecha = new Map(diasNoLaborables.map((dia) => [dia.fecha, dia]))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onMesAnterior} aria-label="Mes anterior">
          <Icon name="chevron_left" className="text-[20px]" />
        </Button>
        <p className="text-sm font-semibold text-slate-700">
          {nombreMes(mes)} {anio}
        </p>
        <Button variant="ghost" size="sm" onClick={onMesSiguiente} aria-label="Mes siguiente">
          <Icon name="chevron_right" className="text-[20px]" />
        </Button>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {NOMBRES_DIA_CORTO.map((dia) => (
          <div
            key={dia}
            className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            {dia}
          </div>
        ))}

        {semanas.flat().map((celda, indice) => {
          if (!celda) {
            return <div key={`relleno-${indice}`} aria-hidden="true" />
          }

          const registro = porFecha.get(celda.iso)
          if (registro) {
            return (
              <button
                key={celda.iso}
                type="button"
                onClick={() => onVerDia?.(registro)}
                aria-label={`Consultar ${formatearFechaLarga(celda.iso)}: ${registro.motivo}`}
                className={`${CELDA_BASE} border-amber-300 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100`}
              >
                <span>{celda.dia}</span>
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              </button>
            )
          }

          return (
            <button
              key={celda.iso}
              type="button"
              onClick={() => onSeleccionarDia?.(celda.iso)}
              aria-label={`Registrar día no laborable el ${formatearFechaLarga(celda.iso)}`}
              className={`${CELDA_BASE} border-slate-200 bg-white text-slate-600 hover:border-hro-blue hover:bg-cyan-50`}
            >
              {celda.dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}
