import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  despacharCarnet,
  listarCarnets,
  marcarEncontrado,
  marcarNoLocalizado as apiMarcarNoLocalizado,
  recibirDevolucionCarnet,
} from '@/modules/carnets/api/carnetsApi'

// Orden por número de expediente (no por correlativo), de menor a mayor,
// con comparación numérica (p. ej. 837871 < 837872).
export function compararPorExpediente(a, b) {
  return String(a?.numeroExpediente ?? '').localeCompare(
    String(b?.numeroExpediente ?? ''),
    undefined,
    { numeric: true, sensitivity: 'base' },
  )
}

// Estado de la sección de seguimiento de carnets en la Estación de Archivo.
// La fecha y la estación las controla la página (un único juego de filtros).
export function useCarnetsArchivo({ fecha, estacionId, recargaKey, clasificacion } = {}) {
  const { mostrarToast } = useToast()
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [enProceso, setEnProceso] = useState(null)

  // `silencioso`: refresca sin mostrar el Spinner ni ocultar la tabla (para el
  // tiempo real y la recarga manual), de modo que no se interrumpa la lectura.
  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true)
      setError(null)
      try {
        const lista = await listarCarnets({
          fecha,
          estacionId: estacionId || undefined,
          clasificacion: clasificacion || undefined,
        })
        setCarnets([...lista].sort(compararPorExpediente))
      } catch (fallo) {
        setError(fallo)
        setCarnets([])
      } finally {
        if (!silencioso) setCargando(false)
      }
    },
    [fecha, estacionId, clasificacion],
  )

  useEffect(() => {
    cargar()
    // `recargaKey` permite forzar la recarga cuando se registra un carnet desde
    // el buscador de la misma página.
  }, [cargar, recargaKey])

  const recargar = useCallback(() => cargar(true), [cargar])

  const ejecutar = useCallback(
    async (carnet, etiqueta, fn) => {
      setEnProceso(carnet.id)
      try {
        await fn()
        await cargar(true)
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
    recargar,
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
