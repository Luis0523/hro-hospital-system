// Controlador de la pantalla de Salidas Externas.
//
// Solo consume la API pÃºblica (`salidasExternasApi.js`); nunca el mock.
// Responsabilidades: estado de los dos modos de captura, carga de la vista
// activa, bÃºsqueda/confirmaciÃ³n de devoluciones, recuperaciÃ³n manual y
// descarte de respuestas obsoletas. El DOM (foco, scroll) queda para B4.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CODIGO_ENTRADA_INVALIDA,
  CODIGO_SIN_PRESTAMO_PENDIENTE,
  CODIGO_YA_DEVUELTO,
  buscarPendiente as buscarPendienteApi,
  listarDevueltos,
  listarHistorial,
  listarHoy,
  listarPendientes,
  obtenerUltimaAccion as obtenerUltimaAccionApi,
  registrarDevolucion as registrarDevolucionApi,
  registrarPrestamo as registrarPrestamoApi,
  registrarRecuperado as registrarRecuperadoApi,
  revertirUltimaAccion as revertirUltimaAccionApi,
} from '../api/salidasExternasApi'
import {
  listarNombresPacientesEnCache,
  obtenerNombrePacienteDeExpediente,
} from '../api/nombrePacienteExpedienteApi'
import {
  MODO_VERIFICACION_REAL,
  errorDeVerificacion,
  obtenerModoVerificacion,
  verificacionBloqueaRegistro,
  verificarExistenciaExpediente,
} from '../api/verificacionExpedienteApi'
import {
  buscarRegistros,
  normalizarNumeroExpediente,
  numeroExpedienteVisible,
  resolverNumeroExpedienteCapturado,
} from '../utils/prestamosExternos'
import { useDiaOperativo } from './useDiaOperativo'

export const MODO_PRESTAMO = 'prestamo'
export const MODO_DEVOLUCION = 'devolucion'
export const MODOS = [MODO_PRESTAMO, MODO_DEVOLUCION]

export const VISTA_TODOS = 'todos'
export const VISTA_PENDIENTES = 'pendientes'
export const VISTA_DEVUELTOS = 'devueltos'
export const VISTAS = [VISTA_TODOS, VISTA_PENDIENTES, VISTA_DEVUELTOS]

/** Estados posibles de la bÃºsqueda para devoluciÃ³n. */
export const BUSQUEDA_INICIAL = 'inicial'
export const BUSQUEDA_BUSCANDO = 'buscando'
export const BUSQUEDA_ENCONTRADO = 'encontrado'
export const BUSQUEDA_SIN_PENDIENTE = 'sin_pendiente'
export const BUSQUEDA_YA_DEVUELTO = 'ya_devuelto'
export const BUSQUEDA_INVALIDA = 'invalido'
export const BUSQUEDA_ERROR = 'error'

function busquedaInicial() {
  return { estado: BUSQUEDA_INICIAL, registro: null, mensaje: null, codigo: null }
}

/** Normaliza cualquier fallo a un descriptor estable para la UI. */
function describirError(fallo, mensajePorDefecto) {
  return {
    codigo: fallo?.codigo ?? null,
    status: fallo?.status ?? null,
    mensaje: fallo?.message || mensajePorDefecto,
    campo: fallo?.data?.campo ?? null,
    registro: fallo?.data?.registro ?? null,
    motivo: fallo?.data?.motivo ?? null,
  }
}

/**
 * @param {{ operador?: string|null }} opciones Identidad del operador de Archivo.
 */
