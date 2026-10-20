import { useCallback, useEffect, useState } from 'react'
import { avanzarTurno, listarClinicas, obtenerLibro, registrarTurno } from '../api/seguimientoApi'

// Carga el libro y las clínicas desde el mock y refresca ambos tras cada acción.
export function useSeguimientoEnfermeria() {
  const [libro, setLibro] = useState(null)
  const [clinicas, setClinicas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [libroCargado, clinicasCargadas] = await Promise.all([obtenerLibro(), listarClinicas()])
      setLibro(libroCargado)
      setClinicas(clinicasCargadas)
    } catch (fallo) {
      setError(fallo?.message ?? 'No fue posible cargar el libro de turnos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const registrar = useCallback(
    async (codigo, numero) => {
      const turno = await registrarTurno({ codigo, numero })
      await cargar()
      return turno
    },
    [cargar],
  )

  const avanzar = useCallback(
    async (id, opciones) => {
      const turno = await avanzarTurno(id, opciones)
      await cargar()
      return turno
    },
    [cargar],
  )

  return { libro, clinicas, cargando, error, recargar: cargar, registrar, avanzar }
}
