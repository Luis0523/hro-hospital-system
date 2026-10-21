/**
 * Tiempo máximo de espera por fragmento durante carga/decodificación.
 * Los MP3 son cortos; 15 s evita bloqueos sin cortar audios legítimos.
 */
export const TIMEOUT_FRAGMENTO_MS = 15000

/**
 * Cada fragmento comienza hasta 1000 ms antes de que termine el anterior
 * (valor aprobado auditivamente). Si el anterior dura menos de 1 s, el
 * siguiente comienza en el mismo instante (nunca con avance negativo).
 */
export const SOLAPAMIENTO_FRAGMENTOS_MS = 1000

export const MARGEN_INICIAL_S = 0.05

const MARGEN_FIN_MS = 100

let colaReproduccion = Promise.resolve()
let generacionReproduccion = 0
let cancelarSecuenciaActual = null

function esRutaValida(ruta) {
  return typeof ruta === 'string' && ruta.trim() !== ''
}

function conTimeout(promesa, ms, mensaje) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(mensaje)), ms)
    Promise.resolve(promesa).then(
      (valor) => {
        clearTimeout(timer)
        resolve(valor)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function cargarBuffer(ruta, { fetchImpl, contexto, timeoutMs, signal }) {
  const respuesta = await conTimeout(
    fetchImpl(ruta, { signal }),
    timeoutMs,
    `[reproductorVoz] Tiempo de espera agotado al cargar "${ruta}".`,
  )

  if (!respuesta || !respuesta.ok) {
    throw new Error(
      `[reproductorVoz] No se pudo cargar "${ruta}" (HTTP ${respuesta?.status ?? 'sin respuesta'}).`,
    )
  }

  const datos = await conTimeout(
    respuesta.arrayBuffer(),
    timeoutMs,
    `[reproductorVoz] Tiempo de espera agotado al leer "${ruta}".`,
  )

  return conTimeout(
    contexto.decodeAudioData(datos),
    timeoutMs,
    `[reproductorVoz] Tiempo de espera agotado al decodificar "${ruta}".`,
  )
}

export function reproducirSecuencia(rutas = [], opciones = {}) {
  const {
    timeoutMs = TIMEOUT_FRAGMENTO_MS,
    AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext,
    fetchImpl = globalThis.fetch,
    pausasPorIndice = {},
  } = opciones

  const lista = Array.isArray(rutas) ? rutas : []

  if (lista.length === 0) {
    return Promise.resolve()
  }

  if (!lista.every(esRutaValida)) {
    return Promise.reject(new Error('[reproductorVoz] La secuencia contiene una ruta inválida.'))
  }

  if (typeof AudioContextCtor !== 'function' || typeof fetchImpl !== 'function') {
    return Promise.reject(new Error('[reproductorVoz] Web Audio API o fetch no están disponibles.'))
  }

  const generacion = generacionReproduccion

  const ejecucion = colaReproduccion.then(
    () =>
      new Promise((resolve, reject) => {
        if (generacion !== generacionReproduccion) {
          reject(new Error('[reproductorVoz] La secuencia fue cancelada.'))
          return
        }

        let contexto = null
        try {
          contexto = new AudioContextCtor()
        } catch {
          reject(new Error('[reproductorVoz] No se pudo crear el AudioContext.'))
          return
        }

        const sources = []
        let timer = null
        let finalizado = false
        let cancelar = null
        const abortController = typeof AbortController === 'function' ? new AbortController() : null

        const finalizar = (error) => {
          if (finalizado) return
          finalizado = true

          if (timer !== null) clearTimeout(timer)
          if (cancelarSecuenciaActual === cancelar) {
            cancelarSecuenciaActual = null
          }

          abortController?.abort()

          for (const source of sources) {
            try {
              source.stop()
            } catch {
              // La fuente puede haber terminado ya.
            }
          }

          try {
            contexto.close?.()
          } catch {
            // Cierre best-effort.
          }

          if (error) reject(error)
          else resolve()
        }

        cancelar = () => finalizar(new Error('[reproductorVoz] La secuencia fue cancelada.'))
        cancelarSecuenciaActual = cancelar

        void (async () => {
          try {
            const buffers = await Promise.all(
              lista.map((ruta) =>
                cargarBuffer(ruta, {
                  fetchImpl,
                  contexto,
                  timeoutMs,
                  signal: abortController?.signal,
                }),
              ),
            )

            if (generacion !== generacionReproduccion) {
              finalizar(new Error('[reproductorVoz] La secuencia fue cancelada.'))
              return
            }

            try {
              await contexto.resume?.()
            } catch {
              finalizar(new Error('[reproductorVoz] El AudioContext no pudo reanudarse.'))
              return
            }

            if (contexto.state && contexto.state !== 'running') {
              finalizar(new Error('[reproductorVoz] El AudioContext está suspendido (autoplay).'))
              return
            }

            const inicio = contexto.currentTime + MARGEN_INICIAL_S
            let cursor = inicio
            let finMaximo = inicio

            buffers.forEach((buffer, indice) => {
              const source = contexto.createBufferSource()
              source.buffer = buffer
              source.connect(contexto.destination)
              source.start(cursor)
              sources.push(source)

              const fin = cursor + buffer.duration
              if (fin > finMaximo) finMaximo = fin

              const pausaMs = Number(pausasPorIndice[indice] ?? 0)
              const pausa = Number.isFinite(pausaMs) && pausaMs > 0 ? pausaMs / 1000 : 0
              cursor +=
                pausa > 0
                  ? buffer.duration + pausa
                  : Math.max(0, buffer.duration - SOLAPAMIENTO_FRAGMENTOS_MS / 1000)
            })

            const esperaMs = Math.max(0, (finMaximo - contexto.currentTime) * 1000) + MARGEN_FIN_MS
            timer = setTimeout(() => finalizar(), esperaMs)
          } catch (error) {
            finalizar(error)
          }
        })()
      }),
  )

  // Evita que un fallo en A deje la cadena rechazada y bloquee B.
  colaReproduccion = ejecucion.catch(() => {})
  return ejecucion
}

export function detenerReproduccion() {
  generacionReproduccion += 1
  cancelarSecuenciaActual?.()
  cancelarSecuenciaActual = null
  colaReproduccion = Promise.resolve()
}
