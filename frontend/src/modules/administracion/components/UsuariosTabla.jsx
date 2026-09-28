import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { etiquetaRol } from '../utils/usuarios.js'

function EstadoBadge({ activo }) {
  const activoBool = Boolean(activo)
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
        activoBool
          ? 'bg-secondary-container text-on-secondary-container'
          : 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      {activoBool ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RolBadge({ rol }) {
  return (
    <span className="inline-block rounded bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface">
      {etiquetaRol(rol)}
    </span>
  )
}

function Acciones({ usuario, onVer, onCambiarRol, onAlternarEstado, onGestionarPermisos }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" onClick={() => onVer?.(usuario)}>
        Ver
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onGestionarPermisos?.(usuario)}>
        Permisos
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onCambiarRol?.(usuario)}>
        Cambiar rol
      </Button>
      {usuario.activo ? (
        <Button size="sm" variant="danger" onClick={() => onAlternarEstado?.(usuario)}>
          Desactivar
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => onAlternarEstado?.(usuario)}>
          Activar
        </Button>
      )}
    </div>
  )
}

/**
 * Listado responsive de usuarios: tabla en escritorio y tarjetas en móvil.
 */
export default function UsuariosTabla({
  usuarios = [],
  cargando = false,
  error = null,
  onReintentar,
  onVer,
  onCambiarRol,
  onAlternarEstado,
  onGestionarPermisos,
}) {
  if (cargando) {
    return <Spinner label="Cargando usuarios..." />
  }

  if (error) {
    return (
      <Alert tone="error" title="No se pudo cargar la información">
        <p>{error}</p>
        {onReintentar && (
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={onReintentar}>
              Reintentar
            </Button>
          </div>
        )}
      </Alert>
    )
  }

  if (usuarios.length === 0) {
    return (
      <EmptyState
        title="Sin usuarios"
        description="No hay usuarios que coincidan con los filtros seleccionados."
      />
    )
  }

  const acciones = (usuario) => (
    <Acciones
      usuario={usuario}
      onVer={onVer}
      onCambiarRol={onCambiarRol}
      onAlternarEstado={onAlternarEstado}
      onGestionarPermisos={onGestionarPermisos}
    />
  )

  return (
    <div>
      <div data-testid="usuarios-escritorio" className="hidden xl:block">
        <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
          <table className="min-w-full divide-y divide-outline-variant/60 text-sm">
            <caption className="sr-only">Listado de usuarios</caption>
            <thead className="bg-surface-container-low">
              <tr>
                {['Nombre', 'Identificador', 'Rol', 'Estado', 'Acciones'].map((titulo) => (
                  <th
                    key={titulo}
                    scope="col"
                    className="px-4 py-2 text-left text-label-sm uppercase tracking-wider text-outline"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-2 font-medium text-on-surface">
                    {usuario.nombreMostrar}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-on-surface-variant">
                    {usuario.idExterno}
                  </td>
                  <td className="px-4 py-2">
                    <RolBadge rol={usuario.rolPrincipal} />
                  </td>
                  <td className="px-4 py-2">
                    <EstadoBadge activo={usuario.activo} />
                  </td>
                  <td className="px-4 py-2">{acciones(usuario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div data-testid="usuarios-movil" className="space-y-3 xl:hidden">
        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">
                  {usuario.nombreMostrar}
                </p>
                <p className="truncate font-mono text-xs text-on-surface-variant">
                  {usuario.idExterno}
                </p>
              </div>
              <EstadoBadge activo={usuario.activo} />
            </div>
            <div className="mt-2">
              <RolBadge rol={usuario.rolPrincipal} />
            </div>
            <div className="mt-3 border-t border-outline-variant/40 pt-3">{acciones(usuario)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
