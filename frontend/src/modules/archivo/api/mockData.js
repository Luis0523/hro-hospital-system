import { aIso } from '@/shared/utils/fecha'

// Datos de prueba de la Estación de Archivo. Simulan la respuesta del backend
// (incluida la lógica de avance de estado) mientras la API real de trazabilidad
// física de expedientes no está disponible. Se activan con VITE_USE_MOCK=true
// o automáticamente en modo test (Vitest).

function fechaRelativa(offsetDias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + offsetDias)
  return aIso(fecha)
}

function marcaTiempo(horasAtras) {
  return new Date(Date.now() - horasAtras * 60 * 60 * 1000).toISOString()
}

// Fecha por defecto del listado: el día siguiente, porque el propósito del
// módulo es preparar expedientes con anticipación.
export function fechaMananaIso() {
  return fechaRelativa(1)
}

export const USUARIO_ARCHIVO_MOCK = 'Lic. Archivo Central'

export const clinicasArchivoMock = [
  { id: 1, nombre: 'Clínica 01 - Medicina General' },
  { id: 2, nombre: 'Clínica 02 - Pediatría' },
  { id: 4, nombre: 'Clínica 04 - Cardiología' },
]

export const medicosArchivoMock = [
  { id: 10, nombre: 'Dr. Jorge Castillo', clinicaId: 1 },
  { id: 11, nombre: 'Dra. Elena Marroquín', clinicaId: 1 },
  { id: 12, nombre: 'Dr. Ricardo Salazar', clinicaId: 2 },
  { id: 13, nombre: 'Dra. Patricia Núñez', clinicaId: 4 },
]

// Secuencia normal de estados que el mock usa para simular al backend.
// El frontend nunca decide cuál es el siguiente estado.
const SECUENCIA_ESTADOS = [
  'pendiente_localizar',
  'en_busqueda',
  'localizado',
  'en_transito',
  'entregado',
]

function historialBase(estado, horasAtras = 3) {
  return [
    {
      id: 1,
      estado,
      fechaHora: marcaTiempo(horasAtras),
      usuario: USUARIO_ARCHIVO_MOCK,
    },
  ]
}

export const expedientesMock = [
  {
    id: 1,
    citaId: 101,
    pacienteId: 1,
    pacienteNombre: 'María Fernanda López García',
    pacienteDpi: '2456789010101',
    numeroExpediente: 'EXP-004521',
    codigo: 'EXP-004521',
    ubicacion: 'Estante A · Fila 3 · Caja 12',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoId: 10,
    medicoNombre: 'Dr. Jorge Castillo',
    fechaCita: fechaRelativa(1),
    horaEstimada: '10:20:00',
    estado: 'pendiente_localizar',
    expedienteNuevo: false,
    historial: historialBase('pendiente_localizar', 5),
  },
  {
    id: 2,
    citaId: 102,
    pacienteId: 2,
    pacienteNombre: 'Carlos Eduardo Ramírez Soto',
    pacienteDpi: '1899234560101',
    numeroExpediente: 'EXP-003118',
    codigo: 'EXP-003118',
    ubicacion: 'Estante B · Fila 1 · Caja 04',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoId: 11,
    medicoNombre: 'Dra. Elena Marroquín',
    fechaCita: fechaRelativa(1),
    horaEstimada: '09:00:00',
    estado: 'en_busqueda',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(4),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(2), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 3,
    citaId: 103,
    pacienteId: 3,
    pacienteNombre: 'Ana Lucía Pérez Morales',
    pacienteDpi: '3012456780101',
    numeroExpediente: 'EXP-005902',
    codigo: 'EXP-005902',
    ubicacion: 'Estante C · Fila 2 · Caja 08',
    clinicaId: 2,
    clinicaNombre: 'Clínica 02 - Pediatría',
    medicoId: 12,
    medicoNombre: 'Dr. Ricardo Salazar',
    fechaCita: fechaRelativa(1),
    horaEstimada: '11:40:00',
    estado: 'localizado',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(6),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(3), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 3, estado: 'localizado', fechaHora: marcaTiempo(1), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 4,
    citaId: 104,
    pacienteId: 4,
    pacienteNombre: 'José Manuel Ordóñez Figueroa',
    pacienteDpi: '2233445560101',
    numeroExpediente: 'EXP-006310',
    codigo: 'EXP-006310',
    ubicacion: 'Estante D · Fila 4 · Caja 21',
    clinicaId: 4,
    clinicaNombre: 'Clínica 04 - Cardiología',
    medicoId: 13,
    medicoNombre: 'Dra. Patricia Núñez',
    fechaCita: fechaRelativa(1),
    horaEstimada: '08:30:00',
    estado: 'en_transito',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(8),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(5), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 3, estado: 'localizado', fechaHora: marcaTiempo(3), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 4, estado: 'en_transito', fechaHora: marcaTiempo(1), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 5,
    citaId: 105,
    pacienteId: 5,
    pacienteNombre: 'Rosa Amelia Chávez de León',
    pacienteDpi: '1998877660101',
    numeroExpediente: 'EXP-001877',
    codigo: 'EXP-001877',
    ubicacion: 'Estante A · Fila 1 · Caja 02',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoId: 10,
    medicoNombre: 'Dr. Jorge Castillo',
    fechaCita: fechaRelativa(1),
    horaEstimada: '14:00:00',
    estado: 'entregado',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(10),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(7), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 3, estado: 'localizado', fechaHora: marcaTiempo(5), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 4, estado: 'en_transito', fechaHora: marcaTiempo(3), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 5, estado: 'entregado', fechaHora: marcaTiempo(1), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 6,
    citaId: 106,
    pacienteId: 6,
    pacienteNombre: 'Luis Fernando Barrios Méndez',
    pacienteDpi: '2112233440101',
    numeroExpediente: 'EXP-007042',
    codigo: 'EXP-007042',
    ubicacion: 'Estante E · Fila 2 · Caja 15',
    clinicaId: 2,
    clinicaNombre: 'Clínica 02 - Pediatría',
    medicoId: 12,
    medicoNombre: 'Dr. Ricardo Salazar',
    fechaCita: fechaRelativa(1),
    horaEstimada: '15:20:00',
    estado: 'no_localizado',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(9),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(6), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 3, estado: 'no_localizado', fechaHora: marcaTiempo(2), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 7,
    citaId: 107,
    pacienteId: 7,
    pacienteNombre: 'Diana Carolina Xicará Tuy',
    pacienteDpi: '3009988770101',
    numeroExpediente: null,
    codigo: null,
    ubicacion: null,
    clinicaId: 4,
    clinicaNombre: 'Clínica 04 - Cardiología',
    medicoId: 13,
    medicoNombre: 'Dra. Patricia Núñez',
    fechaCita: fechaRelativa(1),
    horaEstimada: '16:10:00',
    estado: 'pendiente_localizar',
    expedienteNuevo: true,
    historial: [],
  },
]

