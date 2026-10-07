import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import {
  despacharCarnet,
  listarCarnets,
  listarEspecialidades,
  listarEstaciones,
  marcarEncontrado,
  marcarNoLocalizado as apiMarcarNoLocalizado,
  recibirDevolucionCarnet,
} from '@/modules/carnets/api/carnetsApi'

// Estado de la vista de Archivo para el seguimiento de carnets del día:
// filtros por estación/especialidad y acciones de búsqueda y despacho.
export function useCarnetsArchivo() {
  const { mostrarToast } = useToast()
  const [fecha, setFecha] = useState(hoyIso)
  const [estacionId, setEstacionId] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [estaciones, setEstaciones] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [carnets, setCarnets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [enProceso, setEnProceso] = useState(null)

  useEffect(() => {
    listarEstaciones()
      .then(setEstaciones)
      .catch(() => setEstaciones([]))
    listarEspecialidades()
      .then(setEspecialidades)
      .catch(() => setEspecialidades([]))
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setCarnets(
        await listarCarnets({
          fecha,
          estacionId: estacionId || undefined,
          especialidadId: especialidadId || undefined,
        }),
      )
    } catch (fallo) {
      setError(fallo)
      setCarnets([])
    } finally {
      setCargando(false)
    }
  }, [fecha, estacionId, especialidadId])

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
    fecha,
    setFecha,
    estacionId,
    setEstacionId,
    especialidadId,
    setEspecialidadId,
    estaciones,
    especialidades,
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
