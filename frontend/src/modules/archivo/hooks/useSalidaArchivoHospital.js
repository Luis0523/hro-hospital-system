import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  descargarSalidasHospitalPdf,
  listarSalidasHospital,
  registrarSalidaHospital,
} from '../api/salidaArchivoHospitalApi'

// Registro de salidas de archivo consultando DIRECTAMENTE al hospital. El listado
// es compartido por estación (lo ven todos los operadores de esa estación). La
// consulta al hospital entra a una mini-cola en segundo plano (una a la vez) para
// no bloquear el tecleo ni saturar el backend.
export function useSalidaArchivoHospital({ fecha, estacionId } = {}) {
  const { mostrarToast } = useToast()
  const [salidas, setSalidas] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [fallidos, setFallidos] = useState(0)
  const inputRef = useRef(null)

  const cola = useRef([])
  const procesandoRef = useRef(false)
  const enColaRef = useRef(new Set())

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!estacionId) {
        setSalidas([])
        return
      }
      if (!silencioso) setCargando(true)
      setError(null)
      try {
        setSalidas(await listarSalidasHospital({ fecha, estacionId }))
      } catch (fallo) {
        setError(fallo)
        setSalidas([])
      } finally {
        if (!silencioso) setCargando(false)
      }
    },
    [fecha, estacionId],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  // Refresco periódico para ver lo que otros operadores de la estación marcan.
  useEffect(() => {
    if (!estacionId) return undefined
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      cargar(true)
    }, 15000)
    return () => clearInterval(id)
  }, [estacionId, cargar])

  const enfocar = useCallback(() => inputRef.current?.focus(), [])
  useEffect(() => {
    enfocar()
  }, [enfocar])

  // Mini-cola: procesa las consultas al hospital de a una, en segundo plano.
  const vaciarCola = useCallback(async () => {
    if (procesandoRef.current) return
    procesandoRef.current = true
    while (cola.current.length > 0) {
      const item = cola.current.shift()
      try {
        const nueva = await registrarSalidaHospital({
          numeroExpediente: item.numero,
          estacionId,
        })
        setSalidas((prev) => [nueva, ...prev.filter((s) => s.id !== nueva.id)])
        setPendientes((prev) => prev.filter((p) => p.numeroExpediente !== item.numero))
        enColaRef.current.delete(item.numero)
      } catch (fallo) {
        const status = fallo?.status
        if (status === 404) {
          mostrarToast({
            tone: 'warning',
            title: 'Expediente no encontrado',
            message: `No existe ${item.numero} en el hospital.`,
          })
        } else if (status === 409) {
          mostrarToast({
            tone: 'warning',
            title: 'Ya salió',
            message: `${item.numero} ya estaba marcado en esta estación.`,
          })
          cargar(true)
        } else if (status === 502) {
          mostrarToast({
            tone: 'error',
            title: 'No se pudo consultar el hospital',
            message: 'Intente de nuevo.',
          })
        } else {
          mostrarToast({ tone: 'error', title: 'No se pudo registrar', message: fallo?.message })
        }
        setPendientes((prev) => prev.filter((p) => p.numeroExpediente !== item.numero))
        enColaRef.current.delete(item.numero)
        setFallidos((n) => n + 1)
      }
    }
    procesandoRef.current = false
  }, [estacionId, cargar, mostrarToast])

  const agregar = useCallback(
    (valor) => {
      const numero = String(valor ?? '').trim()
      if (!numero) return false
      if (!estacionId) {
        mostrarToast({
          tone: 'warning',
          title: 'Seleccione la estación',
          message: 'Elija la estación arriba antes de registrar.',
        })
        return false
      }
      if (enColaRef.current.has(numero)) return false
      enColaRef.current.add(numero)
      setPendientes((prev) => [
        ...prev,
        { id: `tmp-${numero}`, numeroExpediente: numero, _procesando: true },
      ])
      cola.current.push({ numero })
      vaciarCola()
      return true
    },
    [estacionId, vaciarCola, mostrarToast],
  )

  const generarPdf = useCallback(async () => {
    if (!estacionId || salidas.length === 0) return null
    try {
      return await descargarSalidasHospitalPdf({ fecha, estacionId })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
      return null
    }
  }, [fecha, estacionId, salidas.length, mostrarToast])

  return {
    salidas,
    pendientes,
    cargando,
    error,
    fallidos,
    cola: pendientes.length,
    inputRef,
    agregar,
    recargar: () => cargar(true),
    generarPdf,
    enfocar,
  }
}
