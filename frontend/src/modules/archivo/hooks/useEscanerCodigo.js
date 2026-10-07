import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

// Lectura de códigos con la cámara del dispositivo. Usa ZXing (funciona en
// Chrome/Android y también en iOS/Safari, donde no existe BarcodeDetector).
// Flujo pensado para el registro de carnets: el usuario pide permiso, se abre
// la cámara y, al detectar el primer código válido, se entrega el valor y se
// cierra la cámara (un solo disparo).

const FORMATOS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODABAR,
  BarcodeFormat.ITF,
]

function mensajeDeError(fallo) {
  const nombre = fallo?.name
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
    return 'Permiso de cámara denegado. Habilítelo o use el ingreso manual.'
  }
  if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
    return 'No se encontró una cámara en este dispositivo. Use el ingreso manual.'
  }
  if (nombre === 'NotReadableError' || nombre === 'TrackStartError') {
    return 'La cámara está en uso por otra aplicación. Ciérrela e intente de nuevo.'
  }
  return 'No se pudo iniciar la cámara. Use el ingreso manual.'
}

export function useEscanerCodigo(onCodigo, { unDisparo = true } = {}) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const onCodigoRef = useRef(onCodigo)

  const [activo, setActivo] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    onCodigoRef.current = onCodigo
  }, [onCodigo])

  const soporteCamara =
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'

  const detener = useCallback(() => setActivo(false), [])

  const iniciar = useCallback(() => {
    setError(null)
    if (!soporteCamara) {
      setError(
        'Este dispositivo o navegador no permite acceder a la cámara. Use el ingreso manual.',
      )
      return
    }
    setActivo(true)
  }, [soporteCamara])

  // Al activar, se monta el <video> y recién entonces se solicita el permiso y
  // se inicia la decodificación (el elemento debe existir en el DOM).
  useEffect(() => {
    if (!activo || !videoRef.current) return undefined

    let cancelado = false
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATOS)
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 })

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (resultado, _error, controls) => {
          if (cancelado || !resultado) return
          const valor = resultado.getText?.()
          if (!valor) return
          onCodigoRef.current?.(valor)
          if (unDisparo) {
            controls?.stop?.()
            setActivo(false)
          }
        },
      )
      .then((controls) => {
        if (cancelado) {
          controls?.stop?.()
          return
        }
        controlsRef.current = controls
      })
      .catch((fallo) => {
        if (cancelado) return
        setError(mensajeDeError(fallo))
        setActivo(false)
      })

    return () => {
      cancelado = true
      controlsRef.current?.stop?.()
      controlsRef.current = null
    }
  }, [activo, unDisparo])

  return { videoRef, activo, error, soporteCamara, iniciar, detener }
}
