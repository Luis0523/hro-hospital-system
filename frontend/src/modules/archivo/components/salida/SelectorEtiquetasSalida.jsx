import { Icon } from '@/shared/components/ui'
import { clasesEtiqueta } from '../../utils/coloresEtiqueta'

/**
 * Selección de UNA etiqueta operativa para la salida. Las etiquetas se cargan
 * según la estación elegida. Volver a pulsar la etiqueta activa la quita.
 */
export default function SelectorEtiquetasSalida({
  etiquetas = [],
  etiquetaId = '',
  onCambiar,
  disabled = false,
  cargando = false,
}) {
  const seleccionada = etiquetas.find((e) => String(e.id) === String(etiquetaId)) ?? null

  if (cargando) {
    return (
      <p className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <Icon name="sync" className="animate-spin text-[16px]" />
        Cargando etiquetas de la estación…
      </p>
    )
  }

  if (etiquetas.length === 0) {
    return (
      <p className="text-label-sm text-on-surface-variant">
        {disabled
          ? 'Elija una estación para ver sus etiquetas.'
          : 'Esta estación no tiene etiquetas configuradas. El jefe de Archivo puede habilitarlas.'}
      </p>
    )
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-1.5 flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
        <Icon name="label" className="text-[18px] text-primary" />
        Etiqueta de la salida <span className="font-normal normal-case">(opcional)</span>
      </legend>

      <div role="radiogroup" aria-label="Etiqueta de la salida" className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={!seleccionada}
          onClick={() => onCambiar?.('')}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-label-md font-semibold transition disabled:opacity-60 ${
            !seleccionada
              ? 'border-outline bg-surface-container-high text-on-surface'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
          }`}
        >
          <Icon name="block" className="text-[18px]" />
          Sin etiqueta
        </button>

        {etiquetas.map((etiqueta) => {
          const activa = String(etiqueta.id) === String(etiquetaId)
          return (
            <button
              key={etiqueta.id}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => onCambiar?.(activa ? '' : etiqueta.id)}
              title={etiqueta.descripcion ?? etiqueta.nombre}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-label-md font-semibold transition disabled:opacity-60 ${
                activa
                  ? clasesEtiqueta(etiqueta.color, 'seleccionada')
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline'
              }`}
            >
              <Icon name={etiqueta.icono || 'label'} className="text-[18px]" />
              {etiqueta.nombre}
            </button>
          )
        })}
      </div>

      {seleccionada?.descripcion && (
        <p className="mt-1.5 text-label-sm text-on-surface-variant">{seleccionada.descripcion}</p>
      )}
    </fieldset>
  )
}
