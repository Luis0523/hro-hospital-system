/**
 * Estrategia de error: las funciones de resolución devuelven `null` cuando el
 * fragmento no existe o el valor es inválido. No se lanzan excepciones ni se
 * generan rutas parciales.
 */
export const RUTA_BASE_AUDIO = '/audio/tablero/'

export const MAXIMO_NUMERO_PACIENTE = 300

/** Pausa de silencio después del número del paciente. */
export const PAUSA_TRAS_NUMERO_MS = 350

/** Índice del fragmento del número dentro de construirSecuenciaLlamado. */
export const INDICE_NUMERO_PACIENTE = 3

export const RUTAS_GENERALES = Object.freeze({
  sonidoPrevio: `${RUTA_BASE_AUDIO}generales/sonidoprevio.mp3`,
  paciente: `${RUTA_BASE_AUDIO}generales/paciente.mp3`,
  numero: `${RUTA_BASE_AUDIO}generales/numero.mp3`,
  pasarA: `${RUTA_BASE_AUDIO}generales/pasar_a.mp3`,
  pasaraA: `${RUTA_BASE_AUDIO}generales/pasara_a.mp3`,
  clinica: `${RUTA_BASE_AUDIO}generales/clinica.mp3`,
  siguientesPacientesClinica: `${RUTA_BASE_AUDIO}generales/siguientes_pacientes_clinica.mp3`,
})

const DESTINOS = Object.freeze({
  '6a': `${RUTA_BASE_AUDIO}numeros/6a.mp3`,
  '6b': `${RUTA_BASE_AUDIO}numeros/6b.mp3`,
})

function normalizarNumero(valor) {
  let numero

  if (typeof valor === 'number') {
    numero = valor
  } else if (typeof valor === 'string') {
    const texto = valor.trim()
    if (!/^\d+$/.test(texto)) return null
    numero = Number(texto)
  } else {
    return null
  }

  if (!Number.isInteger(numero) || numero < 1 || numero > MAXIMO_NUMERO_PACIENTE) return null
  return numero
}

export function rutaNumero(valor) {
  const numero = normalizarNumero(valor)
  if (numero === null) return null
  return `${RUTA_BASE_AUDIO}numeros/${String(numero).padStart(3, '0')}.mp3`
}

export function rutaDestino(valor) {
  if (typeof valor !== 'string') return null

  const clave = valor.trim().toLowerCase()
  if (clave !== '6a' && clave !== '6b') return null
  return DESTINOS[clave]
}

export function construirSecuenciaLlamado({ turno, clinicaNumero } = {}) {
  const rutaDelTurno = rutaNumero(turno)
  if (!rutaDelTurno) return null

  const rutaDeClinica = rutaDestino(clinicaNumero) ?? rutaNumero(clinicaNumero)
  if (!rutaDeClinica) return null

  return [
    RUTAS_GENERALES.sonidoPrevio,
    RUTAS_GENERALES.paciente,
    RUTAS_GENERALES.numero,
    rutaDelTurno,
    RUTAS_GENERALES.pasarA,
    RUTAS_GENERALES.clinica,
    rutaDeClinica,
  ]
}
