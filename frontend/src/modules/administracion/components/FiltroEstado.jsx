import { useId } from 'react'

export const OPCIONES_ESTADO = [
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
  { value: 'todos', label: 'Todos' },
]

/**
 * Filtro de estado de un catálogo administrativo.
 * Usa un <select> nativo con <label htmlFor> para garantizar accesibilidad y
 * navegación por teclado, sin depender de shared/ui/Select.
 */
export default function FiltroEstado({
  valor = 'activos',
  onChange,
  label = 'Estado',
  className = '',
}) {
  const id = `filtro-estado-${useId()}`

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
      >
        {label}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => onChange?.(evento.target.value)}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {OPCIONES_ESTADO.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </div>
  )
}
