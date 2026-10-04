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
