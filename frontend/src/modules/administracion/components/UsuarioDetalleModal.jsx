import { useEffect, useId, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import { formatearFechaHora } from '../utils/fechas.js'
import { etiquetaRol } from '../utils/usuarios.js'

function Campo({ etiqueta, children }) {
  return (
    <div className="flex flex-col">
      <dt className="text-label-sm uppercase tracking-wider text-outline">{etiqueta}</dt>
      <dd className="text-sm text-on-surface">{children}</dd>
    </div>
  )
}

/**
 * Detalle de usuario (solo datos reales del DTO) más acciones: cambiar rol,
 * activar/desactivar y gestionar permisos. Puede abrirse con el registro del
 * listado, sin necesidad de consultar GET /usuarios/{id}.
 */
export default function UsuarioDetalleModal({
  abierto,
  usuario,
  roles = [],
  onCerrar,
  onCambiarRol,
  onAlternarEstado,
  onGestionarPermisos,
  guardandoRol = false,
}) {
  const idRol = `usuario-rol-${useId()}`
  const [rolSeleccionado, setRolSeleccionado] = useState(usuario?.rolPrincipal ?? '')

  useEffect(() => {
    setRolSeleccionado(usuario?.rolPrincipal ?? '')
  }, [usuario?.id, usuario?.rolPrincipal])

  const hayCambioRol = usuario && rolSeleccionado && rolSeleccionado !== usuario.rolPrincipal

  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      title="Detalle del usuario"
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button variant="secondary" onClick={() => onGestionarPermisos?.(usuario)}>
            Gestionar permisos
          </Button>
          <Button
            variant={usuario?.activo ? 'danger' : 'primary'}
            onClick={() => onAlternarEstado?.(usuario)}
          >
            {usuario?.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </>
      }
    >
      <dl className="space-y-3">
        <Campo etiqueta="Nombre">{usuario?.nombreMostrar}</Campo>
        <Campo etiqueta="Identificador">
          <span className="font-mono text-xs">{usuario?.idExterno}</span>
        </Campo>
        <Campo etiqueta="Rol actual">{etiquetaRol(usuario?.rolPrincipal)}</Campo>
        <Campo etiqueta="Estado">{usuario?.activo ? 'Activo' : 'Inactivo'}</Campo>
        <Campo etiqueta="Último acceso">
          {usuario?.ultimoAcceso ? formatearFechaHora(usuario.ultimoAcceso) : 'No disponible'}
        </Campo>
        <Campo etiqueta="Creado">
          {usuario?.creadoEn ? formatearFechaHora(usuario.creadoEn) : 'No disponible'}
        </Campo>
      </dl>

      <div className="mt-4 space-y-2 rounded-lg bg-surface-container-low p-3">
        <label
          htmlFor={idRol}
          className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
        >
          Rol principal
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <select
            id={idRol}
            value={rolSeleccionado}
            onChange={(evento) => setRolSeleccionado(evento.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {roles.map((rol) => (
              <option key={rol} value={rol}>
                {etiquetaRol(rol)}
              </option>
            ))}
          </select>
          <Button
            onClick={() => onCambiarRol?.(usuario, rolSeleccionado)}
            disabled={!hayCambioRol || guardandoRol}
          >
            {guardandoRol ? 'Guardando...' : 'Guardar rol'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
