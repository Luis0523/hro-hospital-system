import { useCallback, useEffect, useRef, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import { obtenerEstadisticasJefe } from '../api/dashboardArchivoApi'

// Datos del dashboard administrativo del Jefe de Archivo para una fecha.
export function useDashboardJefeArchivo() {
  const [fecha, setFecha] = useState(hoyIso)
  const [estadisticas, setEstadisticas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const peticionRef = useRef(0)

  const cargar = useCallback(async (valor) => {
    const peticion = peticionRef.current + 1
    peticionRef.current = peticion
    setCargando(true)
    setError(null)
    try {
      const datos = await obtenerEstadisticasJefe({ fecha: valor })
      if (peticion !== peticionRef.current) return
      setEstadisticas(datos)
    } catch (fallo) {
      if (peticion !== peticionRef.current) return
      setEstadisticas(null)
      setError(fallo?.message || 'No se pudieron cargar las estadísticas')
    } finally {
      if (peticion === peticionRef.current) setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar(fecha)
  }, [cargar, fecha])

  const refrescar = useCallback(() => cargar(fecha), [cargar, fecha])

  return { fecha, setFecha, estadisticas, cargando, error, refrescar }
}
