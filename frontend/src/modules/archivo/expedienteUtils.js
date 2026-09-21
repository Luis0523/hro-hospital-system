// Criterio único para saber si un expediente corresponde a un paciente que
// todavía no tiene expediente físico. Se comparte entre la tarjeta y el detalle
// para no duplicar reglas distintas.
export function esExpedienteNuevo(expediente) {
  if (!expediente) return false
  return Boolean(expediente.expedienteNuevo) || !expediente.numeroExpediente
}
