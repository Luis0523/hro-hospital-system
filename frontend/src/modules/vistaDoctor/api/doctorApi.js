import client from '@/shared/api/client'
import { hoyIso } from '@/shared/utils/fecha'
import * as fuenteMock from './doctorMockApi'
import { normalizarClinica, normalizarMedico } from './doctorMappers'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

export const FUENTE_DATOS = USE_MOCK ? 'mock' : 'backend'
export const esModoDemo = USE_MOCK

const desenvolver = (respuesta) => respuesta?.data ?? respuesta
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ESTADOS_VISIBLES = {
  en_clinica: 'en_espera',
  llamado: 'llamado',
  no_asistio: 'no_responde',
  atendido: 'atendido',
}

function errorConCodigo(error, code, message) {
  const normalizado = new Error(message || error?.message || 'No se pudo completar la operación.')
  normalizado.code = code
  normalizado.status = error?.status
  return normalizado
}

function mapearTurno(turno) {
  const estado = ESTADOS_VISIBLES[turno.estado]
  if (!estado) return null
  return {
    id: turno.id,
    correlativo: turno.codigo ?? null,
    orden: turno.numeroGeneral ?? null,
    estado,
    expediente: turno.numeroExpediente ?? '',
    pacienteNombre: turno.pacienteNombre ?? '',
    identificado: Boolean(turno.expedienteId || turno.numeroExpediente),
    intentosLlamado: turno.llamados ?? 0,
    motivo: null,
    horaGenerado: turno.registradoEn ?? null,
    horaLlamado: turno.ultimoLlamadoEn ?? null,
    horaAtendido: turno.atendidoEn ?? null,
  }
}

export async function buscarMedicoPorColegiado(colegiado) {
  if (USE_MOCK) return fuenteMock.buscarMedicoPorColegiado(colegiado)
  const valor = String(colegiado ?? '').trim()
  if (!valor) {
    throw errorConCodigo(null, 'COLEGIADO_INVALIDO', 'Ingresa el número de colegiado.')
  }
  try {
    const medico = desenvolver(await client.get(`/medicos/colegiado/${encodeURIComponent(valor)}`))
    if (!medico?.activo) {
      throw errorConCodigo(null, 'MEDICO_INACTIVO', 'El médico está inactivo.')
    }
    return normalizarMedico(medico)
  } catch (error) {
    if (error.code) throw error
    if (error.status === 404) {
      throw errorConCodigo(error, 'MEDICO_NO_ENCONTRADO', 'No encontramos ese colegiado.')
    }
    throw error
  }
}

export async function resolverClinicaPorQr(identificador) {
  if (USE_MOCK) return fuenteMock.resolverClinicaPorQr(identificador)
  const valor = String(identificador ?? '').trim()
  if (!valor) {
    throw errorConCodigo(null, 'CLINICA_REQUERIDA', 'Abra el enlace QR de la clínica.')
  }

  try {
    const espacio = UUID_RE.test(valor)
      ? desenvolver(await client.get(`/espacios-fisicos/${valor}`))
      : desenvolver(await client.get(`/espacios-fisicos/numero/${encodeURIComponent(valor)}`))

    if (!espacio?.activo) {
      throw errorConCodigo(null, 'CLINICA_NO_DISPONIBLE', 'La clínica está fuera de servicio.')
    }

    const clinica = {
      ...normalizarClinica(espacio),
      codigo: String(espacio.numero ?? ''),
    }
    const asignacion = {
      id: 1,
      espacioFisicoId: espacio.id,
      subespecialidadId: null,
      subespecialidadNombre: espacio.nombre ?? `Clínica ${espacio.numero}`,
      especialidadId: null,
      especialidadNombre: '',
    }
    return { clinica, asignacion }
  } catch (error) {
    if (error.code) throw error
    throw errorConCodigo(
      error,
      'CLINICA_NO_DISPONIBLE',
      'La clínica no existe o no está disponible.',
    )
  }
}

