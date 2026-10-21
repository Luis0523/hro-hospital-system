import { CLINICAS_MOCK, MEDICOS_MOCK, PACIENTES_MOCK, turnosDeClinica } from './mockData'
import { normalizarClinica, normalizarMedico, normalizarTurno } from './doctorMappers'
import {
  ACCION_ATENDER,
  ACCION_NO_RESPONDE,
  aplicarAtendido,
  aplicarLlamado,
  aplicarNoResponde,
  crearAtencion,
  esAccionPermitida,
  evaluarLlamado,
  ordenarCola,
} from './doctorAcciones'

const LATENCIA_MS = import.meta.env.MODE === 'test' ? 0 : 220
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CODIGO_CLINICA_RE = /^\d{3}-\d{2}$/
const COLEGIADO_RE = /^\d{3,10}$/
const EXPEDIENTE_RE = /^[0-9]{1,10}$/
const CLAVE_OPERATIVA = 'hro_jornada_operativa'
const CLAVE_CERRADA = 'hro_jornada_cerrada'
const VERSION_JORNADA = 2

function esperar() {
  return new Promise((resolve) => setTimeout(resolve, LATENCIA_MS))
}

export function crearError(codigo, mensaje, status = 400) {
  const error = new Error(mensaje)
  error.code = codigo
  error.status = status
  return error
}

export function esUuidValido(valor) {
  return UUID_RE.test(String(valor ?? '').trim())
}

export function normalizarEscenario(escenario) {
  const valor = String(escenario ?? '')
    .trim()
    .toLowerCase()
  return ['vacio', 'error'].includes(valor) ? valor : ''
}

