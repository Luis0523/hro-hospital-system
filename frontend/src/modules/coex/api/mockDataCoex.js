// Fixtures propios de Mesa COEX. Reproducen la forma real de los DTOs del
// backend (`SubespecialidadAsignadaDTO` y `ExpedienteJornadaDTO`) para poder
// ejercitar la integración en modo mock (VITE_USE_MOCK=true o Vitest).
//
// No se reutilizan fixtures de Archivo.

// Subespecialidades activas de una estación. Una estación real puede tener
// varias; se incluyen dos para poder probar la agregación.
export function subespecialidadesEstacionCoexMock() {
  return [
    {
      id: 1,
      nombre: 'Medicina General',
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
    },
    {
      id: 2,
      nombre: 'Pediatría General',
      especialidadId: 2,
      especialidadNombre: 'Pediatría',
    },
  ]
}

// Una fila por cita de la fecha para la subespecialidad consultada.
// `estadoActual` = 'sin_ciclo' y `cicloId` = null representan una cita que
// todavía no tiene ciclo de expediente (no accionable).
const JORNADA_COEX_MOCK = [
  {
    citaId: 101,
    horaEstimada: '08:30:00',
    pacienteId: 'pac-001',
    pacienteNombre: 'María Fernanda López García',
    dpi: '2456789010101',
    numeroExpediente: 'EXP-2024-035',
    expedienteId: 'exp-001',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    cicloId: 'ciclo-001',
    estadoActual: 'en_transito_entrega',
    ubicacionBase: null,
  },
  {
    citaId: 102,
    horaEstimada: '09:15:00',
    pacienteId: 'pac-002',
    pacienteNombre: 'Carlos Eduardo Ramírez Soto',
    dpi: '1899234560101',
    numeroExpediente: 'EXP-2024-002',
    expedienteId: 'exp-002',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    cicloId: 'ciclo-002',
    estadoActual: 'entregado',
    ubicacionBase: null,
  },
  {
    citaId: 103,
    horaEstimada: '10:40:00',
    pacienteId: 'pac-003',
    pacienteNombre: 'Ana Lucía Pérez Morales',
    dpi: '3012456780101',
    numeroExpediente: 'EXP-2024-016',
    expedienteId: 'exp-003',
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    cicloId: 'ciclo-003',
    estadoActual: 'en_transito_entrega',
    ubicacionBase: null,
  },
  {
    citaId: 104,
    horaEstimada: '11:20:00',
    pacienteId: 'pac-004',
    pacienteNombre: 'José Manuel Ordóñez Figueroa',
    dpi: '2233445560101',
    numeroExpediente: 'EXP-2023-8941',
    expedienteId: 'exp-004',
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    cicloId: 'ciclo-004',
    estadoActual: 'localizado',
    ubicacionBase: null,
  },
  {
    citaId: 105,
    horaEstimada: '12:00:00',
    pacienteId: 'pac-005',
    pacienteNombre: 'Diana Carolina Xicará Tuy',
    dpi: '3009988770101',
    numeroExpediente: null,
    expedienteId: null,
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    cicloId: null,
    estadoActual: 'sin_ciclo',
    ubicacionBase: null,
  },
]

export function jornadaSubespecialidadCoexMock({ subespecialidadId } = {}) {
  return JORNADA_COEX_MOCK.filter(
    (fila) => !subespecialidadId || fila.subespecialidadId === Number(subespecialidadId),
  ).map((fila) => ({ ...fila }))
}
