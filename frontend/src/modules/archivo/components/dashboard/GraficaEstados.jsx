import { metadatosEstado } from '../../estadosExpediente'
import {
  maximoPorEstado,
  ordenarEstados,
  porcentaje,
  sumarPorEstado,
} from '../../utils/metricasArchivo'

// Distribución de expedientes por estado como barras horizontales. Sin
// librerías de gráficas: HTML + Tailwind. Los colores provienen de
// `metadatosEstado` (fuente única de estados). Presentacional.
export default function GraficaEstados({ porEstado = [] }) {
  const ordenados = ordenarEstados(porEstado)
  if (ordenados.length === 0) return null

  const total = sumarPorEstado(ordenados)
  const maximo = maximoPorEstado(ordenados)

  return (
    <section
      aria-label="Distribución por estado"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <h3 className="mb-3 text-title-md text-on-surface">Distribución por estado</h3>

      <ul className="space-y-3">
        {ordenados.map((item) => {
          const meta = metadatosEstado(item.estado)
          const ancho = maximo > 0 ? Math.round((item.total / maximo) * 100) : 0
          const pct = porcentaje(item.total, total)

          return (
            <li key={item.estado} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-body-sm">
                <span className="flex min-w-0 items-center gap-2 text-on-surface">
                  <span
                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${meta.punto}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{meta.etiqueta}</span>
                </span>
                <span className="shrink-0 tabular-nums text-on-surface-variant">
                  {item.total} ({pct}%)
                </span>
              </div>
              <div
                role="img"
                aria-label={`${meta.etiqueta}: ${item.total} expedientes (${pct}%)`}
                className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
              >
                <div
                  className={`h-full rounded-full ${meta.punto}`}
                  style={{ width: `${ancho}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
