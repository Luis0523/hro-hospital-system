import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { listarCarnets, salidaArchivoCarnet } from '@/modules/carnets/api/carnetsApi'
import { compararPorExpediente } from './useCarnetsArchivo'
import { useCarnetsRealtime } from '@/modules/carnets/hooks/useCarnetsRealtime'

// Registro ultra-rápido de salidas de archivo por lote. La búsqueda es local
// (sobre los carnets ya cargados de enfermería, sin consultar el API del
// hospital) y el marcado es optimista: la fila cambia al instante y el POST
// entra a una cola en segundo plano con reintentos, de modo que el operador
// nunca espera la respuesta del backend.

const MAX_COINCIDENCIAS = 8
const MAX_REINTENTOS = 2
const BACKOFF_BASE_MS = 600

const ESTADOS_SALIDA = new Set(['salida_archivo', 'salida_enfermeria', 'resguardado'])

function normalizar(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

function esReintentable(fallo, intentos) {
  return (!fallo?.status || fallo.status >= 500) && intentos < MAX_REINTENTOS
}

export function useSalidaArchivo({ fecha } = {}) {
  const { mostrarToast } = useToast()
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [confirmandoIds, setConfirmandoIds] = useState(() => new Set())
  const [fallidos, setFallidos] = useState([])
  // Salidas registradas en ESTA sesión (empieza vacía y crece al marcar).
  const [salidasSesion, setSalidasSesion] = useState([])
  const inputRef = useRef(null)

  const cola = useRef([])
  const procesandoRef = useRef(false)
  // Ids en cola/confirmación: mutable y síncrono para bloquear dobles marcados.
  const confirmandoRef = useRef(new Set())

  const ordenar = (lista) => [...lista].sort(compararPorExpediente)

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true)
      setError(null)
      try {
        const lista = await listarCarnets({ fecha })
        setCarnets(ordenar(lista))
      } catch (fallo) {
        setError(fallo)
        setCarnets([])
      } finally {
        if (!silencioso) setCargando(false)
      }
    },
    [fecha],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  const aplicarEvento = useCallback((carnet) => {
    if (!carnet?.id) return
    setCarnets((actual) => ordenar([...actual.filter((c) => c.id !== carnet.id), carnet]))
  }, [])

  useCarnetsRealtime({
    topics: ['/topic/archivo'],
    onEvento: (carnet) => (carnet?.id ? aplicarEvento(carnet) : cargar(true)),
  })

  const enfocar = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  // Procesa la cola de salidas en segundo plano (una a la vez, con reintentos).
  async function vaciarCola() {
    if (procesandoRef.current) return
    procesandoRef.current = true
    while (cola.current.length > 0) {
      const item = cola.current.shift()
      try {
        const actualizado = await salidaArchivoCarnet(item.id)
        if (actualizado?.id) aplicarEvento(actualizado)
        confirmandoRef.current.delete(item.id)
        setConfirmandoIds((prev) => {
          const siguiente = new Set(prev)
          siguiente.delete(item.id)
          return siguiente
        })
      } catch (fallo) {
        if (esReintentable(fallo, item.intentos)) {
          item.intentos += 1
          await new Promise((resolver) => setTimeout(resolver, BACKOFF_BASE_MS * item.intentos))
          cola.current.push(item)
        } else {
          // Fallo definitivo: se revierte la fila y se informa.
          setCarnets((actual) =>
            actual.map((c) => (c.id === item.id ? { ...c, estado: item.estadoPrevio } : c)),
          )
          setSalidasSesion((prev) => prev.filter((s) => s.id !== item.id))
          confirmandoRef.current.delete(item.id)
          setConfirmandoIds((prev) => {
            const siguiente = new Set(prev)
            siguiente.delete(item.id)
            return siguiente
          })
          setFallidos((prev) => [
            ...prev,
            { id: item.id, numeroExpediente: item.numeroExpediente },
          ])
          mostrarToast({
            tone: 'error',
            title: 'No se pudo registrar la salida',
            message: `Expediente ${item.numeroExpediente}`,
          })
        }
      }
    }
    procesandoRef.current = false
  }

  function marcarSalida(carnet) {
    if (!carnet || confirmandoRef.current.has(carnet.id) || ESTADOS_SALIDA.has(carnet.estado)) {
      return false
    }
    const marcado = { ...carnet, estado: 'salida_archivo', salidaArchivoEn: new Date().toISOString() }
    setCarnets((actual) => actual.map((c) => (c.id === carnet.id ? marcado : c)))
    // El último marcado aparece al inicio de la lista de la sesión.
    setSalidasSesion((prev) => [marcado, ...prev.filter((s) => s.id !== carnet.id)])
    confirmandoRef.current.add(carnet.id)
    setConfirmandoIds((prev) => {
      const siguiente = new Set(prev)
      siguiente.add(carnet.id)
      return siguiente
    })
    cola.current.push({
      id: carnet.id,
      numeroExpediente: carnet.numeroExpediente,
      estadoPrevio: carnet.estado,
      intentos: 0,
    })
    vaciarCola()
    return true
  }

  const pendientes = useMemo(
    () => carnets.filter((c) => !ESTADOS_SALIDA.has(c.estado)),
    [carnets],
  )
  const salidos = useMemo(() => carnets.filter((c) => ESTADOS_SALIDA.has(c.estado)), [carnets])
  const conSalidaArchivo = useMemo(
    () => carnets.filter((c) => c.estado === 'salida_archivo').length,
    [carnets],
  )

  // Coincidencias locales por número de expediente (prefijo/substring de dígitos).
  const coincidencias = useMemo(() => {
    const q = normalizar(query)
    if (!q) return []
    return pendientes
      .filter((c) => normalizar(c.numeroExpediente).includes(q))
      .slice(0, MAX_COINCIDENCIAS)
  }, [query, pendientes])

  return {
    carnets,
    pendientes,
    salidos,
    salidasSesion,
    conSalidaArchivo,
    coincidencias,
    query,
    setQuery,
    inputRef,
    cargando,
    error,
    confirmandoIds,
    fallidos,
    recargar: () => cargar(true),
    marcarSalida,
    enfocar,
  }
}
