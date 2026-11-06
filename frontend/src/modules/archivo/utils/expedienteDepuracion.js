import { formatearExpediente } from '@/shared/utils/expediente'

// Reglas de captura del número de expediente para Depuración.
//
// La identidad canónica es la cadena de dígitos, sin guion y sin perder ceros
// iniciales. El guion es SOLO visual y lo agrega `formatearExpediente`.
// Se acepta un único guion interno al pegar o escribir manualmente, pero el
// valor que se envía a la API siempre es la cadena de dígitos.
export const MAX_LONGITUD_EXPEDIENTE = 30

export const MENSAJES_ERROR_EXPEDIENTE = {
  requerido: 'Ingrese el número de expediente.',
  caracteres_invalidos: 'Use solo dígitos; el guion se agrega automáticamente.',
  guion_invalido: 'Use un único guion entre grupos de dígitos.',
  guion_requerido: 'En modo manual, coloque un único guion interior (p. ej. 9275-81).',
  muy_largo: `El número de expediente no puede superar ${MAX_LONGITUD_EXPEDIENTE} dígitos.`,
}

function esCaracterDeControl(codigo) {
  return codigo <= 0x1f || codigo === 0x7f
}

function quitarCaracteresDeControl(texto) {
  let limpio = ''
  for (const caracter of texto) {
    if (!esCaracterDeControl(caracter.codePointAt(0))) limpio += caracter
  }
  return limpio
}

/** Limpia CR/LF del lector y espacios externos sin alterar letras ni dígitos. */
export function limpiarEntradaExpediente(valor) {
  return quitarCaracteresDeControl(String(valor ?? '')).trim()
}

/**
 * Valida una captura nueva de Depuración.
 * Devuelve `{ valido, numero, error }`; `numero` es la identidad canónica.
 */
export function validarEntradaExpediente(valor) {
  const limpio = limpiarEntradaExpediente(valor)
  if (!limpio) {
    return { valido: false, numero: '', error: 'requerido' }
  }

  const compacto = limpio.replace(/\s+/g, '')

  if (/^\d+$/.test(compacto)) {
    if (compacto.length > MAX_LONGITUD_EXPEDIENTE) {
      return { valido: false, numero: '', error: 'muy_largo' }
    }
    return { valido: true, numero: compacto, error: null }
  }

  if (compacto.includes('-')) {
    const partes = compacto.split('-')
    const gruposValidos = partes.length === 2 && partes.every((parte) => /^\d+$/.test(parte))

    if (!gruposValidos) {
      return { valido: false, numero: '', error: 'guion_invalido' }
    }

    const numero = partes.join('')
    if (numero.length > MAX_LONGITUD_EXPEDIENTE) {
      return { valido: false, numero: '', error: 'muy_largo' }
    }
    return { valido: true, numero, error: null }
  }

  return { valido: false, numero: '', error: 'caracteres_invalidos' }
}

/**
 * Valida la captura manual: exige un único guion interior escrito por el
 * operador y devuelve la identidad canónica sin guion.
 */
export function validarEntradaExpedienteManual(valor) {
  const limpio = limpiarEntradaExpediente(valor)
  if (!limpio) {
    return { valido: false, numero: '', error: 'requerido' }
  }

  const compacto = limpio.replace(/\s+/g, '')

  if (!/^[\d-]+$/.test(compacto)) {
    return { valido: false, numero: '', error: 'caracteres_invalidos' }
  }

  if (!compacto.includes('-')) {
    return { valido: false, numero: '', error: 'guion_requerido' }
  }

  if (!/^\d+-\d+$/.test(compacto)) {
    return { valido: false, numero: '', error: 'guion_invalido' }
  }

  const numero = compacto.replace('-', '')
  if (numero.length > MAX_LONGITUD_EXPEDIENTE) {
    return { valido: false, numero: '', error: 'muy_largo' }
  }

  return { valido: true, numero, error: null }
}

/** Identidad canónica o `null` si la captura no es válida. */
export function normalizarExpedienteDepuracion(valor) {
  const resultado = validarEntradaExpediente(valor)
  return resultado.valido ? resultado.numero : null
}

/** Representación visual institucional (un único guion, sin prefijos). */
export function formatearExpedienteDepuracion(valor) {
  return formatearExpediente(valor)
}
