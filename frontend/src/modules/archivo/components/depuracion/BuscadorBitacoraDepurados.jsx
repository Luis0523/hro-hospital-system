import { Icon } from '@/shared/components/ui'
import { normalizarBusquedaExpediente } from '../../utils/busquedaDepurados'

export default function BuscadorBitacoraDepurados({
  valor,
  onChange,
  totalPeriodo,
  totalCoincidencias,
}) {
  function manejarCambio(evento) {
    const normalizado = normalizarBusquedaExpediente(evento.target.value)
    if (normalizado == null) return
    onChange(normalizado)
  }

  return (
    <section
      aria-label="Buscador de la bitácora"
      className="rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 w-full sm:flex-1">
          <label
            htmlFor="busqueda-expediente-bitacora"
            className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
          >
            <Icon name="search" className="text-[18px] text-primary" />
            Buscar en la bitácora por expediente
          </label>
          <div className="relative mt-2 flex items-center">
            <Icon
              name="tag"
              className="pointer-events-none absolute left-3 text-[20px] text-primary"
            />
            <input
              id="busqueda-expediente-bitacora"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9-]*"
              maxLength={31}
              value={valor}
              onChange={manejarCambio}
              placeholder="Ej. 9275"
              aria-describedby="busqueda-expediente-ayuda"
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-11 text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
            />
            {valor && (
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Limpiar búsqueda de expediente"
                className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <Icon name="backspace" className="text-[20px]" />
              </button>
            )}
          </div>
          <p id="busqueda-expediente-ayuda" className="mt-1 text-label-sm text-on-surface-variant">
            Solo por número; puede escribir los primeros dígitos. El filtro no consulta la API.
          </p>
        </div>
        <p className="text-label-sm font-semibold text-on-surface-variant" aria-live="polite">
          {valor
            ? `Mostrando ${totalCoincidencias} de ${totalPeriodo} expedientes`
            : `${totalPeriodo} expedientes en el período`}
        </p>
      </div>
    </section>
  )
}
