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
  'en_transito_entrega',
  'entregado',
  'en_transito_retorno',
  'archivado',
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

// Fixtures de prueba. Los valores `EXP-*` son DATOS DE EJEMPLO y NO representan
// un formato obligatorio ni un contrato: `numeroExpediente` es un identificador
// externo opaco que el backend no genera ni valida. Por eso se mezclan
// longitudes (EXP-2024-035 y EXP-2023-8941) para no asumir ningún patrón.
export const expedientesMock = [
  {
    id: 1,
    citaId: 101,
    pacienteId: 1,
    pacienteNombre: 'María Fernanda López García',
    pacienteDpi: '2456789010101',
    numeroExpediente: 'EXP-2024-035',
    codigo: 'EXP-2024-035',
    ubicacion: 'Estante A · Fila 3 · Caja 12',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    medicoId: 10,
    medicoNombre: 'Dr. Jorge Castillo',
    fechaCita: fechaRelativa(0),
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
    numeroExpediente: 'EXP-2024-002',
    codigo: 'EXP-2024-002',
    ubicacion: 'Estante B · Fila 1 · Caja 04',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    medicoId: 11,
    medicoNombre: 'Dra. Elena Marroquín',
    fechaCita: fechaRelativa(0),
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
    numeroExpediente: 'EXP-2024-016',
    codigo: 'EXP-2024-016',
    ubicacion: 'Estante C · Fila 2 · Caja 08',
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    medicoId: 12,
    medicoNombre: 'Dr. Ricardo Salazar',
    fechaCita: fechaRelativa(0),
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
    numeroExpediente: 'EXP-2023-8941',
    codigo: 'EXP-2023-8941',
    ubicacion: 'Estante D · Fila 4 · Caja 21',
    subespecialidadId: 4,
    subespecialidadNombre: 'Cardiología Clínica',
    medicoId: 13,
    medicoNombre: 'Dra. Patricia Núñez',
    fechaCita: fechaRelativa(0),
    horaEstimada: '08:30:00',
    estado: 'en_transito_entrega',
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
      {
        id: 4,
        estado: 'en_transito_entrega',
        fechaHora: marcaTiempo(1),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
    ],
  },
  {
    id: 5,
    citaId: 105,
    pacienteId: 5,
    pacienteNombre: 'Rosa Amelia Chávez de León',
    pacienteDpi: '1998877660101',
    numeroExpediente: 'EXP-2024-041',
    codigo: 'EXP-2024-041',
    ubicacion: 'Estante A · Fila 1 · Caja 02',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    medicoId: 10,
    medicoNombre: 'Dr. Jorge Castillo',
    fechaCita: fechaRelativa(0),
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
      {
        id: 4,
        estado: 'en_transito_entrega',
        fechaHora: marcaTiempo(3),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 5, estado: 'entregado', fechaHora: marcaTiempo(1), usuario: USUARIO_ARCHIVO_MOCK },
    ],
  },
  {
    id: 6,
    citaId: 106,
    pacienteId: 6,
    pacienteNombre: 'Luis Fernando Barrios Méndez',
    pacienteDpi: '2112233440101',
    numeroExpediente: 'EXP-2022-5412',
    codigo: 'EXP-2022-5412',
    ubicacion: 'Estante E · Fila 2 · Caja 15',
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    medicoId: 12,
    medicoNombre: 'Dr. Ricardo Salazar',
    fechaCita: fechaRelativa(0),
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
    subespecialidadId: 4,
    subespecialidadNombre: 'Cardiología Clínica',
    medicoId: 13,
    medicoNombre: 'Dra. Patricia Núñez',
    fechaCita: fechaRelativa(0),
    horaEstimada: '16:10:00',
    estado: 'pendiente_localizar',
    expedienteNuevo: true,
    historial: [],
  },
  // Fixture 8: expediente físico SIN ciclo. Demuestra el check-in desde la UI.
  {
    id: 8,
    citaId: 108,
    pacienteId: 8,
    pacienteNombre: 'Pedro Antonio Gutiérrez Solís',
    pacienteDpi: '2544332210101',
    numeroExpediente: 'EXP-2024-099',
    codigo: 'EXP-2024-099',
    ubicacion: 'Estante B · Fila 2 · Caja 07',
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    medicoId: 10,
    medicoNombre: 'Dr. Jorge Castillo',
    fechaCita: fechaRelativa(0),
    horaEstimada: '12:30:00',
    estado: 'pendiente_localizar',
    expedienteNuevo: false,
    historial: [],
  },
  // Fixture 9: ciclo en en_transito_retorno. Demuestra archivar desde la UI.
  {
    id: 9,
    citaId: 109,
    pacienteId: 9,
    pacienteNombre: 'Marta Lidia Hernández Ruiz',
    pacienteDpi: '2998877660101',
    numeroExpediente: 'EXP-2024-077',
    codigo: 'EXP-2024-077',
    ubicacion: 'Estante C · Fila 1 · Caja 03',
    subespecialidadId: 2,
    subespecialidadNombre: 'Pediatría General',
    medicoId: 12,
    medicoNombre: 'Dr. Ricardo Salazar',
    fechaCita: fechaRelativa(0),
    horaEstimada: '13:15:00',
    estado: 'en_transito_retorno',
    expedienteNuevo: false,
    historial: [
      {
        id: 1,
        estado: 'pendiente_localizar',
        fechaHora: marcaTiempo(7),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 2, estado: 'en_busqueda', fechaHora: marcaTiempo(6), usuario: USUARIO_ARCHIVO_MOCK },
      { id: 3, estado: 'localizado', fechaHora: marcaTiempo(5), usuario: USUARIO_ARCHIVO_MOCK },
      {
        id: 4,
        estado: 'en_transito_entrega',
        fechaHora: marcaTiempo(4),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
      { id: 5, estado: 'entregado', fechaHora: marcaTiempo(3), usuario: USUARIO_ARCHIVO_MOCK },
      {
        id: 6,
        estado: 'en_transito_retorno',
        fechaHora: marcaTiempo(1),
        usuario: USUARIO_ARCHIVO_MOCK,
      },
    ],
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
export function listarExpedientesMock({ fecha, subespecialidadId } = {}) {
  return expedientesMock
    .filter((expediente) => Boolean(expediente.numeroExpediente))
    .filter((expediente) => !fecha || expediente.fechaCita === fecha)
    .filter(
      (expediente) =>
        !subespecialidadId || expediente.subespecialidadId === Number(subespecialidadId),
    )
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

// El backend resuelve el código con un simple trim y compara exacto (UUID o
// número impreso). No se normaliza el valor: no se eliminan guiones ni espacios
// para fabricar coincidencias que el endpoint real no aceptaría.
export function buscarExpedientePorCodigoMock(codigo) {
  const buscado = String(codigo ?? '').trim()
  if (!buscado) return null

  const expediente = expedientesMock.find(
    (registro) => registro.codigo === buscado || registro.numeroExpediente === buscado,
  )
  return expediente ? clonar(expediente) : null
}

// Simula la creación del expediente físico de un paciente nuevo. El número de
// expediente es un identificador externo opaco: el frontend NO lo genera ni lo
// reformatea. Se reproduce el comportamiento del backend: se hereda el número
// que ya tenga el paciente y, si no existe, se falla (BusinessException).
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

  const numeroExpediente = expediente.numeroExpediente
  if (!numeroExpediente) {
    const error = new Error('El paciente no tiene un número de expediente asignado')
    error.status = 400
    throw error
  }

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

// ---------------------------------------------------------------------------
// Resumen operativo diario (contrato ResumenArchivoDTO). En modo mock se
// derivan los conteos de la jornada simulada actual para que no aparezcan solo
// ceros; el backend real es la fuente de verdad.
// ---------------------------------------------------------------------------
export function resumenArchivoMock(fecha) {
  const filas = expedientesMock.filter((expediente) => !fecha || expediente.fechaCita === fecha)
  const conteo = {
    pendiente_localizar: 0,
    en_busqueda: 0,
    localizado: 0,
    en_transito_entrega: 0,
    en_transito_retorno: 0,
    entregado: 0,
    archivado: 0,
    no_localizado: 0,
  }
  let expedientesNuevos = 0

  for (const expediente of filas) {
    if (!expediente.numeroExpediente) {
      expedientesNuevos += 1
      continue
    }
    const estado = estadoCicloMock[expediente.id] ?? 'pendiente_localizar'
    if (estado in conteo) conteo[estado] += 1
  }

  const totalCiclos = Object.values(conteo).reduce((total, valor) => total + valor, 0)

  return {
    fecha: fecha ?? null,
    totalCiclos,
    pendienteLocalizar: conteo.pendiente_localizar,
    enBusqueda: conteo.en_busqueda,
    localizado: conteo.localizado,
    enTransitoEntrega: conteo.en_transito_entrega,
    enTransitoRetorno: conteo.en_transito_retorno,
    entregado: conteo.entregado,
    archivado: conteo.archivado,
    noLocalizado: conteo.no_localizado,
    enTransito: conteo.en_transito_entrega + conteo.en_transito_retorno,
    expedientesNuevos,
  }
}

// ---------------------------------------------------------------------------
// Actas de recepción (contrato ActaRecepcionResponseDTO). El backend real es la
// fuente de verdad; este mock solo permite ejercitar el flujo de frontend.
// ---------------------------------------------------------------------------
const actasRecepcionMock = []
let contadorActasMock = 0

export function crearActaRecepcionMock(datos = {}) {
  const id = ++contadorActasMock
  const expedienteIds = datos.expedienteIds ?? []
  const acta = {
    id,
    numeroActa: `ACT-2026-${String(id).padStart(4, '0')}`,
    fecha: datos.fecha ?? null,
    subespecialidadId: datos.subespecialidadId ?? null,
    subespecialidadNombre: null,
    usuarioEntregaId: datos.usuarioEntregaId ?? null,
    usuarioEntregaNombre: USUARIO_ARCHIVO_MOCK,
    usuarioRecibeId: datos.usuarioRecibeId ?? null,
    usuarioRecibeNombre: null,
    observaciones: datos.observaciones ?? null,
    creadoPorNombre: USUARIO_ARCHIVO_MOCK,
    creadoEn: new Date().toISOString(),
    totalExpedientes: expedienteIds.length,
    detalles: [],
  }
  actasRecepcionMock.push(acta)
  return acta
}

export function obtenerActaRecepcionMock(id) {
  const acta = actasRecepcionMock.find((registro) => registro.id === Number(id))
  if (!acta) {
    const error = new Error('Acta de recepción no encontrada')
    error.status = 404
    throw error
  }
  return acta
}

// ---------------------------------------------------------------------------
// Jornada de archivo (contrato ExpedienteJornadaDTO). Refleja progresivamente
// el DTO real: una fila por cita con expedienteId/cicloId/estadoActual
// (o null/sin_ciclo cuando corresponde) y ubicacionBase.
// ---------------------------------------------------------------------------
// Estado mutable del ciclo por fixture. Lo comparten la jornada, el check-in y
// las transiciones para que el mock sea coherente. No incluye a los fixtures
// sin ciclo (7 sin expediente; 8 pendiente de check-in).
const estadoCicloMock = {
  1: 'pendiente_localizar',
  2: 'en_busqueda',
  3: 'localizado',
  4: 'en_transito_entrega',
  5: 'entregado',
  6: 'no_localizado',
  9: 'en_transito_retorno',
}

const UBICACIONES_MOCK = {
  1: { id: 1, pasillo: 'A', estante: '3', balda: '12', descripcion: null },
  2: { id: 2, pasillo: 'B', estante: '1', balda: '4', descripcion: null },
  3: { id: 3, pasillo: 'C', estante: '2', balda: '8', descripcion: null },
  4: { id: 4, pasillo: 'D', estante: '4', balda: '21', descripcion: null },
  5: { id: 5, pasillo: 'A', estante: '1', balda: '2', descripcion: null },
  6: { id: 6, pasillo: 'E', estante: '2', balda: '15', descripcion: null },
}

function uuidMock(bloque, id) {
  return `${bloque}-0000-4000-8000-${String(id).padStart(12, '0')}`
}

export function jornadaArchivoMock({ fecha, subespecialidadId } = {}) {
  return expedientesMock
    .filter((expediente) => !fecha || expediente.fechaCita === fecha)
    .filter(
      (expediente) =>
        !subespecialidadId || expediente.subespecialidadId === Number(subespecialidadId),
    )
    .map((expediente) => {
      const tieneExpediente = Boolean(expediente.numeroExpediente)
      const estadoCiclo = estadoCicloMock[expediente.id] ?? null
      return {
        citaId: expediente.citaId,
        horaEstimada: expediente.horaEstimada,
        pacienteId: expediente.pacienteId,
        pacienteNombre: expediente.pacienteNombre,
        dpi: expediente.pacienteDpi,
        numeroExpediente: expediente.numeroExpediente,
        expedienteId: tieneExpediente ? uuidMock('10000000', expediente.id) : null,
        subespecialidadId: expediente.subespecialidadId,
        subespecialidadNombre: expediente.subespecialidadNombre,
        cicloId: tieneExpediente && estadoCiclo ? uuidMock('20000000', expediente.id) : null,
        estadoActual: tieneExpediente && estadoCiclo ? estadoCiclo : 'sin_ciclo',
        ubicacionBase: UBICACIONES_MOCK[expediente.id] ?? null,
      }
    })
}

// ---------------------------------------------------------------------------
// Ciclo real del expediente (contrato ExpedienteCicloResponseDTO): check-in,
// consulta por cita y transiciones de Archivo. El mock respeta el rol `archivo`
// (o `administrador`), la idempotencia del check-in y las transiciones válidas.
// ---------------------------------------------------------------------------
const ROLES_ARCHIVO_MOCK = ['archivo', 'administrador']

function rolEfectivoMock() {
  try {
    const usuario = JSON.parse(localStorage.getItem('hro_usuario') || 'null')
    return usuario?.rol ?? null
  } catch {
    return null
  }
}

function exigirRolArchivoMock() {
  if (!ROLES_ARCHIVO_MOCK.includes(rolEfectivoMock())) {
    const error = new Error('El rol no está autorizado para ejecutar la acción de Archivo')
    error.status = 403
    throw error
  }
}

function errorMock(mensaje, status) {
  const error = new Error(mensaje)
  error.status = status
  return error
}

// Fixtures del ciclo: los mismos expedientes de la jornada (8 sin ciclo y 9 en
// retorno permiten recorrer todo el flujo desde la UI).
const CICLOS_FIXTURES_MOCK = expedientesMock

function fixturePorExpedienteId(expedienteId) {
  return CICLOS_FIXTURES_MOCK.find(
    (expediente) => uuidMock('10000000', expediente.id) === expedienteId,
  )
}

function fixturePorCicloId(cicloId) {
  return CICLOS_FIXTURES_MOCK.find((expediente) => uuidMock('20000000', expediente.id) === cicloId)
}

// cita asociada al ciclo; el check-in puede fijar otra cita explícitamente.
const citaCicloMock = {}

function dtoCicloMock(fixture) {
  const estado = estadoCicloMock[fixture.id]
  if (!estado) return null
  return {
    id: uuidMock('20000000', fixture.id),
    expedienteId: uuidMock('10000000', fixture.id),
    numeroExpediente: fixture.numeroExpediente,
    paciente: {
      id: fixture.pacienteId,
      nombres: fixture.pacienteNombre,
      apellidos: '',
      dpi: fixture.pacienteDpi,
    },
    citaId: citaCicloMock[fixture.id] ?? fixture.citaId,
    estadoActual: estado,
    version: 0,
    creadoEn: marcaTiempo(4),
    actualizadoEn: marcaTiempo(1),
    movimientos: [
      {
        id: 1,
        estadoAnterior: null,
        estadoNuevo: estado,
        ubicacionOrigen: null,
        ubicacionDestino: null,
        usuarioId: 1,
        usuarioNombre: USUARIO_ARCHIVO_MOCK,
        observacion: null,
        fechaMovimiento: marcaTiempo(4),
      },
    ],
  }
}

export function checkInExpedienteMock(expedienteId, datos = {}) {
  exigirRolArchivoMock()
  const fixture = fixturePorExpedienteId(expedienteId)
  if (!fixture) throw errorMock('Expediente no encontrado', 404)

  if (datos.citaId != null) citaCicloMock[fixture.id] = datos.citaId

  // Idempotente: si la cita ya tiene ciclo, se devuelve sin duplicarlo.
  if (estadoCicloMock[fixture.id]) return dtoCicloMock(fixture)

  estadoCicloMock[fixture.id] = 'en_busqueda'
  return dtoCicloMock(fixture)
}

export function obtenerCicloPorCitaMock(citaId) {
  const fixture = CICLOS_FIXTURES_MOCK.find(
    (expediente) => (citaCicloMock[expediente.id] ?? expediente.citaId) === Number(citaId),
  )
  const dto = fixture ? dtoCicloMock(fixture) : null
  if (!dto) throw errorMock('La cita no tiene ciclo de expediente asociado', 404)
  return dto
}

const ORIGEN_TRANSICION_MOCK = {
  'iniciar-busqueda': 'pendiente_localizar',
  localizar: 'en_busqueda',
  despachar: 'localizado',
  archivar: 'en_transito_retorno',
  'reintentar-busqueda': 'no_localizado',
}

const DESTINO_TRANSICION_MOCK = {
  'iniciar-busqueda': 'en_busqueda',
  localizar: 'localizado',
  despachar: 'en_transito_entrega',
  archivar: 'archivado',
  'reintentar-busqueda': 'en_busqueda',
}

export function transicionCicloMock(cicloId, accion, datos = {}) {
  exigirRolArchivoMock()
  const fixture = fixturePorCicloId(cicloId)
  if (!fixture || !estadoCicloMock[fixture.id])
    throw errorMock('Ciclo de expediente no encontrado', 404)

  const estadoActual = estadoCicloMock[fixture.id]

  if (accion === 'no-localizado') {
    if (estadoActual === 'archivado' || estadoActual === 'no_localizado') {
      throw errorMock(
        `No se puede marcar 'no_localizado' un ciclo en estado '${estadoActual}'`,
        400,
      )
    }
    if (!datos.observacion || !String(datos.observacion).trim()) {
      throw errorMock(
        "Debe indicar una observación al marcar el expediente como 'no_localizado'",
        400,
      )
    }
    estadoCicloMock[fixture.id] = 'no_localizado'
    return dtoCicloMock(fixture)
  }

  const origenEsperado = ORIGEN_TRANSICION_MOCK[accion]
  if (!origenEsperado || origenEsperado !== estadoActual) {
    throw errorMock(
      `Transición inválida: no se puede ejecutar '${accion}' desde el estado '${estadoActual}'`,
      400,
    )
  }

  estadoCicloMock[fixture.id] = DESTINO_TRANSICION_MOCK[accion]
  return dtoCicloMock(fixture)
}
