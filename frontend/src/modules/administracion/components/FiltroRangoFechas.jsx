import { useId } from 'react'

const CLASE_INPUT =
  'rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

/**
 * Rango de fechas (Desde / Hasta) con etiquetas accesibles. No valida aquí;
 * la validación de rango la decide el contenedor según la regla del backend.
 */
export default function FiltroRangoFechas({
  fechaInicio,
  fechaFin,
  onCambiarInicio,
  onCambiarFin,
  error = null,
}) {
  const idInicio = `rango-inicio-${useId()}`
  const idFin = `rango-fin-${useId()}`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1">
        <label
          htmlFor={idInicio}
          className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
        >
          Desde
        </label>
        <input
          id={idInicio}
          type="date"
          value={fechaInicio}
          onChange={(evento) => onCambiarInicio(evento.target.value)}
          className={CLASE_INPUT}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={idFin}
          className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
        >
          Hasta
        </label>
        <input
          id={idFin}
          type="date"
          value={fechaFin}
          onChange={(evento) => onCambiarFin(evento.target.value)}
          className={CLASE_INPUT}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
