import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from '@/shared/components/ui'
import Icon from '@/shared/components/ui/Icon.jsx'

// Región de interés (proporciones sobre el cuadro del video). El recuadro
// amarillo de la vista corresponde exactamente a este recorte.
const ROI = { left: 0.08, top: 0.4, width: 0.84, height: 0.2 }

const ETIQUETAS_LOGGER = {
  'loading tesseract core': 'Cargando motor OCR…',
  'initializing tesseract': 'Inicializando OCR…',
  'loading language traineddata': 'Cargando datos de idioma…',
  'initializing api': 'Preparando API…',
  'recognizing text': 'Reconociendo texto…',
}

export default function PruebaOcrPage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const trackRef = useRef(null)
  const workerRef = useRef(null)

  const [aspecto, setAspecto] = useState(4 / 3)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [torchDisponible, setTorchDisponible] = useState(false)
  const [torchActivo, setTorchActivo] = useState(false)
  const [workerEstado, setWorkerEstado] = useState('cargando')
  const [progreso, setProgreso] = useState(0)
  const [usarRoi, setUsarRoi] = useState(true)
  const [aumentar, setAumentar] = useState(true)
  const [binarizar, setBinarizar] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelado = false
    let workerLocal = null

    async function preparar() {
      try {
        const { createWorker, OEM, PSM } = await import('tesseract.js')
        const worker = await createWorker('eng', OEM.LSTM_ONLY, {
          logger: (evento) => {
            if (cancelado) return
            const etiqueta = ETIQUETAS_LOGGER[evento.status] || evento.status
            if (typeof evento.progress === 'number') {
              setProgreso(Math.round(evento.progress * 100))
            }
            setWorkerEstado(etiqueta)
          },
        })
        if (cancelado) {
          await worker.terminate()
          return
        }
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: `${PSM.SINGLE_LINE}`,
          preserve_interword_spaces: '1',
        })
        workerLocal = worker
        workerRef.current = worker
        setWorkerEstado('listo')
      } catch (fallo) {
        if (!cancelado) {
          setWorkerEstado('error')
          setError(`No se pudo iniciar el OCR: ${fallo?.message || fallo}`)
        }
      }
    }

    preparar()
    return () => {
      cancelado = true
      workerRef.current = null
      workerLocal?.terminate?.()
    }
  }, [])

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((pista) => pista.stop())
    streamRef.current = null
    trackRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamaraActiva(false)
    setTorchDisponible(false)
    setTorchActivo(false)
  }, [])

  const abrirCamara = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play?.().catch(() => {})
      }
      const pista = stream.getVideoTracks?.()[0] || null
      trackRef.current = pista
      const capacidades = pista?.getCapabilities?.() || {}
      setTorchDisponible(Boolean(capacidades.torch))
      setCamaraActiva(true)
    } catch (fallo) {
      if (fallo?.name === 'NotAllowedError' || fallo?.name === 'SecurityError') {
        setError('Permiso de cámara denegado. Habilítelo para continuar.')
      } else {
        setError(`No se pudo abrir la cámara: ${fallo?.message || fallo}`)
      }
    }
  }, [])

  const alternarTorch = useCallback(async () => {
    const pista = trackRef.current
    if (!pista) return
    try {
      const nuevo = !torchActivo
      await pista.applyConstraints({ advanced: [{ torch: nuevo }] })
      setTorchActivo(nuevo)
    } catch {
      setError('La linterna no está disponible en este dispositivo.')
    }
  }, [torchActivo])

  const aEscala2x = useCallback((origen) => {
    const destino = document.createElement('canvas')
    destino.width = origen.width * 2
    destino.height = origen.height * 2
    const ctx = destino.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(origen, 0, 0, destino.width, destino.height)
    return destino
  }, [])

  const binarizarCanvas = useCallback((canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const datos = imagen.data
    for (let i = 0; i < datos.length; i += 4) {
      const gris = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2]
      const valor = gris < 140 ? 0 : 255
      datos[i] = valor
      datos[i + 1] = valor
      datos[i + 2] = valor
    }
    ctx.putImageData(imagen, 0, 0)
  }, [])

  const capturarYLeer = useCallback(async () => {
    const video = videoRef.current
    const worker = workerRef.current
    if (!video || !worker || !video.videoWidth) return

    setError(null)
    setProcesando(true)
    setResultado(null)

    try {
      const ancho = video.videoWidth
      const alto = video.videoHeight
      const sx = Math.round(ancho * (usarRoi ? ROI.left : 0))
      const sy = Math.round(alto * (usarRoi ? ROI.top : 0))
      const sw = Math.round(ancho * (usarRoi ? ROI.width : 1))
      const sh = Math.round(alto * (usarRoi ? ROI.height : 1))

      let lienzo = document.createElement('canvas')
      lienzo.width = sw
      lienzo.height = sh
      lienzo.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

      if (aumentar) lienzo = aEscala2x(lienzo)
      if (binarizar) binarizarCanvas(lienzo)

      setVistaPrevia(lienzo.toDataURL('image/png'))

      const inicio = performance.now()
      const { data } = await worker.recognize(lienzo)
      const ms = Math.round(performance.now() - inicio)

      const texto = (data.text || '').trim()
      const digitos = (texto.match(/\d/g) || []).join('')
      const candidatos = texto.match(/\d{13}/g) || []

      setResultado({
        texto,
        digitos,
        candidatos,
        confianza: Math.round(data.confidence || 0),
        ms,
        ancho: lienzo.width,
        alto: lienzo.height,
      })
    } catch (fallo) {
      setError(`Error al reconocer: ${fallo?.message || fallo}`)
    } finally {
      setProcesando(false)
    }
  }, [usarRoi, aumentar, binarizar, aEscala2x, binarizarCanvas])

  useEffect(() => () => detenerCamara(), [detenerCamara])

  const listoParaLeer = camaraActiva && workerEstado === 'listo' && !procesando

  return (
    <div className="min-h-screen bg-surface px-4 py-6 text-on-surface">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center gap-3">
          <Icon name="document_scanner" className="text-[32px] text-primary" />
          <div>
            <h1 className="text-title-lg font-bold">Prueba de OCR — lectura de DPI</h1>
            <p className="text-body-sm text-on-surface-variant">
              Demo aislada. Enfoque el número en el recuadro y capture. No afecta al sistema.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm font-semibold">
            OCR: {workerEstado}
            {workerEstado !== 'listo' && workerEstado !== 'error' ? ` (${progreso}%)` : ''}
          </span>
          {!camaraActiva ? (
            <button
              type="button"
              onClick={abrirCamara}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-container px-4 font-semibold text-on-primary"
            >
              <Icon name="photo_camera" />
              Abrir cámara
            </button>
          ) : (
            <button
              type="button"
              onClick={detenerCamara}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-container px-4 font-semibold text-on-surface"
            >
              <Icon name="close" />
              Cerrar cámara
            </button>
          )}
          {torchDisponible && (
            <button
              type="button"
              onClick={alternarTorch}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 font-semibold ${
                torchActivo ? 'bg-yellow-400 text-black' : 'bg-surface-container text-on-surface'
              }`}
            >
              <Icon name={torchActivo ? 'flashlight_on' : 'flashlight_off'} />
              Linterna
            </button>
          )}
        </div>

        <div
          className="relative w-full overflow-hidden rounded-2xl border border-outline-variant bg-black"
          style={{ aspectRatio: aspecto }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-fill"
            onLoadedMetadata={(evento) => {
              const video = evento.currentTarget
              if (video.videoWidth) setAspecto(video.videoWidth / video.videoHeight)
            }}
          />
          {usarRoi && camaraActiva && (
            <div
              className="pointer-events-none absolute rounded-md border-2 border-yellow-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
              style={{
                left: `${ROI.left * 100}%`,
                top: `${ROI.top * 100}%`,
                width: `${ROI.width * 100}%`,
                height: `${ROI.height * 100}%`,
              }}
            />
          )}
          {!camaraActiva && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <p>Abre la cámara para comenzar</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 rounded-xl bg-surface-container-low p-3 text-body-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={usarRoi}
              onChange={(e) => setUsarRoi(e.target.checked)}
            />
            Recortar recuadro
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={aumentar}
              onChange={(e) => setAumentar(e.target.checked)}
            />
            Ampliar 2x
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={binarizar}
              onChange={(e) => setBinarizar(e.target.checked)}
            />
            Binarizar
          </label>
        </div>

        <button
          type="button"
          onClick={capturarYLeer}
          disabled={!listoParaLeer}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-on-primary text-title-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name={procesando ? 'hourglass_top' : 'document_scanner'} />
          {procesando ? 'Reconociendo…' : 'Capturar y leer'}
        </button>

        {error && (
          <Alert tone="warning" title="Aviso">
            {error}
          </Alert>
        )}

        {resultado && (
          <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex flex-wrap gap-4 text-body-sm">
              <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">
                Tiempo: {resultado.ms} ms
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">
                Confianza: {resultado.confianza}%
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">
                {resultado.ancho}×{resultado.alto} px
              </span>
            </div>

            <div>
              <p className="text-label-sm font-bold uppercase text-on-surface-variant">
                Candidatos de 13 dígitos
              </p>
              <p className="break-all font-mono text-title-md text-primary">
                {resultado.candidatos.length ? resultado.candidatos.join('   ') : '—'}
              </p>
            </div>

            <div>
              <p className="text-label-sm font-bold uppercase text-on-surface-variant">
                Dígitos detectados
              </p>
              <p className="break-all font-mono">{resultado.digitos || '—'}</p>
            </div>

            <div>
              <p className="text-label-sm font-bold uppercase text-on-surface-variant">
                Texto crudo
              </p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-container p-3 font-mono text-body-sm">
                {resultado.texto || '(sin texto)'}
              </pre>
            </div>

            {vistaPrevia && (
              <div>
                <p className="text-label-sm font-bold uppercase text-on-surface-variant">
                  Imagen que leyó el OCR
                </p>
                <img
                  src={vistaPrevia}
                  alt="Recorte procesado"
                  className="max-h-40 rounded-lg border border-outline-variant"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
