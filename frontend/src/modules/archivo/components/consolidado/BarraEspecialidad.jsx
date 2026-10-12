import { porcentajeDe } from '../../utils/metricasConsolidado'

// Barra horizontal accesible para el consolidado por especialidad. Sin librería
// de gráficas: HTML + Tailwind. Cifras siempre visibles. Presentacional.
export default function BarraEspecialidad({ etiqueta, total, maximo = 0, totalGeneral = 0 }) {
  const ancho = maximo > 0 ? Math.round((total / maximo) * 100) : 0
  const porcentaje = porcentajeDe(total, totalGeneral)

  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-body-sm">
        <span className="min-w-0 truncate text-on-surface">{etiqueta}</span>
        <span className="shrink-0 tabular-nums text-on-surface-variant">
          {total} ({porcentaje}%)
        </span>
      </div>
      <div
        role="img"
        aria-label={`${etiqueta}: ${total} expedientes (${porcentaje}%)`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${ancho}%` }} />
      </div>
    </li>
  )
}
