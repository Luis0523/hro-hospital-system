// Datos provisionales para desarrollo frontend.
// La estructura replica los DTO confirmados del backend y no constituye una fuente de datos real.
//
// Contratos replicados (backend vigente):
//   EspecialidadResponseDTO    { id: Long, nombre, activo, creadoEn }
//   SubespecialidadResponseDTO { id: Long, especialidadId: Long, especialidadNombre, nombre, activo, creadoEn }
//   EspacioFisicoResponseDTO   { id: UUID, numero, nivel: Short, capacidadCamillas, coordenadasPlano, nombre, ubicacion, activo, creadoEn }
//
// Los endpoints de listado del backend devuelven únicamente registros activos.

import { aMinutos, nombreDia, normalizarHora } from '../utils/dias.js'
import { hoyISO, restarDiasISO } from '../utils/fechas.js'

const creadoEnBase = '2026-01-05T08:00:00-06:00'

const ESPECIALIDADES_BASE = [
  { id: 1, nombre: 'Medicina Interna', activo: true, creadoEn: creadoEnBase },
  { id: 2, nombre: 'Pediatría', activo: true, creadoEn: creadoEnBase },
  { id: 3, nombre: 'Ginecología y Obstetricia', activo: true, creadoEn: creadoEnBase },
  { id: 4, nombre: 'Cirugía General', activo: true, creadoEn: creadoEnBase },
  { id: 5, nombre: 'Traumatología y Ortopedia', activo: true, creadoEn: creadoEnBase },
  { id: 6, nombre: 'Cardiología', activo: true, creadoEn: creadoEnBase },
  { id: 7, nombre: 'Dermatología', activo: false, creadoEn: creadoEnBase },
]

const SUBESPECIALIDADES_BASE = [
  { id: 1, especialidadId: 1, nombre: 'Medicina General', activo: true, creadoEn: creadoEnBase },
  { id: 2, especialidadId: 6, nombre: 'Cardiología Clínica', activo: true, creadoEn: creadoEnBase },
  { id: 3, especialidadId: 2, nombre: 'Pediatría General', activo: true, creadoEn: creadoEnBase },
  {
    id: 4,
    especialidadId: 2,
    nombre: 'Control de Niño Sano',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: 5,
    especialidadId: 2,
    nombre: 'Pediatría Especializada',
    activo: true,
    creadoEn: creadoEnBase,
  },
  { id: 6, especialidadId: 3, nombre: 'Ginecología General', activo: true, creadoEn: creadoEnBase },
  { id: 7, especialidadId: 4, nombre: 'Cirugía General', activo: true, creadoEn: creadoEnBase },
  {
    id: 8,
    especialidadId: 5,
    nombre: 'Traumatología General',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: 9,
    especialidadId: 2,
    nombre: 'Alergología Pediátrica',
    activo: false,
    creadoEn: creadoEnBase,
  },
  {
    id: 10,
    especialidadId: 7,
    nombre: 'Dermatología Pediátrica',
    activo: false,
    creadoEn: creadoEnBase,
  },
]

const ESPACIOS_FISICOS_BASE = [
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000001',
    numero: '101',
    nivel: 1,
    capacidadCamillas: 1,
    coordenadasPlano: '{"zona":"A-101"}',
    nombre: 'Sala 101',
    ubicacion: 'Edificio Consulta Externa, Nivel 1',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000002',
    numero: '102',
    nivel: 1,
    capacidadCamillas: 1,
    coordenadasPlano: null,
    nombre: 'Sala 102',
    ubicacion: 'Edificio Consulta Externa, Nivel 1',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000003',
    numero: '201',
    nivel: 2,
    capacidadCamillas: 1,
    coordenadasPlano: null,
    nombre: 'Sala 201',
    ubicacion: 'Edificio Consulta Externa, Nivel 2',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000004',
    numero: '203',
    nivel: 2,
    capacidadCamillas: 2,
    coordenadasPlano: null,
    nombre: 'Sala 203',
    ubicacion: 'Edificio Consulta Externa, Nivel 2',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000005',
    numero: '204',
    nivel: 2,
    capacidadCamillas: 1,
    coordenadasPlano: null,
    nombre: 'Sala 204',
    ubicacion: 'Edificio Consulta Externa, Nivel 2',
    activo: false,
    creadoEn: creadoEnBase,
  },
]

// MedicoResponseDTO { id: UUID, nombres, numeroColegiado, usuarioReferenciaId: Long, activo, creadoEn }
const MEDICOS_BASE = [
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000101',
    nombres: 'Dr. Carlos Méndez',
    numeroColegiado: 'COL-10021',
    usuarioReferenciaId: 5,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000102',
    nombres: 'Dra. Sofía Reyes',
    numeroColegiado: 'COL-10022',
    usuarioReferenciaId: null,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000103',
    nombres: 'Dra. Carmen Fuentes',
    numeroColegiado: 'COL-12890',
    usuarioReferenciaId: null,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000104',
    nombres: 'Dr. Óscar Ramírez',
    numeroColegiado: 'COL-10023',
    usuarioReferenciaId: null,
    activo: false,
    creadoEn: creadoEnBase,
  },
]

// MedicoSubespecialidadResponseDTO (campos derivados se completan al listar).
const MEDICO_SUBESPECIALIDADES_BASE = [
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000201',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000101',
    subespecialidadId: 1,
    diaSemana: 1,
    horaInicio: '07:00:00',
    horaFin: '13:00:00',
    capacidadMaxima: 12,
    duracionConsultaMinutos: 30,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000202',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000101',
    subespecialidadId: 2,
    diaSemana: 2,
    horaInicio: '08:00:00',
    horaFin: '12:00:00',
    capacidadMaxima: 8,
    duracionConsultaMinutos: 30,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000203',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000102',
    subespecialidadId: 3,
    diaSemana: 4,
    horaInicio: '07:30:00',
    horaFin: '11:30:00',
    capacidadMaxima: 10,
    duracionConsultaMinutos: 25,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000204',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000103',
    subespecialidadId: 4,
    diaSemana: 1,
    horaInicio: '14:00:00',
    horaFin: '16:00:00',
    capacidadMaxima: 4,
    duracionConsultaMinutos: 30,
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000205',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000104',
    subespecialidadId: 1,
    diaSemana: 3,
    horaInicio: '08:00:00',
    horaFin: '12:00:00',
    capacidadMaxima: 8,
    duracionConsultaMinutos: 30,
    activo: false,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000206',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000101',
    subespecialidadId: 9,
    diaSemana: 5,
    horaInicio: '08:00:00',
    horaFin: '11:00:00',
    capacidadMaxima: 5,
    duracionConsultaMinutos: 30,
    activo: false,
    creadoEn: creadoEnBase,
  },
  {
    id: '6f0d3a2c-1a11-4d21-9c01-000000000207',
    medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000102',
    subespecialidadId: 3,
    diaSemana: 2,
    horaInicio: '09:00:00',
    horaFin: '12:00:00',
    capacidadMaxima: 6,
    duracionConsultaMinutos: 30,
    activo: false,
    creadoEn: creadoEnBase,
  },
]

