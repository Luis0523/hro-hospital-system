import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import FilaExpedienteCoex from './FilaExpedienteCoex.jsx'

// Sección de solo lectura del lote (Pendientes de recibir / En uso).
export default function SeccionLoteCoex({ titulo, descripcion, filas = [], vacio }) {
  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-title-md text-on-surface">{titulo}</h2>
          {descripcion && <p className="text-body-sm text-on-surface-variant">{descripcion}</p>}
        </div>
        <span className="rounded-lg bg-surface-container px-3 py-1 text-label-md font-bold text-on-surface">
          {filas.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState title={vacio?.title} description={vacio?.description} />
      ) : (
        <ul className="flex flex-col gap-2">
          {filas.map((fila) => (
            <FilaExpedienteCoex key={fila.cicloId ?? fila.citaId} fila={fila} />
          ))}
        </ul>
      )}
    </section>
  )
}
