import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  despacharCarnet,
  listarCarnets,
  marcarEncontrado,
  marcarNoLocalizado as apiMarcarNoLocalizado,
  recibirDevolucionCarnet,
} from '@/modules/carnets/api/carnetsApi'

// Estado de la sección de seguimiento de carnets en la Estación de Archivo.
// La fecha y la estación las controla la página (un único juego de filtros);
// aquí solo se cargan los carnets y se ejecutan las transiciones de Archivo.
export function useCarnetsArchivo({ fecha, estacionId } = {}) {
  const { mostrarToast } = useToast()
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [enProceso, setEnProceso] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setCarnets(
        await listarCarnets({
          fecha,
          estacionId: estacionId || undefined,
        }),
      )
    } catch (fallo) {
      setError(fallo)
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
        return true
      } catch (fallo) {
        mostrarToast({
          tone: 'error',
          title: 'No se pudo completar la acción',
          message: fallo.message,
        })
        return false
      } finally {
        setEnProceso(null)
      }
    },
    [cargar, mostrarToast],
  )

  return {
    carnets,
    cargando,
    error,
    enProceso,
    recargar: cargar,
    marcarEncontrado: (carnet) =>
      ejecutar(carnet, 'Marcado como encontrado', () => marcarEncontrado(carnet.id)),
    despachar: (carnet) => ejecutar(carnet, 'Despachado', () => despacharCarnet(carnet.id)),
    recibirDevolucion: (carnet) =>
      ejecutar(carnet, 'Devolución recibida', () => recibirDevolucionCarnet(carnet.id)),
    marcarNoLocalizado: (carnet, observacion) =>
      ejecutar(carnet, 'Marcado como no localizado', () =>
        apiMarcarNoLocalizado(carnet.id, observacion),
      ),
  }
}
