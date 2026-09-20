// Datos provisionales para desarrollo frontend.
// La estructura replica los DTO confirmados del backend y no constituye una fuente de datos real.
//
// Contratos replicados (backend vigente):
//   EspecialidadResponseDTO    { id: Long, nombre, activo, creadoEn }
//   SubespecialidadResponseDTO { id: Long, especialidadId: Long, especialidadNombre, nombre, activo, creadoEn }
//   EspacioFisicoResponseDTO   { id: UUID, numero, nivel: Short, capacidadCamillas, coordenadasPlano, nombre, ubicacion, activo, creadoEn }
//
// Los endpoints de listado del backend devuelven únicamente registros activos.

const creadoEnBase = '2026-01-05T08:00:00-06:00'

const ESPECIALIDADES_BASE = [
  { id: 1, nombre: 'Medicina Interna', activo: true, creadoEn: creadoEnBase },
  { id: 2, nombre: 'Pediatría', activo: true, creadoEn: creadoEnBase },
  { id: 3, nombre: 'Ginecología y Obstetricia', activo: true, creadoEn: creadoEnBase },
  { id: 4, nombre: 'Cirugía General', activo: true, creadoEn: creadoEnBase },
  { id: 5, nombre: 'Traumatología y Ortopedia', activo: true, creadoEn: creadoEnBase },
  { id: 6, nombre: 'Cardiología', activo: true, creadoEn: creadoEnBase },
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
]

const clonar = (valor) => JSON.parse(JSON.stringify(valor))

export const especialidadesMock = clonar(ESPECIALIDADES_BASE)
export const subespecialidadesMock = clonar(SUBESPECIALIDADES_BASE)
export const espaciosFisicosMock = clonar(ESPACIOS_FISICOS_BASE)

let contadorIdEspecialidad = ESPECIALIDADES_BASE.length
let contadorIdSubespecialidad = SUBESPECIALIDADES_BASE.length
let contadorUuid = ESPACIOS_FISICOS_BASE.length

function errorBackend(mensaje, status = 400) {
  const error = new Error(mensaje)
  error.status = status
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
  contadorIdEspecialidad = ESPECIALIDADES_BASE.length
  contadorIdSubespecialidad = SUBESPECIALIDADES_BASE.length
  contadorUuid = ESPACIOS_FISICOS_BASE.length
}

// ---------------------------------------------------------------------------
// Especialidades
// ---------------------------------------------------------------------------

export function listarEspecialidadesMock() {
  return especialidadesMock.filter((item) => item.activo)
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

// ---------------------------------------------------------------------------
// Subespecialidades
// ---------------------------------------------------------------------------

export function listarSubespecialidadesMock(especialidadId) {
  return subespecialidadesMock
    .filter((item) => item.activo)
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

// ---------------------------------------------------------------------------
// Espacios físicos
// ---------------------------------------------------------------------------

export function listarEspaciosFisicosMock(nivel) {
  return espaciosFisicosMock
    .filter((item) => item.activo)
    .filter((item) => (nivel ? item.nivel === Number(nivel) : true))
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
