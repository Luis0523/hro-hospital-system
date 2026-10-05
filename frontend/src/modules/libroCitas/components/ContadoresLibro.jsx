import { Icon } from '@/shared/components/ui'
import { calcularTotal, DEFINICION_CONTADORES, normalizarContador } from '../utils/contadores'

/**
 * Sección "Contadores diarios" (componente controlado). Los valores viven en el
 * padre (`valores`); aquí solo se normalizan y se emiten por `onChange`.
 */
export default function ContadoresLibro({ valores, onChange }) {
  const total = calcularTotal(valores)

  function manejarCambio(event) {
    const { name, value } = event.target
    onChange(name, normalizarContador(value))
  }

  return (
    <section aria-label="Contadores diarios">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="analytics" className="text-[20px] text-primary" />
        <h3 className="text-title-md text-on-surface">Contadores diarios</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DEFINICION_CONTADORES.map(({ clave, sigla, nombre }) => (
          <label
            key={clave}
            className="block space-y-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2"
          >
            <span className="block text-label-sm uppercase tracking-wider text-primary">
              {sigla}
            </span>
            <span className="block text-xs text-on-surface-variant">{nombre}</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              name={clave}
              aria-label={nombre}
              value={valores?.[clave] ?? 0}
              onChange={manejarCambio}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm tabular-nums text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="text-title-sm uppercase tracking-wider text-primary">Total</span>
        <span
          data-testid="total-contadores"
          className="text-metric-sub tabular-nums text-primary"
        >
          {total}
        </span>
      </div>
    </section>
  )
}
