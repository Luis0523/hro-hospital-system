export const IDIOMAS_PREFERIDOS = ['es-GT']

export const IDIOMAS_LATAM = [
  'es-419',
  'es-MX',
  'es-US',
  'es-CO',
  'es-PE',
  'es-CL',
  'es-AR',
  'es-VE',
  'es-EC',
  'es-UY',
  'es-PY',
  'es-BO',
  'es-CR',
  'es-PA',
  'es-DO',
  'es-HN',
  'es-NI',
  'es-SV',
  'es-PR',
]

export const IDIOMAS_ES_ES = ['es-ES']

export const FRASE_ACTIVACION = 'Comunicación por voz activada.'

// Caché de voces por instancia de `speechSynthesis`. El WeakMap evita registrar
// listeners duplicados y no retiene entornos ya descartados.
const cacheVoces = new WeakMap()

function comoTurno(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : null
}

function idiomaNormalizado(voz) {
  return String(voz?.lang ?? '').toLowerCase()
}

export function estaDisponibleVoz(entorno = globalThis) {
  return Boolean(entorno?.speechSynthesis && entorno?.SpeechSynthesisUtterance)
}

/**
 * Devuelve las voces disponibles conservando una caché por instancia de
 * `speechSynthesis`. Si `getVoices()` viene vacío y el entorno soporta
 * `addEventListener`, registra UN solo listener `voiceschanged` que refresca
 * la caché (nunca uno por llamado).
 */
export function vocesDisponibles(entorno = globalThis) {
  const speech = entorno?.speechSynthesis
  if (!speech || typeof speech.getVoices !== 'function') return []

  const leerVoces = () => {
    try {
      return speech.getVoices() || []
    } catch {
      return []
    }
  }

  let entrada = cacheVoces.get(speech)
  if (!entrada) {
    entrada = { voces: [] }
    entrada.voces = leerVoces()
    if (typeof speech.addEventListener === 'function') {
      speech.addEventListener('voiceschanged', () => {
        entrada.voces = leerVoces()
      })
    }
    cacheVoces.set(speech, entrada)
  } else if (entrada.voces.length === 0) {
    // Reintento sin listener: algunas plataformas ya tienen voces cargadas.
    const actuales = leerVoces()
    if (actuales.length > 0) entrada.voces = actuales
  }

  return entrada.voces
}

export function buscarVozEspanol(voces = []) {
  if (!Array.isArray(voces) || voces.length === 0) return null

  const porIdioma = (idioma) =>
    voces.find((voz) => idiomaNormalizado(voz) === idioma.toLowerCase())

  for (const idioma of IDIOMAS_PREFERIDOS) {
    const coincidencia = porIdioma(idioma)
    if (coincidencia) return coincidencia
  }

  for (const idioma of IDIOMAS_LATAM) {
    const coincidencia = porIdioma(idioma)
    if (coincidencia) return coincidencia
  }

  for (const idioma of IDIOMAS_ES_ES) {
    const coincidencia = porIdioma(idioma)
    if (coincidencia) return coincidencia
  }

  return voces.find((voz) => idiomaNormalizado(voz).startsWith('es')) ?? null
}

export function construirMensajeTurno(asignacion = {}) {
  const turnoActual = comoTurno(asignacion.turnoActual)
  if (!turnoActual) return null

  const consultorio = String(asignacion.espacioNumero ?? '').trim()
  if (!consultorio) return `Turno número ${turnoActual}.`

  return `Turno número ${turnoActual}. Favor pasar al consultorio ${consultorio}.`
}

export function hablar(
  texto,
  { entorno = globalThis, rate = 1.5, pitch = 1.0, volume = 1, onEnd, onError } = {},
) {
  if (!texto || !estaDisponibleVoz(entorno)) return false

  const Constructor = entorno.SpeechSynthesisUtterance
  const utterance = new Constructor(texto)
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  const voz = buscarVozEspanol(vocesDisponibles(entorno))
  if (voz) {
    utterance.voice = voz
    utterance.lang = voz.lang
  } else {
    utterance.lang = 'es-GT'
  }

  if (typeof onEnd === 'function') {
    utterance.onend = () => onEnd()
  }
  if (typeof onError === 'function') {
    utterance.onerror = (evento) => onError(evento)
  }

  entorno.speechSynthesis.speak(utterance)
  return true
}

export function anunciarTurno(asignacion, opciones = {}) {
  const mensaje = construirMensajeTurno(asignacion)
  if (!mensaje) return null
  return hablar(mensaje, opciones) ? mensaje : null
}
