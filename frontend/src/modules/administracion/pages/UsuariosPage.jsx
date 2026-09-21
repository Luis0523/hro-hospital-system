/**
 * Vista informativa de "Usuarios y roles".
 *
 * --- NOTA TÉCNICA (solo para desarrollo; NO se muestra en la interfaz) ---
 * Detalles confirmados durante la inspección del backend vigente:
 *   - Existe la tabla `usuario_referencia` como registro local del usuario del
 *     proveedor externo de autenticación (aprovisionado automáticamente).
 *   - El rol del usuario vive en una columna (`rol_principal`) y NO es una
 *     entidad administrativa REST.
 *   - Existe `permiso_subespecialidad`, que relaciona usuario, subespecialidad
 *     y tipo de permiso.
 *   - El backend NO expone controladores CRUD administrativos para usuarios,
 *     roles ni permisos.
 *
 * Estos detalles NO constituyen un contrato REST consumible por el frontend.
 * No implementar endpoints, mocks ni datos ficticios a partir de ellos.
 * La vista se limita a informar que la gestión está pendiente de integración.
 */

import Alert from '@/shared/components/ui/Alert.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

const FUNCIONALIDADES_PREVISTAS = [
  {
    titulo: 'Gestión de usuarios',
    descripcion: 'Alta, consulta y control de acceso del personal del hospital.',
    icono: 'group',
  },
  {
    titulo: 'Asignación de roles',
    descripcion: 'Definición del rol operativo de cada usuario dentro del sistema.',
    icono: 'badge',
  },
  {
    titulo: 'Permisos por subespecialidad',
    descripcion: 'Autorización de tareas clínicas específicas sobre cada subespecialidad.',
    icono: 'verified_user',
  },
]

export default function UsuariosPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Usuarios y roles</h2>
        <p className="text-sm text-slate-500">
          Administración del personal, sus roles y sus permisos en el hospital.
        </p>
      </header>

      <Alert tone="info" title="Gestión no disponible todavía">
        La gestión de usuarios, roles y permisos requiere integración con los servicios
        correspondientes del sistema y todavía no se encuentra disponible.
      </Alert>

      <Card className="space-y-4">
        <h3 className="text-headline-sm text-slate-700">Funcionalidades previstas</h3>
        <p className="text-sm text-slate-500">
          Estas capacidades forman parte del Panel de Administración y se habilitarán cuando la
          integración esté lista.
        </p>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                Pendiente de integración
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