// DiaNoLaborableResponseDTO { id: Long, fecha: LocalDate, motivo, creadoPorId: Long,
//   creadoPorNombre, creadoEn: OffsetDateTime }
// Réplica del backend vigente: POST valida fecha duplicada y citas activas; DELETE
// es borrado físico. El backend simulado no inventa force, update ni campo activo.
const DIAS_NO_LABORABLES_BASE = [
  {
    id: 1,
    fecha: '2025-12-25',
    motivo: 'Fiesta de Navidad',
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: '2026-01-05T08:00:00-06:00',
  },
  {
    id: 2,
    fecha: '2026-09-15',
    motivo: 'Día de la Independencia Patria',
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: '2026-01-05T08:00:00-06:00',
  },
  {
    id: 3,
    fecha: '2026-10-20',
    motivo: 'Día de la Revolución de Octubre',
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: '2026-01-05T08:00:00-06:00',
  },
  {
    id: 4,
    fecha: '2026-11-01',
    motivo: 'Día de Todos los Santos',
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: '2026-01-05T08:00:00-06:00',
  },
  {
    id: 5,
    fecha: '2026-12-25',
    motivo: 'Fiesta de Navidad',
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: '2026-01-05T08:00:00-06:00',
  },
]

// Simulación exclusiva de pruebas: fechas con citas activas que el backend real
// detectaría vía CitaRepository.contarCitasActivasEnFecha (estado distinto de
// cancelada/reprogramada). No es una regla del frontend.
const CITAS_ACTIVAS_POR_FECHA_MOCK = {
  '2026-09-20': [
    {
      id: 9001,
      horaEstimada: '08:30:00',
      estado: 'confirmada',
      pacienteId: 'a1b2c3d4-0000-4000-8000-000000009001',
      pacienteNombre: 'Juan López',
      medicoNombre: 'Dr. Carlos Méndez',
      subespecialidadNombre: 'Medicina General',
    },
  ],
}

const clonar = (valor) => JSON.parse(JSON.stringify(valor))

export const especialidadesMock = clonar(ESPECIALIDADES_BASE)
export const subespecialidadesMock = clonar(SUBESPECIALIDADES_BASE)
export const espaciosFisicosMock = clonar(ESPACIOS_FISICOS_BASE)
export const medicosMock = clonar(MEDICOS_BASE)
export const medicoSubespecialidadesMock = clonar(MEDICO_SUBESPECIALIDADES_BASE)
export const diasNoLaborablesMock = clonar(DIAS_NO_LABORABLES_BASE)

let contadorIdEspecialidad = ESPECIALIDADES_BASE.length
let contadorIdSubespecialidad = SUBESPECIALIDADES_BASE.length
let contadorUuid = ESPACIOS_FISICOS_BASE.length
let contadorIdDiaNoLaborable = DIAS_NO_LABORABLES_BASE.length

function errorBackend(mensaje, status = 400) {
  const error = new Error(mensaje)
  error.status = status
  return error
}

// Error enriquecido con `codigo`/`data`, replicando ApiResponse del backend
// (BusinessException/ConflictException) para consumidores en modo mock.
function errorCodigo(mensaje, { status = 400, codigo = null, data = null } = {}) {
  const error = new Error(mensaje)
  error.status = status
  error.codigo = codigo
  error.data = data
  return error
}

function generarUuidMock() {
  contadorUuid += 1
  const sufijo = contadorUuid.toString(16).padStart(12, '0')
  return `6f0d3a2c-1a11-4d21-9c01-${sufijo}`
}

function nombreEspecialidad(especialidadId) {
  return especialidadesMock.find((item) => item.id === especialidadId)?.nombre ?? ''
}

function conEspecialidad(subespecialidad) {
  return {
    ...subespecialidad,
    especialidadNombre: nombreEspecialidad(subespecialidad.especialidadId),
  }
}

export function reiniciarCatalogosMock() {
  especialidadesMock.splice(0, especialidadesMock.length, ...clonar(ESPECIALIDADES_BASE))
  subespecialidadesMock.splice(0, subespecialidadesMock.length, ...clonar(SUBESPECIALIDADES_BASE))
  espaciosFisicosMock.splice(0, espaciosFisicosMock.length, ...clonar(ESPACIOS_FISICOS_BASE))
  medicosMock.splice(0, medicosMock.length, ...clonar(MEDICOS_BASE))
  medicoSubespecialidadesMock.splice(
    0,
    medicoSubespecialidadesMock.length,
    ...clonar(MEDICO_SUBESPECIALIDADES_BASE),
  )
  diasNoLaborablesMock.splice(0, diasNoLaborablesMock.length, ...clonar(DIAS_NO_LABORABLES_BASE))
  usuariosMock.splice(0, usuariosMock.length, ...clonar(USUARIOS_BASE))
  permisosSubespecialidadMock.splice(
    0,
    permisosSubespecialidadMock.length,
    ...clonar(PERMISOS_SUBESPECIALIDAD_BASE),
  )
  contadorIdEspecialidad = ESPECIALIDADES_BASE.length
  contadorIdSubespecialidad = SUBESPECIALIDADES_BASE.length
  contadorUuid = ESPACIOS_FISICOS_BASE.length
  contadorIdDiaNoLaborable = DIAS_NO_LABORABLES_BASE.length
  contadorIdPermiso = PERMISOS_SUBESPECIALIDAD_BASE.length
}

// ---------------------------------------------------------------------------
// Filtro de estado — réplica de EstadoFiltro del backend
// Valores: activos (por defecto) | inactivos | todos
// ---------------------------------------------------------------------------

function filtrarPorEstado(lista, estado = 'activos') {
  if (estado === 'todos') return lista
  if (estado === 'inactivos') return lista.filter((item) => !item.activo)
  return lista.filter((item) => item.activo)
}

// ---------------------------------------------------------------------------
// Especialidades
// ---------------------------------------------------------------------------

