import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { useCarnetsRealtime } from '@/modules/carnets/hooks/useCarnetsRealtime'
import { devolverCarnet, listarCarnets, recibirCarnet } from '@/modules/carnets/api/carnetsApi'

// Flujo de carnets en Mesa COEX (Fase 1): enfermería recibe los carnets que
// Archivo despachó y los devuelve a Archivo. Se actualiza en tiempo real.
export function useCarnetsCoex({ fecha = hoyIso(), estacionId } = {}) {
  const { mostrarToast } = useToast()
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enProceso, setEnProceso] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setCarnets(await listarCarnets({ fecha, estacionId: estacionId || undefined }))
    } catch {
      setCarnets([])
    } finally {
      setCargando(false)
    }
  }, [fecha, estacionId])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Tiempo real: al despachar/enfermería cambiar un carnet, se recarga solo.
  useCarnetsRealtime({ topics: ['/topic/archivo'], onEvento: () => cargar() })

  const ejecutar = useCallback(
    async (carnet, etiqueta, fn) => {
      setEnProceso(carnet.id)
      try {
        await fn()
        await cargar()
        mostrarToast({
          tone: 'success',
          title: etiqueta,
          message: `${carnet.especialidadNombre} ${carnet.correlativo}`,
        })
      } catch (fallo) {
        mostrarToast({
          tone: 'error',
          title: 'No se pudo completar la acción',
          message: fallo.message,
        })
      } finally {
        setEnProceso(null)
      }
    },
    [cargar, mostrarToast],
  )

  const ejecutarTodos = useCallback(
    async (lista, etiqueta, fn) => {
      if (lista.length === 0) return
      setEnProceso('__todos__')
      try {
        const resultados = await Promise.allSettled(lista.map(fn))
        const exitosos = resultados.filter((r) => r.status === 'fulfilled').length
        const fallidos = resultados.length - exitosos
        await cargar()
        mostrarToast({
          tone: fallidos > 0 ? 'warning' : 'success',
          title: `${exitosos} ${etiqueta}`,
          message: fallidos > 0 ? `${fallidos} no se pudieron procesar` : undefined,
        })
      } finally {
        setEnProceso(null)
      }
    },
    [cargar, mostrarToast],
  )

  const porRecibir = carnets.filter((c) => c.estado === 'despachado')
  const enUso = carnets.filter((c) => c.estado === 'recibido_estacion')

  return {
    cargando,
    enProceso,
    recargar: cargar,
    porRecibir,
    enUso,
    recibir: (carnet) =>
      ejecutar(carnet, 'Recibido en la estación', () => recibirCarnet(carnet.id)),
    devolver: (carnet) => ejecutar(carnet, 'Devuelto a Archivo', () => devolverCarnet(carnet.id)),
    recibirTodos: () =>
      ejecutarTodos(porRecibir, 'recibidos en la estación', (c) => recibirCarnet(c.id)),
    devolverTodos: () => ejecutarTodos(enUso, 'devueltos a Archivo', (c) => devolverCarnet(c.id)),
  }
}
