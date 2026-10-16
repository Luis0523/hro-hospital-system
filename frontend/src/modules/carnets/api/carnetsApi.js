import client from '@/shared/api/client'

// API del circuito de carnets (Fase 1 Archivo/Enfermería). El backend es la
// fuente de verdad; este módulo solo consume su contrato.

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

/** Catálogo de especialidades activas. */
export async function listarEspecialidades() {
  const lista = desenvolver(await client.get('/especialidades'))
  return (lista ?? []).map((especialidad) => ({
    id: especialidad.id,
    nombre: especialidad.nombre,
    abreviatura: especialidad.abreviatura ?? null,
  }))
}

/** Especialidades con atención activa en la estación para una fecha (día de la semana). */
export async function listarEspecialidadesActivasEstacion(estacionId, { fecha } = {}) {
  return desenvolver(
    await client.get(`/estaciones/${estacionId}/especialidades-activas`, { params: { fecha } }),
  )
}

/** Catálogo de estaciones de enfermería (para el filtro de Archivo). */
export async function listarEstaciones() {
  const lista = desenvolver(await client.get('/estaciones'))
  return (lista ?? []).map((estacion) => ({
    id: estacion.id,
    codigo: estacion.codigo,
    nombre: estacion.nombre,
  }))
}

/** Carnets del día, filtrables por estación, especialidad, estado y clasificación (activo/pasivo). */
export async function listarCarnets({
  fecha,
  estacionId,
  especialidadId,
  estado,
  clasificacion,
} = {}) {
  return desenvolver(
    await client.get('/carnets', {
      params: { fecha, estacionId, especialidadId, estado, clasificacion },
    }),
  )
}

/** Configuración de Archivo (umbral activo/pasivo). */
export async function obtenerConfiguracionArchivo() {
  return desenvolver(await client.get('/archivo/configuracion'))
}

export async function actualizarConfiguracionArchivo({ umbralActivo }) {
  return desenvolver(await client.put('/archivo/configuracion', { umbralActivo }))
}

/** Reporte de salida de archivo (expedientes con salida de archivo de una fecha). */
export async function obtenerSalidaCarnets({ fecha } = {}) {
  return desenvolver(await client.get('/carnets/salida', { params: { fecha } }))
}

/** Descarga el PDF del reporte de salida de archivo (blob). */
export async function descargarSalidaCarnetsPdf({ fecha } = {}) {
  return client.get('/carnets/salida/pdf', { params: { fecha }, responseType: 'blob' })
}

/** Descarga el PDF de salida para un lote concreto de carnets (esta sesión). */
export async function descargarSalidaCarnetsPdfPorIds(ids) {
  return client.post('/carnets/salida/pdf', ids, { responseType: 'blob' })
}

/** Reporte general de expedientes con salida de enfermería (Mesa COEX). */
export async function obtenerSalidaEnfermeriaCarnets({ fecha } = {}) {
  return desenvolver(await client.get('/carnets/salida-enfermeria', { params: { fecha } }))
}

/** Descarga el PDF del reporte de salida de enfermería (sin firmas). */
export async function descargarSalidaEnfermeriaCarnetsPdf({ fecha } = {}) {
  return client.get('/carnets/salida-enfermeria/pdf', { params: { fecha }, responseType: 'blob' })
}

export async function obtenerCarnet(id) {
  return desenvolver(await client.get(`/carnets/${id}`))
}

/**
 * Busca el carnet de un expediente (por defecto hoy) para ver su trazabilidad.
 * Lanza error con `status: 404` si el expediente no tiene carnet ese día.
 */
export async function buscarCarnetPorExpediente(numeroExpediente, { fecha } = {}) {
  return desenvolver(
    await client.get(`/carnets/expediente/${encodeURIComponent(numeroExpediente)}`, {
      params: { fecha },
    }),
  )
}

/**
 * Registra un carnet. Lanza error con `status`:
 * 404 expediente inexistente · 409 duplicado del día · 502 integración hospital.
 */
export async function registrarCarnet({
  numeroExpediente,
  especialidadId,
  estacionId,
  prioritario = false,
  privadoLibertad = false,
}) {
  return desenvolver(
    await client.post('/carnets', {
      numeroExpediente,
      especialidadId,
      estacionId,
      prioritario,
      privadoLibertad,
    }),
  )
}

/** Elimina (borrado físico) un carnet erróneo del día. 400/403 si no aplica. */
export async function eliminarCarnet(id) {
  return desenvolver(await client.delete(`/carnets/${id}`))
}

/**
 * Corrige la especialidad de un carnet del día (le asigna un nuevo correlativo en
 * la especialidad destino). Lanza error con `status` (400/403/404) si no aplica.
 */
export async function corregirEspecialidadCarnet(id, { especialidadId, motivo }) {
  return desenvolver(
    await client.post(`/carnets/${id}/corregir-especialidad`, { especialidadId, motivo }),
  )
}

export async function marcarNoLocalizado(id, observacion) {
  return desenvolver(await client.post(`/carnets/${id}/no-localizado`, { observacion }))
}

export async function salidaArchivoCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/salida-archivo`))
}

export async function salidaEnfermeriaCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/salida-enfermeria`))
}

export async function resguardarCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/resguardar`))
}

/** Etiquetas legibles de cada estado del carnet. */
export const ETIQUETAS_ESTADO_CARNET = {
  registrado: 'Registrado',
  no_localizado: 'No localizado',
  salida_archivo: 'Salida de archivo',
  salida_enfermeria: 'Salida de enfermería',
  resguardado: 'Resguardado en estantería',
}

/** Orden lineal del circuito (no_localizado es una rama, queda fuera). */
export const ORDEN_ESTADO_CARNET = {
  registrado: 0,
  salida_archivo: 1,
  salida_enfermeria: 2,
  resguardado: 3,
}
