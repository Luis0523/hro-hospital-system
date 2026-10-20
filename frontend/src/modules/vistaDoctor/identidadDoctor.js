export const CLAVE_SESION_DOCTOR = 'hro_doctor'
export const VERSION_SESION_DOCTOR = 1

function obtenerAlmacen(almacen) {
  if (almacen) return almacen
  try {
    return globalThis.sessionStorage
  } catch {
    return null
  }
}

function texto(valor) {
  return String(valor ?? '').trim()
}

function normalizarMedico(medico) {
  if (!medico) return null
  const id = texto(medico.id)
  const nombre = texto(medico.nombre)
  const colegiado = texto(medico.colegiado)
  if (!id || !nombre || !colegiado) return null
  return {
    id,
    nombre,
    colegiado,
    usuarioReferenciaId: medico.usuarioReferenciaId ?? null,
    activo: Boolean(medico.activo),
  }
}

function normalizarClinica(clinica) {
  if (!clinica) return null
  const espacioFisicoId = texto(clinica.espacioFisicoId)
  if (!espacioFisicoId) return null
  return {
    codigo: texto(clinica.codigo),
    espacioFisicoId,
    numero: texto(clinica.numero),
    nivel: clinica.nivel ?? null,
    nombre: texto(clinica.nombre),
    ubicacion: texto(clinica.ubicacion),
  }
}

function normalizarAsignacion(asignacion) {
  if (!asignacion) return null
  const id = Number(asignacion.id)
  if (!Number.isFinite(id)) return null
  return {
    id,
    subespecialidadId: asignacion.subespecialidadId ?? null,
    subespecialidadNombre: texto(asignacion.subespecialidadNombre),
    especialidadId: asignacion.especialidadId ?? null,
    especialidadNombre: texto(asignacion.especialidadNombre),
  }
}

export function crearSesionDoctor({ medico, clinica, asignacion }) {
  const medicoNormalizado = normalizarMedico(medico)
  const clinicaNormalizada = normalizarClinica(clinica)
  const asignacionNormalizada = normalizarAsignacion(asignacion)
  if (!medicoNormalizado || !clinicaNormalizada || !asignacionNormalizada) return null

  return {
    version: VERSION_SESION_DOCTOR,
    medico: medicoNormalizado,
    clinica: clinicaNormalizada,
    asignacion: asignacionNormalizada,
    guardadoEn: new Date().toISOString(),
  }
}

export function leerSesionDoctor(almacen) {
  const storage = obtenerAlmacen(almacen)
  if (!storage) return null

  try {
    const crudo = storage.getItem(CLAVE_SESION_DOCTOR)
    if (!crudo) return null
    const sesion = JSON.parse(crudo)
    if (!sesion || sesion.version !== VERSION_SESION_DOCTOR) return null
    return crearSesionDoctor(sesion)
  } catch {
    return null
  }
}

export function guardarSesionDoctor(sesion, almacen) {
  const storage = obtenerAlmacen(almacen)
  const normalizada = crearSesionDoctor(sesion ?? {})
  if (!storage || !normalizada) return null

  try {
    storage.setItem(CLAVE_SESION_DOCTOR, JSON.stringify(normalizada))
    return normalizada
  } catch {
    return null
  }
}

export function limpiarSesionDoctor(almacen) {
  const storage = obtenerAlmacen(almacen)
  if (!storage) return
  try {
    storage.removeItem(CLAVE_SESION_DOCTOR)
  } catch {
    return
  }
}

export function sesionCorrespondeA(sesion, clinica, asignacion) {
  if (!sesion || !clinica || !asignacion) return false
  return (
    sesion.clinica?.espacioFisicoId === clinica.espacioFisicoId &&
    Number(sesion.asignacion?.id) === Number(asignacion.id)
  )
}
