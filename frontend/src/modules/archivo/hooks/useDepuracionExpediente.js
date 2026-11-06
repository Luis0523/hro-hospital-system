import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MENSAJES_ERROR_EXPEDIENTE,
  formatearExpedienteDepuracion,
  validarEntradaExpediente,
} from '../utils/expedienteDepuracion'
import {
  USANDO_DATOS_MOCK,
  deshacerUltimaDepuracion,
  eliminarDepuracion,
  marcarDepurado,
  registrarDepuracionManual,
} from '../api/depuracionArchivoApi'
import { useHistorialDepurados } from './useHistorialDepurados'

function esFalloDeRed(fallo) {
  return fallo?.status == null
}

export function useDepuracionExpediente() {
  const historial = useHistorialDepurados()
  const { invalidarRegistro: invalidarRegistroHistorial, refrescar: refrescarHistorial } = historial

  const [numero, setNumero] = useState('')
  const [estado, setEstado] = useState('inicial')
  const [mensaje, setMensaje] = useState(null)
  const [exito, setExito] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [fallidos, setFallidos] = useState(0)
  const [ultimaDepuracion, setUltimaDepuracion] = useState(null)
  const [confirmacionDeshacerAbierta, setConfirmacionDeshacerAbierta] = useState(false)
  const [errorDeshacer, setErrorDeshacer] = useState(null)
  const [deshaciendo, setDeshaciendo] = useState(false)
  const [exitoDeshacer, setExitoDeshacer] = useState(null)

  const inputRef = useRef(null)
  const colaRef = useRef([])
  const procesandoRef = useRef(false)
  const enColaRef = useRef(new Set())
  const deshaciendoRef = useRef(false)

  const enfocar = useCallback(() => inputRef.current?.focus(), [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  const vaciarCola = useCallback(async () => {
    if (procesandoRef.current) return
    procesandoRef.current = true
    setProcesando(true)

    let huboExito = false
    let huboDuplicado = false

    while (colaRef.current.length > 0) {
      const item = colaRef.current.shift()
      try {
        const registro = await marcarDepurado({
          numeroExpediente: item.numero,
        })
        if (USANDO_DATOS_MOCK) setUltimaDepuracion(registro)
        setExito(
          `Expediente ${formatearExpedienteDepuracion(
            registro?.numeroExpediente ?? item.numero,
          )} depurado.`,
        )
        setEstado('inicial')
        setMensaje(null)
        huboExito = true
      } catch (fallo) {
        const status = fallo?.status
        huboDuplicado = huboDuplicado || status === 409

        if (status === 404) {
          setEstado('no_encontrado')
          setMensaje(
            `No existe el expediente ${formatearExpedienteDepuracion(item.numero)} en el hospital.`,
          )
        } else if (status === 409) {
          setEstado('duplicado')
          setMensaje('Este expediente ya está depurado (ya no existe en el sistema).')
        } else if (esFalloDeRed(fallo) || status === 502) {
          setEstado('error')
          setMensaje('No se pudo consultar el hospital. Intente de nuevo.')
          setFallidos((actuales) => actuales + 1)
        } else {
          setEstado('error')
          setMensaje('No se pudo registrar la depuración. Inténtelo de nuevo.')
          setFallidos((actuales) => actuales + 1)
        }
      } finally {
        setPendientes((actuales) => actuales.filter((p) => p.numero !== item.numero))
        enColaRef.current.delete(item.numero)
      }
    }

    procesandoRef.current = false
    setProcesando(false)

    if (huboExito || huboDuplicado) {
      await refrescarHistorial({ forzar: true })
    }
  }, [refrescarHistorial])

  const agregar = useCallback(
    (valor) => {
      const validacion = validarEntradaExpediente(valor)
      if (!validacion.valido) {
        setEstado('formato_invalido')
        setMensaje(
          MENSAJES_ERROR_EXPEDIENTE[validacion.error] ?? 'Número de expediente no válido.',
        )
        return false
      }

      const numeroCanonico = validacion.numero
      if (enColaRef.current.has(numeroCanonico)) {
        setEstado('duplicado')
        setMensaje('Ese expediente ya se está procesando.')
        return false
      }

      enColaRef.current.add(numeroCanonico)
      setPendientes((actuales) => [...actuales, { numero: numeroCanonico }])
      setEstado('enviado')
      setMensaje(null)
      setExito(null)
      setExitoDeshacer(null)
      colaRef.current.push({ numero: numeroCanonico })
      vaciarCola()
      return true
    },
    [vaciarCola],
  )

  const registrarManual = useCallback(
    async ({ numeroExpediente, pacienteNombre, motivo } = {}) => {
      const registro = await registrarDepuracionManual({
        numeroExpediente,
        pacienteNombre,
        motivo,
      })
      await refrescarHistorial({ forzar: true })
      return registro
    },
    [refrescarHistorial],
  )

  const eliminar = useCallback(
    async (id) => {
      await eliminarDepuracion(id)
      if (ultimaDepuracion?.id === id) setUltimaDepuracion(null)
      invalidarRegistroHistorial(id)
      await refrescarHistorial({ forzar: true })
    },
    [ultimaDepuracion, invalidarRegistroHistorial, refrescarHistorial],
  )

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

      const numeroRevertido = registro?.numeroExpediente ?? ultimaDepuracion.numeroExpediente
      invalidarRegistroHistorial(registro?.id ?? ultimaDepuracion.id)
      setUltimaDepuracion(null)
      setConfirmacionDeshacerAbierta(false)
      setErrorDeshacer(null)
      setExito(null)
      setExitoDeshacer(
        `Depuración simulada revertida: ${formatearExpedienteDepuracion(
          numeroRevertido,
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
    estado,
    mensaje,
    exito,
    procesando,
    pendientes,
    cola: pendientes.length,
    fallidos,
    ultimaDepuracion,
    confirmacionDeshacerAbierta,
    errorDeshacer,
    deshaciendo,
    exitoDeshacer,
    inputRef,
    agregar,
    registrarManual,
    eliminar,
    abrirDeshacer,
    cerrarDeshacer,
    confirmarDeshacer,
    cargarBitacora: refrescarHistorial,
    enfocar,
  }
}
