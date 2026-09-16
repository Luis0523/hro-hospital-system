import client from '@/shared/api/client'
import { guardarCache, leerCache, limpiarCachePrefijo } from '@/shared/utils/cache'
import { aIso, hoyIso } from '@/shared/utils/fecha'
import {
  citasMock,
  clinicasMock,
  construirCitaMock,
  cuposDiaMock,
  disponibilidadMock,
  pacientesMock,
  reservarCupoMock,
  tableroMock,
  turnosMock,
} from './mockData'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta
const normalizar = (valor) =>
  String(valor ?? '')
    .replace(/[\s-]/g, '')
    .toLowerCase()

function agruparCuposPorFecha(cupos = []) {
  const porFecha = new Map()

  cupos.forEach((cupo) => {
    const acumulado = porFecha.get(cupo.fecha) ?? {
      fecha: cupo.fecha,
      capacidadMaxima: 0,
      cuposDisponibles: 0,
      disponible: false,
      noLaborable: false,
    }
    acumulado.capacidadMaxima += cupo.capacidadMaxima ?? 0
    acumulado.cuposDisponibles += cupo.cuposDisponibles ?? 0
    acumulado.disponible = acumulado.disponible || Boolean(cupo.disponible)
    porFecha.set(cupo.fecha, acumulado)
  })

  return Array.from(porFecha.values())
}

function completarRango(agrupado, fechaInicio, fechaFin, feriados = new Set()) {
  const mapa = new Map(agrupado.map((dia) => [dia.fecha, dia]))
  const resultado = []
  const inicio = new Date(`${fechaInicio}T00:00:00`)
  const fin = new Date(`${fechaFin}T00:00:00`)

  for (const fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
    const iso = aIso(fecha)
    const existente = mapa.get(iso)
    if (existente) {
      if (feriados.has(iso)) {
        existente.noLaborable = true
        existente.disponible = false
      }
      resultado.push(existente)
      continue
    }
    resultado.push({
      fecha: iso,
      capacidadMaxima: 0,
      cuposDisponibles: 0,
      disponible: false,
      noLaborable: fecha.getDay() === 0 || feriados.has(iso),
    })
  }

  return resultado
}

async function obtenerFeriados(fechaInicio, fechaFin) {
  const feriados = new Set()
  const anios = new Set([fechaInicio.slice(0, 4), fechaFin.slice(0, 4)])

  for (const anio of anios) {
    const clave = `feriados_${anio}`
    let lista = leerCache(clave)
    if (!lista) {
      try {
        lista = desenvolver(await client.get('/dias-no-laborables', { params: { anio } }))
        guardarCache(clave, lista, 24 * 60 * 60 * 1000)
      } catch {
        lista = []
      }
    }
    lista.forEach((dia) => feriados.add(dia.fecha))
  }

  return feriados
}

export async function listarClinicas() {
  if (USE_MOCK) return clinicasMock
  const cacheado = leerCache('clinicas')
  if (cacheado) return cacheado
  const clinicas = desenvolver(await client.get('/clinicas'))
  guardarCache('clinicas', clinicas, 6 * 60 * 60 * 1000)
  return clinicas
}

export async function listarPacientes({ page = 0, size = 50 } = {}) {
  if (USE_MOCK) return pacientesMock
  const respuesta = await client.get('/pacientes', { params: { page, size } })
  const pagina = desenvolver(respuesta)
  return pagina?.content ?? pagina
}

export async function consultarDisponibilidad({ clinicaIds = [], fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) {
    return disponibilidadMock(fechaInicio, fechaFin, Math.max(1, clinicaIds.length))
  }
  const params = { fechaInicio, fechaFin }
  if (clinicaIds.length === 1) params.clinicaId = clinicaIds[0]
  const clave = `cupos_mes_${fechaInicio}_${fechaFin}_${clinicaIds.join('-') || 'all'}`
  const cacheado = leerCache(clave)
  if (cacheado) return cacheado
  const agrupado = agruparCuposPorFecha(desenvolver(await client.get('/cupos', { params })))
  const feriados = await obtenerFeriados(fechaInicio, fechaFin)
  const resultado = completarRango(agrupado, fechaInicio, fechaFin, feriados)
  guardarCache(clave, resultado, 30 * 1000)
  return resultado
}

