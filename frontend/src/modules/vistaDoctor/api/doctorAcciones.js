export const ACCION_LLAMAR = 'llamar'
export const ACCION_NO_RESPONDE = 'no_responde'
export const ACCION_ATENDER = 'atender'

const ESTADOS_LLAMABLES = ['en_espera', 'reintegrado', 'llamado', 'no_responde']

export function puedeLlamar(estado) {
  return ESTADOS_LLAMABLES.includes(estado)
}

export function puedeNoResponder(estado) {
  return estado === 'llamado'
}

export function puedeAtender(estado) {
  return estado === 'llamado'
}

export function esAccionPermitida(accion, estado) {
  if (accion === ACCION_LLAMAR) return puedeLlamar(estado)
  if (accion === ACCION_NO_RESPONDE) return puedeNoResponder(estado)
  if (accion === ACCION_ATENDER) return puedeAtender(estado)
  return false
}

export function aplicarLlamado(turno, ahora = Date.now()) {
  return {
    ...turno,
    estado: 'llamado',
    intentosLlamado: Number(turno.intentosLlamado ?? 0) + 1,
    horaLlamado: new Date(ahora).toISOString(),
    horaAtendido: null,
    motivo: null,
  }
}

export function aplicarNoResponde(turno) {
  return {
    ...turno,
    estado: 'no_responde',
    motivo: 'No respondió tras el llamado',
  }
}

export function aplicarAtendido(turno, ahora = Date.now()) {
  return {
    ...turno,
    estado: 'atendido',
    horaAtendido: new Date(ahora).toISOString(),
  }
}

export function crearAtencion({ medico, turno, ahora = Date.now() }) {
  return {
    medicoId: medico.id,
    colegiado: medico.colegiado,
    nombreMedico: medico.nombre,
    turnoId: turno.id,
    correlativo: turno.correlativo,
    paciente: turno.pacienteNombre,
    expediente: turno.expediente,
    atendidoEn: new Date(ahora).toISOString(),
  }
}

export const COOLDOWN_MS = 10000

export function calcularRestanteMs(ultimoLlamadoEn, ahora = Date.now()) {
  const ultimo = Number(ultimoLlamadoEn)
  if (!Number.isFinite(ultimo) || ultimo <= 0) return 0
  return Math.max(0, COOLDOWN_MS - Math.max(0, ahora - ultimo))
}

export function ordenarCola(turnos = []) {
  return turnos.slice().sort((a, b) => {
    const ordenA = Number.isFinite(Number(a.orden)) ? Number(a.orden) : Number.MAX_SAFE_INTEGER
    const ordenB = Number.isFinite(Number(b.orden)) ? Number(b.orden) : Number.MAX_SAFE_INTEGER
    return ordenA - ordenB
  })
}

export function primerElegible(turnos = []) {
  return (
    ordenarCola(turnos).find(
      (turno) => turno.estado === 'en_espera' || turno.estado === 'reintegrado',
    ) ?? null
  )
}

export function turnoActivo(turnos = []) {
  return ordenarCola(turnos).find((turno) => turno.estado === 'llamado') ?? null
}

export function evaluarLlamado(turno, turnos, ahora = Date.now(), ultimoLlamadoEn = 0) {
  if (!turno) {
    return { permitido: false, codigo: 'TRANSICION_INVALIDA', motivo: 'Turno no disponible.' }
  }

  if (!['en_espera', 'reintegrado', 'llamado', 'no_responde'].includes(turno.estado)) {
    return {
      permitido: false,
      codigo: 'TRANSICION_INVALIDA',
      motivo: 'El estado actual del turno no permite llamados.',
    }
  }

  const activo = turnoActivo(turnos)
  if (activo && String(activo.id) !== String(turno.id)) {
    return {
      permitido: false,
      codigo: 'TURNO_ACTIVO',
      motivo: `Espere a finalizar el turno ${activo.correlativo ?? ''}.`,
    }
  }

  if (turno.estado === 'en_espera' || turno.estado === 'reintegrado') {
    const siguiente = primerElegible(turnos)
    if (siguiente && String(siguiente.id) !== String(turno.id)) {
      return {
        permitido: false,
        codigo: 'ORDEN_COLA',
        motivo: `El siguiente turno disponible es ${siguiente.correlativo ?? ''}.`,
      }
    }
  }

  const restante = calcularRestanteMs(ultimoLlamadoEn, ahora)
  if (restante > 0) {
    const segundos = Math.ceil(restante / 1000)
    return {
      permitido: false,
      codigo: 'COOLDOWN',
      motivo: `Espere ${segundos} s antes de volver a llamar.`,
      cooldownSegundos: segundos,
    }
  }

  return { permitido: true, codigo: '', motivo: '', cooldownSegundos: 0 }
}

export function calcularEstadisticas(turnos = []) {
  const pendientes = turnos.filter(
    (turno) => turno.estado === 'llamado' || turno.estado === 'no_responde',
  ).length
  const enEspera = turnos.filter(
    (turno) => turno.estado === 'en_espera' || turno.estado === 'reintegrado',
  ).length
  const atendidos = turnos.filter((turno) => turno.estado === 'atendido').length

  return {
    pendientes,
    enEspera,
    atendidos,
    total: turnos.length,
  }
}
