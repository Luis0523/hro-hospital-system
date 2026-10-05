// Formato de expediente del contrato real: 4 dígitos + guion + 2 dígitos.
// Ejemplos válidos: 1323-23, 1401-24.
export const PATRON_EXPEDIENTE = /^\d{4}-\d{2}$/

export function normalizarExpediente(valor) {
  return String(valor ?? '').trim()
}

export function esExpedienteValido(valor) {
  return PATRON_EXPEDIENTE.test(normalizarExpediente(valor))
}