export function listarEspecialidadesMock(estado) {
  return filtrarPorEstado(especialidadesMock, estado)
}

export function crearEspecialidadMock({ nombre }) {
  const duplicada = especialidadesMock.some(
    (item) => item.nombre.toLowerCase() === nombre.toLowerCase(),
  )
  if (duplicada) {
    throw errorBackend(`Ya existe una especialidad con el nombre: ${nombre}`)
  }
  contadorIdEspecialidad += 1
  const nueva = {
    id: contadorIdEspecialidad,
    nombre,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  especialidadesMock.push(nueva)
  return nueva
}

export function actualizarEspecialidadMock(id, { nombre }) {
  const especialidad = especialidadesMock.find((item) => item.id === id)
  if (!especialidad) {
    throw errorBackend(`No se encontró la especialidad con ID ${id}`, 404)
  }
  const duplicada = especialidadesMock.some(
    (item) => item.id !== id && item.nombre.toLowerCase() === nombre.toLowerCase(),
  )
  if (duplicada) {
    throw errorBackend(`Ya existe otra especialidad con el nombre: ${nombre}`)
  }
  especialidad.nombre = nombre
  return especialidad
}

export function desactivarEspecialidadMock(id) {
  const especialidad = especialidadesMock.find((item) => item.id === id)
  if (!especialidad) {
    throw errorBackend(`No se encontró la especialidad con ID ${id}`, 404)
  }
  especialidad.activo = false
  return especialidad
}

export function reactivarEspecialidadMock(id) {
  const especialidad = especialidadesMock.find((item) => item.id === id)
  if (!especialidad) {
    throw errorBackend(`No se encontró la especialidad con ID ${id}`, 404)
  }
  especialidad.activo = true
  return especialidad
}

// ---------------------------------------------------------------------------
// Subespecialidades
// ---------------------------------------------------------------------------

export function listarSubespecialidadesMock(especialidadId, estado) {
  return filtrarPorEstado(subespecialidadesMock, estado)
    .filter((item) => (especialidadId ? item.especialidadId === especialidadId : true))
    .map(conEspecialidad)
}

export function crearSubespecialidadMock({ especialidadId, nombre }) {
  if (!especialidadesMock.some((item) => item.id === especialidadId)) {
    throw errorBackend(`No se encontró la especialidad con ID ${especialidadId}`, 404)
  }
  const duplicada = subespecialidadesMock.some(
    (item) =>
      item.especialidadId === especialidadId && item.nombre.toLowerCase() === nombre.toLowerCase(),
  )
  if (duplicada) {
    throw errorBackend(
      `Ya existe la subespecialidad '${nombre}' para la especialidad '${nombreEspecialidad(especialidadId)}'`,
    )
  }
  contadorIdSubespecialidad += 1
  const nueva = {
    id: contadorIdSubespecialidad,
    especialidadId,
    nombre,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  subespecialidadesMock.push(nueva)
  return conEspecialidad(nueva)
}

export function actualizarSubespecialidadMock(id, { especialidadId, nombre }) {
  const subespecialidad = subespecialidadesMock.find((item) => item.id === id)
  if (!subespecialidad) {
    throw errorBackend(`No se encontró la subespecialidad con ID ${id}`, 404)
  }
  if (!especialidadesMock.some((item) => item.id === especialidadId)) {
    throw errorBackend(`No se encontró la especialidad con ID ${especialidadId}`, 404)
  }
  const duplicada = subespecialidadesMock.some(
    (item) =>
      item.id !== id &&
      item.especialidadId === especialidadId &&
      item.nombre.toLowerCase() === nombre.toLowerCase(),
  )
  if (duplicada) {
    throw errorBackend(
      `Ya existe otra subespecialidad con el nombre '${nombre}' en esta especialidad`,
    )
  }
  subespecialidad.especialidadId = especialidadId
  subespecialidad.nombre = nombre
  return conEspecialidad(subespecialidad)
}

export function desactivarSubespecialidadMock(id) {
  const subespecialidad = subespecialidadesMock.find((item) => item.id === id)
  if (!subespecialidad) {
    throw errorBackend(`No se encontró la subespecialidad con ID ${id}`, 404)
  }
  subespecialidad.activo = false
  return conEspecialidad(subespecialidad)
}

export function reactivarSubespecialidadMock(id) {
  const subespecialidad = subespecialidadesMock.find((item) => item.id === id)
  if (!subespecialidad) {
    throw errorBackend(`No se encontró la subespecialidad con ID ${id}`, 404)
  }
  const especialidadPadre = especialidadesMock.find(
    (item) => item.id === subespecialidad.especialidadId,
  )
  if (!especialidadPadre || !especialidadPadre.activo) {
    throw errorBackend(
      'No se puede reactivar la subespecialidad porque su especialidad padre está inactiva',
      400,
    )
  }
  subespecialidad.activo = true
  return conEspecialidad(subespecialidad)
}

// ---------------------------------------------------------------------------
// Espacios físicos
// ---------------------------------------------------------------------------

export function listarEspaciosFisicosMock(nivel, estado) {
  return filtrarPorEstado(espaciosFisicosMock, estado).filter((item) =>
    nivel ? item.nivel === Number(nivel) : true,
  )
}

export function crearEspacioFisicoMock({
  numero,
  nivel,
  capacidadCamillas = 1,
  coordenadasPlano = null,
  nombre,
  ubicacion = null,
}) {
  const duplicado = espaciosFisicosMock.some((item) => item.numero === numero)
  if (duplicado) {
    throw errorBackend(`Ya existe un espacio físico con el número ${numero}`)
  }
  const nuevo = {
    id: generarUuidMock(),
    numero,
    nivel,
    capacidadCamillas,
    coordenadasPlano,
    nombre,
    ubicacion,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  espaciosFisicosMock.push(nuevo)
  return nuevo
}

export function actualizarEspacioFisicoMock(id, datos) {
  const espacio = espaciosFisicosMock.find((item) => item.id === id)
  if (!espacio) {
    throw errorBackend(`No se encontró el espacio físico con ID ${id}`, 404)
  }
  const duplicado = espaciosFisicosMock.some(
    (item) => item.id !== id && item.numero === datos.numero,
  )
  if (duplicado) {
    throw errorBackend(`Ya existe un espacio físico con el número ${datos.numero}`)
  }
  Object.assign(espacio, datos)
  return espacio
}

export function desactivarEspacioFisicoMock(id) {
  const espacio = espaciosFisicosMock.find((item) => item.id === id)
  if (!espacio) {
    throw errorBackend(`No se encontró el espacio físico con ID ${id}`, 404)
  }
  espacio.activo = false
  return espacio
}

export function reactivarEspacioFisicoMock(id) {
  const espacio = espaciosFisicosMock.find((item) => item.id === id)
  if (!espacio) {
    throw errorBackend(`No se encontró el espacio físico con ID ${id}`, 404)
  }
  espacio.activo = true
  return espacio
}

// ---------------------------------------------------------------------------
// Médicos
// ---------------------------------------------------------------------------

export function listarMedicosMock(estado) {
  return filtrarPorEstado(medicosMock, estado)
}

export function crearMedicoMock({ nombres, numeroColegiado, usuarioReferenciaId = null }) {
  const nombreLimpio = String(nombres).trim()
  const colegiadoLimpio = String(numeroColegiado).trim()
  if (medicosMock.some((item) => item.numeroColegiado === colegiadoLimpio)) {
    throw errorBackend(
      `Ya existe un médico registrado con el número de colegiado: ${colegiadoLimpio}`,
    )
  }
  const nuevo = {
    id: generarUuidMock(),
    nombres: nombreLimpio,
    numeroColegiado: colegiadoLimpio,
    usuarioReferenciaId,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  medicosMock.push(nuevo)
  return nuevo
}

export function actualizarMedicoMock(
  id,
  { nombres, numeroColegiado, usuarioReferenciaId, activo },
) {
  const medico = medicosMock.find((item) => item.id === id)
  if (!medico) {
    throw errorBackend(`No se encontró el médico con ID ${id}`, 404)
  }
  const colegiadoLimpio = String(numeroColegiado).trim()
  if (medicosMock.some((item) => item.id !== id && item.numeroColegiado === colegiadoLimpio)) {
    throw errorBackend(`Ya existe otro médico registrado con el colegiado: ${colegiadoLimpio}`)
  }
  medico.nombres = String(nombres).trim()
  medico.numeroColegiado = colegiadoLimpio
  if (usuarioReferenciaId !== undefined) {
    medico.usuarioReferenciaId = usuarioReferenciaId
  }
  if (activo !== undefined) {
    medico.activo = activo
  }
  return medico
}

export function desactivarMedicoMock(id) {
  const medico = medicosMock.find((item) => item.id === id)
  if (!medico) {
    throw errorBackend(`No se encontró el médico con ID ${id}`, 404)
  }
  medico.activo = false
  return medico
}

export function reactivarMedicoMock(id) {
  const medico = medicosMock.find((item) => item.id === id)
  if (!medico) {
    throw errorBackend(`No se encontró el médico con ID ${id}`, 404)
  }
  medico.activo = true
  return medico
}

// ---------------------------------------------------------------------------
// Programación médico-subespecialidad
// ---------------------------------------------------------------------------

function enriquecerProgramacion(programacion) {
  const medico = medicosMock.find((item) => item.id === programacion.medicoId)
  const subespecialidad = subespecialidadesMock.find(
    (item) => item.id === programacion.subespecialidadId,
  )
  const especialidad = especialidadesMock.find(
    (item) => item.id === subespecialidad?.especialidadId,
  )
  return {
    ...programacion,
    medicoNombre: medico?.nombres ?? '',
    numeroColegiado: medico?.numeroColegiado ?? '',
    subespecialidadNombre: subespecialidad?.nombre ?? '',
    especialidadId: especialidad?.id ?? null,
    especialidadNombre: especialidad?.nombre ?? '',
    diaSemanaNombre: nombreDia(programacion.diaSemana),
  }
}

function validarSolapamientoMock(medicoId, diaSemana, horaInicio, horaFin, idExcluido = null) {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  const solapa = medicoSubespecialidadesMock.some(
    (ms) =>
      ms.activo &&
      ms.medicoId === medicoId &&
      ms.diaSemana === Number(diaSemana) &&
      ms.id !== idExcluido &&
      aMinutos(ms.horaInicio) < fin &&
      inicio < aMinutos(ms.horaFin),
  )
  if (solapa) {
    throw errorBackend(
      `El médico ya tiene una programación activa que se superpone el ${nombreDia(diaSemana)} en el horario indicado.`,
    )
  }
}

export function listarProgramacionesMock({ medicoId, subespecialidadId, diaSemana, estado } = {}) {
  return filtrarPorEstado(medicoSubespecialidadesMock, estado)
    .filter((item) => (medicoId ? item.medicoId === medicoId : true))
    .filter((item) =>
      subespecialidadId ? item.subespecialidadId === Number(subespecialidadId) : true,
    )
    .filter((item) => (diaSemana ? item.diaSemana === Number(diaSemana) : true))
    .map(enriquecerProgramacion)
}

export function listarProgramacionesPorMedicoMock(medicoId) {
  return medicoSubespecialidadesMock
    .filter((item) => item.activo && item.medicoId === medicoId)
    .map(enriquecerProgramacion)
}

export function listarProgramacionesPorSubespecialidadMock(subespecialidadId) {
  return medicoSubespecialidadesMock
    .filter((item) => item.activo && item.subespecialidadId === Number(subespecialidadId))
    .map(enriquecerProgramacion)
}

export function crearProgramacionMock(dto) {
  const inicio = aMinutos(dto.horaInicio)
  const fin = aMinutos(dto.horaFin)
  if (!(fin > inicio)) {
    throw errorBackend('La hora de fin debe ser posterior a la hora de inicio')
  }

  const duracion = dto.duracionConsultaMinutos != null ? Number(dto.duracionConsultaMinutos) : 35
  const capacidad = Number(dto.capacidadMaxima)
  const minutosJornada = fin - inicio
  const minutosRequeridos = capacidad * duracion
  if (minutosRequeridos > minutosJornada) {
    throw errorBackend(
      `La capacidad configurada no cabe en la jornada: ${capacidad} pacientes x ${duracion} min = ${minutosRequeridos} min, pero el horario ${dto.horaInicio}-${dto.horaFin} solo dispone de ${minutosJornada} min.`,
    )
  }

  if (!medicosMock.some((item) => item.id === dto.medicoId)) {
    throw errorBackend(`No se encontró el médico con ID ${dto.medicoId}`, 404)
  }

  const medico = medicosMock.find((item) => item.id === dto.medicoId)
  if (medico && !medico.activo) {
    throw errorBackend(`El médico ${medico.nombres} está inactivo.`)
  }

  const subespecialidad = subespecialidadesMock.find(
    (item) => item.id === Number(dto.subespecialidadId),
  )
  if (!subespecialidad) {
    throw errorBackend(`No se encontró la subespecialidad con ID ${dto.subespecialidadId}`, 404)
  }
  if (!subespecialidad.activo) {
    throw errorBackend(`La subespecialidad ${subespecialidad.nombre} está inactiva.`)
  }

  const diaSemana = Number(dto.diaSemana)
  const duplicada = medicoSubespecialidadesMock.some(
    (item) =>
      item.medicoId === dto.medicoId &&
      item.subespecialidadId === Number(dto.subespecialidadId) &&
      item.diaSemana === diaSemana,
  )
  if (duplicada) {
    throw errorBackend(
      `El médico ya tiene asignado un horario en esta subespecialidad para el día ${nombreDia(diaSemana)}`,
    )
  }

  validarSolapamientoMock(dto.medicoId, diaSemana, dto.horaInicio, dto.horaFin)

  const nueva = {
    id: generarUuidMock(),
    medicoId: dto.medicoId,
    subespecialidadId: Number(dto.subespecialidadId),
    diaSemana,
    horaInicio: normalizarHora(dto.horaInicio),
    horaFin: normalizarHora(dto.horaFin),
    capacidadMaxima: capacidad,
    duracionConsultaMinutos: duracion,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  medicoSubespecialidadesMock.push(nueva)
  return enriquecerProgramacion(nueva)
}

export function desactivarProgramacionMock(id) {
  const programacion = medicoSubespecialidadesMock.find((item) => item.id === id)
  if (!programacion) {
    throw errorBackend(`No se encontró la programación con ID ${id}`, 404)
  }
  programacion.activo = false
  return enriquecerProgramacion(programacion)
}

export function actualizarProgramacionMock(id, dto) {
  const programacion = medicoSubespecialidadesMock.find((item) => item.id === id)
  if (!programacion) {
    throw errorBackend(`No se encontró la programación con ID ${id}`, 404)
  }

  const inicio = aMinutos(dto.horaInicio)
  const fin = aMinutos(dto.horaFin)
  if (!(fin > inicio)) {
    throw errorBackend('La hora de fin debe ser posterior a la hora de inicio')
  }

  const duracion =
    dto.duracionConsultaMinutos != null
      ? Number(dto.duracionConsultaMinutos)
      : programacion.duracionConsultaMinutos
  const capacidad = Number(dto.capacidadMaxima)
  const minutosJornada = fin - inicio
  const minutosRequeridos = capacidad * duracion
  if (minutosRequeridos > minutosJornada) {
    throw errorBackend(
      `La capacidad configurada no cabe en la jornada: ${capacidad} pacientes x ${duracion} min = ${minutosRequeridos} min, pero el horario ${dto.horaInicio}-${dto.horaFin} solo dispone de ${minutosJornada} min.`,
    )
  }

  validarSolapamientoMock(
    programacion.medicoId,
    programacion.diaSemana,
    dto.horaInicio,
    dto.horaFin,
    id,
  )

  programacion.horaInicio = normalizarHora(dto.horaInicio)
  programacion.horaFin = normalizarHora(dto.horaFin)
  programacion.capacidadMaxima = capacidad
  programacion.duracionConsultaMinutos = duracion
  return enriquecerProgramacion(programacion)
}

export function reactivarProgramacionMock(id) {
  const programacion = medicoSubespecialidadesMock.find((item) => item.id === id)
  if (!programacion) {
    throw errorBackend(`No se encontró la programación con ID ${id}`, 404)
  }
  if (programacion.activo) {
    return enriquecerProgramacion(programacion)
  }

  const medico = medicosMock.find((item) => item.id === programacion.medicoId)
  if (!medico || !medico.activo) {
    throw errorBackend(`No se puede reactivar: el médico ${medico?.nombres ?? ''} está inactivo.`)
  }

  const subespecialidad = subespecialidadesMock.find(
    (item) => item.id === programacion.subespecialidadId,
  )
  if (!subespecialidad || !subespecialidad.activo) {
    throw errorBackend(
      `No se puede reactivar: la subespecialidad ${subespecialidad?.nombre ?? ''} está inactiva.`,
    )
  }

  validarSolapamientoMock(
    programacion.medicoId,
    programacion.diaSemana,
    programacion.horaInicio,
    programacion.horaFin,
    id,
  )

  programacion.activo = true
  return enriquecerProgramacion(programacion)
}

// ---------------------------------------------------------------------------
// Calendario institucional — /dias-no-laborables (backend simulado)
// ---------------------------------------------------------------------------

export function listarDiasNoLaborablesMock() {
  return [...diasNoLaborablesMock].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function listarDiasNoLaborablesFuturosMock() {
  const hoy = hoyISO()
  return diasNoLaborablesMock
    .filter((item) => item.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function listarDiasNoLaborablesPorRangoMock(inicio, fin) {
  return diasNoLaborablesMock
    .filter((item) => item.fecha >= inicio && item.fecha <= fin)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function crearDiaNoLaborableMock({ fecha, motivo, forzar = false }) {
  if (diasNoLaborablesMock.some((item) => item.fecha === fecha)) {
    throw errorCodigo(`La fecha ${fecha} ya está registrada como día no laborable.`, {
      status: 400,
      codigo: 'DIA_NO_LABORABLE_YA_EXISTE',
    })
  }

  const citas = CITAS_ACTIVAS_POR_FECHA_MOCK[fecha] ?? []
  if (citas.length > 0 && !forzar) {
    throw errorCodigo(
      `Existen ${citas.length} cita(s) activa(s) para el ${fecha}. ` +
        `Confirme el bloqueo para continuar: las citas deberán reprogramarse.`,
      {
        status: 409,
        codigo: 'DIA_NO_LABORABLE_CON_CITAS',
        data: {
          codigo: 'DIA_NO_LABORABLE_CON_CITAS',
          fecha,
          totalCitas: citas.length,
          citas,
        },
      },
    )
  }

  contadorIdDiaNoLaborable += 1
  const nuevo = {
    id: contadorIdDiaNoLaborable,
    fecha,
    motivo: String(motivo).trim(),
    creadoPorId: 1,
    creadoPorNombre: 'Administrador HRO',
    creadoEn: new Date().toISOString(),
  }
  diasNoLaborablesMock.push(nuevo)
  return nuevo
}

export function actualizarDiaNoLaborableMock(id, { motivo }) {
  const dia = diasNoLaborablesMock.find((item) => item.id === id)
  if (!dia) {
    throw errorBackend(`No se encontró el día no laborable con ID ${id}`, 404)
  }
  dia.motivo = String(motivo).trim()
  return dia
}

export function eliminarDiaNoLaborableMock(id) {
  const indice = diasNoLaborablesMock.findIndex((item) => item.id === id)
  if (indice === -1) {
    throw errorBackend(`No se encontró el día no laborable con ID ${id}`, 404)
  }
  diasNoLaborablesMock.splice(indice, 1)
}

// ---------------------------------------------------------------------------
// Dashboard administrativo — /dashboard/resumen (backend simulado)
// Datos de prueba; replican exactamente las claves de ResumenAdminDTO.
// ---------------------------------------------------------------------------

const DASHBOARD_RESUMEN_MOCK = {
  totalCitas: 42,
  citasPendientes: 5,
  citasConfirmadas: 20,
  citasAtendidas: 14,
  citasCanceladas: 2,
  citasReprogramadas: 1,
  inasistencias: 3,
  capacidadTotal: 60,
  cuposOcupados: 45,
  cuposDisponibles: 15,
  tasaInasistencia: 17.65,
  alertas: [
    {
      codigo: 'CUPOS_AGOTADOS',
      severidad: 'ADVERTENCIA',
      mensaje: '2 cupo(s) del día alcanzaron su capacidad máxima.',
    },
    {
      codigo: 'DIAS_NO_LABORABLES_PROXIMOS',
      severidad: 'INFO',
      mensaje: '1 día no laborable en los próximos 7 días.',
    },
  ],
}

export function obtenerResumenDashboardMock(fecha) {
  return {
    ...clonar(DASHBOARD_RESUMEN_MOCK),
    fecha: fecha || hoyISO(),
  }
}

// ---------------------------------------------------------------------------
// Usuarios, roles y permisos — /usuarios, /roles, /permisos-subespecialidad
// Datos de prueba; replican los DTO reales. El alta de usuarios es JIT (no hay POST).
// ---------------------------------------------------------------------------

const ROLES_MOCK = [
  'personal_citas',
  'enfermeria',
  'medico',
  'administrador',
  'archivo',
  'jefe_enfermeria',
]

const TIPOS_PERMISO_VALIDOS = ['avanzar_turno', 'generar_orden_laboratorio', 'autorizar_cupo']

const USUARIOS_BASE = [
  {
    id: 1,
    idExterno: 'ana-perez',
    nombreMostrar: 'Ana Pérez',
    rolPrincipal: 'administrador',
    activo: true,
    ultimoAcceso: '2026-09-25T14:05:00Z',
    creadoEn: creadoEnBase,
  },
  {
    id: 2,
    idExterno: 'luis-gomez',
    nombreMostrar: 'Luis Gómez',
    rolPrincipal: 'medico',
    activo: true,
    ultimoAcceso: null,
    creadoEn: creadoEnBase,
  },
  {
    id: 3,
    idExterno: 'marta-ruiz',
    nombreMostrar: 'Marta Ruiz',
    rolPrincipal: 'enfermeria',
    activo: false,
    ultimoAcceso: '2026-08-30T09:00:00Z',
    creadoEn: creadoEnBase,
  },
  {
    id: 4,
    idExterno: 'jorge-salas',
    nombreMostrar: 'Jorge Salas',
    rolPrincipal: 'personal_citas',
    activo: true,
    ultimoAcceso: null,
    creadoEn: creadoEnBase,
  },
  {
    id: 5,
    idExterno: 'elena-diaz',
    nombreMostrar: 'Elena Díaz',
    rolPrincipal: 'archivo',
    activo: false,
    ultimoAcceso: null,
    creadoEn: creadoEnBase,
  },
]

const PERMISOS_SUBESPECIALIDAD_BASE = [
  {
    id: 1,
    usuarioId: 2,
    subespecialidadId: 1,
    tipoPermiso: 'avanzar_turno',
    activo: true,
    creadoEn: creadoEnBase,
  },
  {
    id: 2,
    usuarioId: 2,
    subespecialidadId: 2,
    tipoPermiso: 'autorizar_cupo',
    activo: false,
    creadoEn: creadoEnBase,
  },
  {
    id: 3,
    usuarioId: 3,
    subespecialidadId: 1,
    tipoPermiso: 'generar_orden_laboratorio',
    activo: true,
    creadoEn: creadoEnBase,
  },
]

export const usuariosMock = clonar(USUARIOS_BASE)
export const permisosSubespecialidadMock = clonar(PERMISOS_SUBESPECIALIDAD_BASE)

let contadorIdPermiso = PERMISOS_SUBESPECIALIDAD_BASE.length

export function listarRolesMock() {
  return [...ROLES_MOCK]
}

export function listarUsuariosMock({ estado, rol } = {}) {
  let rolNormalizado = null
  if (rol) {
    rolNormalizado = String(rol).trim().toLowerCase()
    if (!ROLES_MOCK.includes(rolNormalizado)) {
      throw errorBackend(
        `Rol no válido: '${rol}'. Roles permitidos: ${ROLES_MOCK.join(', ')}.`,
      )
    }
  }

  return filtrarPorEstado(usuariosMock, estado).filter((usuario) =>
    rolNormalizado ? usuario.rolPrincipal === rolNormalizado : true,
  )
}

export function obtenerUsuarioMock(id) {
  const usuario = usuariosMock.find((item) => item.id === id)
  if (!usuario) {
    throw errorBackend(`No se encontró el usuario con ID ${id}`, 404)
  }
  return usuario
}

export function activarUsuarioMock(id) {
  return cambiarEstadoUsuarioMock(id, true)
}

export function desactivarUsuarioMock(id) {
  return cambiarEstadoUsuarioMock(id, false)
}

function cambiarEstadoUsuarioMock(id, activo) {
  const usuario = obtenerUsuarioMock(id)
  usuario.activo = activo
  return usuario
}

export function actualizarRolUsuarioMock(id, { rolPrincipal }) {
  const rolNormalizado = String(rolPrincipal ?? '')
    .trim()
    .toLowerCase()
  if (!ROLES_MOCK.includes(rolNormalizado)) {
    throw errorBackend(
      `Rol no válido: '${rolPrincipal}'. Roles permitidos: ${ROLES_MOCK.join(', ')}.`,
    )
  }
  const usuario = obtenerUsuarioMock(id)
  usuario.rolPrincipal = rolNormalizado
  return usuario
}

function enriquecerPermiso(permiso) {
  const usuario = usuariosMock.find((item) => item.id === permiso.usuarioId)
  const subespecialidad = subespecialidadesMock.find(
    (item) => item.id === permiso.subespecialidadId,
  )
  const especialidad = especialidadesMock.find(
    (item) => item.id === subespecialidad?.especialidadId,
  )
  return {
    ...permiso,
    usuarioNombre: usuario?.nombreMostrar ?? '',
    subespecialidadNombre: subespecialidad?.nombre ?? '',
    especialidadId: especialidad?.id ?? null,
    especialidadNombre: especialidad?.nombre ?? '',
  }
}

export function listarPermisosUsuarioMock(usuarioId, estado) {
  obtenerUsuarioMock(usuarioId)
  return filtrarPorEstado(permisosSubespecialidadMock, estado)
    .filter((permiso) => permiso.usuarioId === usuarioId)
    .map(enriquecerPermiso)
}

export function listarPermisosSubespecialidadMock({ subespecialidadId, estado } = {}) {
  return filtrarPorEstado(permisosSubespecialidadMock, estado)
    .filter((permiso) =>
      subespecialidadId ? permiso.subespecialidadId === Number(subespecialidadId) : true,
    )
    .map(enriquecerPermiso)
}

export function asignarPermisoSubespecialidadMock({ usuarioId, subespecialidadId, tipoPermiso }) {
  const tipoNormalizado = String(tipoPermiso ?? '')
    .trim()
    .toLowerCase()
  if (!TIPOS_PERMISO_VALIDOS.includes(tipoNormalizado)) {
    throw errorBackend(
      `Tipo de permiso no válido: '${tipoPermiso}'. Valores permitidos: ${TIPOS_PERMISO_VALIDOS.join(', ')}.`,
    )
  }

  const usuario = usuariosMock.find((item) => item.id === Number(usuarioId))
  if (!usuario) {
    throw errorBackend(`No se encontró el usuario con ID ${usuarioId}`, 404)
  }
  if (!usuario.activo) {
    throw errorBackend(`El usuario ${usuario.nombreMostrar} está inactivo.`)
  }

  const subespecialidad = subespecialidadesMock.find(
    (item) => item.id === Number(subespecialidadId),
  )
  if (!subespecialidad) {
    throw errorBackend(`No se encontró la subespecialidad con ID ${subespecialidadId}`, 404)
  }
  if (!subespecialidad.activo) {
    throw errorBackend(`La subespecialidad ${subespecialidad.nombre} está inactiva.`)
  }

  const existente = permisosSubespecialidadMock.find(
    (permiso) =>
      permiso.usuarioId === usuario.id &&
      permiso.subespecialidadId === subespecialidad.id &&
      permiso.tipoPermiso === tipoNormalizado,
  )

  if (existente) {
    if (existente.activo) {
      throw errorBackend(
        `El usuario ya tiene el permiso '${tipoNormalizado}' sobre la subespecialidad ${subespecialidad.nombre}.`,
      )
    }
    existente.activo = true
    return enriquecerPermiso(existente)
  }

  contadorIdPermiso += 1
  const nuevo = {
    id: contadorIdPermiso,
    usuarioId: usuario.id,
    subespecialidadId: subespecialidad.id,
    tipoPermiso: tipoNormalizado,
    activo: true,
    creadoEn: new Date().toISOString(),
  }
  permisosSubespecialidadMock.push(nuevo)
  return enriquecerPermiso(nuevo)
}

export function desactivarPermisoSubespecialidadMock(id) {
  return cambiarEstadoPermisoMock(id, false)
}

export function reactivarPermisoSubespecialidadMock(id) {
  return cambiarEstadoPermisoMock(id, true)
}

function cambiarEstadoPermisoMock(id, activo) {
  const permiso = permisosSubespecialidadMock.find((item) => item.id === id)
  if (!permiso) {
    throw errorBackend(`No se encontró el permiso con ID ${id}`, 404)
  }
  if (activo) {
    const usuario = usuariosMock.find((item) => item.id === permiso.usuarioId)
    if (!usuario || !usuario.activo) {
      throw errorBackend('No se puede reactivar el permiso: el usuario está inactivo.')
    }
    const subespecialidad = subespecialidadesMock.find(
      (item) => item.id === permiso.subespecialidadId,
    )
    if (!subespecialidad || !subespecialidad.activo) {
      throw errorBackend('No se puede reactivar el permiso: la subespecialidad está inactiva.')
    }
  }
  permiso.activo = activo
  return enriquecerPermiso(permiso)
}

// ---------------------------------------------------------------------------
// Reportes administrativos — /reportes (backend simulado)
// Datos ficticios; replican los DTO reales.
// ---------------------------------------------------------------------------

const REPORTE_CITAS_POR_ESTADO_MOCK = {
  total: 40,
  porEstado: {
    atendida: 12,
    pendiente: 8,
    confirmada: 10,
    cancelada: 4,
    reprogramada: 3,
    no_asistio: 3,
  },
}

const REPORTE_DEMANDA_ITEMS_MOCK = [
  {
    especialidadId: 1,
    especialidadNombre: 'Medicina Interna',
    totalCitas: 20,
    atendidas: 9,
    inasistencias: 2,
  },
  {
    especialidadId: 2,
    especialidadNombre: 'Pediatría',
    totalCitas: 12,
    atendidas: 7,
    inasistencias: 1,
  },
  {
    especialidadId: 6,
    especialidadNombre: 'Cardiología',
    totalCitas: 8,
    atendidas: 3,
    inasistencias: 0,
  },
]

function rangoReporteMock(fechaInicio, fechaFin) {
  const fin = fechaFin || hoyISO()
  const inicio = fechaInicio || restarDiasISO(fin, 30)
  if (fin < inicio) {
    throw errorBackend('La fecha final no puede ser anterior a la fecha inicial.')
  }
  return { inicio, fin }
}

export function obtenerReporteCitasPorEstadoMock({ fechaInicio, fechaFin } = {}) {
  const { inicio, fin } = rangoReporteMock(fechaInicio, fechaFin)
  return {
    fechaInicio: inicio,
    fechaFin: fin,
    total: REPORTE_CITAS_POR_ESTADO_MOCK.total,
    porEstado: { ...REPORTE_CITAS_POR_ESTADO_MOCK.porEstado },
  }
}

export function obtenerReporteDemandaMock({ fechaInicio, fechaFin } = {}) {
  const { inicio, fin } = rangoReporteMock(fechaInicio, fechaFin)
  return { fechaInicio: inicio, fechaFin: fin, items: clonar(REPORTE_DEMANDA_ITEMS_MOCK) }
}

export function obtenerReporteUtilizacionMock({ fechaInicio, fechaFin, subespecialidadId } = {}) {
  const { inicio, fin } = rangoReporteMock(fechaInicio, fechaFin)
  if (subespecialidadId) {
    return {
      fechaInicio: inicio,
      fechaFin: fin,
      subespecialidadId: Number(subespecialidadId),
      capacidadTotal: 600,
      cuposOcupados: 36,
      cuposDisponibles: 564,
      utilizacionPorcentaje: 6,
    }
  }
  return {
    fechaInicio: inicio,
    fechaFin: fin,
    subespecialidadId: null,
    capacidadTotal: 2400,
    cuposOcupados: 48,
    cuposDisponibles: 2352,
    utilizacionPorcentaje: 2,
  }
}

// ---------------------------------------------------------------------------
// Auditoría administrativa — /auditoria (backend simulado)
// Datos 100% ficticios. Replican AuditoriaResponseDTO y la página Spring.
// `valoresAnteriores`/`valoresNuevos` son JSON en TEXTO (String) o null.
// ---------------------------------------------------------------------------

const AUDITORIA_BASE = [
  {
    id: 9,
    tablaAfectada: 'cita',
    entidadId: '10231',
    accion: 'actualizar',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: '{"estado":"pendiente"}',
    valoresNuevos: '{"estado":"confirmada","nota":"Reconfirmada por teléfono"}',
    fecha: '2026-09-26T14:20:00Z',
  },
  {
    id: 8,
    tablaAfectada: 'paciente',
    entidadId: 'a1b2c3d4-0000-4000-8000-000000000777',
    accion: 'crear',
    usuarioId: 4,
    usuarioNombre: 'Jorge Salas',
    valoresAnteriores: null,
    valoresNuevos:
      '{"nombres":"Paciente Ejemplo","documento":"0000000000000","contacto":{"telefono":"0000-0000"}}',
    fecha: '2026-09-26T11:05:00Z',
  },
  {
    id: 7,
    tablaAfectada: 'medico_subespecialidad',
    entidadId: '6f0d3a2c-1a11-4d21-9c01-000000000201',
    accion: 'actualizar',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: '{"capacidadMaxima":12,"horaInicio":"07:00:00"}',
    valoresNuevos: '{"capacidadMaxima":10,"horaInicio":"08:00:00"}',
    fecha: '2026-09-25T16:40:00Z',
  },
  {
    id: 6,
    tablaAfectada: 'usuario_referencia',
    entidadId: '3',
    accion: 'desactivar',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: '{"activo":true}',
    valoresNuevos: '{"activo":false}',
    fecha: '2026-09-25T09:15:00Z',
  },
  {
    id: 5,
    tablaAfectada: 'dia_no_laborable',
    entidadId: '12',
    accion: 'crear',
    usuarioId: 4,
    usuarioNombre: 'Jorge Salas',
    valoresAnteriores: null,
    valoresNuevos: '{"fecha":"2026-12-25","motivo":"Fiesta de Navidad"}',
    fecha: '2026-09-24T08:00:00Z',
  },
  {
    id: 4,
    tablaAfectada: 'especialidad',
    entidadId: '7',
    accion: 'crear',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: null,
    valoresNuevos: '{"nombre":"Dermatología","activo":true}',
    fecha: '2026-09-23T13:30:00Z',
  },
  {
    id: 3,
    tablaAfectada: 'espacio_fisico',
    entidadId: '6f0d3a2c-1a11-4d21-9c01-000000000005',
    accion: 'reactivar',
    usuarioId: 4,
    usuarioNombre: 'Jorge Salas',
    valoresAnteriores: '{"activo":false}',
    valoresNuevos: '{"activo":true}',
    fecha: '2026-09-22T10:10:00Z',
  },
  {
    id: 2,
    tablaAfectada: 'turno',
    entidadId: '5501',
    accion: 'actualizar',
    usuarioId: null,
    usuarioNombre: null,
    valoresAnteriores: '{"estado":"en_espera"}',
    valoresNuevos: '{"estado":"llamado"}',
    fecha: '2026-09-21T07:45:00Z',
  },
  {
    id: 1,
    tablaAfectada: 'mensaje_hl7_log',
    entidadId: 'hl7-0001',
    accion: 'crear',
    usuarioId: null,
    usuarioNombre: null,
    valoresAnteriores: null,
    valoresNuevos: '{"segmentos":["MSH","PID","OBX"],"resultado":{"glucosa":92,"unidad":"mg/dL"}}',
    fecha: '2026-09-20T06:20:00Z',
  },
  {
    id: 0,
    tablaAfectada: 'subespecialidad',
    entidadId: '4',
    accion: 'actualizar',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: '{"nombre":"Control Niño Sano"}',
    valoresNuevos: 'texto plano no JSON (registro heredado)',
    fecha: '2026-09-19T15:00:00Z',
  },
]

function paginarAuditoria(lista, page, size) {
  const tamano = Number(size) > 0 ? Number(size) : 20
  const numero = Number(page) > 0 ? Number(page) : 0
  const totalElements = lista.length
  const totalPages = Math.ceil(totalElements / tamano)
  const inicio = numero * tamano
  const content = lista.slice(inicio, inicio + tamano)

  return {
    content,
    number: numero,
    size: tamano,
    totalElements,
    totalPages,
    numberOfElements: content.length,
    first: numero === 0,
    last: numero >= totalPages - 1,
    empty: content.length === 0,
  }
}

export function obtenerAuditoriaMock({
  tabla,
  usuarioId,
  accion,
  fechaInicio,
  fechaFin,
  page = 0,
  size = 20,
} = {}) {
  const tablaNorm = tabla ? String(tabla).trim().toLowerCase() : ''
  const accionNorm = accion ? String(accion).trim().toLowerCase() : ''
  const usuarioNum =
    usuarioId !== null && usuarioId !== undefined && usuarioId !== '' ? Number(usuarioId) : null

  const filtrados = AUDITORIA_BASE.filter((registro) =>
    tablaNorm ? registro.tablaAfectada.toLowerCase() === tablaNorm : true,
  )
    .filter((registro) => (accionNorm ? registro.accion.toLowerCase() === accionNorm : true))
    .filter((registro) => (usuarioNum !== null ? registro.usuarioId === usuarioNum : true))
    .filter((registro) => (fechaInicio ? registro.fecha.slice(0, 10) >= fechaInicio : true))
    .filter((registro) => (fechaFin ? registro.fecha.slice(0, 10) <= fechaFin : true))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

  return paginarAuditoria(filtrados, page, size)
}
