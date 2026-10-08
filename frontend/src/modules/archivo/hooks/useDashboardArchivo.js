import { useCallback, useEffect, useRef, useState } from 'react'
import { listarMovimientosArchivo, obtenerEstadisticasArchivo } from '../api/dashboardArchivoApi'

// Orquestación de datos del Dashboard de Archivo: carga estadísticas y la
// primera página de movimientos, permite refrescar, cambiar filtros y paginar
// ("cargar más"). La UI solo consume el estado que expone este hook.
const FILTROS_INICIALES = { desde: '', hasta: '', subespecialidadId: '' }

function construirParametros(filtros = {}) {
  return {
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
    subespecialidadId: filtros.subespecialidadId || undefined,
  }
}

export function useDashboardArchivo({ pageSize = 20 } = {}) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [estadisticas, setEstadisticas] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [pagina, setPagina] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false)
  const [error, setError] = useState(null)

  // Evita que una respuesta antigua pise a una más reciente al cambiar filtros.
  const peticionRef = useRef(0)

  const cargar = useCallback(
    async (filtrosActivos) => {
      const peticion = peticionRef.current + 1
      peticionRef.current = peticion
      setCargando(true)
      setError(null)

      try {
        const parametros = construirParametros(filtrosActivos)
        const [estadisticasResp, movimientosResp] = await Promise.all([
          obtenerEstadisticasArchivo(parametros),
          listarMovimientosArchivo({ ...parametros, page: 0, size: pageSize }),
        ])

        if (peticion !== peticionRef.current) return

        setEstadisticas(estadisticasResp)
        setMovimientos(movimientosResp?.content ?? [])
        setPagina(movimientosResp?.number ?? 0)
        setHayMas(
          Boolean(movimientosResp && movimientosResp.number + 1 < movimientosResp.totalPages),
        )
      } catch (fallo) {
        if (peticion !== peticionRef.current) return
        setEstadisticas(null)
        setMovimientos([])
        setHayMas(false)
        setError(fallo?.message || 'No se pudieron cargar los datos del dashboard')
      } finally {
        if (peticion === peticionRef.current) setCargando(false)
      }
    },
    [pageSize],
  )

  useEffect(() => {
    cargar(filtros)
  }, [cargar, filtros])

  const cargarMas = useCallback(async () => {
    if (cargandoMovimientos || !hayMas) return
    setCargandoMovimientos(true)

    try {
      const siguiente = pagina + 1
      const respuesta = await listarMovimientosArchivo({
        ...construirParametros(filtros),
        page: siguiente,
        size: pageSize,
      })
      setMovimientos((previos) => [...previos, ...(respuesta?.content ?? [])])
      setPagina(respuesta?.number ?? siguiente)
      setHayMas(Boolean(respuesta && respuesta.number + 1 < respuesta.totalPages))
    } catch (fallo) {
      setError(fallo?.message || 'No se pudieron cargar más movimientos')
    } finally {
      setCargandoMovimientos(false)
    }
  }, [cargandoMovimientos, filtros, hayMas, pagina, pageSize])

  const refrescar = useCallback(() => cargar(filtros), [cargar, filtros])

  return {
    estadisticas,
    movimientos,
    cargando,
    cargandoMovimientos,
    error,
    filtros,
    setFiltros,
    refrescar,
    cargarMas,
    hayMas,
  }
}