export async function listarCuposDelDia(fecha, clinicaIds = []) {
  if (USE_MOCK) {
    return cuposDiaMock(fecha, clinicaIds)
  }
  const params = { fechaInicio: fecha, fechaFin: fecha }
  if (clinicaIds.length === 1) params.clinicaId = clinicaIds[0]
  const clave = `cupos_dia_${fecha}_${clinicaIds.join('-') || 'all'}`
  const cacheado = leerCache(clave)
  if (cacheado) return cacheado
  const cupos = desenvolver(await client.get('/cupos', { params }))
  guardarCache(clave, cupos, 30 * 1000)
  return cupos
}

export async function listarCitasDePaciente(pacienteId) {
  if (USE_MOCK) {
    return citasMock.filter((cita) => cita.pacienteId === Number(pacienteId))
  }
  return desenvolver(await client.get(`/citas/paciente/${pacienteId}`))
}

export async function buscarPacientes(filtro = '') {
  if (USE_MOCK) {
    const termino = filtro.trim().toLowerCase()
    return pacientesMock.filter(
      (paciente) =>
        !termino ||
        [paciente.dpi, paciente.numeroExpediente, paciente.nombres, paciente.apellidos].some(
          (valor) => valor.toLowerCase().includes(termino),
        ),
    )
  }

  const respuesta = await client.get('/pacientes/buscar', { params: { filtro } })
  const pagina = desenvolver(respuesta)
  return pagina?.content ?? pagina
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

export async function agendarCita({ pacienteId, cupo }) {
  if (USE_MOCK) {
    const paciente = pacientesMock.find((registro) => registro.id === Number(pacienteId))
    if (!paciente) throw new Error('Paciente no encontrado')

    if (!cupo || cupo.cuposDisponibles < 1) {
      const error = new Error(
        'No hay cupos disponibles para la fecha seleccionada. Seleccione otra fecha u otro médico.',
      )
      error.status = 409
      throw error
    }

    reservarCupoMock(cupo.id)
    return construirCitaMock({ id: 5000 + (Date.now() % 100000), paciente, cupo })
  }

  const cita = desenvolver(
    await client.post('/citas', { pacienteId: Number(pacienteId), cupoDiarioId: cupo.id }),
  )
  limpiarCachePrefijo('cupos')
  return cita
}

export async function hacerCheckIn(citaId) {
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

  return desenvolver(await client.post('/turnos/check-in', { citaId: Number(citaId) }))
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

export async function llamarTurno(turnoId) {
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
  return desenvolver(await client.post(`/turnos/${turnoId}/llamar`))
}

export async function marcarNoResponde(turnoId, motivo) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (turno) {
      turno.estado = 'no_responde'
      turno.motivo = motivo
    }
    return turno ?? { id: Number(turnoId), estado: 'no_responde' }
  }
  return desenvolver(
    await client.post(`/turnos/${turnoId}/no-responde`, null, { params: { motivo } }),
  )
}

export async function reintegrarTurno(turnoId, motivo) {
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
  return desenvolver(await client.post(`/turnos/${turnoId}/reintegrar`, { motivo }))
}

export async function marcarAtendido(turnoId) {
  if (USE_MOCK) {
    const turno = turnosMock.find((registro) => registro.id === Number(turnoId))
    if (turno) turno.estado = 'atendido'
    return turno ?? { id: Number(turnoId), estado: 'atendido' }
  }
  return desenvolver(await client.post(`/turnos/${turnoId}/atendido`))
}

export async function pasarSiguiente(clinicaId) {
  if (USE_MOCK) {
    const siguiente = turnosMock.find(
      (turno) => turno.estado === 'en_espera' && turno.clinicaId === Number(clinicaId),
    )
    if (siguiente) return llamarTurno(siguiente.id)
    tableroMock.turnoActual += 1
    return { numeroTurno: tableroMock.turnoActual, clinicaId, estado: 'llamado' }
  }

  const turnos = await listarTurnosClinica(clinicaId)
  const siguiente = turnos.find((turno) => turno.estado === 'en_espera')
  if (!siguiente) {
    throw new Error('No hay turnos en espera en esta clínica')
  }
  return llamarTurno(siguiente.id)
}

export async function obtenerEstadoTablero() {
  return { activo: tableroMock.activo }
}

export async function cambiarEstadoTablero(activo) {
  tableroMock.activo = activo
  return { activo }
}