function leerJson(clave) {
  try {
    const crudo = globalThis.sessionStorage?.getItem(clave)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

function guardarJson(clave, valor) {
  try {
    globalThis.sessionStorage?.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

function limpiarJson(clave) {
  try {
    globalThis.sessionStorage?.removeItem(clave)
  } catch {
    return
  }
}

function medicoEnSesion(medicoId) {
  return String(medicoId ?? 'sin-medico')
}

function leerOperativa() {
  const estado = leerJson(CLAVE_OPERATIVA)
  if (!estado || estado.version !== VERSION_JORNADA) return null
  if (!Number.isFinite(Number(estado.asignacionId)) || !Array.isArray(estado.turnos)) {
    return null
  }
  return estado
}

function guardarOperativa(estado) {
  return guardarJson(CLAVE_OPERATIVA, {
    version: VERSION_JORNADA,
    asignacionId: Number(estado.asignacionId),
    medicoId: String(estado.medicoId),
    turnos: estado.turnos,
    atenciones: estado.atenciones ?? [],
    ultimoLlamadoEn: Number(estado.ultimoLlamadoEn ?? 0),
    actualizadoEn: new Date().toISOString(),
  })
}

function obtenerOperativa({ asignacionId, medicoId }) {
  const estado = leerOperativa()
  if (
    !estado ||
    Number(estado.asignacionId) !== Number(asignacionId) ||
    String(estado.medicoId) !== medicoEnSesion(medicoId)
  ) {
    throw crearError(
      'SIN_JORNADA_ACTIVA',
      'No hay una jornada activa para esta clínica y médico.',
      409,
    )
  }
  return estado
}

function buscarTurno(estado, turnoId) {
  const turno = estado.turnos.find((registro) => String(registro.id) === String(turnoId))
  if (!turno) {
    throw crearError('TURNO_NO_ENCONTRADO', 'No se encontró el turno solicitado.', 404)
  }
  return turno
}

function validarAccion(turno, accion) {
  if (!esAccionPermitida(accion, turno.estado)) {
    throw crearError(
      'TRANSICION_INVALIDA',
      `El turno no permite la acción "${accion}" en su estado actual.`,
      409,
    )
  }
}

function guardarTurno(estado, turnoActualizado) {
  estado.turnos = estado.turnos.map((registro) =>
    String(registro.id) === String(turnoActualizado.id) ? turnoActualizado : registro,
  )
  guardarOperativa(estado)
  return {
    turnos: ordenarCola(estado.turnos).map(normalizarTurno),
    turno: normalizarTurno(turnoActualizado),
    ultimoLlamadoEn: Number(estado.ultimoLlamadoEn ?? 0),
  }
}

function validarEscenario(escenario) {
  if (normalizarEscenario(escenario) === 'error') {
    throw crearError(
      'ERROR_SIMULADO',
      'No se pudo completar la operación simulada. Intenta de nuevo.',
      503,
    )
  }
}

function normalizarExpediente(valor) {
  return String(valor ?? '').trim()
}

function normalizarNombre(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function buscarPacienteFicticio(expediente) {
  const valor = normalizarExpediente(expediente)
  if (!EXPEDIENTE_RE.test(valor)) {
    throw crearError(
      'EXPEDIENTE_INVALIDO',
      'Ingresa un número de expediente válido (de 1 a 10 dígitos numéricos).',
      400,
    )
  }

  const paciente = PACIENTES_MOCK.find((registro) => registro.expediente === valor)
  if (!paciente) {
    throw crearError(
      'EXPEDIENTE_NO_ENCONTRADO',
      'No encontramos un paciente ficticio con ese número de expediente.',
      404,
    )
  }
  return { ...paciente }
}

export async function buscarMedicoPorColegiado(colegiado) {
  await esperar()
  const valor = String(colegiado ?? '')
    .trim()
    .replace(/^COL-/i, '')

  if (!COLEGIADO_RE.test(valor)) {
    throw crearError(
      'COLEGIADO_INVALIDO',
      'Ingresa un número de colegiado válido (solo dígitos, mínimo 3).',
      400,
    )
  }

  const medico = MEDICOS_MOCK.find((registro) => registro.colegiado === valor)
  if (!medico) {
    throw crearError(
      'MEDICO_NO_ENCONTRADO',
      'No encontramos un médico con ese número de colegiado.',
      404,
    )
  }
  if (!medico.activo) {
    throw crearError('MEDICO_INACTIVO', 'El médico está inactivo. Contacta al administrador.', 403)
  }

  return normalizarMedico(medico)
}

export async function resolverClinicaPorQr(identificador) {
  await esperar()
  const valor = String(identificador ?? '').trim()

  if (!valor) {
    throw crearError('CLINICA_REQUERIDA', 'Abre el enlace QR de tu clínica para continuar.', 400)
  }

  const esUuid = esUuidValido(valor)
  const esCodigo = CODIGO_CLINICA_RE.test(valor)
  if (!esUuid && !esCodigo) {
    throw crearError('CLINICA_INVALIDA', 'El enlace de la clínica no es válido.', 400)
  }

  const espacio = CLINICAS_MOCK.find((registro) =>
    esUuid
      ? registro.espacioFisicoId.toLowerCase() === valor.toLowerCase()
      : registro.codigo.toLowerCase() === valor.toLowerCase(),
  )
  if (!espacio || !espacio.activo) {
    throw crearError('CLINICA_NO_DISPONIBLE', 'La clínica no existe o está fuera de servicio.', 404)
  }
  if (!espacio.asignacion) {
    throw crearError(
      'SIN_ASIGNACION',
      'La clínica no tiene una asignación de atención para hoy.',
      409,
    )
  }

  const clinica = normalizarClinica(espacio)
  return { clinica, asignacion: clinica.asignacion }
}

export async function listarTurnos({ asignacionId, escenario, medicoId } = {}) {
  await esperar()
  const id = Number(asignacionId)
  if (!Number.isFinite(id)) {
    throw crearError('SIN_ASIGNACION', 'No hay una clínica asignada para consultar.', 409)
  }

  validarEscenario(escenario)
  if (normalizarEscenario(escenario) === 'vacio') return []

  const medico = medicoEnSesion(medicoId)
  const existente = leerOperativa()
  if (existente && Number(existente.asignacionId) === id && String(existente.medicoId) === medico) {
    return ordenarCola(existente.turnos).map(normalizarTurno)
  }

  const turnos = ordenarCola(turnosDeClinica(id).map(normalizarTurno))
  guardarOperativa({
    asignacionId: id,
    medicoId: medico,
    turnos,
    atenciones: [],
    ultimoLlamadoEn: 0,
  })
  return turnos
}

export async function obtenerCola({ asignacionId, escenario, medicoId } = {}) {
  const turnos = await listarTurnos({ asignacionId, escenario, medicoId })
  const estado = leerOperativa()
  const coincide =
    estado &&
    Number(estado.asignacionId) === Number(asignacionId) &&
    String(estado.medicoId) === medicoEnSesion(medicoId)

  return {
    turnos,
    ultimoLlamadoEn: coincide ? Number(estado.ultimoLlamadoEn ?? 0) : 0,
  }
}

export async function buscarPacientePorExpediente(expediente) {
  await esperar()
  return buscarPacienteFicticio(expediente)
}

export async function registrarExpediente({
  asignacionId,
  medicoId,
  turnoId,
  expediente,
  escenario,
} = {}) {
  await esperar()
  validarEscenario(escenario)
  const paciente = buscarPacienteFicticio(expediente)
  const estado = obtenerOperativa({ asignacionId, medicoId })
  const turno = buscarTurno(estado, turnoId)

  if (turno.estado === 'atendido') {
    throw crearError(
      'TURNO_ATENDIDO',
      'No se puede modificar el expediente de un turno ya atendido.',
      409,
    )
  }

  if (normalizarNombre(paciente.pacienteNombre) !== normalizarNombre(turno.pacienteNombre)) {
    throw crearError(
      'EXPEDIENTE_DE_OTRO_PACIENTE',
      `El expediente ${paciente.expediente} pertenece a otro paciente y no puede asociarse a este turno.`,
      409,
    )
  }

  const actualizado = {
    ...turno,
    identificado: true,
    expediente: paciente.expediente,
    pacienteNombre: paciente.pacienteNombre,
  }
  return { ...guardarTurno(estado, actualizado), paciente }
}

export async function llamarTurno({ asignacionId, medicoId, turnoId, escenario } = {}) {
  await esperar()
  validarEscenario(escenario)
  const estado = obtenerOperativa({ asignacionId, medicoId })
  const turno = buscarTurno(estado, turnoId)
  const ahora = Date.now()
  const evaluacion = evaluarLlamado(turno, estado.turnos, ahora, estado.ultimoLlamadoEn)

  if (!evaluacion.permitido) {
    throw crearError(
      evaluacion.codigo || 'TRANSICION_INVALIDA',
      evaluacion.motivo,
      evaluacion.codigo === 'COOLDOWN' ? 429 : 409,
    )
  }

  estado.ultimoLlamadoEn = ahora
  return guardarTurno(estado, aplicarLlamado(turno, ahora))
}

export async function marcarNoResponde({ asignacionId, medicoId, turnoId, escenario } = {}) {
  await esperar()
  validarEscenario(escenario)
  const estado = obtenerOperativa({ asignacionId, medicoId })
  const turno = buscarTurno(estado, turnoId)
  validarAccion(turno, ACCION_NO_RESPONDE)
  return guardarTurno(estado, aplicarNoResponde(turno))
}

export async function marcarAtendido({ asignacionId, medicoId, turnoId, medico, escenario } = {}) {
  await esperar()
  validarEscenario(escenario)
  if (!medico?.id) {
    throw crearError(
      'MEDICO_REQUERIDO',
      'No hay un médico identificado para registrar la atención.',
      409,
    )
  }

  const estado = obtenerOperativa({ asignacionId, medicoId })
  const turno = buscarTurno(estado, turnoId)
  validarAccion(turno, ACCION_ATENDER)

  if (!turno.identificado || !turno.expediente) {
    throw crearError(
      'EXPEDIENTE_REQUERIDO',
      'Registre y valide el expediente antes de marcar la atención.',
      409,
    )
  }

  const actualizado = aplicarAtendido(turno)
  const atencion = crearAtencion({ medico, turno: actualizado })
  estado.atenciones = [...(estado.atenciones ?? []), atencion]
  return { ...guardarTurno(estado, actualizado), atencion }
}

export function obtenerJornadaCerrada() {
  const estado = leerJson(CLAVE_CERRADA)
  if (!estado || estado.version !== VERSION_JORNADA) return null
  if (!estado.medico || !estado.clinica || !estado.asignacion) return null
  if (!Array.isArray(estado.turnos)) return null
  return estado
}

export function jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion) {
  if (!cerrada || !medico || !clinica || !asignacion) return false
  return (
    String(cerrada.medico.id) === String(medico.id) &&
    cerrada.clinica.espacioFisicoId === clinica.espacioFisicoId &&
    Number(cerrada.asignacion.id) === Number(asignacion.id)
  )
}

export function cerrarJornada({ medico, clinica, asignacion, turnos, atenciones } = {}) {
  const operativa = leerOperativa()
  const coincide =
    operativa &&
    Number(operativa.asignacionId) === Number(asignacion?.id) &&
    String(operativa.medicoId) === medicoEnSesion(medico?.id)

  const cerrada = {
    version: VERSION_JORNADA,
    medico,
    clinica,
    asignacion,
    turnos: coincide ? operativa.turnos : (turnos ?? []),
    atenciones: coincide ? operativa.atenciones : (atenciones ?? []),
    ultimoLlamadoEn: coincide ? Number(operativa.ultimoLlamadoEn ?? 0) : 0,
    cerradaEn: new Date().toISOString(),
  }

  guardarJson(CLAVE_CERRADA, cerrada)
  limpiarJson(CLAVE_OPERATIVA)
  return cerrada
}

export function reabrirJornada() {
  const cerrada = obtenerJornadaCerrada()
  if (!cerrada) return null

  guardarOperativa({
    asignacionId: cerrada.asignacion.id,
    medicoId: cerrada.medico.id,
    turnos: cerrada.turnos,
    atenciones: cerrada.atenciones ?? [],
    ultimoLlamadoEn: Number(cerrada.ultimoLlamadoEn ?? 0),
  })
  limpiarJson(CLAVE_CERRADA)
  return cerrada
}

export function descartarJornadaCerrada() {
  limpiarJson(CLAVE_CERRADA)
}

export function limpiarJornadaOperativa() {
  limpiarJson(CLAVE_OPERATIVA)
}
