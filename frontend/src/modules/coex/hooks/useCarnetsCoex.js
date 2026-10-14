import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { useCarnetsRealtime } from '@/modules/carnets/hooks/useCarnetsRealtime'
import { listarCarnets, salidaEnfermeriaCarnet } from '@/modules/carnets/api/carnetsApi'

function upsert(lista, carnet) {
  const sinAnterior = lista.filter((c) => c.id !== carnet.id)
  return [...sinAnterior, carnet]
}

// Flujo de carnets en Mesa COEX: muestra los expedientes con salida de archivo
// (ya salieron de archivo / están en enfermería) y registra su salida de
// enfermería (devolución a archivo). El backend es la fuente de verdad.
export function useCarnetsCoex({ fecha = hoyIso(), estacionId, recargaKey } = {}) {
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
  }, [cargar, recargaKey])

  const aplicarEvento = useCallback((carnet) => {
    if (!carnet?.id) return
    setCarnets((actual) => upsert(actual, carnet))
  }, [])

  // Tiempo real: al cambiar un carnet, se actualiza la fila (el evento nulo es
  // el polling de respaldo, que refresca por completo).
  useCarnetsRealtime({
    topics: ['/topic/archivo'],
    onEvento: (carnet) => (carnet?.id ? aplicarEvento(carnet) : cargar()),
  })

  const ejecutar = useCallback(
    async (carnet, etiqueta, fn) => {
      setEnProceso(carnet.id)
      try {
        const actualizado = await fn()
        if (actualizado?.id) {
          aplicarEvento(actualizado)
        } else {
          await cargar()
        }
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
    [aplicarEvento, cargar, mostrarToast],
  )

  const ejecutarTodos = useCallback(
    async (lista, etiqueta, fn) => {
      if (lista.length === 0) return
      setEnProceso('__todos__')
      try {
        const resultados = await Promise.allSettled(lista.map(fn))
        const exitosos = resultados.filter((r) => r.status === 'fulfilled').length
        const fallidos = resultados.length - exitosos
        resultados
          .filter((r) => r.status === 'fulfilled' && r.value?.id)
          .forEach((r) => aplicarEvento(r.value))
        mostrarToast({
          tone: fallidos > 0 ? 'warning' : 'success',
          title: `${exitosos} ${etiqueta}`,
          message: fallidos > 0 ? `${fallidos} no se pudieron procesar` : undefined,
        })
      } finally {
        setEnProceso(null)
      }
    },
    [aplicarEvento, mostrarToast],
  )

  const porSalida = carnets.filter((c) => c.estado === 'salida_archivo')

  return {
    cargando,
    enProceso,
    porSalida,
    recargar: cargar,
    salidaEnfermeria: (carnet) =>
      ejecutar(carnet, 'Salida de enfermería', () => salidaEnfermeriaCarnet(carnet.id)),
    salidaEnfermeriaTodos: () =>
      ejecutarTodos(porSalida, 'con salida de enfermería', (c) => salidaEnfermeriaCarnet(c.id)),
  }
}
