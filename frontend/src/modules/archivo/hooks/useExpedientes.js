import { useCallback, useEffect, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import { listarJornadaArchivo, listarSubespecialidades } from '../api/archivoApi'

// Jornada de archivo del Operador. La fecha por defecto es HOY (local) en
// formato YYYY-MM-DD. El backend es la fuente de verdad del estado de cada
// ciclo; este hook solo carga y recarga la jornada.
export function useExpedientes() {
  const [fecha, setFecha] = useState(hoyIso)
  const [subespecialidadId, setSubespecialidadId] = useState('')
  const [subespecialidades, setSubespecialidades] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarSubespecialidades()
      .then(setSubespecialidades)
      .catch(() => setSubespecialidades([]))
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await listarJornadaArchivo({ fecha, subespecialidadId })
      setExpedientes(lista)
    } catch (fallo) {
      setError(fallo)
      setExpedientes([])
    } finally {
      setCargando(false)
    }
  }, [fecha, subespecialidadId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    fecha,
    setFecha,
    subespecialidadId,
    setSubespecialidadId,
    subespecialidades,
    expedientes,
    cargando,
    error,
    recargar: cargar,
  }
}
