import { useCallback, useEffect, useRef, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import { obtenerConsolidadoDiario, obtenerConsolidadoMensual } from '../api/consolidadoArchivoApi'

// Orquesta el Consolidado de Archivo: diario (por especialidad) y mensual
// (Informe Estadístico). Cada carga mantiene su propio estado.
export function useConsolidadoArchivo() {
  const ahora = new Date()

  const [fecha, setFecha] = useState(hoyIso())
  const [diario, setDiario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [periodo, setPeriodo] = useState({ anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 })
  const [mensual, setMensual] = useState(null)
  const [cargandoMensual, setCargandoMensual] = useState(true)
  const [errorMensual, setErrorMensual] = useState(null)

  const peticionDiario = useRef(0)
  const peticionMensual = useRef(0)

  const cargarDiario = useCallback(async (valor) => {
    const peticion = peticionDiario.current + 1
    peticionDiario.current = peticion
    setCargando(true)
    setError(null)

    try {
      const datos = await obtenerConsolidadoDiario({ fecha: valor })
      if (peticion !== peticionDiario.current) return
      setDiario(datos)
    } catch (fallo) {
      if (peticion !== peticionDiario.current) return
      setDiario(null)
      setError(fallo?.message || 'No se pudo cargar el consolidado diario')
    } finally {
      if (peticion === peticionDiario.current) setCargando(false)
    }
  }, [])

  const cargarMensual = useCallback(async (valor) => {
    const peticion = peticionMensual.current + 1
    peticionMensual.current = peticion
    setCargandoMensual(true)
    setErrorMensual(null)

    try {
      const datos = await obtenerConsolidadoMensual({ anio: valor.anio, mes: valor.mes })
      if (peticion !== peticionMensual.current) return
      setMensual(datos)
    } catch (fallo) {
      if (peticion !== peticionMensual.current) return
      setMensual(null)
      setErrorMensual(fallo?.message || 'No se pudo cargar el consolidado mensual')
    } finally {
      if (peticion === peticionMensual.current) setCargandoMensual(false)
    }
  }, [])

  useEffect(() => {
    cargarDiario(fecha)
  }, [cargarDiario, fecha])

  useEffect(() => {
    cargarMensual(periodo)
  }, [cargarMensual, periodo])

  const refrescar = useCallback(() => cargarDiario(fecha), [cargarDiario, fecha])
  const refrescarMensual = useCallback(() => cargarMensual(periodo), [cargarMensual, periodo])

  return {
    fecha,
    setFecha,
    diario,
    cargando,
    error,
    refrescar,
    periodo,
    setPeriodo,
    mensual,
    cargandoMensual,
    errorMensual,
    refrescarMensual,
  }
}
