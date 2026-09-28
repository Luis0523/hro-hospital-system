import { useCallback, useEffect, useRef, useState } from 'react'

// Formatos habituales de expediente: QR (UUID) y códigos de barras.
const FORMATOS = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'codabar', 'itf']

const INTERVALO_DETECCION_MS = 300

// Lectura de códigos con capacidades nativas del navegador:
// navigator.mediaDevices.getUserMedia + BarcodeDetector. No usa librerías
// externas. Si alguna capacidad no existe, informa y deja intacta la búsqueda
// manual.
export function useLectorCamara(onCodigo) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const intervaloRef = useRef(null)
  const ultimoCodigoRef = useRef(null)
  const activoRef = useRef(false)
  const onCodigoRef = useRef(onCodigo)

  const [activo, setActivo] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    onCodigoRef.current = onCodigo
  }, [onCodigo])

  const soporteCamara =
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  const soporteDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window

  const detener = useCallback(() => {
    activoRef.current = false
    if (intervaloRef.current !== null) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((pista) => pista.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    detectorRef.current = null
    setActivo(false)
  }, [])

  const detectar = useCallback(async () => {
    if (!activoRef.current || !detectorRef.current || !videoRef.current) return
    try {
      const codigos = await detectorRef.current.detect(videoRef.current)
      const valor = codigos?.[0]?.rawValue
      if (valor && valor !== ultimoCodigoRef.current) {
        ultimoCodigoRef.current = valor
        onCodigoRef.current?.(valor)
      }
    } catch {
      // Se ignora el fallo de un intento; se reintenta en el siguiente.
    }
  }, [])

  const iniciar = useCallback(async () => {
    setError(null)

    if (!soporteDetector) {
      setError(
        'Este navegador no soporta la detección de códigos (BarcodeDetector). Use la búsqueda manual.',
      )
      return false
    }
    if (!soporteCamara) {
      setError(
        'Este dispositivo o navegador no permite acceder a la cámara. Use la búsqueda manual.',
      )
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        const reproduccion = videoRef.current.play?.()
        if (reproduccion && typeof reproduccion.catch === 'function') {
          reproduccion.catch(() => {})
        }
      }
      detectorRef.current = new window.BarcodeDetector({ formats: FORMATOS })
      ultimoCodigoRef.current = null
      activoRef.current = true
      setActivo(true)
      intervaloRef.current = setInterval(detectar, INTERVALO_DETECCION_MS)
      return true
    } catch (fallo) {
      detener()
      if (fallo?.name === 'NotAllowedError' || fallo?.name === 'SecurityError') {
        setError('Permiso de cámara denegado. Use la búsqueda manual.')
      } else if (fallo?.name === 'NotFoundError' || fallo?.name === 'DevicesNotFoundError') {
        setError('No se encontró una cámara en este dispositivo. Use la búsqueda manual.')
      } else {
        setError('No se pudo iniciar la cámara. Use la búsqueda manual.')
      }
      return false
    }
  }, [detener, detectar, soporteCamara, soporteDetector])

  // Libera la cámara al desmontar el componente.
  useEffect(() => detener, [detener])

  return { videoRef, activo, error, soporteCamara, soporteDetector, iniciar, detener }
}
