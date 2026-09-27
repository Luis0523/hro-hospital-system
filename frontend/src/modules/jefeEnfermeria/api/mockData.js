// Datos provisionales para el área de Jefe de Enfermería (solo dev/mock).
// La estructura imita los DTO confirmados del backend; no es fuente real.

const ESPACIOS_BASE = [
  { id: 'ef-101', numero: '101', nivel: 1, capacidadCamillas: 1 },
  { id: 'ef-102', numero: '102', nivel: 1, capacidadCamillas: 1 },
  { id: 'ef-201', numero: '201', nivel: 2, capacidadCamillas: 1 },
  { id: 'ef-202', numero: '202', nivel: 2, capacidadCamillas: 1 },
  { id: 'ef-203', numero: '203', nivel: 2, capacidadCamillas: 2 },
  { id: 'ef-301', numero: '301', nivel: 3, capacidadCamillas: 1 },
  { id: 'ef-401', numero: '401', nivel: 4, capacidadCamillas: 1 },
  { id: 'ef-402', numero: '402', nivel: 4, capacidadCamillas: 1 },
]

const SUBESPECIALIDADES_BASE = [
  { id: 1, nombre: 'Medicina General', especialidadId: 1, especialidadNombre: 'Medicina Interna' },
  { id: 2, nombre: 'Cardiología Clínica', especialidadId: 6, especialidadNombre: 'Cardiología' },
  { id: 3, nombre: 'Pediatría General', especialidadId: 2, especialidadNombre: 'Pediatría' },
  { id: 4, nombre: 'Control de Niño Sano', especialidadId: 2, especialidadNombre: 'Pediatría' },
  { id: 5, nombre: 'Pediatría Especializada', especialidadId: 2, especialidadNombre: 'Pediatría' },
  {
    id: 6,
    nombre: 'Ginecología General',
    especialidadId: 3,
    especialidadNombre: 'Ginecología y Obstetricia',
  },
  { id: 7, nombre: 'Cirugía General', especialidadId: 4, especialidadNombre: 'Cirugía General' },
  {
    id: 8,
    nombre: 'Traumatología General',
    especialidadId: 5,
    especialidadNombre: 'Traumatología y Ortopedia',
  },
]

export const espaciosMock = ESPACIOS_BASE.map((espacio) => ({ ...espacio }))
export const subespecialidadesMock = SUBESPECIALIDADES_BASE.map((sub) => ({ ...sub }))

/** fecha -> Array<{ id, espacioFisicoId, subespecialidadId }> (una sala puede tener varias) */
const asignacionesPorFecha = new Map()
const diasCerrados = new Set()
let contadorAsignacion = 1

function listaDe(fecha) {
  if (!asignacionesPorFecha.has(fecha)) asignacionesPorFecha.set(fecha, [])
  return asignacionesPorFecha.get(fecha)
}

function subDe(id) {
  return subespecialidadesMock.find((sub) => sub.id === Number(id)) ?? null
}

function espacioDe(id) {
  return espaciosMock.find((espacio) => espacio.id === id) ?? null
}

export function listarEspaciosFisicosMock(nivel) {
  return espaciosMock
    .filter((espacio) => !nivel || Number(espacio.nivel) === Number(nivel))
    .map((espacio) => ({ ...espacio, activo: true }))
}

export function listarSubespecialidadesMock() {
  return subespecialidadesMock.map((sub) => ({ ...sub, activo: true }))
}

export function vistaAsignacionMock(fecha, nivel) {
  const fila = listaDe(fecha)
  return espaciosMock
    .filter((espacio) => !nivel || Number(espacio.nivel) === Number(nivel))
    .map((espacio) => {
      const asignaciones = fila
        .filter((a) => a.espacioFisicoId === espacio.id)
        .map((a) => {
          const sub = subDe(a.subespecialidadId)
          return {
            asignacionId: a.id,
            subespecialidadId: sub?.id ?? null,
            subespecialidadNombre: sub?.nombre ?? null,
            especialidadId: sub?.especialidadId ?? null,
            especialidadNombre: sub?.especialidadNombre ?? null,
          }
        })
      return {
        espacioFisicoId: espacio.id,
        numero: espacio.numero,
        nivel: espacio.nivel,
        capacidadCamillas: espacio.capacidadCamillas,
        asignaciones,
      }
    })
}

