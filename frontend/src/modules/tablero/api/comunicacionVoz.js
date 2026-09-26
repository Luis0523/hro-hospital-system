export const IDIOMAS_ES = ['es-GT', 'es-MX', 'es-ES']

export const FRASE_ACTIVACION = 'Comunicación por voz activada.'

function comoTurno(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : null
}

export function estaDisponibleVoz(entorno = globalThis) {
  return Boolean(entorno?.speechSynthesis && entorno?.SpeechSynthesisUtterance)
}

export function buscarVozEspanol(voces = []) {
  if (!Array.isArray(voces) || voces.length === 0) return null

  for (const idioma of IDIOMAS_ES) {
    const coincidencia = voces.find((voz) => voz?.lang === idioma)
    if (coincidencia) return coincidencia
  }

  return (
    voces.find((voz) =>
      String(voz?.lang ?? '')
        .toLowerCase()
        .startsWith('es'),
    ) ?? null
  )
}

export function construirMensajeTurno(asignacion = {}) {
  const turnoActual = comoTurno(asignacion.turnoActual)
  if (!turnoActual) return null

  const subespecialidad = String(asignacion.subespecialidadNombre ?? '').trim()
  const consultorio = String(asignacion.espacioNumero ?? '').trim() || '—'

  return subespecialidad
    ? `Turno número ${turnoActual}, favor pasar a ${subespecialidad}, consultorio ${consultorio}.`
    : `Turno número ${turnoActual}, favor pasar al consultorio ${consultorio}.`
}

export function hablar(
  texto,
  { entorno = globalThis, rate = 0.9, pitch = 1, volume = 1, onEnd, onError } = {},
) {
  if (!texto || !estaDisponibleVoz(entorno)) return false

  const Constructor = entorno.SpeechSynthesisUtterance
  const utterance = new Constructor(texto)
  utterance.lang = 'es-GT'
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  if (typeof onEnd === 'function') {
    utterance.onend = () => onEnd()
  }
  if (typeof onError === 'function') {
    utterance.onerror = (evento) => onError(evento)
  }

  const voces =
    typeof entorno.speechSynthesis.getVoices === 'function'
      ? entorno.speechSynthesis.getVoices()
      : []
  const voz = buscarVozEspanol(voces)
  if (voz) utterance.voice = voz

  entorno.speechSynthesis.speak(utterance)
  return true
}

export function anunciarTurno(asignacion, opciones = {}) {
  const mensaje = construirMensajeTurno(asignacion)
  if (!mensaje) return null
  return hablar(mensaje, opciones) ? mensaje : null
}
