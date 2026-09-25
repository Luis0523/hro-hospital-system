import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'

/**
 * Orquesta el ciclo de vida de un catálogo administrable:
 * carga, estado de error/vacío, modal crear/editar/consultar y baja lógica.
 * No aplica reglas de negocio: delega en las funciones API entregadas.
 */
export default function useGestionCatalogo({
  cargar,
  crear,
  actualizar,
  desactivar,
  mensajes = {},
}) {
  const { mostrarToast } = useToast()
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [porDesactivar, setPorDesactivar] = useState(null)
  const [desactivando, setDesactivando] = useState(false)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await cargar()
      setDatos(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo cargar la información')
    } finally {
      setCargando(false)
    }
  }, [cargar])

  useEffect(() => {
    recargar()
  }, [recargar])

  const abrirCrear = useCallback(() => setModal({ modo: 'crear', registro: null }), [])
  const abrirVer = useCallback((registro) => setModal({ modo: 'consultar', registro }), [])
  const abrirEditar = useCallback((registro) => setModal({ modo: 'editar', registro }), [])
  const cerrarModal = useCallback(() => setModal(null), [])

  const guardar = useCallback(
    async (valores) => {
      if (!modal) return
      setGuardando(true)
      try {
        if (modal.modo === 'crear') {
          await crear(valores)
          mostrarToast({ title: mensajes.crear ?? 'Registro creado', tone: 'success' })
        } else if (modal.modo === 'editar') {
          await actualizar(modal.registro.id, valores)
          mostrarToast({ title: mensajes.editar ?? 'Registro actualizado', tone: 'success' })
        }
        setModal(null)
        await recargar()
      } catch (fallo) {
        mostrarToast({
          title: 'No se pudo guardar',
          message: fallo?.message || 'Verifique los datos e intente nuevamente',
          tone: 'error',
        })
      } finally {
        setGuardando(false)
      }
    },
    [modal, crear, actualizar, mostrarToast, mensajes, recargar],
  )

  const solicitarDesactivar = useCallback((registro) => setPorDesactivar(registro), [])
  const cancelarDesactivar = useCallback(() => setPorDesactivar(null), [])

  const confirmarDesactivar = useCallback(async () => {
    if (!porDesactivar) return
    setDesactivando(true)
    try {
      await desactivar(porDesactivar.id)
      mostrarToast({ title: mensajes.desactivar ?? 'Registro desactivado', tone: 'success' })
      setPorDesactivar(null)
      await recargar()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo desactivar',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setDesactivando(false)
    }
  }, [porDesactivar, desactivar, mostrarToast, mensajes, recargar])

  return {
    datos,
    cargando,
    error,
    recargar,
    modal,
    abrirCrear,
    abrirVer,
    abrirEditar,
    cerrarModal,
    guardar,
    guardando,
    porDesactivar,
    solicitarDesactivar,
    cancelarDesactivar,
    confirmarDesactivar,
    desactivando,
  }
}
