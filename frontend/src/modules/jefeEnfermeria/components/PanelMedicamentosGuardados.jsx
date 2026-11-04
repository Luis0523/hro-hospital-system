import { useMemo, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'

function detalle(medicamento) {
  return [medicamento.dosis, medicamento.via, medicamento.frecuencia].filter(Boolean).join(' · ')
}

export default function PanelMedicamentosGuardados({
  medicamentos = [],
  onUsar,
  onEliminar,
  onAlternarFavorito,
  onLimpiar,
}) {
  const [filtro, setFiltro] = useState('')

  const visibles = useMemo(() => {
    const busqueda = filtro.trim().toLowerCase()
    if (!busqueda) return medicamentos
    return medicamentos.filter((medicamento) =>
      [medicamento.nombre, medicamento.dosis, medicamento.via, medicamento.frecuencia]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(busqueda)),
    )
  }, [filtro, medicamentos])

  function confirmarEliminar(medicamento) {
    const confirmado =
      typeof window === 'undefined' ||
      window.confirm(`¿Quitar ${medicamento.nombre} del catálogo de medicamentos?`)
    if (confirmado) onEliminar(medicamento.id)
  }

  function confirmarLimpiar() {
    const confirmado =
      typeof window === 'undefined' ||
      window.confirm('¿Vaciar todo el catálogo de medicamentos guardados?')
    if (confirmado) onLimpiar()
  }

  return (
    <aside
      aria-label="Medicamentos guardados"
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card xl:sticky xl:top-4 xl:max-h-[calc(100dvh-8rem)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 text-title-md text-on-surface">
            <Icon name="inventory_2" className="text-[20px] text-primary" />
            Guardados
          </h4>
          <p className="text-body-sm text-on-surface-variant">
            Elija uno para cargar dosis, vía y frecuencia.
          </p>
        </div>
        <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm text-on-secondary-container">
          {medicamentos.length}
        </span>
      </div>

      <Input
        name="filtroMedicamentosGuardados"
        value={filtro}
        onChange={(evento) => setFiltro(evento.target.value)}
        placeholder="Filtrar medicamentos"
        autoComplete="off"
        aria-label="Filtrar medicamentos guardados"
      />

      {medicamentos.length === 0 ? (
        <EmptyState
          title="Sin medicamentos guardados"
          description="Los medicamentos que agregue a una solicitud quedarán disponibles aquí."
        />
      ) : visibles.length === 0 ? (
        <EmptyState title="Sin coincidencias" description="Pruebe con otro nombre o dosis." />
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {visibles.map((medicamento) => (
            <li
              key={medicamento.id || medicamento.nombre}
              data-testid={`medicamento-guardado-${medicamento.id || medicamento.nombre}`}
              className="rounded-lg border border-outline-variant bg-surface-container-low p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-title-sm font-semibold text-on-surface">
                    {medicamento.nombre}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">{detalle(medicamento)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAlternarFavorito(medicamento.id)}
                  aria-label={
                    medicamento.favorito
                      ? `Quitar ${medicamento.nombre} de favoritos`
                      : `Marcar ${medicamento.nombre} como favorito`
                  }
                  aria-pressed={medicamento.favorito}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    medicamento.favorito
                      ? 'text-amber-500 hover:bg-amber-50'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <Icon name="star" fill={medicamento.favorito} className="text-[20px]" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => onUsar(medicamento)}
                  aria-label={`Usar ${medicamento.nombre}`}
                >
                  <Icon name="replay" className="text-[16px]" />
                  Usar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmarEliminar(medicamento)}
                  aria-label={`Quitar ${medicamento.nombre} del catálogo`}
                >
                  <Icon name="delete" className="text-[16px]" />
                  Quitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {medicamentos.length > 0 && (
        <Button variant="ghost" size="sm" onClick={confirmarLimpiar} className="self-start">
          <Icon name="delete_sweep" className="text-[16px]" />
          Vaciar catálogo
        </Button>
      )}
    </aside>
  )
}