export function useSalidasExternas({ operador = null } = {}) {
  const { hoy } = useDiaOperativo()

  // --- Vista activa -------------------------------------------------------
  const [vista, setVista] = useState(VISTA_TODOS)
  const [busquedaLocal, setBusquedaLocal] = useState('')
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const vistaRef = useRef(VISTA_TODOS)
  const hoyRef = useRef(hoy)
  const peticionRef = useRef(0)

  useEffect(() => {
    hoyRef.current = hoy
  }, [hoy])

  // --- Última acción (para el panel y la reversión) -----------------------
  const [ultimaAccion, setUltimaAccion] = useState(null)

  const refrescarUltimaAccion = useCallback(async () => {
    try {
      setUltimaAccion(await obtenerUltimaAccionApi())
    } catch {
      setUltimaAccion(null)
    }
  }, [])

  const cargar = useCallback(
    async (vistaPedida = vistaRef.current, fechaPedida = hoyRef.current) => {
      const peticion = peticionRef.current + 1
      peticionRef.current = peticion
      setCargando(true)
      setErrorCarga(null)

      try {
        let datos
        if (vistaPedida === VISTA_PENDIENTES) datos = await listarPendientes()
        else if (vistaPedida === VISTA_DEVUELTOS) datos = await listarDevueltos()
        else datos = await listarHoy({ fecha: fechaPedida })

        // Descarta respuestas de una vista/fecha que ya no estÃ¡ activa.
        if (peticion !== peticionRef.current) return
        setRegistros(datos)
      } catch (fallo) {
        if (peticion !== peticionRef.current) return
        setRegistros([])
        setErrorCarga(describirError(fallo, 'No se pudieron cargar los movimientos.'))
      } finally {
        if (peticion === peticionRef.current) setCargando(false)
      }
    },
    [],
  )

  // Carga inicial y recarga al cambiar de vista o de dÃ­a operativo.
  useEffect(() => {
    cargar(vista, hoy)
  }, [cargar, vista, hoy])

  // Recupera la última acción de la sesión (p. ej. al volver a la pantalla).
  useEffect(() => {
    refrescarUltimaAccion()
  }, [refrescarUltimaAccion])

  const recargar = useCallback(() => cargar(), [cargar])

  // Historial completo, sin filtro de vista ni de bÃºsqueda, para el reporte.
  // No altera la vista activa ni el texto de bÃºsqueda del operador.
  const obtenerHistorialCompleto = useCallback(() => listarHistorial(), [])

  const cambiarVista = useCallback((nuevaVista) => {
    if (!VISTAS.includes(nuevaVista) || nuevaVista === vistaRef.current) return
    vistaRef.current = nuevaVista
    setVista(nuevaVista)
  }, [])

  const cambiarBusquedaLocal = useCallback((texto) => setBusquedaLocal(String(texto ?? '')), [])

  // Los registros visibles son una copia ordenada y filtrada: nunca se muta el
  // estado recibido de la API.
  const registrosVisibles = useMemo(
    () => buscarRegistros(registros, busquedaLocal),
    [registros, busquedaLocal],
  )

  // --- Modo de captura ----------------------------------------------------
  const [modo, setModo] = useState(MODO_PRESTAMO)

  const cambiarModo = useCallback((nuevoModo) => {
    if (!MODOS.includes(nuevoModo)) return
    // No se limpian los campos: cada modo conserva lo que el operador escribiÃ³.
    setModo(nuevoModo)
  }, [])

  // --- PrÃ©stamo individual ------------------------------------------------
  const [personaRetira, setPersonaRetira] = useState('')
  const [motivo, setMotivo] = useState('')
  const [numeroPrestamo, setNumeroPrestamo] = useState('')
  const [presentacionPrestamo, setPresentacionPrestamo] = useState(null)
  const [guardandoPrestamo, setGuardandoPrestamo] = useState(false)
  const [errorPrestamo, setErrorPrestamo] = useState(null)
  const [exitoPrestamo, setExitoPrestamo] = useState(null)

  // Verificación de existencia (independiente de la persistencia simulada).
  const [verificandoPrestamo, setVerificandoPrestamo] = useState(false)
  const [verificacionPrestamo, setVerificacionPrestamo] = useState(null)
  const modoVerificacion = useMemo(() => obtenerModoVerificacion(), [])

  const guardandoPrestamoRef = useRef(false)
  // Huella de la captura vigente: sirve para descartar la respuesta de una
  // verificación que terminó después de que el operador cambió el número.
  const numeroPrestamoRef = useRef('')
  const presentacionPrestamoRef = useRef(null)
  const verificacionRef = useRef(0)

  // Nombre del paciente dueño del expediente, solo como dato complementario de
  // lectura. Se conserva en memoria durante la sesión; nunca bloquea el préstamo.
  const [nombresPacientes, setNombresPacientes] = useState(() => listarNombresPacientesEnCache())

  const resolverNombrePaciente = useCallback(async (numero, pacienteId) => {
    try {
      const resultado = await obtenerNombrePacienteDeExpediente(numero, pacienteId)
      if (!resultado?.nombre) return
      const clave = normalizarNumeroExpediente(numero)
      setNombresPacientes((previo) => ({ ...previo, [clave]: resultado }))
    } catch {
      // Consulta complementaria: un fallo nunca afecta el préstamo registrado.
    }
  }, [])

  // El ingreso manual (con guion) fija también la representación visible.
  const cambiarNumeroPrestamo = useCallback((valor, presentacion = null) => {
    const siguiente = String(valor ?? '')
    const siguientePresentacion = presentacion ? String(presentacion) : null

    numeroPrestamoRef.current = siguiente
    presentacionPrestamoRef.current = siguientePresentacion
    verificacionRef.current += 1
    setNumeroPrestamo(siguiente)
    setPresentacionPrestamo(siguientePresentacion)
    setVerificacionPrestamo(null)
  }, [])

  const guardarPrestamo = useCallback(async () => {
    // Guard sincrónico contra doble Enter.
    if (guardandoPrestamoRef.current) return

    guardandoPrestamoRef.current = true
    setGuardandoPrestamo(true)
    setErrorPrestamo(null)
    setExitoPrestamo(null)
    setVerificacionPrestamo(null)

    // Captura exacta que se está enviando. Si el operador la cambia mientras
    // se verifica, la respuesta ya no aplica y no se registra nada.
    const numeroCapturado = numeroPrestamo
    const presentacionCapturada = presentacionPrestamo
    const numeroVerificado = resolverNumeroExpedienteCapturado(
      numeroCapturado,
      presentacionCapturada,
    )
    let pacienteIdVerificado = null

    try {
      if (modoVerificacion === MODO_VERIFICACION_REAL && numeroVerificado) {
        const intento = verificacionRef.current + 1
        verificacionRef.current = intento
        setVerificandoPrestamo(true)

        const resultado = await verificarExistenciaExpediente(numeroVerificado)

        const capturaVigente =
          intento === verificacionRef.current &&
          numeroPrestamoRef.current === numeroCapturado &&
          presentacionPrestamoRef.current === presentacionCapturada

        // Respuesta obsoleta: otro número está en pantalla. No se registra.
        if (!capturaVigente) return

        setVerificacionPrestamo(resultado)
        if (verificacionBloqueaRegistro(resultado)) {
          throw errorDeVerificacion(resultado)
        }
        pacienteIdVerificado = resultado.expediente?.pacienteId ?? null
      } else if (numeroVerificado) {
        // Sin verificación real (mock o deshabilitada): solo se deja constancia
        // del modo. La existencia NO se confirma contra la base de datos.
        setVerificacionPrestamo(await verificarExistenciaExpediente(numeroVerificado))
      }

      const creado = await registrarPrestamoApi({
        numeroExpediente: numeroPrestamo,
        presentacion: presentacionPrestamo,
        personaRetira,
        motivo,
        registradoPor: operador,
      })

      // Solo se limpia el expediente; persona y motivo se conservan.
      cambiarNumeroPrestamo('')
      setExitoPrestamo(`Préstamo registrado para el expediente ${numeroExpedienteVisible(creado)}.`)
      await refrescarUltimaAccion()
      await cargar()

      // Complementario y posterior al registro: si falla, el préstamo sigue
      // siendo válido y la tabla muestra "no disponible".
      if (modoVerificacion === MODO_VERIFICACION_REAL && pacienteIdVerificado) {
        void resolverNombrePaciente(numeroVerificado, pacienteIdVerificado)
      }
    } catch (fallo) {
      // Se conserva todo lo escrito para que el operador corrija y reintente.
      setErrorPrestamo(describirError(fallo, 'No se pudo registrar el préstamo.'))
    } finally {
      guardandoPrestamoRef.current = false
      setGuardandoPrestamo(false)
      setVerificandoPrestamo(false)
    }
  }, [
    numeroPrestamo,
    presentacionPrestamo,
    personaRetira,
    motivo,
    operador,
    modoVerificacion,
    cargar,
    refrescarUltimaAccion,
    resolverNombrePaciente,
    cambiarNumeroPrestamo,
  ])

  // --- DevoluciÃ³n ---------------------------------------------------------
  const [numeroDevolucion, setNumeroDevolucion] = useState('')
  const [presentacionDevolucion, setPresentacionDevolucion] = useState(null)
  const [busqueda, setBusqueda] = useState(busquedaInicial)
  const [buscando, setBuscando] = useState(false)
  const [guardandoDevolucion, setGuardandoDevolucion] = useState(false)
  const [errorDevolucion, setErrorDevolucion] = useState(null)
  const [exitoDevolucion, setExitoDevolucion] = useState(null)

  const guardandoDevolucionRef = useRef(false)
  const busquedaRef = useRef(0)
  // Registro listo para confirmar. Se usa un ref (ademÃ¡s del estado) para que
  // dos confirmaciones en el mismo tick no puedan dispararse dos veces.
  const confirmableRef = useRef(null)

  const cambiarNumeroDevolucion = useCallback((valor, presentacion = null) => {
    // Cambiar el número invalida cualquier búsqueda en curso: su resultado ya
    // no corresponde al expediente que el operador tiene en pantalla.
    busquedaRef.current += 1
    confirmableRef.current = null
    setNumeroDevolucion(String(valor ?? ''))
    setPresentacionDevolucion(presentacion ? String(presentacion) : null)
    setBusqueda(busquedaInicial())
    setBuscando(false)
    setErrorDevolucion(null)
  }, [])

  const buscarParaDevolucion = useCallback(async () => {
    const numero = String(numeroDevolucion ?? '').trim()
    if (!numero) {
      setBusqueda(busquedaInicial())
      return
    }

    const peticion = busquedaRef.current + 1
    busquedaRef.current = peticion
    confirmableRef.current = null
    setBuscando(true)
    setErrorDevolucion(null)
    setExitoDevolucion(null)
    setBusqueda({ estado: BUSQUEDA_BUSCANDO, registro: null, mensaje: null, codigo: null })

    try {
      const registro = await buscarPendienteApi(numero)
      if (peticion !== busquedaRef.current) return
      confirmableRef.current = registro
      setBusqueda({ estado: BUSQUEDA_ENCONTRADO, registro, mensaje: null, codigo: null })
    } catch (fallo) {
      if (peticion !== busquedaRef.current) return

      const codigo = fallo?.codigo ?? null
      let estado = BUSQUEDA_ERROR
      if (codigo === CODIGO_SIN_PRESTAMO_PENDIENTE) estado = BUSQUEDA_SIN_PENDIENTE
      else if (codigo === CODIGO_YA_DEVUELTO) estado = BUSQUEDA_YA_DEVUELTO
      else if (codigo === CODIGO_ENTRADA_INVALIDA) estado = BUSQUEDA_INVALIDA

      setBusqueda({
        estado,
        registro: fallo?.data?.registro ?? null,
        mensaje: fallo?.message || 'No se pudo buscar el expediente.',
        codigo,
      })
    } finally {
      if (peticion === busquedaRef.current) setBuscando(false)
    }
  }, [numeroDevolucion])

  const cancelarDevolucion = useCallback(() => {
    busquedaRef.current += 1
    confirmableRef.current = null
    setBusqueda(busquedaInicial())
    setBuscando(false)
    setErrorDevolucion(null)
  }, [])

  const confirmarDevolucion = useCallback(async () => {
    if (guardandoDevolucionRef.current) return

    // La confirmaciÃ³n usa el ref: si ya se confirmÃ³ (o se cancelÃ³), no hay nada
    // que registrar aunque el componente vuelva a llamar a esta funciÃ³n.
    const registro = confirmableRef.current
    if (!registro) return

    guardandoDevolucionRef.current = true
    setGuardandoDevolucion(true)
    setErrorDevolucion(null)
    setExitoDevolucion(null)

    try {
      const devuelto = await registrarDevolucionApi({
        numeroExpediente: registro.numeroExpediente,
      })

      confirmableRef.current = null
      busquedaRef.current += 1
      setNumeroDevolucion('')
      setBusqueda(busquedaInicial())
      setExitoDevolucion(
        `Devolución registrada para el expediente ${numeroExpedienteVisible(devuelto)}.`,
      )
      await refrescarUltimaAccion()
      await cargar()
    } catch (fallo) {
      // El expediente NO se marca como devuelto: solo se informa el fallo.
      setErrorDevolucion(describirError(fallo, 'No se pudo registrar la devolución.'))
    } finally {
      guardandoDevolucionRef.current = false
      setGuardandoDevolucion(false)
    }
  }, [cargar, refrescarUltimaAccion])

  /**
   * Devolución directa: una sola acción (Enter o botón) sin tarjeta de
   * confirmación previa. La API valida que exista un préstamo pendiente.
   */
  const registrarDevolucionDirecta = useCallback(async () => {
    if (guardandoDevolucionRef.current) return

    guardandoDevolucionRef.current = true
    setGuardandoDevolucion(true)
    setErrorDevolucion(null)
    setExitoDevolucion(null)

    try {
      const devuelto = await registrarDevolucionApi({
        numeroExpediente: numeroDevolucion,
        presentacion: presentacionDevolucion,
      })

      cambiarNumeroDevolucion('')
      setExitoDevolucion(
        `Devolución registrada para el expediente ${numeroExpedienteVisible(devuelto)}.`,
      )
      await refrescarUltimaAccion()
      await cargar()
    } catch (fallo) {
      setErrorDevolucion(describirError(fallo, 'No se pudo registrar la devolución.'))
    } finally {
      guardandoDevolucionRef.current = false
      setGuardandoDevolucion(false)
    }
  }, [
    numeroDevolucion,
    presentacionDevolucion,
    cambiarNumeroDevolucion,
    cargar,
    refrescarUltimaAccion,
  ])

  // --- RecuperaciÃ³n manual de pendientes (flujo separado) -----------------
  const [guardandoRecuperacion, setGuardandoRecuperacion] = useState(false)
  const [errorRecuperacion, setErrorRecuperacion] = useState(null)
  const [exitoRecuperacion, setExitoRecuperacion] = useState(null)

  const guardandoRecuperacionRef = useRef(false)

  const recuperarPrestamo = useCallback(
    async (datos = {}) => {
      if (guardandoRecuperacionRef.current) return null

      guardandoRecuperacionRef.current = true
      setGuardandoRecuperacion(true)
      setErrorRecuperacion(null)
      setExitoRecuperacion(null)

      try {
        const creado = await registrarRecuperadoApi({ ...datos, registradoPor: operador })
        setExitoRecuperacion(
          `Préstamo recuperado para el expediente ${numeroExpedienteVisible(creado)}.`,
        )
        await refrescarUltimaAccion()
        await cargar()
        return creado
      } catch (fallo) {
        setErrorRecuperacion(describirError(fallo, 'No se pudo recuperar el préstamo.'))
        return null
      } finally {
        guardandoRecuperacionRef.current = false
        setGuardandoRecuperacion(false)
      }
    },
    [operador, cargar, refrescarUltimaAccion],
  )

  // --- Reversión de la última acción --------------------------------------
  const [revirtiendo, setRevirtiendo] = useState(false)
  const [errorReversion, setErrorReversion] = useState(null)
  const [exitoReversion, setExitoReversion] = useState(null)

  const revirtiendoRef = useRef(false)

  const revertirAccion = useCallback(async () => {
    if (revirtiendoRef.current) return

    revirtiendoRef.current = true
    setRevirtiendo(true)
    setErrorReversion(null)
    setExitoReversion(null)

    try {
      const resultado = await revertirUltimaAccionApi()
      const etiqueta =
        resultado.tipo === 'devolucion'
          ? 'Devolución revertida'
          : resultado.tipo === 'recuperacion'
            ? 'Recuperación revertida'
            : 'Préstamo revertido'

      setUltimaAccion(null)
      setExitoReversion(`${etiqueta}: expediente ${numeroExpedienteVisible(resultado.registro)}.`)
      await cargar()
    } catch (fallo) {
      setErrorReversion(describirError(fallo, 'No se pudo revertir la acción.'))
    } finally {
      revirtiendoRef.current = false
      setRevirtiendo(false)
    }
  }, [cargar])

  const limpiarAvisos = useCallback(() => {
    setErrorPrestamo(null)
    setExitoPrestamo(null)
    setErrorDevolucion(null)
    setExitoDevolucion(null)
    setErrorRecuperacion(null)
    setExitoRecuperacion(null)
    setErrorReversion(null)
    setExitoReversion(null)
  }, [])

  const operacionEnCurso =
    guardandoPrestamo || guardandoDevolucion || guardandoRecuperacion || revirtiendo

  return {
    // DÃ­a operativo y vista
    hoy,
    vista,
    cambiarVista,
    busquedaLocal,
    cambiarBusquedaLocal,
    registros: registrosVisibles,
    cargando,
    errorCarga,
    recargar,
    obtenerHistorialCompleto,

    // Modo
    modo,
    cambiarModo,

    // PrÃ©stamo
    personaRetira,
    setPersonaRetira,
    motivo,
    setMotivo,
    numeroPrestamo,
    setNumeroPrestamo: cambiarNumeroPrestamo,
    guardarPrestamo,
    guardandoPrestamo,
    errorPrestamo,
    exitoPrestamo,
    verificandoPrestamo,
    verificacionPrestamo,
    modoVerificacion,
    nombresPacientes,

    // Devolución
    numeroDevolucion,
    setNumeroDevolucion: cambiarNumeroDevolucion,
    buscarParaDevolucion,
    busqueda,
    buscando,
    confirmarDevolucion,
    cancelarDevolucion,
    registrarDevolucionDirecta,
    guardandoDevolucion,
    errorDevolucion,
    exitoDevolucion,

    // Recuperación manual
    recuperarPrestamo,
    guardandoRecuperacion,
    errorRecuperacion,
    exitoRecuperacion,

    // Última acción y reversión
    ultimaAccion,
    revertirAccion,
    revirtiendo,
    errorReversion,
    exitoReversion,
    operacionEnCurso,

    // Utilidades
    limpiarAvisos,
  }
}
