/**
 * Vista informativa de "Auditoría".
 *
 * --- NOTA TÉCNICA (solo para desarrollo; NO se muestra en la interfaz) ---
 * Backend vigente:
 *   - Existe el endpoint GET /api/v1/auditoria, con filtros `tabla` y `usuarioId`
 *     y paginación vía Pageable (page base 0, size por defecto 20, orden `fecha` descendente).
 *   - Devuelve registros de bitácora general (tabla, entidad, acción, usuario y fecha),
 *     además de los valores anteriores y nuevos del cambio.
 *
 * Motivos por los que NO se integra todavía:
 *   - Los listados con resultados fallan con error 500 al serializar una relación
 *     JPA lazy (`usuarioReferencia`) fuera de sesión (`open-in-view: false`).
 *   - El endpoint aún no cuenta con autorización efectiva en el backend.
 *   - Los campos de valores anteriores/nuevos pueden contener información personal
 *     y clínica; no existe todavía una política confirmada de exposición.
 *
 * Por lo anterior esta pantalla es únicamente descriptiva: no consulta APIs, no usa
 * mocks y no presenta registros. La consulta real queda pendiente de backend.
 */

import Alert from '@/shared/components/ui/Alert.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

const ESTADO_PENDIENTE = 'Pendiente de integración'

const FUNCIONALIDADES_PREVISTAS = [
  {
    titulo: 'Consulta de registros',
    descripcion: 'Consulta cronológica de las operaciones registradas en el sistema.',
    icono: 'history',
  },
  {
    titulo: 'Filtro por recurso',
    descripcion: 'Consulta de actividad asociada a los distintos recursos del sistema.',
    icono: 'category',
  },
  {
    titulo: 'Filtro por usuario',
    descripcion: 'Consulta de actividad asociada al usuario responsable de una operación.',
    icono: 'person_search',
  },
  {
    titulo: 'Trazabilidad de cambios',
    descripcion: 'Seguimiento de las modificaciones registradas por el sistema.',
    icono: 'track_changes',
  },
]

export default function AuditoriaPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Auditoría</h2>
        <p className="text-sm text-slate-500">
          Consulta de trazabilidad de las operaciones realizadas en el sistema (solo lectura).
        </p>
      </header>

      <Alert tone="info" title="Consulta no disponible todavía">
        La consulta de auditoría requiere integración segura con los servicios correspondientes del
        sistema y todavía no se encuentra disponible.
      </Alert>

      <Card className="space-y-4">
        <h3 className="text-headline-sm text-slate-700">Funcionalidades previstas</h3>
        <p className="text-sm text-slate-500">
          Estas capacidades forman parte del Panel de Administración y se habilitarán cuando la
          integración esté lista.
        </p>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCIONALIDADES_PREVISTAS.map((funcionalidad) => (
            <li
              key={funcionalidad.titulo}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2">
                <Icon name={funcionalidad.icono} className="text-[22px] text-hro-celeste" />
                <h4 className="text-sm font-semibold text-slate-700">{funcionalidad.titulo}</h4>
              </div>
              <p className="text-sm text-slate-500">{funcionalidad.descripcion}</p>
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
