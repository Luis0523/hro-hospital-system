export const ESTADOS_TURNO = Object.freeze({
  en_espera: { etiqueta: 'En espera' },
  llamado: { etiqueta: 'Llamado' },
  no_responde: { etiqueta: 'No respondió' },
  atendido: { etiqueta: 'Atendido' },
  reintegrado: { etiqueta: 'Reintegrado' },
  desconocido: { etiqueta: 'Sin estado' },
})

export function normalizarEstado(estado) {
  const clave = String(estado ?? '')
    .trim()
    .toLowerCase()
  return ESTADOS_TURNO[clave] ? clave : 'desconocido'
}

export function etiquetaEstado(estado) {
  return ESTADOS_TURNO[normalizarEstado(estado)].etiqueta
}

export function normalizarMedico(medico) {
  if (!medico) return null
  return {
    id: String(medico.id ?? ''),
    nombre: String(medico.nombres ?? medico.nombre ?? '').trim(),
    colegiado: String(medico.numeroColegiado ?? medico.colegiado ?? '').trim(),
    usuarioReferenciaId: medico.usuarioReferenciaId ?? null,
    activo: Boolean(medico.activo),
  }
}

export function normalizarAsignacion(asignacion) {
  if (!asignacion) return null
  return {
    id: Number(asignacion.id),
    espacioFisicoId: asignacion.espacioFisicoId ?? null,
    subespecialidadId: asignacion.subespecialidadId ?? null,
    subespecialidadNombre: String(asignacion.subespecialidadNombre ?? '').trim(),
    especialidadId: asignacion.especialidadId ?? null,
    especialidadNombre: String(asignacion.especialidadNombre ?? '').trim(),
  }
}

export function normalizarClinica(espacio) {
  if (!espacio) return null
  return {
    codigo: String(espacio.codigo ?? '').trim(),
    espacioFisicoId: String(espacio.espacioFisicoId ?? espacio.id ?? '').trim(),
    numero: String(espacio.numero ?? '').trim(),
    nivel: espacio.nivel ?? null,
    nombre: String(espacio.nombre ?? '').trim(),
    ubicacion: String(espacio.ubicacion ?? '').trim(),
    activo: Boolean(espacio.activo),
    asignacion: normalizarAsignacion(espacio.asignacion),
  }
}

export function normalizarTurno(turno) {
  if (!turno) return null
  const correlativo = String(turno.numeroTurno ?? turno.correlativo ?? '').trim()
  const intentos = Number(turno.intentosLlamado ?? 0)
  const orden = Number(turno.orden)

  return {
    id: turno.id,
    correlativo: correlativo || null,
    orden: Number.isFinite(orden) ? orden : null,
    estado: normalizarEstado(turno.estado),
    expediente: String(turno.pacienteExpediente ?? turno.expediente ?? '').trim(),
    pacienteNombre: String(turno.pacienteNombre ?? turno.nombrePaciente ?? '').trim(),
    identificado: turno.identificado === true,
    intentosLlamado: Number.isFinite(intentos) ? intentos : 0,
    motivo: turno.motivo ?? null,
    horaGenerado: turno.horaGenerado ?? null,
    horaLlamado: turno.horaLlamado ?? null,
    horaAtendido: turno.horaAtendido ?? null,
  }
}

export function minutosDeEspera(turno, ahora = Date.now()) {
  if (!turno || turno.estado === 'atendido') return null
  const referencia = turno.horaLlamado ?? turno.horaGenerado
  if (!referencia) return null
  const fecha = new Date(referencia).getTime()
  if (!Number.isFinite(fecha)) return null
  return Math.max(0, Math.floor((ahora - fecha) / 60000))
}

export function formatearEspera(minutos) {
  if (minutos == null || !Number.isFinite(minutos)) return '—'
  if (minutos < 1) return 'menos de 1 min'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}
