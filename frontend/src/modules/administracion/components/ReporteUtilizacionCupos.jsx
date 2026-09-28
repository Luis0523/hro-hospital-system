/**
 * Utilización de cupos. Muestra los valores del backend y una barra visual
 * basada directamente en `utilizacionPorcentaje` (porcentaje ya calculado).
 */
export default function ReporteUtilizacionCupos({ datos }) {
  if (!datos) return null

  const { capacidadTotal, cuposOcupados, cuposDisponibles, utilizacionPorcentaje } = datos

  const metricas = [
    { etiqueta: 'Capacidad total', valor: capacidadTotal },
    { etiqueta: 'Ocupados', valor: cuposOcupados },
    { etiqueta: 'Disponibles', valor: cuposDisponibles },
    { etiqueta: 'Utilización', valor: `${utilizacionPorcentaje}%` },
  ]

  return (
    <div className="space-y-4">
      <dl data-testid="reporte-utilizacion" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metricas.map((metrica) => (
          <div
            key={metrica.etiqueta}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3"
          >
            <dt className="text-xs uppercase tracking-wide text-outline">{metrica.etiqueta}</dt>
            <dd className="text-headline-sm font-semibold text-on-surface">{metrica.valor}</dd>
          </div>
        ))}
      </dl>

      {capacidadTotal > 0 && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${utilizacionPorcentaje}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-outline">Utilización: {utilizacionPorcentaje}%</p>
        </div>
      )}
    </div>
  )
}
