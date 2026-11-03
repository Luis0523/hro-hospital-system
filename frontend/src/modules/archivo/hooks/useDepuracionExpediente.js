import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MENSAJES_ERROR_EXPEDIENTE,
  formatearExpedienteDepuracion,
  validarEntradaExpediente,
  validarEntradaExpedienteManual,
} from '../utils/expedienteDepuracion'
import {
  USANDO_DATOS_MOCK,
  buscarExpedienteParaDepurar,
  deshacerUltimaDepuracion,
  marcarDepurado,
} from '../api/depuracionArchivoApi'
import { useHistorialDepurados } from './useHistorialDepurados'

const DEBOUNCE_MS = 350

function esFalloDeRed(fallo) {
  return fallo?.status == null
}

export function useDepuracionExpediente() {
  const historial = useHistorialDepurados()
  const { invalidarRegistro: invalidarRegistroHistorial, refrescar: refrescarHistorial } = historial

  const [numero, setNumero] = useState('')
  const [resultado, setResultado] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [mensaje, setMensaje] = useState(null)
  const [exito, setExito] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [errorConfirmacion, setErrorConfirmacion] = useState(null)
  const [ultimaDepuracion, setUltimaDepuracion] = useState(null)
  const [confirmacionDeshacerAbierta, setConfirmacionDeshacerAbierta] = useState(false)
  const [errorDeshacer, setErrorDeshacer] = useState(null)
  const [deshaciendo, setDeshaciendo] = useState(false)
  const [exitoDeshacer, setExitoDeshacer] = useState(null)
  const [modoCaptura, setModoCaptura] = useState('normal')

  const inputRef = useRef(null)
  const peticionRef = useRef(0)
  const confirmandoRef = useRef(false)
  const deshaciendoRef = useRef(false)
  const modoCapturaRef = useRef('normal')
  const timerBusquedaRef = useRef(null)

  const enfocar = useCallback(() => inputRef.current?.focus(), [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  const buscar = useCallback(async (valor) => {
    if (timerBusquedaRef.current != null) {
      clearTimeout(timerBusquedaRef.current)
      timerBusquedaRef.current = null
    }

    const peticion = peticionRef.current + 1
    peticionRef.current = peticion

    const validacion =
      modoCapturaRef.current === 'manual'
        ? validarEntradaExpedienteManual(valor)
        : validarEntradaExpediente(valor)
    if (!validacion.valido) {
      setProcesando(false)
      setEstado('formato_invalido')
      setMensaje(MENSAJES_ERROR_EXPEDIENTE[validacion.error] ?? 'Número de expediente no válido.')
      setResultado(null)
      setConfirmacionAbierta(false)
      setErrorConfirmacion(null)
      return { estado: 'formato_invalido', resultado: null }
    }

    const buscado = validacion.numero
    setProcesando(true)
    setEstado('buscando')
    setMensaje(null)
    setResultado(null)
    setConfirmacionAbierta(false)
    setErrorConfirmacion(null)

    try {
      const expediente = await buscarExpedienteParaDepurar(buscado)
      if (peticion !== peticionRef.current) return

      if (!expediente) {
        setEstado('no_encontrado')
        setMensaje(`No se encontró el expediente ${formatearExpedienteDepuracion(buscado)}.`)
        return { estado: 'no_encontrado', resultado: null }
      }
      if (expediente.depurado) {
        setResultado(expediente)
        setEstado('duplicado')
        setMensaje('Este expediente ya está depurado (ya no existe en el sistema).')
        return { estado: 'duplicado', resultado: expediente }
      }
      setResultado(expediente)
      setEstado('encontrado')
      return { estado: 'encontrado', resultado: expediente }
    } catch (fallo) {
      if (peticion !== peticionRef.current) return null
      if (fallo?.status === 404) {
        setEstado('no_encontrado')
        setMensaje(`No se encontró el expediente ${formatearExpedienteDepuracion(buscado)}.`)
        return { estado: 'no_encontrado', resultado: null }
      }
      setEstado('error')
      setMensaje(fallo?.message || 'No se pudo buscar el expediente.')
      return { estado: 'error', resultado: null }
    } finally {
      if (peticion === peticionRef.current) setProcesando(false)
    }
  }, [])

  const establecerModoCaptura = useCallback((modo) => {
    if (modo !== 'normal' && modo !== 'manual') return
    if (modoCapturaRef.current === modo) return

    if (timerBusquedaRef.current != null) {
      clearTimeout(timerBusquedaRef.current)
      timerBusquedaRef.current = null
    }
    peticionRef.current += 1
    modoCapturaRef.current = modo
    setModoCaptura(modo)
    setProcesando(false)
    setMensaje(null)
    setEstado((actual) => (actual === 'formato_invalido' ? 'inicial' : actual))
  }, [])

  const alternarModoCaptura = useCallback(() => {
    establecerModoCaptura(modoCapturaRef.current === 'normal' ? 'manual' : 'normal')
  }, [establecerModoCaptura])

  // Búsqueda automática con debounce al escribir/escanear.
  useEffect(() => {
    const buscado = numero.trim()
    if (!buscado) {
      // Invalida cualquier respuesta en vuelo al limpiar el campo.
      peticionRef.current += 1
      setProcesando(false)
      setEstado('inicial')
      setResultado(null)
      setMensaje(null)
      setExitoDeshacer(null)
      setConfirmacionAbierta(false)
      setErrorConfirmacion(null)
      return undefined
    }

    setExito(null)
    setExitoDeshacer(null)
    const timer = setTimeout(() => {
      timerBusquedaRef.current = null
      buscar(buscado)
    }, DEBOUNCE_MS)
    timerBusquedaRef.current = timer
    return () => {
      clearTimeout(timer)
      if (timerBusquedaRef.current === timer) timerBusquedaRef.current = null
    }
  }, [numero, buscar])

  const abrirConfirmacion = useCallback(
    (expediente = resultado) => {
      if (!expediente || expediente.depurado) return false
      setErrorConfirmacion(null)
      setConfirmacionAbierta(true)
      return true
    },
    [resultado],
  )

  const cerrarConfirmacion = useCallback(() => {
    if (procesando) return
    setConfirmacionAbierta(false)
    setErrorConfirmacion(null)
    setTimeout(enfocar, 0)
  }, [procesando, enfocar])

  const confirmarDepuracion = useCallback(async () => {
    // El ref corta el doble clic/Enter en el mismo tick, antes de que React
    // vuelva a renderizar y actualice `procesando`.
    if (!resultado || !confirmacionAbierta || confirmandoRef.current) return

    confirmandoRef.current = true
    setProcesando(true)
    setMensaje(null)
    setErrorConfirmacion(null)

    try {
      let registro
      try {
        registro = await marcarDepurado({
          numeroExpediente: resultado.numeroExpediente,
        })
      } catch (fallo) {
        const status = fallo?.status
        if (status === 409) {
          setConfirmacionAbierta(false)
          setEstado('duplicado')
          setMensaje('Este expediente ya estaba depurado.')
          setTimeout(enfocar, 0)
        } else if (status === 404) {
          setConfirmacionAbierta(false)
          setEstado('no_encontrado')
          setMensaje('El expediente no existe.')
          setTimeout(enfocar, 0)
        } else if (esFalloDeRed(fallo)) {
          setErrorConfirmacion(
            'No se pudo confirmar la depuración por un problema de conexión. Verifique la bitácora antes de volver a intentarlo.',
          )
        } else {
          setErrorConfirmacion('No se pudo registrar la depuración. Inténtelo de nuevo.')
        }
        return
      }

      // Operación A confirmada: desde aquí la baja ya está registrada y no se
      // revierte aunque falle la actualización de la bitácora.
      if (USANDO_DATOS_MOCK) setUltimaDepuracion(registro)
      setExitoDeshacer(null)
      setExito(
        `Expediente ${formatearExpedienteDepuracion(
          registro?.numeroExpediente ?? resultado.numeroExpediente,
        )} depurado.`,
      )
      setNumero('')
      setResultado(null)
      setEstado('inicial')
      setConfirmacionAbierta(false)
      setErrorConfirmacion(null)
      setProcesando(false)
      // Espera a que la tarjeta vuelva a su estado inicial para devolver el foco.
      setTimeout(enfocar, 0)

      await refrescarHistorial({ forzar: true })
    } finally {
      confirmandoRef.current = false
      setProcesando(false)
    }
  }, [resultado, confirmacionAbierta, refrescarHistorial, enfocar])

  const abrirDeshacer = useCallback(() => {
    if (!USANDO_DATOS_MOCK || !ultimaDepuracion || deshaciendo) return
    setErrorDeshacer(null)
    setConfirmacionDeshacerAbierta(true)
  }, [ultimaDepuracion, deshaciendo])

  const cerrarDeshacer = useCallback(() => {
    if (deshaciendo) return
    setConfirmacionDeshacerAbierta(false)
    setErrorDeshacer(null)
  }, [deshaciendo])

  const confirmarDeshacer = useCallback(async () => {
    if (
      !USANDO_DATOS_MOCK ||
      !ultimaDepuracion ||
      !confirmacionDeshacerAbierta ||
      deshaciendoRef.current
    ) {
      return
    }

    deshaciendoRef.current = true
    setDeshaciendo(true)
    setErrorDeshacer(null)

    try {
      let registro
      try {
        registro = await deshacerUltimaDepuracion()
      } catch (fallo) {
        if (fallo?.codigo === 'solo_mock') {
          setErrorDeshacer('La reversión solo está disponible en modo simulación.')
        } else if (fallo?.status === 409) {
          setErrorDeshacer('No hay una depuración reversible en esta sesión.')
        } else {
          setErrorDeshacer('No se pudo deshacer la depuración simulada. Inténtelo de nuevo.')
        }
        return
      }

      const numero = registro?.numeroExpediente ?? ultimaDepuracion.numeroExpediente
      invalidarRegistroHistorial(registro?.id ?? ultimaDepuracion.id)
      setUltimaDepuracion(null)
      setConfirmacionDeshacerAbierta(false)
      setErrorDeshacer(null)
      setExito(null)
      setExitoDeshacer(
        `Depuración simulada revertida: ${formatearExpedienteDepuracion(
          numero,
        )} vuelve a estar disponible.`,
      )
      setTimeout(enfocar, 0)

      await refrescarHistorial({ forzar: true })
    } finally {
      deshaciendoRef.current = false
      setDeshaciendo(false)
    }
  }, [
    ultimaDepuracion,
    confirmacionDeshacerAbierta,
    invalidarRegistroHistorial,
    refrescarHistorial,
    enfocar,
  ])

  return {
    ...historial,
    numero,
    setNumero,
    resultado,
    estado,
    mensaje,
    exito,
    procesando,
    confirmacionAbierta,
    errorConfirmacion,
    ultimaDepuracion,
    confirmacionDeshacerAbierta,
    errorDeshacer,
    deshaciendo,
    exitoDeshacer,
    modoCaptura,
    inputRef,
    buscar,
    alternarModoCaptura,
    establecerModoCaptura,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarDepuracion,
    abrirDeshacer,
    cerrarDeshacer,
    confirmarDeshacer,
    cargarBitacora: refrescarHistorial,
    enfocar,
  }
}
