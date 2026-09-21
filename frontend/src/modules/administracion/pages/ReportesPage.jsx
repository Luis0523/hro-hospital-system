/**
 * Vista informativa de "Reportes".
 *
 * --- NOTA TÉCNICA (solo para desarrollo; NO se muestra en la interfaz) ---
 * El backend vigente NO expone endpoints agregados de reportes ni estadísticas
 * (no hay conteos por estado, demanda, inasistencias ni utilización de cupos).
 * Tampoco debe utilizarse GET /cupos para generar estadísticas desde el frontend:
 * ese endpoint es operativo y tiene efectos secundarios (crea registros diarios),
 * además de no ofrecer un resultado agregado.
 *
 * Por lo anterior esta pantalla es únicamente descriptiva: no consulta APIs,
 * no usa mocks y no presenta cifras. Los reportes reales quedan pendientes de
 * contrato backend.
 */

import Alert from '@/shared/components/ui/Alert.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

const ESTADO_PENDIENTE = 'Pendiente de integración'

const REPORTES_PREVISTOS = [
  {
    titulo: 'Citas por estado',
    descripcion: 'Consulta de citas programadas, atendidas, canceladas y reprogramadas.',
    icono: 'event_note',
  },
  {
    titulo: 'Inasistencias',
    descripcion: 'Consulta de pacientes que no asistieron a sus citas.',
    icono: 'person_off',
  },
  {
    titulo: 'Demanda',
    descripcion: 'Análisis de demanda por especialidad y subespecialidad.',
    icono: 'insights',
  },
  {
    titulo: 'Utilización de cupos',
    descripcion: 'Consulta de utilización de la capacidad programada por médico.',
    icono: 'event_available',
  },
]

export default function ReportesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Reportes</h2>
        <p className="text-sm text-slate-500">
          Consulta de información administrativa sobre citas, demanda y capacidad.
        </p>
      </header>

      <Alert tone="info" title="Reportes no disponibles todavía">
        La generación de reportes administrativos requiere integración con los servicios
        correspondientes del sistema y todavía no se encuentra disponible.
      </Alert>

      <Card className="space-y-4">
        <h3 className="text-headline-sm text-slate-700">Reportes previstos</h3>
        <p className="text-sm text-slate-500">
          Estas consultas forman parte del Panel de Administración y se habilitarán cuando la
          integración esté lista.
        </p>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REPORTES_PREVISTOS.map((reporte) => (
            <li
              key={reporte.titulo}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2">
                <Icon name={reporte.icono} className="text-[22px] text-hro-celeste" />
                <h4 className="text-sm font-semibold text-slate-700">{reporte.titulo}</h4>
              </div>
              <p className="text-sm text-slate-500">{reporte.descripcion}</p>
              <span className="mt-auto inline-flex w-fit rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {ESTADO_PENDIENTE}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
