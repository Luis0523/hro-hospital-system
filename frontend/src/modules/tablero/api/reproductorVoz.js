/**
 * Un fragmento MP3 corto termina en pocos segundos; 15 s es un techo amplio
 * para audios lentos sin dejar la cola bloqueada indefinidamente.
 */
export const TIMEOUT_FRAGMENTO_MS = 15000

let colaReproduccion = Promise.resolve()

function esRutaValida(ruta) {
  return typeof ruta === 'string' && ruta.trim() !== ''
}

function reproducirFragmento(ruta, { timeoutMs, AudioCtor, logger }) {
  return new Promise((resolve) => {
    let terminado = false
    let audio = null
    let timer = null

    const alTerminar = () => finalizar('ended')

    const alFallar = () => {
      logger.warn?.(`[reproductorVoz] No se pudo reproducir "${ruta}".`)
      finalizar('error')
    }

    const limpiar = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      if (!audio) return

      audio.removeEventListener?.('ended', alTerminar)
      audio.removeEventListener?.('error', alFallar)

      try {
        audio.pause?.()
      } catch {
        // El audio puede no estar en un estado pausable.
      }

      try {
        audio.src = ''
      } catch {
        // Ignorar fallos al liberar el recurso.
      }
    }

    const finalizar = (resultado) => {
      if (terminado) return
      terminado = true
      limpiar()
      resolve(resultado)
    }

    try {
      audio = new AudioCtor(ruta)
      audio.preload = 'auto'
      audio.addEventListener('ended', alTerminar)
      audio.addEventListener('error', alFallar)
    } catch {
      logger.warn?.(`[reproductorVoz] No se pudo crear el audio "${ruta}".`)
      finalizar('error')
      return
    }

    timer = setTimeout(() => {
      logger.warn?.(`[reproductorVoz] Tiempo de espera agotado para "${ruta}".`)
      finalizar('timeout')
    }, timeoutMs)

    let reproduccion
    try {
      reproduccion = audio.play()
    } catch {
      logger.warn?.(`[reproductorVoz] No se pudo iniciar "${ruta}".`)
      finalizar('play-rechazado')
      return
    }

    if (reproduccion && typeof reproduccion.catch === 'function') {
      reproduccion.catch(() => {
        logger.warn?.(`[reproductorVoz] Reproducción bloqueada para "${ruta}".`)
        finalizar('play-rechazado')
      })
    }
  })
}

export function reproducirSecuencia(rutas = [], opciones = {}) {
  const {
    timeoutMs = TIMEOUT_FRAGMENTO_MS,
    AudioCtor = globalThis.Audio,
    logger = console,
  } = opciones

  const lista = Array.isArray(rutas) ? rutas.filter(esRutaValida) : []

  const ejecucion = colaReproduccion.then(async () => {
    for (const ruta of lista) {
      await reproducirFragmento(ruta, { timeoutMs, AudioCtor, logger })
    }
  })

  colaReproduccion = ejecucion.catch(() => {})
  return ejecucion
}
