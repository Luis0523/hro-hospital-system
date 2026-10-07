import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { devolverCarnet, listarCarnets, recibirCarnet } from '@/modules/carnets/api/carnetsApi'

// Flujo de carnets en Mesa COEX (Fase 1): enfermería recibe los carnets que
// Archivo despachó y los devuelve a Archivo. Independiente del lote por citas
// del ciclo (que corresponde a la fase de pre-planeación).
export function useCarnetsCoex({ fecha = hoyIso(), estacionId } = {}) {
  const { mostrarToast } = useToast()
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enProceso, setEnProceso] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setCarnets(
        await listarCarnets({ fecha, estacionId: estacionId || undefined }),
      )
    } catch {
      setCarnets([])
    } finally {
      setCargando(false)
    }
  }, [fecha, estacionId])

  useEffect(() => {
    cargar()
  }, [cargar])

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

  return {
    cargando,
    enProceso,
    recargar: cargar,
    porRecibir: carnets.filter((c) => c.estado === 'despachado'),
    enUso: carnets.filter((c) => c.estado === 'recibido_estacion'),
    recibir: (carnet) =>
      ejecutar(carnet, 'Recibido en la estación', () => recibirCarnet(carnet.id)),
    devolver: (carnet) => ejecutar(carnet, 'Devuelto a Archivo', () => devolverCarnet(carnet.id)),
  }
}
