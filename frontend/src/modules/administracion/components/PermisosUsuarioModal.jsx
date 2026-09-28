import { useCallback, useEffect, useId, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  asignarPermisoSubespecialidad,
  desactivarPermisoSubespecialidad,
  listarPermisosUsuario,
  listarSubespecialidades,
  reactivarPermisoSubespecialidad,
} from '../api/administracionApi.js'
import FiltroEstado from './FiltroEstado.jsx'
import { TIPOS_PERMISO, etiquetaTipoPermiso } from '../utils/usuarios.js'

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

/**
 * Gestión de permisos de un usuario sobre subespecialidades. La baja es lógica y
 * el POST puede reactivar un permiso inactivo (semántica del backend).
 */
export default function PermisosUsuarioModal({ abierto, usuario, onCerrar }) {
  const { mostrarToast } = useToast()
  const idSubespecialidad = `permiso-sub-${useId()}`
  const idTipo = `permiso-tipo-${useId()}`

  const [estado, setEstado] = useState('activos')
  const [permisos, setPermisos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [subespecialidades, setSubespecialidades] = useState([])
  const [formulario, setFormulario] = useState({ subespecialidadId: '', tipoPermiso: TIPOS_PERMISO[0].value })
  const [asignando, setAsignando] = useState(false)

  const cargarPermisos = useCallback(async () => {
    if (!usuario) return
    setCargando(true)
    setError(null)
    try {
      const lista = await listarPermisosUsuario(usuario.id, estado)
      setPermisos(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setPermisos([])
      setError(fallo?.message || 'No se pudieron cargar los permisos')
    } finally {
      setCargando(false)
    }
  }, [usuario, estado])

  useEffect(() => {
    if (abierto) cargarPermisos()
  }, [abierto, cargarPermisos])

  useEffect(() => {
    if (!abierto) return undefined
    let vigente = true
    listarSubespecialidades(undefined, 'activos')
      .then((lista) => {
        if (vigente) setSubespecialidades(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vigente) setSubespecialidades([])
      })
    return () => {
      vigente = false
    }
  }, [abierto])

  const asignar = async () => {
    if (!usuario || !formulario.subespecialidadId || !formulario.tipoPermiso) return
    setAsignando(true)
    try {
      await asignarPermisoSubespecialidad({
        usuarioId: usuario.id,
        subespecialidadId: Number(formulario.subespecialidadId),
        tipoPermiso: formulario.tipoPermiso,
      })
      mostrarToast({ title: 'Permiso asignado', tone: 'success' })
      setFormulario((previo) => ({ ...previo, subespecialidadId: '' }))
      await cargarPermisos()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo asignar el permiso',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setAsignando(false)
    }
  }

  const alternar = async (permiso) => {
    try {
      if (permiso.activo) {
        await desactivarPermisoSubespecialidad(permiso.id)
        mostrarToast({ title: 'Permiso desactivado', tone: 'success' })
      } else {
        await reactivarPermisoSubespecialidad(permiso.id)
        mostrarToast({ title: 'Permiso reactivado', tone: 'success' })
      }
      await cargarPermisos()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo actualizar el permiso',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    }
  }

  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      title={`Permisos de ${usuario?.nombreMostrar ?? ''}`}
      footer={
        <Button variant="secondary" onClick={onCerrar}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor={idSubespecialidad}
              className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Subespecialidad
            </label>
            <select
              id={idSubespecialidad}
              value={formulario.subespecialidadId}
              onChange={(evento) =>
                setFormulario((previo) => ({ ...previo, subespecialidadId: evento.target.value }))
              }
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Seleccione una subespecialidad</option>
              {subespecialidades.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={idTipo}
              className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Tipo de permiso
            </label>
            <select
              id={idTipo}
              value={formulario.tipoPermiso}
              onChange={(evento) =>
                setFormulario((previo) => ({ ...previo, tipoPermiso: evento.target.value }))
              }
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TIPOS_PERMISO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={asignar} disabled={!formulario.subespecialidadId || asignando}>
          {asignando ? 'Asignando...' : 'Asignar permiso'}
        </Button>

        <div className="border-t border-outline-variant/40 pt-3">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <h4 className="text-sm font-semibold text-on-surface">Permisos registrados</h4>
            <FiltroEstado valor={estado} onChange={setEstado} className="w-full sm:w-48" />
          </div>

          {cargando && <Spinner label="Cargando permisos..." />}

          {!cargando && error && (
            <Alert tone="error" title="No se pudieron cargar los permisos">
              <p>{error}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={cargarPermisos}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {!cargando && !error && permisos.length === 0 && (
            <EmptyState
              title="Sin permisos"
              description="No hay permisos que coincidan con el filtro seleccionado."
            />
          )}

          {!cargando && !error && permisos.length > 0 && (
            <ul data-testid="lista-permisos" className="space-y-2">
              {permisos.map((permiso) => (
                <li
                  key={permiso.id}
                  className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">
                        {permiso.subespecialidadNombre}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {permiso.especialidadNombre} · {etiquetaTipoPermiso(permiso.tipoPermiso)}
                      </p>
                    </div>
                    <EstadoBadge activo={permiso.activo} />
                  </div>
                  <div className="mt-2">
                    {permiso.activo ? (
                      <Button size="sm" variant="danger" onClick={() => alternar(permiso)}>
                        Desactivar
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => alternar(permiso)}>
                        Reactivar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
