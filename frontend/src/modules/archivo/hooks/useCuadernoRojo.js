import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hoyIsoGuatemala } from '@/shared/utils/fecha'
import { validarFormulario, valoresIniciales } from '../cuadernoRojoCampos'
import { guardarCuadernoRojo, listarCuadernoRojo, obtenerCuadernoRojo } from '../api/archivoApi'

const CLAVES_CANTIDAD = ['egresosHospitalarios', 'sobres', 'sobresSellados', 'tia']

function valoresConFecha(fecha = hoyIsoGuatemala()) {
  return { ...valoresIniciales(), fecha }
}

function periodoActual() {
  const iso = hoyIsoGuatemala()
  return { anio: iso.slice(0, 4), mes: '' }
}

function construirParametros(filtros = {}) {
  const parametros = {}
  const anio = Number(filtros.anio)
  if (Number.isInteger(anio)) parametros.anio = anio
  if (filtros.mes !== '' && filtros.mes !== null && filtros.mes !== undefined) {
    parametros.mes = Number(filtros.mes)
  }
  return parametros
}

function estaEnPeriodo(fecha, filtros = {}) {
  if (!fecha) return true
  const anio = fecha.slice(0, 4)
  const mes = fecha.slice(5, 7)
  return (
    String(anio) === String(filtros.anio) &&
    (!filtros.mes || mes === String(filtros.mes).padStart(2, '0'))
  )
}

export function valoresDesdeRegistro(registro) {
  return {
    fecha: registro.fecha,
    egresosHospitalarios: String(registro.egresosHospitalarios ?? ''),
    sobres: String(registro.sobresEmergencia ?? ''),
    sobresSellados: String(registro.sobresSellados ?? ''),
    tia: String(registro.tia ?? ''),
  }
}

export function datosParaGuardar(valores) {
  return {
    egresosHospitalarios: Number(valores.egresosHospitalarios),
    sobresEmergencia: Number(valores.sobres),
    sobresSellados: Number(valores.sobresSellados),
    tia: Number(valores.tia),
  }
}

function cantidadesDe(valores) {
  return {
    egresosHospitalarios: String(valores?.egresosHospitalarios ?? ''),
    sobres: String(valores?.sobres ?? ''),
    sobresSellados: String(valores?.sobresSellados ?? ''),
    tia: String(valores?.tia ?? ''),
  }
}

function mismasCantidades(a, b) {
  const cantidadesA = cantidadesDe(a)
  const cantidadesB = cantidadesDe(b)
  return CLAVES_CANTIDAD.every((clave) => cantidadesA[clave] === cantidadesB[clave])
}

function mensajeError(fallo, accion) {
  const status = fallo?.status
  const verbo = accion === 'guardar' ? 'guardar' : 'consultar'

  if (status === 400) {
    if (accion === 'guardar') {
      return 'El servidor rechazó las cantidades. Revise los datos e intente de nuevo.'
    }
    if (accion === 'filtrar') {
      return 'El servidor rechazó el período. Verifique el año y el mes.'
    }
    return 'El servidor rechazó la consulta. Verifique la fecha e intente de nuevo.'
  }
  if (status === 401) return 'La sesión expiró. Vuelva a iniciar sesión.'
  if (status === 403) return `Su rol no tiene permiso para ${verbo} el Cuaderno Rojo.`
  if (status === 404) return 'No se encontró el recurso solicitado. Actualice e intente de nuevo.'
  if (!status) {
    return 'No se pudo conectar con el servidor. Verifique la conexión e intente de nuevo.'
  }
  return (
    fallo?.message ||
    (accion === 'filtrar'
      ? 'No se pudo consultar el historial del Cuaderno Rojo.'
      : `No se pudo ${verbo} el registro del Cuaderno Rojo.`)
  )
}

/**
 * Estado y operaciones de la pantalla del Cuaderno Rojo. El formulario usa
 * `valores` como única fuente de verdad (incluida la fecha). Al cambiar de
 * fecha se consulta el registro existente: si ya existe, se edita; si no, se
 * captura uno nuevo.
 *
 * Concurrencia:
 * - `solicitudRef` invalida respuestas antiguas de consultas por fecha.
 * - `historialSolicitudRef` invalida respuestas antiguas del historial filtrado.
 * - `guardandoRef` bloquea de forma síncrona envíos duplicados.
 * - `omitirCargaRef` evita un GET cuando el registro ya vino del historial.
 */
