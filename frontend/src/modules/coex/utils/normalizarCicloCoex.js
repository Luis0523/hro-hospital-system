// Normalizador local DTO -> modelo interno de Mesa COEX.
//
// Desacopla los componentes de la forma exacta del `ExpedienteCicloResponseDTO`
// del backend. La UI y los hooks consumen siempre el modelo interno (misma forma
// que una fila de jornada), de modo que un cambio de fuente no obligue a tocar
// componentes.
//
// El DTO actual NO entrega `subespecialidadId`, `subespecialidadNombre`,
// `horaEstimada` ni `ubicacionBase`. Se mapean explícitamente a `null` para no
// inventar información: cuando el backend los incluya, este mapper los tomará.

function componerPacienteNombre(paciente) {
  if (!paciente || typeof paciente !== 'object') return null
  const partes = [paciente.nombres, paciente.apellidos].filter(
    (parte) => typeof parte === 'string' && parte.trim() !== '',
  )
  return partes.length > 0 ? partes.join(' ') : null
}

// Devuelve una fila del modelo interno, o `null` si el DTO no es utilizable.
export function normalizarCicloCoex(dto) {
  if (!dto || typeof dto !== 'object') return null

  const tieneIdentidad =
    dto.id != null || dto.citaId != null || dto.expedienteId != null
  if (!tieneIdentidad) return null

  const paciente = dto.paciente && typeof dto.paciente === 'object' ? dto.paciente : null

  return {
    cicloId: dto.id ?? null,
    citaId: dto.citaId ?? null,
    expedienteId: dto.expedienteId ?? null,
    numeroExpediente: dto.numeroExpediente ?? null,
    pacienteId: paciente?.id ?? null,
    pacienteNombre: componerPacienteNombre(paciente),
    dpi: paciente?.dpi ?? null,
    subespecialidadId: dto.subespecialidadId ?? null,
    subespecialidadNombre: dto.subespecialidadNombre ?? null,
    horaEstimada: dto.horaEstimada ?? null,
    estadoActual: dto.estadoActual ?? null,
    ubicacionBase: dto.ubicacionBase ?? null,
  }
}

// Normaliza una lista tolerando entradas inválidas (se descartan).
export function normalizarCiclosCoex(lista) {
  if (!Array.isArray(lista)) return []
  return lista.map(normalizarCicloCoex).filter((fila) => fila != null)
}
