import Card from '@/shared/components/ui/Card.jsx'
import Alert from '@/shared/components/ui/Alert.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

const TARJETAS = [
  {
    titulo: 'Citas del día',
    icono: 'event',
    descripcion: 'Resumen de las citas programadas para la jornada.',
  },
  {
    titulo: 'Cupos disponibles',
    icono: 'event_available',
    descripcion: 'Disponibilidad de cupos por clínica.',
  },
  {
    titulo: 'Alertas administrativas',
    icono: 'notifications',
    descripcion: 'Avisos pendientes de revisión por administración.',
  },
]

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-lg text-hro-blue">Dashboard</h2>
        <p className="text-sm text-slate-500">Resumen general del Panel de Administración.</p>
      </header>

      <Alert tone="info" title="Integración de datos pendiente">
        Estos indicadores se conectarán al backend en una fase posterior. No se muestran cifras
        mientras no exista el contrato de datos.
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS.map((tarjeta) => (
          <Card key={tarjeta.titulo} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name={tarjeta.icono} className="text-[22px] text-hro-celeste" />
              <h3 className="text-headline-sm text-slate-700">{tarjeta.titulo}</h3>
            </div>
            <p className="text-sm text-slate-500">{tarjeta.descripcion}</p>
            <p className="mt-auto rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
              Dato pendiente de integración
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}
