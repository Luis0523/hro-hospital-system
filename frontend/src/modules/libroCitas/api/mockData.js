// Catálogo mock pequeño y determinista para la fase frontend de SCRUM-202.
// Cada paciente expone SOLO: id, numeroExpediente y nombre. No incluye DPI,
// teléfono, dirección, sexo, diagnóstico, fecha de nacimiento ni datos clínicos.
// La consulta real (GET /pacientes/expediente/{exp}) se integrará en SCRUM-204.
export const PACIENTES_MOCK = [
  { id: 'pac-1323', numeroExpediente: '1323-23', nombre: 'Paciente Demo Uno' },
  { id: 'pac-1401', numeroExpediente: '1401-24', nombre: 'Paciente Demo Dos' },
  { id: 'pac-1402', numeroExpediente: '1402-24', nombre: 'Paciente Demo Tres' },
  { id: 'pac-1500', numeroExpediente: '1500-25', nombre: 'Paciente Demo Cuatro' },
]

// Para SCRUM-202 solo se usan estas dos especialidades. No ampliar el catálogo.
export const ESPECIALIDADES = [
  { id: 1, nombre: 'Medicina Interna' },
  { id: 2, nombre: 'Medicina General' },
]

export function buscarPacienteMock(numeroExpediente) {
  const expediente = String(numeroExpediente ?? '').trim()
  return PACIENTES_MOCK.find((paciente) => paciente.numeroExpediente === expediente) ?? null
}