function clonar(expediente) {
  return {
    ...expediente,
    historial: expediente.historial.map((evento) => ({ ...evento })),
  }
}

function registrarCambio(expediente, estado) {
  expediente.estado = estado
  expediente.historial.push({
    id: expediente.historial.length + 1,
    estado,
    fechaHora: new Date().toISOString(),
    usuario: USUARIO_ARCHIVO_MOCK,
  })
}

// Listado operativo de la Estación de Archivo: todo expediente recibido ya
// existe físicamente, por lo que solo se devuelven registros con número de
// expediente. El registro sin expediente permanece en `expedientesMock` como
// infraestructura histórica para `crearExpedienteMock` y sus pruebas.
export function listarExpedientesMock({ fecha, clinicaId, medicoId } = {}) {
  return expedientesMock
    .filter((expediente) => Boolean(expediente.numeroExpediente))
    .filter((expediente) => !fecha || expediente.fechaCita === fecha)
    .filter((expediente) => !clinicaId || expediente.clinicaId === Number(clinicaId))
    .filter((expediente) => !medicoId || expediente.medicoId === Number(medicoId))
    .map(clonar)
}

export function obtenerExpedienteMock(id) {
  const expediente = expedientesMock.find((registro) => registro.id === Number(id))
  return expediente ? clonar(expediente) : null
}

// Simula al backend devolviendo el siguiente estado de la secuencia normal.
export function avanzarEstadoMock(id) {
  const expediente = expedientesMock.find((registro) => registro.id === Number(id))
  if (!expediente) {
    const error = new Error('Expediente no encontrado')
    error.status = 404
    throw error
  }
  if (expediente.estado === 'no_localizado') {
    const error = new Error('El expediente está marcado como no localizado')
    error.status = 409
    throw error
  }

  const indice = SECUENCIA_ESTADOS.indexOf(expediente.estado)
  if (indice === -1 || indice >= SECUENCIA_ESTADOS.length - 1) {
    const error = new Error('El expediente ya fue entregado')
    error.status = 409
    throw error
  }

  registrarCambio(expediente, SECUENCIA_ESTADOS[indice + 1])
  return clonar(expediente)
}

export function marcarNoLocalizadoMock(id) {
  const expediente = expedientesMock.find((registro) => registro.id === Number(id))
  if (!expediente) {
    const error = new Error('Expediente no encontrado')
    error.status = 404
    throw error
  }
  if (expediente.estado === 'no_localizado') {
    const error = new Error('El expediente ya está marcado como no localizado')
    error.status = 409
    throw error
  }

  registrarCambio(expediente, 'no_localizado')
  return clonar(expediente)
}

function normalizar(valor) {
  return String(valor ?? '')
    .replace(/[\s-]/g, '')
    .toLowerCase()
}

export function buscarExpedientePorCodigoMock(codigo) {
  const buscado = normalizar(codigo)
  if (!buscado) return null

  const expediente = expedientesMock.find((registro) =>
    [registro.codigo, registro.numeroExpediente, registro.pacienteDpi].some(
      (valor) => valor && normalizar(valor) === buscado,
    ),
  )
  return expediente ? clonar(expediente) : null
}

// Simula la creación del expediente físico de un paciente nuevo. Una vez
// creado, el expediente entra al flujo normal de trazabilidad en
// "pendiente_localizar".
export function crearExpedienteMock(pacienteId) {
  const expediente = expedientesMock.find((registro) => registro.pacienteId === Number(pacienteId))
  if (!expediente) {
    const error = new Error('Paciente sin cita para crear expediente')
    error.status = 404
    throw error
  }
  if (!expediente.expedienteNuevo && expediente.numeroExpediente) {
    const error = new Error('El paciente ya cuenta con expediente físico')
    error.status = 409
    throw error
  }

  const numeroExpediente = `EXP-${String(7000 + expediente.id).padStart(6, '0')}`
  expediente.numeroExpediente = numeroExpediente
  expediente.codigo = numeroExpediente
  expediente.expedienteNuevo = false
  expediente.estado = 'pendiente_localizar'
  expediente.historial = [
    {
      id: 1,
      estado: 'pendiente_localizar',
      fechaHora: new Date().toISOString(),
      usuario: USUARIO_ARCHIVO_MOCK,
    },
  ]

  return clonar(expediente)
}