export function guardarAsignacionMock({ espacioFisicoId, subespecialidadId, fecha }) {
  if (diasCerrados.has(fecha)) {
    const error = new Error('La asignación del día está cerrada. Use reasignación en caliente.')
    error.status = 409
    throw error
  }
  const fila = listaDe(fecha)
  const subId = Number(subespecialidadId)
  const existente = fila.find(
    (a) => a.espacioFisicoId === espacioFisicoId && a.subespecialidadId === subId,
  )
  if (existente) {
    return { id: existente.id, fecha, espacioFisicoId, subespecialidadId: subId }
  }
  const nueva = { id: contadorAsignacion++, espacioFisicoId, subespecialidadId: subId }
  fila.push(nueva)
  return { id: nueva.id, fecha, espacioFisicoId, subespecialidadId: subId }
}

export function eliminarAsignacionMock(id) {
  for (const [fecha, fila] of asignacionesPorFecha.entries()) {
    const indice = fila.findIndex((a) => a.id === Number(id))
    if (indice !== -1) {
      if (diasCerrados.has(fecha)) {
        const error = new Error('La asignación del día está cerrada; no se puede quitar.')
        error.status = 409
        throw error
      }
      fila.splice(indice, 1)
      return { ok: true }
    }
  }
  return { ok: true }
}

export function obtenerCoberturaMock(fecha) {
  const asignadas = new Set(listaDe(fecha).map((a) => a.subespecialidadId))
  return subespecialidadesMock
    .filter((sub) => !asignadas.has(sub.id))
    .map((sub) => ({ subespecialidadId: sub.id, subespecialidadNombre: sub.nombre }))
}

export function cerrarDiaMock(fecha) {
  diasCerrados.add(fecha)
  return { ok: true }
}

export function estaCerradoMock(fecha) {
  return diasCerrados.has(fecha)
}

export function duplicarAsignacionMock(fechaOrigen, fechaDestino) {
  if (diasCerrados.has(fechaDestino)) {
    const error = new Error('La asignación del día destino está cerrada.')
    error.status = 409
    throw error
  }
  const origen = asignacionesPorFecha.get(fechaOrigen) ?? []
  const destino = listaDe(fechaDestino)
  let copiadas = 0
  for (const a of origen) {
    const yaEsta = destino.some(
      (d) => d.espacioFisicoId === a.espacioFisicoId && d.subespecialidadId === a.subespecialidadId,
    )
    if (yaEsta) continue
    destino.push({ id: contadorAsignacion++, espacioFisicoId: a.espacioFisicoId, subespecialidadId: a.subespecialidadId })
    copiadas++
  }
  return copiadas
}

