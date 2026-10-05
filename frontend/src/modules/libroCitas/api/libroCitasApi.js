import { buscarPacienteMock } from './mockData'

/**
 * Busca un paciente por número de expediente.
 *
 * FASE 5F.2: solo consulta el catálogo mock determinista; NO llama a la API
 * real ni al backend. La integración real (GET /pacientes/expediente/{exp})
 * se realizará en SCRUM-204.
 *
 * Devuelve únicamente `{ id, numeroExpediente, nombre }` o `null`.
 */
export async function buscarPacientePorExpediente(numeroExpediente) {
  const paciente = buscarPacienteMock(numeroExpediente)
  return paciente ? { ...paciente } : null
}

/**
 * Guarda el paquete capturado (contadores + items).
 *
 * FASE 5F.4: implementación MOCK. NO hace fetch, no usa axios ni el cliente
 * compartido. La persistencia real (POST /libro-citas/expedientes) se integrará
 * en SCRUM-204. No muta el payload recibido.
 */
export async function guardarLibroCitas(payload = {}) {
  const total = Array.isArray(payload.items) ? payload.items.length : 0
  return { ok: true, total }
}
