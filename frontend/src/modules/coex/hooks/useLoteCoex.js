import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
//
// Dos rutas de actualización con semántica distinta:
//   - Carga normal (inicial y cambios de estación/fecha): usa `cargando` y
//     `error`, y es la única que puede vaciar el lote.
//   - Refresco silencioso (`refrescarSilencioso`): near-real-time; nunca activa
//     `cargando` ni vacía datos. En éxito reemplaza el lote y limpia
//     `errorRefresco`; en fallo conserva los datos y expone `errorRefresco`.
export function useLoteCoex() {
  const { estacion } = useEstacion()
  const estacionId = estacion?.id ?? null

  const [fecha, setFecha] = useState(hoyIso)
  const [subespecialidades, setSubespecialidades] = useState([])
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [refrescando, setRefrescando] = useState(false)
  const [errorRefresco, setErrorRefresco] = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  // Una sola actualización silenciosa en vuelo: un intento durante otro se
  // coalesce en un único refresco posterior (no se encola una ráfaga de ticks).
  const enVueloRef = useRef(false)
  const pendienteRef = useRef(false)
  // Token monotónico: una respuesta obsoleta no sobrescribe una más reciente.
  const seqRef = useRef(0)
  const montadoRef = useRef(true)
  const ejecutarRefrescoRef = useRef(null)

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  // Carga normal (inicial y cambios de estación/fecha). Conserva el Spinner de
  // página completa y el `error` destructivo.
  useEffect(() => {
    let activo = true
    const token = ++seqRef.current

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
        if (!activo || token !== seqRef.current) return
        setSubespecialidades(lote.subespecialidades)
        setFilas(lote.filas)
        setUltimaActualizacion(new Date())
      })
      .catch((fallo) => {
        if (!activo || token !== seqRef.current) return
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
  }, [estacionId, fecha])

  const refrescarSilencioso = useCallback(async () => {
    if (estacionId == null) return null

    if (enVueloRef.current) {
      pendienteRef.current = true
      return null
    }

    enVueloRef.current = true
    const token = ++seqRef.current
    setRefrescando(true)

    try {
      const lote = await cargarLoteEstacion({ estacionId, fecha })
      if (!montadoRef.current || token !== seqRef.current) return null
      setSubespecialidades(lote.subespecialidades)
      setFilas(lote.filas)
      setErrorRefresco(null)
      setUltimaActualizacion(new Date())
      return lote
    } catch (fallo) {
      if (!montadoRef.current || token !== seqRef.current) return null
      setErrorRefresco(fallo)
      return null
    } finally {
      enVueloRef.current = false
      if (montadoRef.current) {
        setRefrescando(false)
        if (pendienteRef.current) {
          pendienteRef.current = false
          ejecutarRefrescoRef.current?.()
        }
      } else {
        pendienteRef.current = false
      }
    }
  }, [estacionId, fecha])

  useEffect(() => {
    ejecutarRefrescoRef.current = refrescarSilencioso
  }, [refrescarSilencioso])

  const grupos = useMemo(() => agruparLote(filas), [filas])

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
    refrescarSilencioso,
    refrescando,
    ultimaActualizacion,
    errorRefresco,
  }
}
