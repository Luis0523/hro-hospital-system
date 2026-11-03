import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  USANDO_DATOS_MOCK,
  listarDepuraciones,
  listarDepuracionesEnRango,
} from '../api/depuracionArchivoApi'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import {
  ORDEN_HISTORIAL,
  consultarDiasDepuraciones,
  deduplicarRegistros,
  ordenarRegistrosDesc,
} from '../utils/historialDepurados'
import {
  TIPOS_PERIODO,
  crearPeriodo,
  etiquetaPeriodo,
  textoVacioPeriodo,
  tituloPeriodo,
  validarRangoPersonalizado,
} from '../utils/periodoDepuracion'

export const UMBRAL_CONFIRMACION_RANGO_REAL = 31
export const UMBRAL_RANGO_MOCK_OPTIMIZADO = 31

function esFalloDeRed(fallo) {
  return fallo?.status == null
}

function mensajeDeErrorHistorial(fallo, { diasConsultados = 1, diasConError = 1 } = {}) {
  if (fallo?.status === 401 || fallo?.status === 403) {
    return 'La sesión no está autorizada para consultar la bitácora. Inicie sesión de nuevo.'
  }
  if (esFalloDeRed(fallo)) {
    return 'No se pudo conectar con el servidor. Revise la conexión e inténtelo de nuevo.'
  }
  if (diasConsultados > 1 && diasConError > 0) {
    return `No se pudieron consultar ${diasConError} de ${diasConsultados} días del período. Inténtelo de nuevo.`
  }
  return 'No se pudo cargar la bitácora de depuraciones.'
}

function claveDePeriodo(periodo) {
  return `${periodo?.tipo}:${periodo?.desde}:${periodo?.hasta}`
}

