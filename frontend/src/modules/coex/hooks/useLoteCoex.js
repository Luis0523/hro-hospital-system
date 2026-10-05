import { useCallback, useEffect, useMemo, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { cargarLoteEstacion } from '../api/coexApi'

export const ESTADO_PENDIENTE_RECIBIR = 'en_transito_entrega'
export const ESTADO_EN_USO = 'entregado'

// Separación para presentación del lote cargado. Solo expone filas accionables:
// se exige `cicloId` para que una cita sin ciclo (o `sin_ciclo`) nunca caiga en
// estos grupos. No decide transiciones.
export function agruparLote(filas = []) {
  return {
    pendientesRecibir: filas.filter(
      (fila) => fila?.cicloId && fila.estadoActual === ESTADO_PENDIENTE_RECIBIR,
    ),
    enUso: filas.filter(
      (fila) => fila?.cicloId && fila.estadoActual === ESTADO_EN_USO,
    ),
  }
}

// Carga de lectura del lote de la estación activa para una fecha de trabajo.
export function useLoteCoex() {
  const { estacion } = useEstacion()
  const estacionId = estacion?.id ?? null

  const [fecha, setFecha] = useState(hoyIso)
  const [subespecialidades, setSubespecialidades] = useState([])
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true

    if (estacionId == null) {
      setCargando(false)
      setError(null)
      setSubespecialidades([])
      setFilas([])
      return () => {
        activo = false
      }
    }

    setCargando(true)
    setError(null)

    cargarLoteEstacion({ estacionId, fecha })
      .then((lote) => {
        if (!activo) return
        setSubespecialidades(lote.subespecialidades)
        setFilas(lote.filas)
      })
      .catch((fallo) => {
        if (!activo) return
        setError(fallo)
        setSubespecialidades([])
        setFilas([])
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [estacionId, fecha, recarga])

  const grupos = useMemo(() => agruparLote(filas), [filas])

  const recargar = useCallback(() => setRecarga((n) => n + 1), [])

  return {
    estacion,
    fecha,
    setFecha,
    subespecialidades,
    filas,
    pendientesRecibir: grupos.pendientesRecibir,
    enUso: grupos.enUso,
    total: filas.length,
    cargando,
    error,
    recargar,
  }
}
