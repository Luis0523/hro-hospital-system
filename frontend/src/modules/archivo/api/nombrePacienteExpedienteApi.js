// Nombre del paciente PROPIETARIO de un expediente (dato complementario).
//
// Esta capa NO participa en la verificación de existencia ni en la persistencia
// de préstamos (que sigue siendo simulada). Solo agrega un dato de lectura a la
// tabla de movimientos cuando la verificación real está habilitada.
//
// Contrato reutilizado (ya existente en el backend):
//   GET /pacientes/{id}  -> ApiResponse<PacienteResponseDTO>
//   PacienteResponseDTO: { id, nombres, apellidos, numeroExpediente, ... }
// El nombre completo se arma con `nombres` + `apellidos` mediante `mapearPaciente`
// (ver `archivoApi.buscarPacientePorId`).
//
// Reglas:
// - En modo simulación NO se consulta ni se inventan nombres.
// - Un fallo de esta consulta NUNCA bloquea el préstamo ya registrado.
// - El nombre se conserva solo en memoria durante la sesión (Map). No se usa
//   localStorage, sessionStorage, IndexedDB ni se envía a servicios externos.

import { buscarPacientePorId } from './archivoApi'
import { MODO_VERIFICACION_REAL, obtenerModoVerificacion } from './verificacionExpedienteApi'
import { normalizarNumeroExpediente } from '../utils/prestamosExternos'

export const NOMBRE_PACIENTE_DISPONIBLE = 'disponible'
export const NOMBRE_PACIENTE_NO_DISPONIBLE = 'no_disponible'
export const NOMBRE_PACIENTE_NO_VERIFICADO = 'no_verificado'

// Tope defensivo: evita crecer sin límite en sesiones muy largas.
const MAX_ENTRADAS = 300

/** Caché de sesión: número normalizado → { estado, nombre }. */
const cache = new Map()

export function limpiarCacheNombresPacientes() {
  cache.clear()
}

/** Copia de la caché (para hidratar la UI al montar o en pruebas). */
export function listarNombresPacientesEnCache() {
  return Object.fromEntries(cache)
}

function guardarEnCache(clave, resultado) {
  if (cache.size >= MAX_ENTRADAS) {
    const [primera] = cache.keys()
    cache.delete(primera)
  }
  cache.set(clave, resultado)
}

/**
 * Obtiene el nombre completo del paciente dueño del expediente.
 *
 * Devuelve `{ estado, nombre }`:
 * - `disponible`: nombre real obtenido del backend.
 * - `no_disponible`: no se pudo consultar (sin pacienteId, error o sin nombre).
 * - `no_verificado`: modo simulación; no se consultó el backend.
 *
 * Nunca lanza: la consulta es complementaria.
 */
export async function obtenerNombrePacienteDeExpediente(numeroExpediente, pacienteId = null) {
  const clave = normalizarNumeroExpediente(numeroExpediente)
  if (!clave) return { estado: NOMBRE_PACIENTE_NO_DISPONIBLE, nombre: null }

  const enCache = cache.get(clave)
  if (enCache) return enCache

  if (obtenerModoVerificacion() !== MODO_VERIFICACION_REAL) {
    return { estado: NOMBRE_PACIENTE_NO_VERIFICADO, nombre: null }
  }

  if (!pacienteId) {
    return { estado: NOMBRE_PACIENTE_NO_DISPONIBLE, nombre: null }
  }

  try {
    const paciente = await buscarPacientePorId(pacienteId)
    const nombre = String(paciente?.nombreCompleto ?? '').trim()

    const resultado = nombre
      ? { estado: NOMBRE_PACIENTE_DISPONIBLE, nombre }
      : { estado: NOMBRE_PACIENTE_NO_DISPONIBLE, nombre: null }

    if (resultado.estado === NOMBRE_PACIENTE_DISPONIBLE) {
      guardarEnCache(clave, resultado)
    }
    return resultado
  } catch (fallo) {
    return {
      estado: NOMBRE_PACIENTE_NO_DISPONIBLE,
      nombre: null,
      status: fallo?.status ?? null,
    }
  }
}