export function useHistorialDepurados() {
  const inicialRef = useRef(null)
  if (!inicialRef.current) {
    inicialRef.current = crearPeriodo(TIPOS_PERIODO.HOY)
  }

  const [filtroSeleccionado, setFiltroSeleccionado] = useState(TIPOS_PERIODO.HOY)
  const [periodoActivo, setPeriodoActivo] = useState(inicialRef.current)
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargado, setCargado] = useState(false)
  const [completo, setCompleto] = useState(false)
  const [desactualizado, setDesactualizado] = useState(false)
  const [error, setError] = useState(null)
  const [errorRango, setErrorRango] = useState(null)
  const [rangoBorrador, setRangoBorrador] = useState({
    desde: inicialRef.current.desde,
    hasta: inicialRef.current.hasta,
  })
  const [confirmacionRangoLargoAbierta, setConfirmacionRangoLargoAbierta] = useState(false)
  const [periodoPendiente, setPeriodoPendiente] = useState(null)

  const periodoRef = useRef(inicialRef.current)
  const registrosRef = useRef([])
  const cargadoRef = useRef(false)
  const completoRef = useRef(false)
  const errorRef = useRef(null)
  const solicitudRef = useRef(0)
  const enVueloRef = useRef(null)
  const iniciadoRef = useRef(false)

  const consultarPeriodo = useCallback(
    async (periodo, { conservar = false, forzar = false } = {}) => {
      const clave = claveDePeriodo(periodo)
      const enVuelo = enVueloRef.current
      if (!forzar && enVuelo?.clave === clave && enVuelo.solicitud === solicitudRef.current) {
        return enVuelo.promesa
      }

      const anterior = periodoRef.current
      const mismoPeriodo = anterior?.desde === periodo.desde && anterior?.hasta === periodo.hasta
      const registrosPrevios = registrosRef.current
      const estabaCargado = cargadoRef.current

      const solicitud = solicitudRef.current + 1
      solicitudRef.current = solicitud
      periodoRef.current = periodo

      setCargando(true)
      setError(null)
      errorRef.current = null
      setDesactualizado(false)

      if (!conservar) {
        registrosRef.current = []
        setRegistros([])
        cargadoRef.current = false
        setCargado(false)
        completoRef.current = false
        setCompleto(false)
      }

      const promesa = (async () => {
        try {
          const resultado =
            USANDO_DATOS_MOCK && periodo.dias.length > UMBRAL_RANGO_MOCK_OPTIMIZADO
              ? await listarDepuracionesEnRango({ dias: periodo.dias }).then((registros) => ({
                  registros: deduplicarRegistros(ordenarRegistrosDesc(registros)),
                  errores: [],
                  completo: true,
                  diasConsultados: periodo.dias.length,
                  diasConError: 0,
                }))
              : await consultarDiasDepuraciones({
                  dias: periodo.dias,
                  consultar: (fecha) => listarDepuraciones({ fecha }),
                })

          if (solicitud !== solicitudRef.current) return false

          const fallo = resultado.errores[0]?.error ?? null
          const mensaje = fallo
            ? mensajeDeErrorHistorial(fallo, {
                diasConsultados: resultado.diasConsultados,
                diasConError: resultado.diasConError,
              })
            : null

          if (fallo && mismoPeriodo && estabaCargado) {
            registrosRef.current = registrosPrevios
            setRegistros(registrosPrevios)
            cargadoRef.current = true
            setCargado(true)
            completoRef.current = false
            setCompleto(false)
            setDesactualizado(true)
            setError(mensaje)
            errorRef.current = mensaje
            return false
          }

          registrosRef.current = resultado.registros
          setRegistros(resultado.registros)

          const hayDatos = resultado.registros.length > 0
          const mostrarCargado = resultado.completo || hayDatos
          cargadoRef.current = mostrarCargado
          setCargado(mostrarCargado)
          completoRef.current = resultado.completo
          setCompleto(resultado.completo)
          setDesactualizado(false)
          setError(mensaje)
          errorRef.current = mensaje

          return resultado.completo
        } catch (fallo) {
          if (solicitud !== solicitudRef.current) return false

          const mensaje = mensajeDeErrorHistorial(fallo, {
            diasConsultados: periodo.dias.length,
            diasConError: periodo.dias.length,
          })

          if (mismoPeriodo && estabaCargado) {
            registrosRef.current = registrosPrevios
            setRegistros(registrosPrevios)
            cargadoRef.current = true
            setCargado(true)
            completoRef.current = false
            setCompleto(false)
            setDesactualizado(true)
          } else {
            registrosRef.current = []
            setRegistros([])
            cargadoRef.current = false
            setCargado(false)
            completoRef.current = false
            setCompleto(false)
          }

          setError(mensaje)
          errorRef.current = mensaje
          return false
        } finally {
          if (solicitud === solicitudRef.current) setCargando(false)
        }
      })()

      enVueloRef.current = { clave, solicitud, promesa }

      try {
        return await promesa
      } finally {
        if (enVueloRef.current?.promesa === promesa) enVueloRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    if (iniciadoRef.current) return
    iniciadoRef.current = true
    consultarPeriodo(inicialRef.current, { conservar: false })
  }, [consultarPeriodo])

  const aplicarPeriodo = useCallback(
    (periodo) => {
      const misma =
        periodoRef.current?.desde === periodo.desde && periodoRef.current?.hasta === periodo.hasta

      setFiltroSeleccionado(periodo.tipo)
      setPeriodoActivo(periodo)
      setRangoBorrador({ desde: periodo.desde, hasta: periodo.hasta })
      setErrorRango(null)

      if (misma && cargadoRef.current && !errorRef.current) return true

      consultarPeriodo(periodo, { conservar: false })
      return true
    },
    [consultarPeriodo],
  )

  const seleccionarPeriodo = useCallback(
    (tipo) => {
      if (tipo === TIPOS_PERIODO.PERSONALIZADO) {
        setFiltroSeleccionado(tipo)
        setErrorRango(null)
        if (filtroSeleccionado !== TIPOS_PERIODO.PERSONALIZADO) {
          setRangoBorrador({
            desde: periodoRef.current.desde,
            hasta: periodoRef.current.hasta,
          })
        }
        return false
      }

      const periodo = crearPeriodo(tipo, { hoy: hoyIsoGuatemala() })
      if (!periodo.valido) {
        setErrorRango(periodo.mensaje)
        return false
      }

      return aplicarPeriodo(periodo)
    },
    [aplicarPeriodo, filtroSeleccionado],
  )

  const cambiarRango = useCallback((campo, valor) => {
    if (campo !== 'desde' && campo !== 'hasta') return
    setRangoBorrador((anterior) => ({ ...anterior, [campo]: valor }))
    setErrorRango(null)
  }, [])

  const aplicarRangoPersonalizado = useCallback(() => {
    const validacion = validarRangoPersonalizado(rangoBorrador.desde, rangoBorrador.hasta)

    if (!validacion.valido) {
      setErrorRango(validacion.mensaje)
      return false
    }

    const periodo = crearPeriodo(TIPOS_PERIODO.PERSONALIZADO, {
      hoy: hoyIsoGuatemala(),
      desde: validacion.desde,
      hasta: validacion.hasta,
    })

    if (!periodo.valido) {
      setErrorRango(periodo.mensaje)
      return false
    }

    if (!USANDO_DATOS_MOCK && periodo.diasCalendario > UMBRAL_CONFIRMACION_RANGO_REAL) {
      setPeriodoPendiente(periodo)
      setConfirmacionRangoLargoAbierta(true)
      return false
    }

    return aplicarPeriodo(periodo)
  }, [aplicarPeriodo, rangoBorrador])

  const confirmarRangoLargo = useCallback(() => {
    if (!periodoPendiente) return false
    const periodo = periodoPendiente
    setPeriodoPendiente(null)
    setConfirmacionRangoLargoAbierta(false)
    return aplicarPeriodo(periodo)
  }, [aplicarPeriodo, periodoPendiente])

  const cancelarRangoLargo = useCallback(() => {
    setPeriodoPendiente(null)
    setConfirmacionRangoLargoAbierta(false)
  }, [])

  const restablecerRango = useCallback(() => {
    const hoy = hoyIsoGuatemala()
    setRangoBorrador({
      desde: periodoRef.current?.desde ?? hoy,
      hasta: periodoRef.current?.hasta ?? hoy,
    })
    setErrorRango(null)
  }, [])

  const invalidarRegistro = useCallback((registroId) => {
    if (registroId == null) return
    const actuales = registrosRef.current
    const restantes = actuales.filter((registro) => registro.id !== registroId)
    if (restantes.length === actuales.length) return

    registrosRef.current = restantes
    setRegistros(restantes)
    completoRef.current = false
    setCompleto(false)
    setDesactualizado(true)
  }, [])

  const reintentar = useCallback(
    () => consultarPeriodo(periodoRef.current, { conservar: true, forzar: true }),
    [consultarPeriodo],
  )

  const refrescar = useCallback(
    (opciones = {}) =>
      consultarPeriodo(periodoRef.current, {
        conservar: true,
        forzar: false,
        ...opciones,
      }),
    [consultarPeriodo],
  )

  const consultaValidaParaReportes = completo && cargado && !cargando && !error && !desactualizado

  const datosHistorial = useMemo(
    () => ({
      filtroActivo: periodoActivo.tipo,
      fechaInicio: periodoActivo.desde,
      fechaFin: periodoActivo.hasta,
      dias: periodoActivo.dias,
      registros,
      total: registros.length,
      orden: ORDEN_HISTORIAL,
      cargando,
      error,
      completo,
      validoParaReportes: consultaValidaParaReportes,
      desactualizado,
    }),
    [
      periodoActivo,
      registros,
      cargando,
      error,
      completo,
      consultaValidaParaReportes,
      desactualizado,
    ],
  )

  return {
    filtroSeleccionado,
    filtroActivo: periodoActivo.tipo,
    periodoActivo,
    fechaInicio: periodoActivo.desde,
    fechaFin: periodoActivo.hasta,
    dias: periodoActivo.dias,
    registros,
    depurados: registros,
    total: registros.length,
    orden: ORDEN_HISTORIAL,
    cargando,
    cargado,
    completo,
    consultaCompleta: completo,
    consultaValidaParaReportes,
    desactualizado,
    error,
    errorHistorial: error,
    errorRango,
    rangoBorrador,
    confirmacionRangoLargoAbierta,
    periodoPendiente,
    etiquetaPeriodo: etiquetaPeriodo(periodoActivo),
    tituloHistorial: tituloPeriodo(periodoActivo.tipo),
    textoVacioHistorial: textoVacioPeriodo(periodoActivo.tipo),
    seleccionarPeriodo,
    cambiarRango,
    aplicarRangoPersonalizado,
    confirmarRangoLargo,
    cancelarRangoLargo,
    restablecerRango,
    reintentar,
    refrescar,
    invalidarRegistro,
    datosHistorial,
    bitacoraCargada: cargado,
    cargandoBitacora: cargando,
    errorBitacora: error,
    reintentarBitacora: reintentar,
    cargarBitacora: refrescar,
  }
}
