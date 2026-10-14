import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { guardarCache, leerCache } from '@/shared/utils/cache'
import { hoyIso } from '@/shared/utils/fecha'
import {
  corregirEspecialidadCarnet,
  listarCarnets,
  listarEspecialidades,
  listarEspecialidadesActivasEstacion,
  registrarCarnet,
} from '@/modules/carnets/api/carnetsApi'

// Últimos registros conservados en caché para la corrección inmediata de
// especialidad (ventana que habilita el backend para enfermería).
const CACHE_RECIENTES = 'carnets_recientes'
const MAX_RECIENTES = 2
const TTL_RECIENTES_MS = 12 * 60 * 60 * 1000 // 12 h (el día operativo)

// Orden por más reciente (registradoEn descendente).
function ordenarPorReciente(lista) {
  return [...lista].sort((a, b) => new Date(b.registradoEn ?? 0) - new Date(a.registradoEn ?? 0))
}

function recientesIniciales() {
  const cache = leerCache(CACHE_RECIENTES)
  if (!Array.isArray(cache)) return []
  const hoy = hoyIso()
  return cache.filter((c) => c?.fecha === hoy).slice(0, MAX_RECIENTES)
}

// Estado de la vista "Registro de carnets" (enfermería). El flujo: elegir
// especialidad -> escanear/teclear expediente -> el backend consulta el API del
// hospital y asigna el correlativo diario por especialidad.
// `estado`: inicial | registrando | registrado | duplicado | error.
export function useRegistroCarnets({ estacionId } = {}) {
  const { mostrarToast } = useToast()
  const [expediente, setExpediente] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [especialidades, setEspecialidades] = useState([])
  // Últimos 2 (corrección inmediata); no se recargan del backend al montar.
  const [recientes, setRecientes] = useState(recientesIniciales)
  // Tabla completa del día: solo por petición manual ("Ver carnets de hoy").
  const [registros, setRegistros] = useState([])
  const [cargandoTabla, setCargandoTabla] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [mensaje, setMensaje] = useState(null)
  const [procesando, setProcesando] = useState(false)

  const inputRef = useRef(null)
  const enCurso = useRef(false)

  const enfocar = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  // Persiste los últimos 2 ante cada cambio (cambio de pestaña/recarga incluidos).
  useEffect(() => {
    guardarCache(CACHE_RECIENTES, recientes, TTL_RECIENTES_MS)
  }, [recientes])

  // Especialidades a mostrar: las que tienen atención activa hoy en la estación
  // de la sesión. Si no hay estación o el endpoint no devuelve nada, cae al
  // catálogo completo de especialidades activas.
  useEffect(() => {
    let activo = true
    async function cargar() {
      if (estacionId) {
        try {
          const activas = await listarEspecialidadesActivasEstacion(estacionId, { fecha: hoyIso() })
          if (activo && Array.isArray(activas) && activas.length > 0) {
            setEspecialidades(activas)
            return
          }
        } catch {
          // Sin respuesta de la estación: se usa el catálogo completo.
        }
      }
      try {
        const todas = await listarEspecialidades()
        if (activo) setEspecialidades(todas)
      } catch {
        if (activo) setEspecialidades([])
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [estacionId])

  // Carga manual de la tabla completa del día (no automática).
  const cargarRegistros = useCallback(async () => {
    setCargandoTabla(true)
    try {
      const lista = await listarCarnets()
      setRegistros(ordenarPorReciente(lista))
      return lista
    } catch {
      setRegistros([])
      return []
    } finally {
      setCargandoTabla(false)
    }
  }, [])

  const registrar = useCallback(
    async (valor) => {
      const numero = String(valor ?? '').trim()
      if (!numero || enCurso.current) return
      if (!especialidadId) {
        setEstado('error')
        setMensaje('Seleccione la especialidad antes de registrar el carnet.')
        enfocar()
        return
      }
      enCurso.current = true
      setProcesando(true)
      setEstado('registrando')
      setMensaje(null)
      try {
        const registro = await registrarCarnet({
          numeroExpediente: numero,
          especialidadId: Number(especialidadId),
        })
        setResultado(registro)
        setEstado('registrado')
        setExpediente('')
        // Actualiza la caché de recientes sin volver a pedir el listado.
        setRecientes((actual) =>
          [registro, ...actual.filter((c) => c.id !== registro.id)].slice(0, MAX_RECIENTES),
        )
        mostrarToast({
          tone: 'success',
          title: 'Carnet registrado',
          message: `${registro.especialidadNombre} ${registro.correlativo} · ${registro.numeroExpediente}`,
        })
      } catch (fallo) {
        const status = fallo?.status
        if (status === 404) {
          setEstado('error')
          setMensaje('Expediente no encontrado. Verifique el número o consulte por DPI.')
        } else if (status === 409) {
          setEstado('duplicado')
          setMensaje(fallo.message)
        } else if (status === 502) {
          setEstado('error')
          setMensaje('No fue posible consultar el sistema hospitalario. Intente de nuevo.')
        } else {
          setEstado('error')
          setMensaje(fallo.message || 'No se pudo registrar el carnet.')
        }
      } finally {
        setProcesando(false)
        enCurso.current = false
        enfocar()
      }
    },
    [especialidadId, enfocar, mostrarToast],
  )

  // Corrige la especialidad de un carnet reciente y parchea la caché local.
  const corregir = useCallback(
    async (carnet, { especialidadId: nuevaEspecialidadId, motivo }) => {
      try {
        const actualizado = await corregirEspecialidadCarnet(carnet.id, {
          especialidadId: Number(nuevaEspecialidadId),
          motivo,
        })
        setRecientes((actual) => actual.map((c) => (c.id === actualizado.id ? actualizado : c)))
        setRegistros((actual) => actual.map((c) => (c.id === actualizado.id ? actualizado : c)))
        setResultado((actual) => (actual?.id === actualizado.id ? actualizado : actual))
        mostrarToast({
          tone: 'success',
          title: 'Especialidad corregida',
          message: `${actualizado.especialidadNombre} ${actualizado.correlativo}`,
        })
        return true
      } catch (fallo) {
        mostrarToast({
          tone: 'error',
          title: 'No se pudo corregir',
          message: fallo?.message,
        })
        return false
      }
    },
    [mostrarToast],
  )

  return {
    expediente,
    setExpediente,
    especialidadId,
    setEspecialidadId,
    especialidades,
    recientes,
    registros,
    cargandoTabla,
    resultado,
    estado,
    mensaje,
    procesando,
    inputRef,
    registrar,
    corregir,
    cargarRegistros,
    enfocar,
  }
}
