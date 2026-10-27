import { useCallback, useEffect, useMemo, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import { validarFormulario, valoresIniciales } from '../cuadernoRojoCampos'
import { guardarCuadernoRojo, listarCuadernoRojo, obtenerCuadernoRojo } from '../api/archivoApi'

function valoresConFecha(fecha = hoyIso()) {
  return { ...valoresIniciales(), fecha }
}

function valoresDesdeRegistro(registro) {
  return {
    fecha: registro.fecha,
    egresosHospitalarios: String(registro.egresosHospitalarios ?? ''),
    sobres: String(registro.sobresEmergencia ?? ''),
    sobresSellados: String(registro.sobresSellados ?? ''),
    tia: String(registro.tia ?? ''),
  }
}

function datosParaGuardar(valores) {
  return {
    egresosHospitalarios: Number(valores.egresosHospitalarios),
    sobresEmergencia: Number(valores.sobres),
    sobresSellados: Number(valores.sobresSellados),
    tia: Number(valores.tia),
  }
}

/**
 * Estado y operaciones de la pantalla del Cuaderno Rojo. El formulario usa
 * `valores` como única fuente de verdad (incluida la fecha). Al cambiar de
 * fecha se consulta el registro existente: si ya existe, se edita; si no, se
 * captura uno nuevo.
 */
export function useCuadernoRojo() {
  const [valores, setValores] = useState(() => valoresConFecha())
  const [tocados, setTocados] = useState({})
  const [registros, setRegistros] = useState([])
  const [existente, setExistente] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [cargandoDia, setCargandoDia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const { valido, errores } = useMemo(() => validarFormulario(valores), [valores])

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true)
    try {
      const lista = await listarCuadernoRojo()
      setRegistros(Array.isArray(lista) ? lista : [])
      setError(null)
    } catch (fallo) {
      setRegistros([])
      setError(fallo?.message || 'No se pudo cargar el historial del Cuaderno Rojo.')
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  useEffect(() => {
    cargarHistorial()
  }, [cargarHistorial])

  useEffect(() => {
    const fecha = valores.fecha
    if (!fecha) return undefined

    let cancelado = false
    setCargandoDia(true)
    obtenerCuadernoRojo(fecha)
      .then((registro) => {
        if (cancelado) return
        if (registro) {
          setValores(valoresDesdeRegistro(registro))
          setExistente(true)
        } else {
          setValores(valoresConFecha(fecha))
          setExistente(false)
        }
        setTocados({})
        setError(null)
      })
      .catch((fallo) => {
        if (cancelado) return
        setExistente(false)
        setError(fallo?.message || 'No se pudo consultar el registro de la fecha.')
      })
      .finally(() => {
        if (!cancelado) setCargandoDia(false)
      })

    return () => {
      cancelado = true
    }
  }, [valores.fecha])

  const cambiarCampo = useCallback((clave, valor) => {
    setValores((actuales) => ({ ...actuales, [clave]: valor }))
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
    setError(null)
  }, [])

  const marcarTocado = useCallback((clave) => {
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
  }, [])

  const guardar = useCallback(async () => {
    const todos = {}
    for (const clave of Object.keys(valores)) todos[clave] = true
    setTocados(todos)

    if (!valido) {
      return { ok: false, error: 'Revise las cantidades marcadas antes de guardar.' }
    }

    setGuardando(true)
    setError(null)
    try {
      const guardado = await guardarCuadernoRojo(valores.fecha, datosParaGuardar(valores))
      setExistente(true)
      setValores(valoresDesdeRegistro(guardado))
      setTocados({})
      const lista = await listarCuadernoRojo()
      setRegistros(Array.isArray(lista) ? lista : [])
      return { ok: true, registro: guardado }
    } catch (fallo) {
      const mensaje = fallo?.message || 'No se pudo guardar el registro del Cuaderno Rojo.'
      setError(mensaje)
      return { ok: false, error: mensaje }
    } finally {
      setGuardando(false)
    }
  }, [valido, valores])

  return {
    valores,
    errores,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    cargandoDia,
    guardando,
    error,
    cambiarCampo,
    marcarTocado,
    guardar,
    recargarHistorial: cargarHistorial,
  }
}
