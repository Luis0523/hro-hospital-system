import { anunciarTurno, detenerHabla, estaDisponibleVoz } from './comunicacionVoz'
import {
  construirSecuenciaLlamado,
  RUTAS_GENERALES,
  rutaDestino,
  rutaNumero,
} from './segmentosVoz'
import { detenerReproduccion, reproducirSecuencia } from './reproductorVoz'

const ESTADOS = Object.freeze({
  DESCONOCIDO: 'desconocido',
  CARGANDO: 'cargando',
  LISTO: 'listo',
  FALLIDO: 'fallido',
})

const TIMEOUT_PRECARGA_MS = 15000
const CONCURRENCIA_PRECARGA = 4

const cache = new Map()
let generacionDetencion = 0
let generacionPrecarga = 0
let precargaCritica = null
let numerosIniciados = false

function estadoDe(url) {
  return cache.get(url)?.estado ?? ESTADOS.DESCONOCIDO
}

function precargarUrl(url) {
  const existente = cache.get(url)
  if (existente?.estado === ESTADOS.LISTO || existente?.estado === ESTADOS.FALLIDO) {
    return Promise.resolve(existente.estado === ESTADOS.LISTO)
  }
  if (existente?.estado === ESTADOS.CARGANDO) return existente.promesa

  const token = generacionPrecarga
  const entrada = { estado: ESTADOS.CARGANDO, audio: null, promesa: null }

  entrada.promesa = new Promise((resolve) => {
    if (typeof Audio !== 'function') {
      entrada.estado = ESTADOS.FALLIDO
      resolve(false)
      return
    }

    let audio
    try {
      audio = new Audio(url)
      audio.preload = 'auto'
    } catch {
      entrada.estado = ESTADOS.FALLIDO
      resolve(false)
      return
    }

    entrada.audio = audio
    let terminado = false
    let timer = null

    const limpiar = () => {
      if (timer !== null) clearTimeout(timer)
      timer = null
      audio.removeEventListener?.('canplaythrough', alCargar)
      audio.removeEventListener?.('loadeddata', alCargar)
      audio.removeEventListener?.('error', alFallar)
    }

    const finalizar = (ok) => {
      if (terminado) return
      terminado = true
      limpiar()

      if (token !== generacionPrecarga) {
        try {
          audio.pause?.()
          audio.src = ''
        } catch {
          // Liberación best-effort.
        }
        resolve(false)
        return
      }

      entrada.estado = ok ? ESTADOS.LISTO : ESTADOS.FALLIDO
      if (!ok) {
        try {
          audio.pause?.()
          audio.src = ''
        } catch {
          // Liberación best-effort.
        }
      }
      resolve(ok)
    }

    function alCargar() {
      finalizar(true)
    }

    function alFallar() {
      finalizar(false)
    }

    timer = setTimeout(() => finalizar(false), TIMEOUT_PRECARGA_MS)
    audio.addEventListener?.('canplaythrough', alCargar)
    audio.addEventListener?.('loadeddata', alCargar)
    audio.addEventListener?.('error', alFallar)
    entrada.cancelar = () => finalizar(false)
  })

  cache.set(url, entrada)
  return entrada.promesa
}

function iniciarPrecargaNumeros(token) {
  if (numerosIniciados) return
  numerosIniciados = true

  const pendientes = Array.from({ length: 300 }, (_, indice) => rutaNumero(indice + 1)).filter(
    Boolean,
  )

  const trabajador = async () => {
    while (pendientes.length > 0) {
      if (token !== generacionPrecarga) return
      const url = pendientes.shift()
      await precargarUrl(url)
    }
  }

  for (let i = 0; i < CONCURRENCIA_PRECARGA; i += 1) {
    trabajador()
  }
}

function rutasCriticas() {
  return [
    RUTAS_GENERALES.paciente,
    RUTAS_GENERALES.numero,
    RUTAS_GENERALES.pasarA,
    RUTAS_GENERALES.clinica,
    rutaDestino('6A'),
    rutaDestino('6B'),
  ].filter(Boolean)
}

/**
 * Inicia la precarga prioritaria (generales + destinos) y, en segundo plano,
 * los números 001–300 con concurrencia limitada. No rechaza si falta un
 * archivo: el estado queda en caché para decidir el fallback TTS.
 */
export function precargarAudioTablero() {
  if (!estaDisponibleAudioTablero()) return Promise.resolve(false)
  if (precargaCritica) return precargaCritica

  const token = generacionPrecarga
  precargaCritica = Promise.all(rutasCriticas().map((url) => precargarUrl(url))).then(
    (resultados) => {
      if (token !== generacionPrecarga) return false
      iniciarPrecargaNumeros(token)
      return resultados.every(Boolean)
    },
  )

  return precargaCritica
}

/**
 * Indica si existe el mecanismo local Audio. No afirma que los 311 archivos
 * existan; la disponibilidad de una llamada concreta depende del rango, la
 * clínica, la caché de precarga y la reproducción real.
 */
export function estaDisponibleAudioTablero(entorno = globalThis) {
  return typeof entorno?.Audio === 'function'
}

export function estaDisponibleVozTablero(entorno = globalThis) {
  return estaDisponibleVoz(entorno)
}

function reproducirFallbackTts({ turno, clinicaNumero, finalizar, onEnd, onError }) {
  try {
    const mensaje = anunciarTurno(
      { turnoActual: turno, espacioNumero: clinicaNumero },
      {
        onEnd: () => finalizar(onEnd),
        onError: () => finalizar(onError),
      },
    )

    if (!mensaje) finalizar(onError)
  } catch {
    finalizar(onError)
  }
}

/**
 * Reproduce una repetición completa del anuncio. Si el MP3 no está disponible
 * o falla, cae a SpeechSynthesis con la frase completa. Los callbacks son
 * idempotentes y se ignoran si el audio fue detenido.
 */
export function reproducirLlamado({ turno, clinicaNumero, onEnd, onError } = {}) {
  const generacion = generacionDetencion
  let terminado = false

  const finalizar = (callback) => {
    if (terminado || generacion !== generacionDetencion) return
    terminado = true
    callback?.()
  }

  const fallback = () => {
    reproducirFallbackTts({ turno, clinicaNumero, finalizar, onEnd, onError })
  }

  const secuencia = construirSecuenciaLlamado({ turno, clinicaNumero })

  if (!secuencia || !estaDisponibleAudioTablero()) {
    fallback()
    return
  }

  if (secuencia.some((url) => estadoDe(url) === ESTADOS.FALLIDO)) {
    fallback()
    return
  }

  try {
    reproducirSecuencia(secuencia)
      .then(() => finalizar(onEnd))
      .catch(() => {
        if (generacion !== generacionDetencion) return
        fallback()
      })
  } catch {
    fallback()
  }
}

/**
 * Cancela la reproducción actual, las secuencias pendientes, la precarga y el
 * TTS. La caché se reinicia para una nueva activación.
 */
export function detenerAudioTablero() {
  generacionDetencion += 1
  generacionPrecarga += 1
  precargaCritica = null
  numerosIniciados = false

  detenerReproduccion()
  detenerHabla()

  for (const entrada of cache.values()) {
    try {
      entrada.cancelar?.()
      entrada.audio?.pause?.()
      if (entrada.audio) entrada.audio.src = ''
    } catch {
      // Liberación best-effort.
    }
  }
  cache.clear()
}
