import client from '@/shared/api/client'
import { hoyIso } from '@/shared/utils/fecha'
import {
  citasMock,
  clinicasMock,
  disponibilidadMock,
  pacientesMock,
  tableroMock,
  turnosMock,
} from './mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta
const normalizar = (valor) =>
  String(valor ?? '')
    .replace(/[\s-]/g, '')
    .toLowerCase()

export async function listarClinicas() {
  if (USE_MOCK) return clinicasMock
  return desenvolver(await client.get('/catalogos/clinicas'))
}

export async function consultarDisponibilidad({ clinicaIds = [], fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) {
    return disponibilidadMock(fechaInicio, fechaFin, Math.max(1, clinicaIds.length))
  }
  const respuesta = await client.get('/cupos', { params: { fechaInicio, fechaFin } })
  return desenvolver(respuesta)
}

export async function listarCitasDePaciente(pacienteId) {
  if (USE_MOCK) {
    return citasMock.filter((cita) => cita.pacienteId === Number(pacienteId))
  }
  return desenvolver(await client.get(`/citas/paciente/${pacienteId}`))
}

export async function buscarPaciente(identificador) {
  const valor = String(identificador ?? '').trim()
  if (!valor) return null

  if (USE_MOCK) {
    const buscado = normalizar(valor)
    return (
      pacientesMock.find(
        (paciente) =>
          normalizar(paciente.dpi) === buscado || normalizar(paciente.numeroExpediente) === buscado,
      ) ?? null
    )
  }

  try {
    return desenvolver(await client.get(`/pacientes/dpi/${valor}`))
  } catch {
    return desenvolver(await client.get(`/pacientes/expediente/${valor}`))
  }
}

export async function buscarCitaDelDia(identificador) {
  const paciente = await buscarPaciente(identificador)
  if (!paciente) return null

  const citas = await listarCitasDePaciente(paciente.id)
  const cita = citas.find((registro) => registro.fechaCita === hoyIso()) ?? null
  return { paciente, cita }
}

export async function hacerCheckIn(citaId, usuarioId) {
  if (USE_MOCK) {
    const existente = turnosMock.find((turno) => turno.citaId === Number(citaId))
    if (existente) return existente

    const cita = citasMock.find((registro) => registro.id === Number(citaId))
    const numeroTurno =
      turnosMock.length > 0 ? Math.max(...turnosMock.map((turno) => turno.numeroTurno)) + 1 : 43
    const turno = {
      id: 1000 + turnosMock.length,
      citaId: Number(citaId),
      numeroTurno,
      estado: 'en_espera',
      clinicaId: cita?.clinicaId ?? null,
      clinicaNombre: cita?.clinicaNombre ?? '',
      medicoNombre: cita?.medicoNombre ?? '',
      horaGenerado: new Date().toISOString(),
    }
    turnosMock.push(turno)
    return turno
  }

  return desenvolver(await client.post('/turnos/check-in', { citaId: Number(citaId), usuarioId }))
}

export async function listarTurnosClinica(clinicaId, fecha = hoyIso()) {
  if (USE_MOCK) {
    return turnosMock
      .filter((turno) => turno.clinicaId === Number(clinicaId))
      .sort((a, b) => a.numeroTurno - b.numeroTurno)
  }
  return desenvolver(await client.get(`/turnos/clinica/${clinicaId}`, { params: { fecha } }))
}

export async function listarTurnosActivos() {
  if (USE_MOCK) {
    return turnosMock.filter((turno) => turno.estado === 'en_espera' || turno.estado === 'llamado')
  }
  return desenvolver(await client.get('/turnos/activos'))
}

export async function llamarTurno(turnoId, usuarioId) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (!turno) {
      tableroMock.turnoActual += 1
      return { id: Date.now(), numeroTurno: tableroMock.turnoActual, estado: 'llamado' }
    }
    turno.estado = 'llamado'
    turno.horaLlamado = new Date().toISOString()
    return turno
  }
  return desenvolver(
    await client.post(`/turnos/${turnoId}/llamar`, null, { params: { usuarioId } }),
  )
}

export async function marcarNoResponde(turnoId, usuarioId, motivo) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (turno) {
      turno.estado = 'no_responde'
      turno.motivo = motivo
    }
    return turno ?? { id: Number(turnoId), estado: 'no_responde' }
  }
  return desenvolver(
    await client.post(`/turnos/${turnoId}/no-responde`, null, { params: { usuarioId, motivo } }),
  )
}

export async function reintegrarTurno(turnoId, usuarioId, motivo) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (turno) {
      turno.estado = 'en_espera'
      turno.numeroTurno = Math.max(...turnosMock.map((registro) => registro.numeroTurno)) + 1
      turno.horaGenerado = new Date().toISOString()
      turno.motivo = motivo
    }
    return turno ?? { id: Number(turnoId), estado: 'en_espera' }
  }
  return desenvolver(await client.post(`/turnos/${turnoId}/reintegrar`, { usuarioId, motivo }))
}

export async function marcarAtendido(turnoId, usuarioId) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (turno) turno.estado = 'atendido'
    return turno ?? { id: Number(turnoId), estado: 'atendido' }
  }
  return desenvolver(
    await client.post(`/turnos/${turnoId}/atendido`, null, { params: { usuarioId } }),
  )
}

export async function pasarSiguiente(clinicaId, usuarioId) {
  if (USE_MOCK) {
    const siguiente = turnosMock.find(
      (turno) => turno.estado === 'en_espera' && turno.clinicaId === Number(clinicaId),
    )
    if (siguiente) return llamarTurno(siguiente.id, usuarioId)
    tableroMock.turnoActual += 1
    return { numeroTurno: tableroMock.turnoActual, clinicaId, estado: 'llamado' }
  }

  const turnos = await listarTurnosClinica(clinicaId)
  const siguiente = turnos.find((turno) => turno.estado === 'en_espera')
  if (!siguiente) {
    throw new Error('No hay turnos en espera en esta clínica')
  }
  return llamarTurno(siguiente.id, usuarioId)
}

export async function obtenerEstadoTablero() {
  return { activo: tableroMock.activo }
}

export async function cambiarEstadoTablero(activo) {
  if (!USE_MOCK) {
    throw new Error('Endpoint de estado del tablero pendiente de confirmar con el backend')
  }
  tableroMock.activo = activo
  return { activo }
}
