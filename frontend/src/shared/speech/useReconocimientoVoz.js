import { useCallback, useEffect, useRef, useState } from 'react'

// Envoltorio de la Web Speech API para capturar una frase corta (un número de
// expediente). No integra nada por sí solo: expone estado y acciones para que
// la pantalla decida qué hacer con la transcripción.
//
// La API se detiene sola cuando deja de detectar sonido; aquí eso se trata
// como el final normal de la captura (onend) y NO se reinicia automáticamente.

const MENSAJES_ERROR = {
  'not-allowed': 'Permiso de micrófono denegado. Habilítelo en el navegador para continuar.',
  'service-not-allowed': 'El navegador no permite usar el micrófono en este contexto.',
  'audio-capture': 'No se encontró un micrófono disponible.',
  network: 'No se pudo conectar con el servicio de reconocimiento. Revise la conexión.',
  'no-speech': 'No se detectó voz. Intente de nuevo.',
  'language-not-supported': 'El idioma es-MX no está disponible en este navegador.',
  'bad-grammar': 'El navegador rechazó la configuración de reconocimiento.',
  aborted: null,
}

const DURACION_MAXIMA_MS = 10000

function obtenerConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useReconocimientoVoz({ lang = 'es-MX', maxAlternativas = 3 } = {}) {
  const [soportado] = useState(() => Boolean(obtenerConstructor()))
  const [estado, setEstado] = useState('inactivo')
  const [transcripcion, setTranscripcion] = useState('')
  const [parcial, setParcial] = useState('')
  const [alternativas, setAlternativas] = useState([])
  const [confianza, setConfianza] = useState(null)
  const [error, setError] = useState(null)
  const [codigoError, setCodigoError] = useState(null)

  const reconocimientoRef = useRef(null)
  const estadoRef = useRef('inactivo')
  const detenidoPorUsuarioRef = useRef(false)
  const huboResultadoRef = useRef(false)
  const timeoutRef = useRef(null)

  const actualizarEstado = useCallback((nuevo) => {
    estadoRef.current = nuevo
    setEstado(nuevo)
  }, [])

  const limpiarTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const limpiar = useCallback(() => {
    setTranscripcion('')
    setParcial('')
    setAlternativas([])
    setConfianza(null)
    setError(null)
    setCodigoError(null)
  }, [])

  const detener = useCallback(() => {
    detenidoPorUsuarioRef.current = true
    const reconocimiento = reconocimientoRef.current
    if (!reconocimiento) return
    try {
      reconocimiento.stop()
    } catch {
      // Si ya terminó, no hay nada que hacer.
    }
  }, [])

  const iniciar = useCallback(() => {
    const Constructor = obtenerConstructor()
    if (!Constructor) {
      setError('Este navegador no soporta la Web Speech API. Use Chrome o Edge.')
      return
    }
    if (estadoRef.current === 'escuchando') return

    setError(null)
    setTranscripcion('')
    setParcial('')
    setAlternativas([])
    setConfianza(null)
    setCodigoError(null)
    detenidoPorUsuarioRef.current = false
    huboResultadoRef.current = false

    const reconocimiento = new Constructor()
    reconocimiento.lang = lang
    reconocimiento.continuous = false
    reconocimiento.interimResults = true
    reconocimiento.maxAlternatives = maxAlternativas

    reconocimiento.onstart = () => {
      actualizarEstado('escuchando')
      limpiarTimeout()
      timeoutRef.current = window.setTimeout(() => {
        try {
          reconocimiento.stop()
        } catch {
          // La sesión pudo haber terminado sola.
        }
      }, DURACION_MAXIMA_MS)
    }

    reconocimiento.onresult = (evento) => {
      let final = ''
      let interino = ''
      let confianzaFinal = null
      const lista = []

      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const resultado = evento.results[i]
        const texto = resultado?.[0]?.transcript ?? ''

        if (resultado.isFinal) {
          final += texto
          confianzaFinal = resultado[0]?.confidence ?? null
          for (let j = 0; j < resultado.length; j += 1) {
            const alternativa = resultado[j]
            if (alternativa?.transcript) {
              lista.push({
                texto: alternativa.transcript,
                confianza: alternativa.confidence ?? null,
              })
            }
          }
        } else {
          interino += texto
        }
      }

      if (interino) setParcial(interino.trim())
      if (final) {
        huboResultadoRef.current = true
        setTranscripcion(final.trim())
        setParcial('')
        setConfianza(confianzaFinal)
        setAlternativas(lista)
      }
    }
    reconocimiento.onerror = (evento) => {
      const codigo = evento?.error || 'desconocido'
      const mensaje =
        codigo in MENSAJES_ERROR ? MENSAJES_ERROR[codigo] : `Error de reconocimiento: ${codigo}.`
      setCodigoError(codigo)
      if (mensaje) setError(mensaje)
    }
    reconocimiento.onend = () => {
      limpiarTimeout()
      reconocimientoRef.current = null
      actualizarEstado('inactivo')
      if (!huboResultadoRef.current && !detenidoPorUsuarioRef.current) {
        setError((actual) => actual || 'No se detectó voz. Intente de nuevo.')
      }
    }

    reconocimientoRef.current = reconocimiento

    try {
      reconocimiento.start()
    } catch {
      reconocimientoRef.current = null
      actualizarEstado('inactivo')
      setError('No se pudo iniciar el micrófono. Espere un momento e intente de nuevo.')
    }
  }, [actualizarEstado, lang, limpiarTimeout, maxAlternativas])

  useEffect(
    () => () => {
      limpiarTimeout()
      const reconocimiento = reconocimientoRef.current
      reconocimientoRef.current = null
      try {
        reconocimiento?.abort?.()
      } catch {
        // Sin sesión activa.
      }
    },
    [limpiarTimeout],
  )

  return {
    soportado,
    estado,
    escuchando: estado === 'escuchando',
    transcripcion,
    parcial,
    alternativas,
    confianza,
    error,
    codigoError,
    iniciar,
    detener,
    limpiar,
  }
}
