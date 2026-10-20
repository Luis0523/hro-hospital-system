export const CLINICAS_MOCK = Object.freeze([
  {
    codigo: '101-11',
    espacioFisicoId: '11111111-1111-4111-8111-111111111111',
    numero: '3',
    nivel: 2,
    nombre: 'Consulta Externa',
    ubicacion: 'Edificio de Consulta Externa · Segundo Nivel',
    activo: true,
    asignacion: {
      id: 101,
      subespecialidadId: 11,
      subespecialidadNombre: 'Medicina Interna',
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
    },
  },
  {
    codigo: '202-11',
    espacioFisicoId: '22222222-2222-4222-8222-222222222222',
    numero: '5',
    nivel: 1,
    nombre: 'Consulta Externa',
    ubicacion: 'Edificio de Consulta Externa · Primer Nivel',
    activo: true,
    asignacion: {
      id: 202,
      subespecialidadId: 22,
      subespecialidadNombre: 'Pediatría',
      especialidadId: 2,
      especialidadNombre: 'Pediatría',
    },
  },
  {
    codigo: '303-00',
    espacioFisicoId: '33333333-3333-4333-8333-333333333333',
    numero: '7',
    nivel: 1,
    nombre: 'Consulta Externa',
    ubicacion: 'Edificio de Consulta Externa · Primer Nivel',
    activo: true,
    asignacion: null,
  },
])

export const MEDICOS_MOCK = Object.freeze([
  {
    id: 'med-001',
    nombre: 'Dra. Ana Lucía Demo',
    colegiado: '1001',
    usuarioReferenciaId: 11,
    activo: true,
  },
  {
    id: 'med-002',
    nombre: 'Dr. Bruno Estuardo Demo',
    colegiado: '1002',
    usuarioReferenciaId: 12,
    activo: true,
  },
  {
    id: 'med-003',
    nombre: 'Dra. Carla Sofía Inactiva',
    colegiado: '2001',
    usuarioReferenciaId: 13,
    activo: false,
  },
  {
    id: 'med-004',
    nombre: 'Dr. Diego Alejandro Demo',
    colegiado: '3001',
    usuarioReferenciaId: null,
    activo: true,
  },
])

export const COLEGIADOS_DEMO = Object.freeze({
  validos: ['1001', '1002', '3001'],
  inactivo: '2001',
  inexistente: '9999',
})

export const PACIENTES_MOCK = Object.freeze([
  { expediente: '0000000001', pacienteNombre: 'Rosa María Demo' },
  { expediente: '0000000002', pacienteNombre: 'Juan Carlos Demo' },
  { expediente: '0000000003', pacienteNombre: 'María Elena Demo' },
  { expediente: '0000000004', pacienteNombre: 'Pedro Antonio Demo' },
  { expediente: '0000000005', pacienteNombre: 'Ana Lucía Demo' },
  { expediente: '0000000006', pacienteNombre: 'Carlos Eduardo Demo' },
  { expediente: '0000000101', pacienteNombre: 'Sofía Valentina Demo' },
  { expediente: '0000000102', pacienteNombre: 'Mateo Andrés Demo' },
  { expediente: '0000000103', pacienteNombre: 'Valentina Sofía Demo' },
  { expediente: '0000000999', pacienteNombre: 'Paciente Ajeno Demo' },
])

function isoHaceMinutos(minutos) {
  return new Date(Date.now() - Math.max(0, minutos) * 60000).toISOString()
}

function crearTurno({
  id,
  numeroTurno,
  orden,
  estado,
  pacienteNombre,
  pacienteExpediente,
  intentosLlamado = 0,
  esperaMin,
  llamadoMin = null,
  atendidoMin = null,
}) {
  return {
    id,
    numeroTurno,
    orden,
    estado,
    pacienteNombre,
    pacienteExpediente,
    identificado: false,
    intentosLlamado,
    horaGenerado: isoHaceMinutos(esperaMin),
    horaLlamado: llamadoMin == null ? null : isoHaceMinutos(llamadoMin),
    horaAtendido: atendidoMin == null ? null : isoHaceMinutos(atendidoMin),
  }
}

const TURNOS_POR_ASIGNACION = Object.freeze({
  101: [
    {
      id: 1001,
      numeroTurno: 'MI-1',
      orden: 1,
      estado: 'en_espera',
      pacienteNombre: 'Rosa María Demo',
      pacienteExpediente: '0000000001',
      esperaMin: 8,
    },
    {
      id: 1002,
      numeroTurno: 'MI-2',
      orden: 2,
      estado: 'en_espera',
      pacienteNombre: 'Juan Carlos Demo',
      pacienteExpediente: '0000000002',
      esperaMin: 15,
    },
    {
      id: 1003,
      numeroTurno: 'MI-3',
      orden: 3,
      estado: 'no_responde',
      pacienteNombre: 'María Elena Demo',
      pacienteExpediente: '0000000003',
      intentosLlamado: 1,
      esperaMin: 22,
      llamadoMin: 10,
    },
    {
      id: 1004,
      numeroTurno: 'MI-4',
      orden: 4,
      estado: 'atendido',
      pacienteNombre: 'Pedro Antonio Demo',
      pacienteExpediente: '0000000004',
      esperaMin: 35,
      llamadoMin: 15,
      atendidoMin: 5,
    },
    {
      id: 1005,
      numeroTurno: 'MI-5',
      orden: 5,
      estado: 'reintegrado',
      pacienteNombre: 'Ana Lucía Demo',
      pacienteExpediente: '0000000005',
      esperaMin: 5,
    },
    {
      id: 1006,
      numeroTurno: 'MI-6',
      orden: 6,
      estado: 'en_espera',
      pacienteNombre: 'Carlos Eduardo Demo',
      pacienteExpediente: '',
      esperaMin: 2,
    },
  ],
  202: [
    {
      id: 2001,
      numeroTurno: 'REUMA-1',
      orden: 1,
      estado: 'en_espera',
      pacienteNombre: 'Sofía Valentina Demo',
      pacienteExpediente: '0000000101',
      esperaMin: 6,
    },
    {
      id: 2002,
      numeroTurno: 'REUMA-2',
      orden: 2,
      estado: 'en_espera',
      pacienteNombre: 'Mateo Andrés Demo',
      pacienteExpediente: '0000000102',
      esperaMin: 12,
    },
    {
      id: 2003,
      numeroTurno: 'REUMA-3',
      orden: 3,
      estado: 'atendido',
      pacienteNombre: 'Valentina Sofía Demo',
      pacienteExpediente: '0000000103',
      esperaMin: 30,
      llamadoMin: 16,
      atendidoMin: 8,
    },
  ],
})

export function turnosDeClinica(asignacionId) {
  const id = Number(asignacionId)
  const turnos = TURNOS_POR_ASIGNACION[id] ?? []
  return turnos.map((turno) => crearTurno(turno))
}