export async function listarTurnos({ espacioFisicoId, escenario } = {}) {
  if (USE_MOCK) return fuenteMock.listarTurnos(arguments[0])
  if (!espacioFisicoId) {
    throw errorConCodigo(null, 'SIN_ASIGNACION', 'No hay una clínica asignada.')
  }
  if (String(escenario) === 'error') {
    throw errorConCodigo(null, 'ERROR_SIMULADO', 'No se pudo cargar la cola.')
  }
  const lista = desenvolver(
    await client.get('/turnos-estacion', {
      params: { fecha: hoyIso(), espacioFisicoId },
    }),
  )
  if (String(escenario) === 'vacio') return []
  return (Array.isArray(lista) ? lista : []).map(mapearTurno).filter(Boolean)
}

export async function obtenerCola({ espacioFisicoId, escenario } = {}) {
  if (USE_MOCK) return fuenteMock.obtenerCola(arguments[0])
  const turnos = await listarTurnos({ espacioFisicoId, escenario })
  const ultimoLlamadoEn = turnos.reduce((mayor, turno) => {
    const fecha = Date.parse(turno.horaLlamado ?? '')
    return Number.isFinite(fecha) ? Math.max(mayor, fecha) : mayor
  }, 0)
  return { turnos, ultimoLlamadoEn }
}

export async function buscarPacientePorExpediente(expediente) {
  if (USE_MOCK) return fuenteMock.buscarPacientePorExpediente(expediente)
  const valor = String(expediente ?? '').trim()
  if (!valor) {
    throw errorConCodigo(null, 'EXPEDIENTE_INVALIDO', 'Ingresa el número de expediente.')
  }
  try {
    const paciente = desenvolver(
      await client.get(`/integracion/hro/paciente/${encodeURIComponent(valor)}`),
    )
    return {
      expediente: paciente.numeroExpediente,
      pacienteNombre: paciente.nombreCompleto,
    }
  } catch (error) {
    if (error.status === 404) {
      throw errorConCodigo(error, 'EXPEDIENTE_NO_ENCONTRADO', 'No encontramos ese expediente.')
    }
    throw error
  }
}

async function refrescar(espacioFisicoId, turnoId) {
  const cola = await obtenerCola({ espacioFisicoId })
  return {
    ...cola,
    turno: cola.turnos.find((turno) => String(turno.id) === String(turnoId)) ?? null,
  }
}

export async function registrarExpediente({
  turnoId,
  expediente,
  numeroColegiado,
  espacioFisicoId,
} = {}) {
  if (USE_MOCK) return fuenteMock.registrarExpediente(arguments[0])
  const paciente = await buscarPacientePorExpediente(expediente)
  await client.post(`/turnos-estacion/${turnoId}/vincular-expediente`, {
    numeroColegiado,
    espacioFisicoId,
    numeroExpediente: paciente.expediente,
  })
  return { ...(await refrescar(espacioFisicoId, turnoId)), paciente }
}

export async function llamarTurno({ turnoId, numeroColegiado, espacioFisicoId } = {}) {
  if (USE_MOCK) return fuenteMock.llamarTurno(arguments[0])
  await client.post(`/turnos-estacion/${turnoId}/llamar`, {
    numeroColegiado,
    espacioFisicoId,
  })
  return refrescar(espacioFisicoId, turnoId)
}

export async function marcarNoResponde({ turnoId, numeroColegiado, espacioFisicoId } = {}) {
  if (USE_MOCK) return fuenteMock.marcarNoResponde(arguments[0])
  await client.post(`/turnos-estacion/${turnoId}/no-asistio`, {
    numeroColegiado,
    espacioFisicoId,
  })
  return refrescar(espacioFisicoId, turnoId)
}

export async function marcarAtendido({ turnoId, numeroColegiado, espacioFisicoId } = {}) {
  if (USE_MOCK) return fuenteMock.marcarAtendido(arguments[0])
  await client.post(`/turnos-estacion/${turnoId}/atendido`, {
    numeroColegiado,
    espacioFisicoId,
  })
  return refrescar(espacioFisicoId, turnoId)
}

export function obtenerJornadaCerrada() {
  return fuenteMock.obtenerJornadaCerrada()
}

export function jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion) {
  return fuenteMock.jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion)
}

export function cerrarJornada(opciones) {
  return fuenteMock.cerrarJornada(opciones)
}

export function reabrirJornada() {
  return fuenteMock.reabrirJornada()
}

export function descartarJornadaCerrada() {
  return fuenteMock.descartarJornadaCerrada()
}

export function limpiarJornadaOperativa() {
  return fuenteMock.limpiarJornadaOperativa()
}
