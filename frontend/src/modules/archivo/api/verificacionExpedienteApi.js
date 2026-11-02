// Verificación de EXISTENCIA de expedientes para Salidas Externas.
//
// Esta capa es independiente de la persistencia simulada de préstamos
// (`salidasExternasMock.js`). Cuando está configurada, reutiliza el contrato
// real ya existente en `archivoApi.js`:
//
//   GET /expedientes/buscar?codigo={numeroExpediente}
//   -> ApiResponse<Page<ExpedienteResponseDTO>>  (404 si el código no existe)
//
// Es un contrato de CONSULTA: informa si el expediente existe en el sistema,
// NO si el expediente físico está disponible para préstamo.
//
// Modos:
// - `real`: se consulta el endpoint (requiere VITE_VERIFICACION_EXPEDIENTES=true
//   y VITE_USE_MOCK=false).
// - `no_disponible`: se pidió verificar pero el backend no está configurado
//   (por ejemplo, VITE_USE_MOCK=true). NO se inventa un catálogo local.
// - `deshabilitada`: verificación apagada (valor por defecto).

import { buscarExpedientePorCodigo } from './archivoApi'
import { normalizarNumeroExpediente } from '../utils/prestamosExternos'

export const MODO_VERIFICACION_REAL = 'real'
export const MODO_VERIFICACION_NO_DISPONIBLE = 'no_disponible'
export const MODO_VERIFICACION_DESHABILITADA = 'deshabilitada'

export const VERIFICACION_ENCONTRADO = 'encontrado'
export const VERIFICACION_NO_ENCONTRADO = 'no_encontrado'
export const VERIFICACION_ERROR_CONEXION = 'error_conexion'
export const VERIFICACION_ERROR_AUTENTICACION = 'error_autenticacion'
export const VERIFICACION_ERROR_INCONSISTENTE = 'error_inconsistente'
export const VERIFICACION_NO_DISPONIBLE = 'no_disponible'
export const VERIFICACION_DESHABILITADA = 'deshabilitada'

// Códigos internos del frontend (no son códigos del backend).
export const CODIGO_EXPEDIENTE_NO_ENCONTRADO = 'SALIDAS_EXTERNAS_EXPEDIENTE_NO_ENCONTRADO'
export const CODIGO_VERIFICACION_FALLIDA = 'SALIDAS_EXTERNAS_VERIFICACION_FALLIDA'

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * ¿El expediente devuelto corresponde al código consultado?
 *
 * - Código UUID (QR): se compara con `expediente.id`.
 * - Número (código de barras): se comparan los números normalizados (el guion
 *   es solo visual). Números distintos nunca se consideran equivalentes.
 */
function identidadCoincide(expediente, codigoSolicitado) {
  if (!expediente) return false

  const codigo = String(codigoSolicitado ?? '').trim()
  if (!codigo) return false

  if (PATRON_UUID.test(codigo)) {
    return String(expediente.id ?? '').toLowerCase() === codigo.toLowerCase()
  }

  const numeroRecibido = normalizarNumeroExpediente(expediente.numeroExpediente)
  if (!numeroRecibido) return false

  return numeroRecibido === normalizarNumeroExpediente(codigo)
}

function banderaActiva(valor) {
  return (
    String(valor ?? '')
      .trim()
      .toLowerCase() === 'true'
  )
}

/**
 * Modo vigente de verificación. Se evalúa en cada llamada para que la
 * configuración (y los tests) puedan cambiarla sin recargar el módulo.
 */
export function obtenerModoVerificacion() {
  if (!banderaActiva(import.meta.env.VITE_VERIFICACION_EXPEDIENTES)) {
    return MODO_VERIFICACION_DESHABILITADA
  }
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    return MODO_VERIFICACION_NO_DISPONIBLE
  }
  return MODO_VERIFICACION_REAL
}

