import { useCallback, useEffect, useState } from 'react'
import { listarEtiquetasEstacion } from '../api/etiquetasArchivoApi'

/**
 * Etiquetas habilitadas para la estación activa en la salida al Registro
 * Médico. Se recargan al cambiar de estación.
 */
export function useEtiquetasEstacion(estacionId) {
  const [etiquetas, setEtiquetas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (!estacionId) {
      setEtiquetas([])
      setError(null)
      setCargando(false)
      return undefined
    }

    let cancelado = false
    setCargando(true)
    setError(null)
    listarEtiquetasEstacion(estacionId)
      .then((lista) => {
        if (!cancelado) setEtiquetas(Array.isArray(lista) ? lista : [])
      })
      .catch((fallo) => {
        if (!cancelado) {
          setError(fallo)
          setEtiquetas([])
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [estacionId, recarga])

  const recargar = useCallback(() => setRecarga((valor) => valor + 1), [])

  return { etiquetas, cargando, error, recargar }
}
