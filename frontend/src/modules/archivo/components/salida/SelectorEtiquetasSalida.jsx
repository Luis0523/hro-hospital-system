import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/components/ui'
import { clasesEtiqueta } from '../../utils/coloresEtiqueta'

/**
 * Selección de UNA etiqueta operativa para la salida. En móvil se presenta como
 * un carrusel horizontal deslizable para no ocupar media pantalla. "Normal"
 * equivale a registrar sin etiqueta. Volver a pulsar la activa la quita.
 */
export default function SelectorEtiquetasSalida({
  etiquetas = [],
  etiquetaId = '',
  onCambiar,
  disabled = false,
  cargando = false,
}) {
  const carruselRef = useRef(null)
  const seleccionada = etiquetas.find((e) => String(e.id) === String(etiquetaId)) ?? null

  // Mantener visible la etiqueta activa al cambiar (o al entrar a la pantalla).
  useEffect(() => {
    const contenedor = carruselRef.current
    const activo = contenedor?.querySelector('[data-activo="true"]')
    if (activo && typeof activo.scrollIntoView === 'function') {
      activo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [etiquetaId, etiquetas])

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
      <legend className="mb-1 flex items-center gap-1 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
        <Icon name="label" className="text-[16px] text-primary" />
        Etiqueta <span className="font-normal normal-case">(opcional)</span>
      </legend>

      <div
        ref={carruselRef}
        role="radiogroup"
        aria-label="Etiqueta de la salida"
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!seleccionada}
          data-activo={!seleccionada}
          onClick={() => onCambiar?.('')}
          className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-sm font-semibold transition disabled:opacity-60 ${
            !seleccionada
              ? 'border-outline bg-surface-container-high text-on-surface'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
          }`}
        >
          <Icon name="block" className="text-[16px]" />
          Normal
        </button>

        {etiquetas.map((etiqueta) => {
          const activa = String(etiqueta.id) === String(etiquetaId)
          return (
            <button
              key={etiqueta.id}
              type="button"
              role="radio"
              aria-checked={activa}
              data-activo={activa}
              onClick={() => onCambiar?.(activa ? '' : etiqueta.id)}
              title={etiqueta.descripcion ?? etiqueta.nombre}
              className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-sm font-semibold transition disabled:opacity-60 ${
                activa
                  ? clasesEtiqueta(etiqueta.color, 'seleccionada')
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline'
              }`}
            >
              <Icon name={etiqueta.icono || 'label'} className="text-[16px]" />
              {etiqueta.nombre}
            </button>
          )
        })}
      </div>

      {seleccionada?.descripcion && (
        <p className="mt-1 truncate text-label-sm text-on-surface-variant">
          {seleccionada.descripcion}
        </p>
      )}
    </fieldset>
  )
}
