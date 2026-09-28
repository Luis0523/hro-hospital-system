// Mapeadores puros de DTOs reales del backend a un modelo interno simple para
// la Estación de Archivo.
//
// IMPORTANTE: aquí SOLO se transforman campos que el backend confirmó. No se
// inventa estado físico, ubicación de estantería, historial físico ni
// identificadores inexistentes. Un DTO de cita NO se convierte en un
// "expediente físico completo".

export function mapearMedico(dto) {
  if (!dto) return null
  return {
    id: dto.id,
    nombre: dto.nombres ?? '',
    numeroColegiado: dto.numeroColegiado ?? null,
    activo: dto.activo ?? true,
  }
}

export function mapearSubespecialidad(dto) {
  if (!dto) return null
  return {
    id: dto.id,
    nombre: dto.nombre ?? '',
    especialidadId: dto.especialidadId ?? null,
    especialidadNombre: dto.especialidadNombre ?? null,
    activo: dto.activo ?? true,
  }
}

export function mapearPaciente(dto) {
  if (!dto) return null
  const nombres = dto.nombres ?? ''
  const apellidos = dto.apellidos ?? ''
  return {
    id: dto.id,
    dpi: dto.dpi ?? null,
    nombres,
    apellidos,
    nombreCompleto: `${nombres} ${apellidos}`.trim(),
    numeroExpediente: dto.numeroExpediente ?? null,
    fechaNacimiento: dto.fechaNacimiento ?? null,
    sexo: dto.sexo ?? null,
    telefono: dto.telefono ?? null,
    direccion: dto.direccion ?? null,
  }
}

// Resultado de GET /expedientes/buscar?codigo= (ExpedienteResponseDTO).
// El backend acepta UUID (QR) o número de expediente (código de barras) y
// devuelve el expediente físico; no se inventan campos.
export function mapearExpedienteBusqueda(dto) {
  if (!dto) return null
  return {
    id: dto.id,
    numeroExpediente: dto.numeroExpediente ?? null,
    codigo: dto.numeroExpediente ?? null,
    ubicacionBase: dto.ubicacionBase ?? null,
    activo: dto.activo ?? null,
  }
}

export function mapearCita(dto) {
  if (!dto) return null
  return {
    id: dto.id,
    pacienteId: dto.pacienteId ?? null,
    pacienteNombreCompleto: dto.pacienteNombreCompleto ?? '',
    pacienteDpi: dto.pacienteDpi ?? null,
    pacienteExpediente: dto.pacienteExpediente ?? null,
    fechaCita: dto.fechaCita ?? null,
    horaEstimada: dto.horaEstimada ?? null,
    horaVentanaInicio: dto.horaVentanaInicio ?? null,
    horaVentanaFin: dto.horaVentanaFin ?? null,
    subespecialidadNombre: dto.subespecialidadNombre ?? null,
    medicoNombre: dto.medicoNombre ?? null,
    estado: dto.estado ?? null,
  }
}
