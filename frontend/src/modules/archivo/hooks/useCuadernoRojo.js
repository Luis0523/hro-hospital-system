import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hoyIsoGuatemala } from '@/shared/utils/fecha'
import { validarFormulario, valoresIniciales } from '../cuadernoRojoCampos'
import {
  eliminarCuadernoRojo,
  guardarCuadernoRojo,
  listarCuadernoRojo,
  obtenerCuadernoRojo,
} from '../api/archivoApi'
import {
  aniosDelRango,
  fechaEnRango,
  filtrarRegistrosPorRango,
  rangoMesActualGuatemala,
} from '../utils/rangoFechas'

const CLAVES_CANTIDAD = ['egresosHospitalarios', 'sobres', 'sobresSellados', 'tia']
const LIMITE_SOLICITUDES_ANIO = 3

function valoresConFecha(fecha = hoyIsoGuatemala()) {
  return { ...valoresIniciales(), fecha }
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
  const verbo = accion === 'guardar' ? 'guardar' : accion === 'eliminar' ? 'eliminar' : 'consultar'

  if (status === 400) {
    if (accion === 'guardar') {
      return 'El servidor rechazó las cantidades. Revise los datos e intente de nuevo.'
    }
    if (accion === 'filtrar') {
      return 'El servidor rechazó el período. Verifique el rango de fechas.'
    }
    return 'El servidor rechazó la consulta. Verifique la fecha e intente de nuevo.'
  }
  if (status === 401) return 'La sesión expiró. Vuelva a iniciar sesión.'
  if (status === 403) return `Su rol no tiene permiso para ${verbo} el Cuaderno Rojo.`
  if (status === 404) {
    return accion === 'eliminar'
      ? 'No se encontró el registro que intenta eliminar.'
      : 'No se encontró el recurso solicitado. Actualice e intente de nuevo.'
  }
  if (status === 501) {
    return (
      fallo?.message ||
      'La operación no está disponible: el backend no expone el endpoint necesario.'
    )
  }
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
 * Estado y operaciones de la pantalla del Cuaderno Rojo.
 *
 * - El formulario vive en los modales de alta/edición.
 * - El historial usa un rango de fechas y consulta al backend por año.
 * - Los tokens separan consultas de fecha e historial para descartar respuestas obsoletas.
 */
export function useCuadernoRojo() {
  const [valores, setValores] = useState(() => valoresConFecha())
  const [valoresGuardados, setValoresGuardados] = useState(() => valoresConFecha())
  const [tocados, setTocados] = useState({})
  const [registros, setRegistros] = useState([])
  const [existente, setExistente] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [progreso, setProgreso] = useState({ completados: 0, total: 0 })
  const [cargandoDia, setCargandoDia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState(() => rangoMesActualGuatemala())

  const guardandoRef = useRef(false)
  const eliminandoRef = useRef(false)
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
      { conservarRegistrosEnError = false, registrarError = true, limpiarAlIniciar = true } = {},
    ) => {
      const vigentes = filtrosSolicitados ?? filtrosRef.current
      const anios = aniosDelRango(vigentes.desde, vigentes.hasta)

      if (anios.length === 0) {
        setError('El período seleccionado no es válido.')
        setRegistros([])
        setCargandoHistorial(false)
        return false
      }

      const token = ++historialSolicitudRef.current
      setCargandoHistorial(true)
      setProgreso({ completados: 0, total: anios.length })
      if (limpiarAlIniciar) setRegistros([])

      const resultados = []
      let siguienteAnio = 0
      let completados = 0
      let fallo = null

      async function trabajador() {
        while (!fallo) {
          const indice = siguienteAnio
          siguienteAnio += 1
          if (indice >= anios.length) return

          try {
            const lista = await listarCuadernoRojo({ anio: anios[indice] })
            if (token !== historialSolicitudRef.current) return
            if (Array.isArray(lista)) resultados.push(...lista)
            completados += 1
            setProgreso({ completados, total: anios.length })
          } catch (errorConsulta) {
            fallo = errorConsulta
            return
          }
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(LIMITE_SOLICITUDES_ANIO, anios.length) }, () =>
            trabajador(),
          ),
        )
        if (token !== historialSolicitudRef.current) return null
        if (fallo) throw fallo

        setRegistros(filtrarRegistrosPorRango(resultados, vigentes.desde, vigentes.hasta))
        setError(null)
        return true
      } catch (errorConsulta) {
        if (token !== historialSolicitudRef.current) return null
        if (!conservarRegistrosEnError) setRegistros([])
        if (registrarError) setError(mensajeError(errorConsulta, 'filtrar'))
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
      .catch((falloConsulta) => {
        if (!activo || token !== solicitudRef.current) return
        setExistente(false)
        setError(mensajeError(falloConsulta, 'consultar'))
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

  const marcarTodosTocados = useCallback(() => {
    const todos = {}
    for (const clave of Object.keys(valoresRef.current)) todos[clave] = true
    setTocados(todos)
  }, [])

  const iniciarRegistroNuevo = useCallback(() => {
    solicitudRef.current += 1
    omitirCargaRef.current = null
    aplicarValores(valoresConFecha())
    setExistente(false)
    setTocados({})
    setError(null)
  }, [aplicarValores])

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

  const persistir = useCallback(
    async (fuente, fecha, { verificarDuplicado = false, marcarTocados = false } = {}) => {
      if (guardandoRef.current) return { ok: false, omitido: true }

      const revision = validarFormulario(fuente)
      if (!revision.valido) {
        if (marcarTocados) {
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

      try {
        if (verificarDuplicado) {
          const existenteFecha = await obtenerCuadernoRojo(fecha)
          if (existenteFecha) {
            return { ok: false, duplicado: true, registro: existenteFecha }
          }
        }

        const guardado = await guardarCuadernoRojo(fecha, datosParaGuardar(fuente))
        aplicarValores(valoresDesdeRegistro(guardado))
        setExistente(true)
        setTocados({})

        const refresco = await cargarHistorial(null, {
          conservarRegistrosEnError: true,
          registrarError: false,
          limpiarAlIniciar: false,
        })

        return {
          ok: true,
          registro: guardado,
          historialActualizado: refresco !== false,
          fueraDePeriodo: !fechaEnRango(guardado?.fecha ?? fecha, filtrosRef.current),
        }
      } catch (falloGuardado) {
        return { ok: false, error: mensajeError(falloGuardado, 'guardar') }
      } finally {
        guardandoRef.current = false
        setGuardando(false)
      }
    },
    [aplicarValores, cargarHistorial],
  )

  const crearRegistro = useCallback(
    () =>
      persistir(valoresRef.current, valoresRef.current.fecha, {
        verificarDuplicado: true,
        marcarTocados: true,
      }),
    [persistir],
  )

  const guardar = useCallback(
    (confirmado = null) =>
      persistir(
        confirmado ? confirmado.valores : valoresRef.current,
        confirmado ? confirmado.fecha : valoresRef.current.fecha,
        { marcarTocados: !confirmado },
      ),
    [persistir],
  )

  const eliminarRegistro = useCallback(async (fecha) => {
    if (eliminandoRef.current) return { ok: false, omitido: true }

    eliminandoRef.current = true
    setEliminando(true)
    try {
      await eliminarCuadernoRojo(fecha)
      setRegistros((actuales) => actuales.filter((registro) => registro.fecha !== fecha))
      return { ok: true }
    } catch (falloEliminar) {
      return { ok: false, error: mensajeError(falloEliminar, 'eliminar') }
    } finally {
      eliminandoRef.current = false
      setEliminando(false)
    }
  }, [])

  const aplicarFiltros = useCallback(({ desde, hasta }) => {
    const siguientes = { desde, hasta }
    filtrosRef.current = siguientes
    setFiltros(siguientes)
    setError(null)
  }, [])

  const restablecerFiltros = useCallback(() => {
    const siguientes = rangoMesActualGuatemala()
    filtrosRef.current = siguientes
    setFiltros(siguientes)
    setError(null)
  }, [])

  return {
    valores,
    errores,
    valido,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    progreso,
    cargandoDia,
    guardando,
    eliminando,
    error,
    hayCambios,
    filtros,
    iniciarRegistroNuevo,
    cambiarCampo,
    marcarTocado,
    marcarTodosTocados,
    crearRegistro,
    guardar,
    obtenerSnapshot,
    seleccionarRegistro,
    eliminarRegistro,
    aplicarFiltros,
    restablecerFiltros,
    recargarHistorial,
  }
}