/**
 * Consulta si el expediente existe.
 *
 * Devuelve siempre un descriptor estable `{ estado, modo, expediente, motivo? }`;
 * nunca lanza por errores del servidor. El llamador decide si bloquea el
 * registro según el `estado`.
 *
 * @param {string} numeroExpediente Número normalizado (sin guion) o código.
 */
export async function verificarExistenciaExpediente(numeroExpediente) {
  const modo = obtenerModoVerificacion()
  const numero = normalizarNumeroExpediente(numeroExpediente)

  if (!numero) {
    return { estado: VERIFICACION_NO_ENCONTRADO, modo, expediente: null, motivo: 'invalido' }
  }

  if (modo === MODO_VERIFICACION_DESHABILITADA) {
    return { estado: VERIFICACION_DESHABILITADA, modo, expediente: null }
  }

  if (modo === MODO_VERIFICACION_NO_DISPONIBLE) {
    return { estado: VERIFICACION_NO_DISPONIBLE, modo, expediente: null }
  }

  try {
    const expediente = await buscarExpedientePorCodigo(numero)

    if (!expediente) {
      return { estado: VERIFICACION_NO_ENCONTRADO, modo, expediente: null }
    }

    // `depurado = true` significa que el expediente ya no existe en el sistema.
    if (expediente.depurado === true) {
      return { estado: VERIFICACION_NO_ENCONTRADO, modo, expediente, motivo: 'depurado' }
    }

    // Respuesta defensiva: el backend debe devolver exactamente el expediente
    // consultado. Una coincidencia distinta (datos cruzados, contrato alterado)
    // no puede autorizar el préstamo.
    if (!identidadCoincide(expediente, numero)) {
      return { estado: VERIFICACION_ERROR_INCONSISTENTE, modo, expediente: null }
    }

    return { estado: VERIFICACION_ENCONTRADO, modo, expediente }
  } catch (fallo) {
    const status = fallo?.status ?? null

    if (status === 404) {
      return { estado: VERIFICACION_NO_ENCONTRADO, modo, expediente: null }
    }

    if (status === 401 || status === 403) {
      return { estado: VERIFICACION_ERROR_AUTENTICACION, modo, expediente: null, status }
    }

    return { estado: VERIFICACION_ERROR_CONEXION, modo, expediente: null, status }
  }
}

/** Indica si el resultado impide registrar el préstamo. */
export function verificacionBloqueaRegistro(resultado) {
  return (
    resultado?.estado === VERIFICACION_NO_ENCONTRADO ||
    resultado?.estado === VERIFICACION_ERROR_CONEXION ||
    resultado?.estado === VERIFICACION_ERROR_AUTENTICACION ||
    resultado?.estado === VERIFICACION_ERROR_INCONSISTENTE
  )
}

/** Traduce un resultado bloqueante a un error con la forma que usa la pantalla. */
export function errorDeVerificacion(resultado) {
  if (resultado?.estado === VERIFICACION_NO_ENCONTRADO) {
    const error = new Error(
      resultado.motivo === 'depurado'
        ? 'El expediente figura como depurado (ya no existe en el sistema).'
        : 'No se encontró un expediente con ese número en el sistema.',
    )
    error.status = 404
    error.codigo = CODIGO_EXPEDIENTE_NO_ENCONTRADO
    return error
  }

  const autenticacion = resultado?.estado === VERIFICACION_ERROR_AUTENTICACION
  const inconsistente = resultado?.estado === VERIFICACION_ERROR_INCONSISTENTE
  const error = new Error(
    autenticacion
      ? 'No se pudo verificar el expediente: la sesión no está autorizada.'
      : inconsistente
        ? 'El servidor devolvió un expediente que no coincide con el número consultado.'
        : 'No se pudo verificar el expediente con el servidor. Intente de nuevo.',
  )
  error.status = resultado?.status ?? 503
  error.codigo = CODIGO_VERIFICACION_FALLIDA
  error.data = {
    motivo: autenticacion ? 'autenticacion' : inconsistente ? 'inconsistente' : 'conexion',
  }
  return error
}
