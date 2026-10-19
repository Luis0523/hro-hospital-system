/**
 * Estrategia de error: las funciones de resolución devuelven `null` cuando el
 * fragmento no existe o el valor es inválido. No se lanzan excepciones ni se
 * generan rutas parciales.
 */
export const RUTA_BASE_AUDIO = '/audio/tablero/'

export const MAXIMO_NUMERO_PACIENTE = 200

export const RUTAS_GENERALES = Object.freeze({
  paciente: `${RUTA_BASE_AUDIO}generales/paciente.mp3`,
  pasarA: `${RUTA_BASE_AUDIO}generales/pasar_a.mp3`,
  pasaraA: `${RUTA_BASE_AUDIO}generales/pasara_a.mp3`,
  siguientesPacientesClinica: `${RUTA_BASE_AUDIO}generales/siguientes_pacientes_clinica.mp3`,
})

const ACCIONES = Object.freeze({
  pasar_a: RUTAS_GENERALES.pasarA,
  pasara_a: RUTAS_GENERALES.pasaraA,
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

export function construirSecuenciaPaciente({ numero, destino, accion = 'pasara_a' } = {}) {
  if (accion !== 'pasar_a' && accion !== 'pasara_a') return null

  const rutaDelNumero = rutaNumero(numero)
  if (!rutaDelNumero) return null

  const rutaDelDestino = rutaDestino(destino)
  if (!rutaDelDestino) return null

  return [RUTAS_GENERALES.paciente, rutaDelNumero, ACCIONES[accion], rutaDelDestino]
}