export function reasignarEnCalienteMock(id, nuevoEspacioFisicoId, motivo) {
  for (const [fecha, fila] of asignacionesPorFecha.entries()) {
    const asignacion = fila.find((a) => a.id === Number(id))
    if (!asignacion) continue

    const duplicada = fila.some(
      (a) =>
        a.id !== asignacion.id &&
        a.espacioFisicoId === nuevoEspacioFisicoId &&
        a.subespecialidadId === asignacion.subespecialidadId,
    )
    if (duplicada) {
      const error = new Error('Esa sala ya tiene la misma subespecialidad asignada.')
      error.status = 409
      throw error
    }

    asignacion.espacioFisicoId = nuevoEspacioFisicoId
    const espacio = espacioDe(nuevoEspacioFisicoId)
    const sub = subDe(asignacion.subespecialidadId)
    return {
      id: asignacion.id,
      fecha,
      espacioFisicoId: nuevoEspacioFisicoId,
      espacioNumero: espacio?.numero ?? null,
      subespecialidadId: sub?.id ?? null,
      subespecialidadNombre: sub?.nombre ?? null,
      motivo: motivo ?? null,
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Horario por subespecialidad (/subespecialidad-horarios)
// ---------------------------------------------------------------------------

const NOMBRES_DIA = [
  '',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const horariosMockData = []
let contadorHorario = 1

function subNombre(id) {
  return subDe(id)?.nombre ?? null
}

function subEsp(id) {
  return subDe(id)?.especialidadId ?? null
}

function subEspNombre(id) {
  return subDe(id)?.especialidadNombre ?? null
}

function toHorarioDTO(h) {
  return {
    id: h.id,
    subespecialidadId: h.subespecialidadId,
    subespecialidadNombre: subNombre(h.subespecialidadId),
    especialidadId: subEsp(h.subespecialidadId),
    especialidadNombre: subEspNombre(h.subespecialidadId),
    diaSemana: h.diaSemana,
    diaSemanaNombre: NOMBRES_DIA[h.diaSemana] ?? null,
    horaInicio: h.horaInicio,
    horaFin: h.horaFin,
    capacidadMaxima: h.capacidadMaxima,
    duracionConsultaMinutos: h.duracionConsultaMinutos,
    activo: h.activo,
  }
}

export function listarHorariosMock(subespecialidadId) {
  return horariosMockData
    .filter((h) => h.subespecialidadId === Number(subespecialidadId))
    .sort((a, b) => a.diaSemana - b.diaSemana)
    .map(toHorarioDTO)
}

export function crearHorarioMock(datos) {
  const subespecialidadId = Number(datos.subespecialidadId)
  const dia = Number(datos.diaSemana)
  if (horariosMockData.some((h) => h.subespecialidadId === subespecialidadId && h.diaSemana === dia)) {
    const error = new Error('Esa subespecialidad ya tiene un horario para ese día.')
    error.status = 409
    throw error
  }
  const horario = {
    id: `h-${contadorHorario++}`,
    subespecialidadId,
    diaSemana: dia,
    horaInicio: datos.horaInicio,
    horaFin: datos.horaFin,
    capacidadMaxima: Number(datos.capacidadMaxima),
    duracionConsultaMinutos: Number(datos.duracionConsultaMinutos),
    activo: true,
  }
  horariosMockData.push(horario)
  return toHorarioDTO(horario)
}

function buscarHorario(id) {
  return horariosMockData.find((h) => h.id === id) ?? null
}

export function actualizarHorarioMock(id, datos) {
  const horario = buscarHorario(id)
  if (!horario) return null
  if (datos.diaSemana !== undefined) horario.diaSemana = Number(datos.diaSemana)
  if (datos.horaInicio !== undefined) horario.horaInicio = datos.horaInicio
  if (datos.horaFin !== undefined) horario.horaFin = datos.horaFin
  if (datos.capacidadMaxima !== undefined) horario.capacidadMaxima = Number(datos.capacidadMaxima)
  if (datos.duracionConsultaMinutos !== undefined) {
    horario.duracionConsultaMinutos = Number(datos.duracionConsultaMinutos)
  }
  return toHorarioDTO(horario)
}

export function reactivarHorarioMock(id) {
  const horario = buscarHorario(id)
  if (horario) horario.activo = true
  return horario ? toHorarioDTO(horario) : null
}

export function desactivarHorarioMock(id) {
  const horario = buscarHorario(id)
  if (horario) horario.activo = false
  return horario ? toHorarioDTO(horario) : null
}

// ---------------------------------------------------------------------------
// Estaciones y bitácora de accesos (/estaciones, /estaciones/{id}/accesos)
// ---------------------------------------------------------------------------

const hoy = new Date()
const isoDeHoy = (hora, minuto) =>
  new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), hora, minuto).toISOString()

const ESTACIONES_BASE = [
  { id: 1, codigo: 'EST-01', nombre: 'Medicina y Cardiología', ubicacion: 'Nivel 1', activo: true, subespecialidadIds: [1, 2] },
  { id: 2, codigo: 'EST-02', nombre: 'Pediatría', ubicacion: 'Nivel 2', activo: true, subespecialidadIds: [3, 4, 5] },
  { id: 3, codigo: 'EST-03', nombre: 'Ginecología y Obstetricia', ubicacion: 'Nivel 3', activo: true, subespecialidadIds: [6] },
  { id: 4, codigo: 'EST-04', nombre: 'Cirugía y Traumatología', ubicacion: 'Nivel 4', activo: true, subespecialidadIds: [7, 8] },
]

const ACCESOS_BASE = [
  { id: 1, estacionId: 1, usuarioReferenciaId: 10, usuarioNombre: 'Licda. Sofía Carrillo', entradoEn: isoDeHoy(7, 0), salidoEn: null },
  { id: 2, estacionId: 1, usuarioReferenciaId: 11, usuarioNombre: 'Téc. Raúl Barrios', entradoEn: isoDeHoy(7, 30), salidoEn: null },
  { id: 3, estacionId: 2, usuarioReferenciaId: 12, usuarioNombre: 'Enf. María Xicay', entradoEn: isoDeHoy(7, 15), salidoEn: null },
  { id: 4, estacionId: 3, usuarioReferenciaId: 13, usuarioNombre: 'Enf. Ana Puac', entradoEn: isoDeHoy(6, 45), salidoEn: isoDeHoy(11, 0) },
  { id: 5, estacionId: 3, usuarioReferenciaId: 14, usuarioNombre: 'Enf. Luis Ixcot', entradoEn: isoDeHoy(8, 0), salidoEn: null },
  { id: 6, estacionId: 4, usuarioReferenciaId: 15, usuarioNombre: 'Enf. Diego Saloj', entradoEn: isoDeHoy(9, 10), salidoEn: isoDeHoy(12, 30) },
]

const estacionesMockData = ESTACIONES_BASE.map((e) => ({ ...e, subespecialidadIds: [...e.subespecialidadIds] }))
const accesosMockData = ACCESOS_BASE.map((a) => ({ ...a }))
let contadorEstacion = ESTACIONES_BASE.length + 1

function toEstacionDTO(e) {
  return {
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    ubicacion: e.ubicacion,
    activo: e.activo,
    subespecialidades: e.subespecialidadIds
      .map((id) => subDe(id))
      .filter(Boolean)
      .map((sub) => ({
        id: sub.id,
        nombre: sub.nombre,
        especialidadId: sub.especialidadId,
        especialidadNombre: sub.especialidadNombre,
      })),
  }
}

export function listarEstacionesMock() {
  return estacionesMockData.filter((e) => e.activo).map(toEstacionDTO)
}

export function crearEstacionMock({ codigo, nombre, ubicacion }) {
  const nueva = {
    id: contadorEstacion++,
    codigo: String(codigo).trim(),
    nombre: String(nombre).trim(),
    ubicacion: ubicacion ? String(ubicacion).trim() : null,
    activo: true,
    subespecialidadIds: [],
  }
  estacionesMockData.push(nueva)
  return toEstacionDTO(nueva)
}

export function actualizarEstacionMock(id, { codigo, nombre, ubicacion, activo }) {
  const estacion = estacionesMockData.find((e) => e.id === Number(id))
  if (!estacion) return null
  if (codigo !== undefined) estacion.codigo = String(codigo).trim()
  if (nombre !== undefined) estacion.nombre = String(nombre).trim()
  if (ubicacion !== undefined) estacion.ubicacion = ubicacion ? String(ubicacion).trim() : null
  if (activo !== undefined) estacion.activo = activo
  return toEstacionDTO(estacion)
}

export function desactivarEstacionMock(id) {
  const estacion = estacionesMockData.find((e) => e.id === Number(id))
  if (estacion) estacion.activo = false
  return estacion ? toEstacionDTO(estacion) : null
}

export function asignarSubespecialidadesEstacionMock(id, subespecialidadIds) {
  const estacion = estacionesMockData.find((e) => e.id === Number(id))
  if (!estacion) return null
  estacion.subespecialidadIds = Array.from(new Set(subespecialidadIds.map(Number)))
  return toEstacionDTO(estacion)
}

export function listarAccesosMock(estacionId, abiertos = false) {
  return accesosMockData
    .filter((a) => a.estacionId === Number(estacionId))
    .filter((a) => (abiertos ? a.salidoEn === null : true))
    .sort((a, b) => new Date(b.entradoEn) - new Date(a.entradoEn))
    .map((a) => ({ ...a }))
}

export function reiniciarJefeMock() {
  asignacionesPorFecha.clear()
  diasCerrados.clear()
  horariosMockData.length = 0
  estacionesMockData.splice(0, estacionesMockData.length, ...ESTACIONES_BASE.map((e) => ({ ...e, subespecialidadIds: [...e.subespecialidadIds] })))
  accesosMockData.splice(0, accesosMockData.length, ...ACCESOS_BASE.map((a) => ({ ...a })))
  contadorAsignacion = 1
  contadorHorario = 1
  contadorEstacion = ESTACIONES_BASE.length + 1
}
