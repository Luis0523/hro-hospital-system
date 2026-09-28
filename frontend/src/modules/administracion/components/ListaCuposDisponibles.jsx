import { useId } from 'react'
import { horaCorta } from '../utils/dias.js'
import { formatearFechaLarga } from '../utils/fechas.js'

/**
 * Lista seleccionable de cupos devueltos por el backend. Solo las opciones con
 * `disponible === true` son seleccionables; el resto se muestran deshabilitadas
 * con información directa del DTO (no se recalcula disponibilidad).
 */
export default function ListaCuposDisponibles({ cupos = [], seleccionado = '', onSeleccionar }) {
  const idGrupo = `cupos-${useId()}`

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Cupos disponibles</legend>
      {cupos.map((cupo) => {
        const activo = seleccionado === cupo.id
        return (
          <label
            key={cupo.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
              cupo.disponible
                ? activo
                  ? 'border-primary bg-surface-container-low'
                  : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                : 'cursor-not-allowed border-outline-variant/50 bg-surface-container-low opacity-70'
            }`}
          >
            <input
              type="radio"
              name={idGrupo}
              value={cupo.id}
              checked={activo}
              disabled={!cupo.disponible}
              onChange={() => onSeleccionar?.(cupo)}
              className="mt-1"
              aria-label={`${formatearFechaLarga(cupo.fecha)} ${horaCorta(cupo.horaInicio)} a ${horaCorta(cupo.horaFin)}`}
            />
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-on-surface">
                  {formatearFechaLarga(cupo.fecha)}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
                    cupo.disponible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cupo.disponible
                    ? `${cupo.cuposDisponibles} / ${cupo.capacidadMaxima} cupos`
                    : 'Sin cupos'}
                </span>
              </span>
              <span className="block text-xs text-on-surface-variant">
                {horaCorta(cupo.horaInicio)}–{horaCorta(cupo.horaFin)} · {cupo.medicoNombre} ·{' '}
                {cupo.subespecialidadNombre}
              </span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
