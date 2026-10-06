import { useCallback, useState } from 'react'
import {
  archivarCiclo,
  checkInExpediente,
  despacharCiclo,
  iniciarBusquedaCiclo,
  localizarCiclo,
  noLocalizadoCiclo,
  obtenerCicloPorCita,
  reintentarBusquedaCiclo,
} from '../api/archivoApi'

// Centraliza el ciclo real del expediente para el Operador de Archivo:
// check-in, consulta por cita y las transiciones que le corresponden. Expone
// `loading`, `error` y el ciclo actual; reemplaza el estado local con la
// respuesta del backend. NO ejecuta `entregar`/`retornar` (Enfermería).
export function useCicloExpediente() {
  const [ciclo, setCiclo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const ejecutar = useCallback(async (tarea) => {
    setCargando(true)
    setError(null)
    try {
      const actualizado = await tarea()
      setCiclo(actualizado)
      return actualizado
    } catch (fallo) {
      setError(fallo)
      throw fallo
    } finally {
      setCargando(false)
    }
  }, [])

  const checkIn = useCallback(
    (expedienteId, datos) => ejecutar(() => checkInExpediente(expedienteId, datos)),
    [ejecutar],
  )

  const obtenerCiclo = useCallback(
    (citaId) => ejecutar(() => obtenerCicloPorCita(citaId)),
    [ejecutar],
  )

  const iniciarBusqueda = useCallback(
    (cicloId, datos) =>
      ejecutar(() =>
        datos === undefined ? iniciarBusquedaCiclo(cicloId) : iniciarBusquedaCiclo(cicloId, datos),
      ),
    [ejecutar],
  )

  const localizar = useCallback(
    (cicloId, datos) =>
      ejecutar(() =>
        datos === undefined ? localizarCiclo(cicloId) : localizarCiclo(cicloId, datos),
      ),
    [ejecutar],
  )

  const despachar = useCallback(
    (cicloId, datos) =>
      ejecutar(() =>
        datos === undefined ? despacharCiclo(cicloId) : despacharCiclo(cicloId, datos),
      ),
    [ejecutar],
  )

  const archivar = useCallback(
    (cicloId, datos) =>
      ejecutar(() =>
        datos === undefined ? archivarCiclo(cicloId) : archivarCiclo(cicloId, datos),
      ),
    [ejecutar],
  )

  const marcarNoLocalizado = useCallback(
    (cicloId, datos) => ejecutar(() => noLocalizadoCiclo(cicloId, datos)),
    [ejecutar],
  )

  const reintentarBusqueda = useCallback(
    (cicloId, datos) =>
      ejecutar(() =>
        datos === undefined
          ? reintentarBusquedaCiclo(cicloId)
          : reintentarBusquedaCiclo(cicloId, datos),
      ),
    [ejecutar],
  )

  return {
    ciclo,
    cargando,
    error,
    checkIn,
    obtenerCiclo,
    iniciarBusqueda,
    localizar,
    despachar,
    archivar,
    marcarNoLocalizado,
    reintentarBusqueda,
  }
}
