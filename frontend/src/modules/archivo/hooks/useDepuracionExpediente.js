import { useCallback, useEffect, useRef, useState } from 'react'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import {
  buscarExpedienteParaDepurar,
  listarDepuraciones,
  marcarDepurado,
} from '../api/depuracionArchivoApi'

const DEBOUNCE_MS = 350

// Un fallo sin `status` proviene de un problema de red/transporte: el cliente
// HTTP no recibió respuesta del servidor, así que no puede confirmarse si la
// operación se aplicó.
function esFalloDeRed(fallo) {
  return fallo?.status == null
}

// Mensajes de la bitácora sin detalles técnicos internos.
function mensajeDeErrorBitacora(fallo) {
  if (fallo?.status === 401 || fallo?.status === 403) {
    return 'La sesión no está autorizada para consultar la bitácora. Inicie sesión de nuevo.'
  }
  if (esFalloDeRed(fallo)) {
    return 'No se pudo conectar con el servidor. Revise la conexión e inténtelo de nuevo.'
  }
  return 'No se pudo cargar la bitácora de depuraciones.'
}

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

  // La bitácora solo muestra su estado vacío tras una primera carga exitosa.
  const [bitacoraCargada, setBitacoraCargada] = useState(false)
  const [cargandoBitacora, setCargandoBitacora] = useState(true)
  const [errorBitacora, setErrorBitacora] = useState(null)

  const inputRef = useRef(null)
  const peticionRef = useRef(0)
  const cargaBitacoraRef = useRef(null)
  const confirmandoRef = useRef(false)

  const enfocar = useCallback(() => inputRef.current?.focus(), [])

  useEffect(() => {
    enfocar()
  }, [enfocar])

  // Deduplica cargas simultáneas: un reintento mientras hay una consulta en
  // curso reutiliza la misma petición en vez de lanzar otra.
  const cargarBitacora = useCallback(async () => {
    if (cargaBitacoraRef.current) return cargaBitacoraRef.current

    const ejecucion = (async () => {
      setCargandoBitacora(true)
      setErrorBitacora(null)
      try {
        const registros = await listarDepuraciones({ fecha: hoyIsoGuatemala() })
        setDepurados(Array.isArray(registros) ? registros : [])
        setBitacoraCargada(true)
        return true
      } catch (fallo) {
        // No se vacía `depurados`: si había datos de una consulta anterior se
        // conservan y la UI advierte que el listado puede estar desactualizado.
        setErrorBitacora(mensajeDeErrorBitacora(fallo))
        return false
      } finally {
        setCargandoBitacora(false)
        cargaBitacoraRef.current = null
      }
    })()

    cargaBitacoraRef.current = ejecucion
    return ejecucion
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
    // El ref corta el doble clic/Enter en el mismo tick, antes de que React
    // vuelva a renderizar y actualice `procesando`.
    if (!resultado || confirmandoRef.current) return

    confirmandoRef.current = true
    setProcesando(true)
    setMensaje(null)

    try {
      let registro
      try {
        registro = await marcarDepurado({
          numeroExpediente: resultado.numeroExpediente,
          motivo: motivo.trim() || undefined,
        })
      } catch (fallo) {
        const status = fallo?.status
        if (status === 409) {
          setEstado('duplicado')
          setMensaje('Este expediente ya estaba depurado.')
        } else if (status === 404) {
          setEstado('no_encontrado')
          setMensaje('El expediente no existe.')
        } else if (esFalloDeRed(fallo)) {
          setEstado('error')
          setMensaje(
            'No se pudo confirmar la depuración por un problema de conexión. Verifique la bitácora antes de volver a intentarlo.',
          )
        } else {
          setEstado('error')
          setMensaje('No se pudo registrar la depuración. Inténtelo de nuevo.')
        }
        return
      }

      // Operación A confirmada: desde aquí la baja ya está registrada y no se
      // revierte aunque falle la actualización de la bitácora.
      setExito(`Expediente ${registro?.numeroExpediente ?? resultado.numeroExpediente} depurado.`)
      setNumero('')
      setResultado(null)
      setMotivo('')
      setEstado('inicial')
      setProcesando(false)
      enfocar()

      // Operación B: recarga independiente. `cargarBitacora` captura su propio
      // error y lo expone en `errorBitacora` sin afectar el éxito anterior.
      await cargarBitacora()
    } finally {
      confirmandoRef.current = false
      setProcesando(false)
      enfocar()
    }
  }, [resultado, motivo, cargarBitacora, enfocar])

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
    bitacoraCargada,
    cargandoBitacora,
    errorBitacora,
    inputRef,
    buscar,
    confirmarDepuracion,
    cargarBitacora,
    reintentarBitacora: cargarBitacora,
    enfocar,
  }
}