export function useCuadernoRojo() {
  const [valores, setValores] = useState(() => valoresConFecha())
  const [valoresGuardados, setValoresGuardados] = useState(() => valoresConFecha())
  const [tocados, setTocados] = useState({})
  const [registros, setRegistros] = useState([])
  const [existente, setExistente] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [cargandoDia, setCargandoDia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState(() => periodoActual())
  const [anioActual] = useState(() => Number(hoyIsoGuatemala().slice(0, 4)))

  const guardandoRef = useRef(false)
  const solicitudRef = useRef(0)
  const historialSolicitudRef = useRef(0)
  const omitirCargaRef = useRef(null)
  const valoresRef = useRef(valores)
  const filtrosRef = useRef(filtros)

  useEffect(() => {
    valoresRef.current = valores
  }, [valores])

  const { valido, errores } = useMemo(() => validarFormulario(valores), [valores])

  const hayCambios = useMemo(
    () => !mismasCantidades(valores, valoresGuardados),
    [valores, valoresGuardados],
  )

  const aplicarValores = useCallback((siguientes) => {
    valoresRef.current = siguientes
    setValores(siguientes)
    setValoresGuardados(siguientes)
  }, [])

  const cargarHistorial = useCallback(
    async (
      filtrosSolicitados = null,
      { conservarRegistrosEnError = false, registrarError = true } = {},
    ) => {
      const vigentes = filtrosSolicitados ?? filtrosRef.current
      const token = ++historialSolicitudRef.current
      setCargandoHistorial(true)

      try {
        const lista = await listarCuadernoRojo(construirParametros(vigentes))
        if (token !== historialSolicitudRef.current) return null
        setRegistros(Array.isArray(lista) ? lista : [])
        setError(null)
        return true
      } catch (fallo) {
        if (token !== historialSolicitudRef.current) return null
        if (!conservarRegistrosEnError) setRegistros([])
        if (registrarError) setError(mensajeError(fallo, 'filtrar'))
        return false
      } finally {
        if (token === historialSolicitudRef.current) setCargandoHistorial(false)
      }
    },
    [],
  )

  const recargarHistorial = useCallback(
    () => cargarHistorial(filtrosRef.current),
    [cargarHistorial],
  )

  useEffect(() => {
    cargarHistorial(filtros)
  }, [filtros, cargarHistorial])

  useEffect(() => {
    const fecha = valores.fecha
    if (!fecha) {
      setCargandoDia(false)
      setExistente(false)
      return undefined
    }

    // La selección desde el historial ya trae los datos: no se repite el GET.
    const omitir = omitirCargaRef.current
    omitirCargaRef.current = null
    if (omitir === fecha) return undefined

    const token = ++solicitudRef.current
    let activo = true
    setCargandoDia(true)
    setExistente(false)
    setError(null)

    obtenerCuadernoRojo(fecha)
      .then((registro) => {
        if (!activo || token !== solicitudRef.current) return
        if (registro) {
          aplicarValores(valoresDesdeRegistro(registro))
          setExistente(true)
        } else {
          aplicarValores(valoresConFecha(fecha))
          setExistente(false)
        }
        setTocados({})
      })
      .catch((fallo) => {
        if (!activo || token !== solicitudRef.current) return
        setExistente(false)
        setError(mensajeError(fallo, 'consultar'))
      })
      .finally(() => {
        if (activo && token === solicitudRef.current) setCargandoDia(false)
      })

    return () => {
      activo = false
    }
  }, [valores.fecha, aplicarValores])

  const cambiarCampo = useCallback((clave, valor) => {
    if (clave === 'fecha' && valor !== valoresRef.current.fecha) {
      // Invalida de inmediato cualquier consulta pendiente de la fecha anterior.
      solicitudRef.current += 1
      omitirCargaRef.current = null
    }

    setValores((actuales) => {
      const siguientes = { ...actuales, [clave]: valor }
      valoresRef.current = siguientes
      return siguientes
    })
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
    setError(null)
  }, [])

  const marcarTocado = useCallback((clave) => {
    setTocados((actuales) => ({ ...actuales, [clave]: true }))
  }, [])

  const cambiarFiltro = useCallback(
    (clave, valor) => {
      const actuales = filtrosRef.current
      let siguientes = actuales

      if (clave === 'anio') {
        const anio = Number(valor)
        if (!Number.isInteger(anio) || anio < 2000 || anio > anioActual) return
        if (String(anio) === actuales.anio) return
        siguientes = { ...actuales, anio: String(anio) }
      } else if (clave === 'mes') {
        if (valor === '') {
          if (actuales.mes === '') return
          siguientes = { ...actuales, mes: '' }
        } else {
          const mes = Number(valor)
          if (!Number.isInteger(mes) || mes < 1 || mes > 12) return
          const normalizado = String(mes).padStart(2, '0')
          if (normalizado === actuales.mes) return
          siguientes = { ...actuales, mes: normalizado }
        }
      } else {
        return
      }

      filtrosRef.current = siguientes
      setFiltros(siguientes)
      setError(null)
    },
    [anioActual],
  )

  const restablecerFiltros = useCallback(() => {
    const siguientes = { anio: String(anioActual), mes: '' }
    if (filtrosRef.current.anio === siguientes.anio && filtrosRef.current.mes === siguientes.mes) {
      return
    }
    filtrosRef.current = siguientes
    setFiltros(siguientes)
    setError(null)
  }, [anioActual])

  /**
   * Selecciona un registro del historial sin volver a consultarlo.
   * Invalida cualquier GET pendiente para que no sobrescriba la selección.
   */
  const seleccionarRegistro = useCallback(
    (registro) => {
      if (!registro?.fecha) return

      solicitudRef.current += 1
      const cargados = valoresDesdeRegistro(registro)
      omitirCargaRef.current = registro.fecha
      aplicarValores(cargados)
      setExistente(true)
      setTocados({})
      setError(null)
      setCargandoDia(false)
    },
    [aplicarValores],
  )

  /** Snapshot inmutable para la confirmación de actualización. */
  const obtenerSnapshot = useCallback(() => {
    const actuales = valoresRef.current
    const revision = validarFormulario(actuales)
    return {
      valido: revision.valido,
      errores: revision.errores,
      fecha: actuales.fecha,
      valores: { ...actuales },
    }
  }, [])

  /**
   * Guarda (crea o actualiza) el registro.
   * `confirmado` es un snapshot inmutable tomado al abrir el modal de actualización.
   */
  const guardar = useCallback(
    async (confirmado = null) => {
      if (guardandoRef.current) return { ok: false, omitido: true }

      const fuente = confirmado ? confirmado.valores : valoresRef.current
      const fecha = confirmado ? confirmado.fecha : valoresRef.current.fecha
      const revision = validarFormulario(fuente)

      if (!revision.valido) {
        if (!confirmado) {
          const todos = {}
          for (const clave of Object.keys(fuente)) todos[clave] = true
          setTocados(todos)
        }
        return {
          ok: false,
          validacion: true,
          error: 'Revise las cantidades marcadas antes de guardar.',
        }
      }

      guardandoRef.current = true
      setGuardando(true)
      setError(null)

      let guardado
      try {
        guardado = await guardarCuadernoRojo(fecha, datosParaGuardar(fuente))
        aplicarValores(valoresDesdeRegistro(guardado))
        setExistente(true)
        setTocados({})
      } catch (fallo) {
        guardandoRef.current = false
        setGuardando(false)
        return { ok: false, error: mensajeError(fallo, 'guardar') }
      }

      // El PUT ya fue exitoso. Un fallo al refrescar el historial no invalida el guardado.
      const refresco = await cargarHistorial(null, {
        conservarRegistrosEnError: true,
        registrarError: false,
      })
      const historialActualizado = refresco !== false
      const fueraDePeriodo = !estaEnPeriodo(guardado?.fecha ?? fecha, filtrosRef.current)

      guardandoRef.current = false
      setGuardando(false)

      return { ok: true, registro: guardado, historialActualizado, fueraDePeriodo }
    },
    [aplicarValores, cargarHistorial],
  )

  return {
    valores,
    errores,
    valido,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    cargandoDia,
    guardando,
    error,
    hayCambios,
    filtros,
    anioActual,
    cambiarCampo,
    marcarTocado,
    cambiarFiltro,
    restablecerFiltros,
    guardar,
    obtenerSnapshot,
    seleccionarRegistro,
    recargarHistorial,
  }
}
