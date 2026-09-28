import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import TarjetaIndicador from './TarjetaIndicador.jsx'

// Etiquetas humanas para claves conocidas; claves desconocidas se muestran tal cual.
const ETIQUETAS_ESTADO = {
  pendiente: 'Pendientes',
  confirmada: 'Confirmadas',
  atendida: 'Atendidas',
  cancelada: 'Canceladas',
  reprogramada: 'Reprogramadas',
  no_asistio: 'Inasistencias',
}

export default function ReporteCitasPorEstado({ datos }) {
  if (!datos) return null

  const entradas = Object.entries(datos.porEstado ?? {})

  return (
    <div className="space-y-4">
      <TarjetaIndicador
        testId="reporte-citas-total"
        titulo="Total de citas"
        icono="event_note"
        descripcion="Citas registradas en el rango seleccionado."
      >
        <p className="text-metric-display font-bold text-primary">{datos.total}</p>
      </TarjetaIndicador>

      {entradas.length === 0 ? (
        <EmptyState
          title="Sin datos"
          description="No hay citas registradas en el rango seleccionado."
        />
      ) : (
        <dl
          data-testid="reporte-citas-estados"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {entradas.map(([estado, valor]) => (
            <div
              key={estado}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3"
            >
              <dt className="text-xs uppercase tracking-wide text-outline">
                {ETIQUETAS_ESTADO[estado] ?? estado}
              </dt>
              <dd className="text-headline-sm font-semibold text-on-surface">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
