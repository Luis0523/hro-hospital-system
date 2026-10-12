import { useCallback, useEffect, useRef, useState } from 'react'
import { hoyIso } from '@/shared/utils/fecha'
import {
  buscarExpedienteParaDepurar,
  listarDepuraciones,
  marcarDepurado,
} from '../api/depuracionArchivoApi'

const DEBOUNCE_MS = 350

// Orquesta la pantalla de Depuración: búsqueda automática por número de
// expediente, confirmación de baja lógica y bitácora del día.
// `estado`: inicial | buscando | encontrado | no_encontrado | duplicado | error.
export function useDepuracionExpediente() {
  const [numero, setNumero] = useState('')
  const [resultado, setResultado] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [mensaje, setMensaje] = useState(null)
  const [exito, setExito] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [depurados, setDepurados] = useState([])
  const [procesando, setProcesando] = useState(false)

  const inputRef = useRef(null)
  const peticionRef = useRef(0)

  const enfocar = useCallback(() => inputRef.current?.focus(), [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  const cargarBitacora = useCallback(async () => {
    try {
      setDepurados(await listarDepuraciones({ fecha: hoyIso() }))
    } catch {
      // Silencioso: la bitácora se reintenta al confirmar/recargar.
    }
  }, [])

  useEffect(() => {
    cargarBitacora()
  }, [cargarBitacora])

  const buscar = useCallback(async (valor) => {
    const buscado = String(valor ?? '').trim()
    if (!buscado) return

    const peticion = peticionRef.current + 1
    peticionRef.current = peticion
    setProcesando(true)
    setEstado('buscando')
    setMensaje(null)
    setResultado(null)

    try {
      const expediente = await buscarExpedienteParaDepurar(buscado)
      if (peticion !== peticionRef.current) return

      if (!expediente) {
        setEstado('no_encontrado')
        setMensaje(`No se encontró el expediente ${buscado}.`)
        return
      }
      if (expediente.depurado) {
        setResultado(expediente)
        setEstado('duplicado')
        setMensaje('Este expediente ya está depurado (ya no existe en el sistema).')
        return
      }
      setResultado(expediente)
      setEstado('encontrado')
    } catch (fallo) {
      if (peticion !== peticionRef.current) return
      if (fallo?.status === 404) {
        setEstado('no_encontrado')
        setMensaje(`No se encontró el expediente ${buscado}.`)
      } else {
        setEstado('error')
        setMensaje(fallo?.message || 'No se pudo buscar el expediente.')
      }
    } finally {
      if (peticion === peticionRef.current) setProcesando(false)
    }
  }, [])

  // Búsqueda automática con debounce al escribir/escanear.
  useEffect(() => {
    const buscado = numero.trim()
    if (!buscado) {
      setEstado('inicial')
      setResultado(null)
      setMensaje(null)
      return undefined
    }

    setExito(null)
    const timer = setTimeout(() => buscar(buscado), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [numero, buscar])

  const confirmarDepuracion = useCallback(async () => {
    if (!resultado || procesando) return

    setProcesando(true)
    setMensaje(null)
    try {
      const registro = await marcarDepurado({
        numeroExpediente: resultado.numeroExpediente,
        motivo: motivo.trim() || undefined,
      })
      setExito(`Expediente ${registro.numeroExpediente ?? resultado.numeroExpediente} depurado.`)
      setNumero('')
      setResultado(null)
      setMotivo('')
      setEstado('inicial')
      await cargarBitacora()
    } catch (fallo) {
      const status = fallo?.status
      if (status === 409) {
        setEstado('duplicado')
        setMensaje('Este expediente ya estaba depurado.')
      } else if (status === 404) {
        setEstado('no_encontrado')
        setMensaje('El expediente no existe.')
      } else {
        setEstado('error')
        setMensaje(fallo?.message || 'No se pudo marcar el expediente como depurado.')
      }
    } finally {
      setProcesando(false)
      enfocar()
    }
  }, [resultado, procesando, motivo, cargarBitacora, enfocar])

  return {
    numero,
    setNumero,
    resultado,
    estado,
    mensaje,
    exito,
    motivo,
    setMotivo,
    depurados,
    procesando,
    inputRef,
    buscar,
    confirmarDepuracion,
    cargarBitacora,
    enfocar,
  }
}
