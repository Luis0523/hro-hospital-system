import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  activarUsuario,
  actualizarRolUsuario,
  desactivarUsuario,
  listarRoles,
  listarUsuarios,
} from '../api/administracionApi.js'
import FiltroEstado from '../components/FiltroEstado.jsx'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import PermisosUsuarioModal from '../components/PermisosUsuarioModal.jsx'
import UsuarioDetalleModal from '../components/UsuarioDetalleModal.jsx'
import UsuariosTabla from '../components/UsuariosTabla.jsx'
import { etiquetaRol } from '../utils/usuarios.js'

const OPCIONES_ROL = [{ value: '', label: 'Todos' }]

export default function UsuariosPage() {
  const { mostrarToast } = useToast()
  const { usuario: usuarioActual } = useAuth()

  const [estado, setEstado] = useState('activos')
  const [rol, setRol] = useState('')
  const [roles, setRoles] = useState([])

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [detalle, setDetalle] = useState(null)
  const [permisosPara, setPermisosPara] = useState(null)
  const [porAlternar, setPorAlternar] = useState(null)
  const [alternando, setAlternando] = useState(false)
  const [guardandoRol, setGuardandoRol] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await listarUsuarios({ estado, rol: rol || undefined })
      setUsuarios(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setUsuarios([])
      setError(fallo?.message || 'No se pudieron cargar los usuarios')
    } finally {
      setCargando(false)
    }
  }, [estado, rol])

  useEffect(() => {
    let vigente = true
    listarRoles()
      .then((lista) => {
        if (vigente) setRoles(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vigente) setRoles([])
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirDetalle = (usuario) => setDetalle(usuario)
  const abrirPermisos = (usuario) => setPermisosPara(usuario)

  const cambiarRol = async (usuario, rolPrincipal) => {
    if (!usuario || !rolPrincipal || rolPrincipal === usuario.rolPrincipal) return
    setGuardandoRol(true)
    try {
      const actualizado = await actualizarRolUsuario(usuario.id, { rolPrincipal })
      mostrarToast({ title: 'Rol actualizado', tone: 'success' })
      setDetalle((previo) => (previo && previo.id === usuario.id ? actualizado : previo))
      await cargar()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo actualizar el rol',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setGuardandoRol(false)
    }
  }

  const solicitarAlternar = (usuario) => setPorAlternar(usuario)
  const cancelarAlternar = () => setPorAlternar(null)

  const confirmarAlternar = async () => {
    if (!porAlternar) return
    setAlternando(true)
    try {
      const actualizado = porAlternar.activo
        ? await desactivarUsuario(porAlternar.id)
        : await activarUsuario(porAlternar.id)
      mostrarToast({
        title: actualizado.activo ? 'Usuario activado' : 'Usuario desactivado',
        tone: 'success',
      })
      setDetalle((previo) => (previo && previo.id === porAlternar.id ? actualizado : previo))
      setPorAlternar(null)
      await cargar()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo actualizar el usuario',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setAlternando(false)
    }
  }

  const mensajeConfirmacion = (usuario) => {
    if (!usuario) return ''
    const accion = usuario.activo ? 'desactivar' : 'activar'
    let mensaje = `¿Deseas ${accion} a ${usuario.nombreMostrar}?`
    if (usuario.activo && usuario.idExterno === usuarioActual?.idExterno) {
      mensaje += ' Estás desactivando el usuario actualmente identificado en esta sesión.'
    }
    if (usuario.activo && usuario.rolPrincipal === 'administrador') {
      mensaje += ' Este usuario tiene rol Administrador.'
    }
    return mensaje
  }

  const opcionesRol = [
    ...OPCIONES_ROL,
    ...roles.map((valor) => ({ value: valor, label: etiquetaRol(valor) })),
  ]

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-headline-md text-primary">Usuarios y roles</h2>
        <p className="text-sm text-outline">
          Consulta, activación y asignación de rol de los usuarios internos.
        </p>
        <p className="text-xs text-on-surface-variant">
          Los usuarios se aprovisionan desde el proveedor de identidad institucional.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-md text-sm text-outline">
          Gestión de permisos por subespecialidad disponible en cada usuario.
        </p>
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
          <FiltroEstado valor={estado} onChange={setEstado} className="w-full sm:w-44" />
          <div className="w-full space-y-1 sm:w-44">
            <label
              htmlFor="filtro-rol"
              className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Rol
            </label>
            <select
              id="filtro-rol"
              value={rol}
              onChange={(evento) => setRol(evento.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {opcionesRol.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <UsuariosTabla
        usuarios={usuarios}
        cargando={cargando}
        error={error}
        onReintentar={cargar}
        onVer={abrirDetalle}
        onCambiarRol={abrirDetalle}
        onAlternarEstado={solicitarAlternar}
        onGestionarPermisos={abrirPermisos}
      />

      <UsuarioDetalleModal
        abierto={Boolean(detalle)}
        usuario={detalle}
        roles={roles}
        onCerrar={() => setDetalle(null)}
        onCambiarRol={cambiarRol}
        onAlternarEstado={solicitarAlternar}
        onGestionarPermisos={(usuario) => {
          setDetalle(null)
          abrirPermisos(usuario)
        }}
        guardandoRol={guardandoRol}
      />

      <PermisosUsuarioModal
        abierto={Boolean(permisosPara)}
        usuario={permisosPara}
        onCerrar={() => setPermisosPara(null)}
      />

      <ModalConfirmacion
        abierto={Boolean(porAlternar)}
        titulo={porAlternar?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        mensaje={mensajeConfirmacion(porAlternar)}
        textoConfirmar={porAlternar?.activo ? 'Sí, desactivar' : 'Sí, activar'}
        onConfirmar={confirmarAlternar}
        onCancelar={cancelarAlternar}
        procesando={alternando}
      />
    </section>
  )
}
