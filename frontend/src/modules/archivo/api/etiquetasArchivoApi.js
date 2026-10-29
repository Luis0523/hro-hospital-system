import client from '@/shared/api/client'

// Catálogo de etiquetas operativas de Archivo y su asignación por estación.
// En modo mock (dev/test) se conserva un catálogo en memoria por sesión.
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

/** Etiqueta histórica: permite que el POS siga funcionando si el backend aún no
 * tiene el endpoint de etiquetas (despliegue escalonado). */
export const ETIQUETA_CLINICA_MUJER = {
  id: 'clinica_mujer',
  codigo: 'clinica_mujer',
  nombre: 'Clínica de la Mujer',
  descripcion:
    'Active esta etiqueta si el expediente pertenece a la Clínica de la Mujer. Se guardará para la estadística diaria.',
  icono: 'female',
  color: 'rose',
  orden: 10,
}

const catalogoMock = [
  { ...ETIQUETA_CLINICA_MUJER, id: 1, activo: true },
  {
    id: 2,
    codigo: 'emergencia',
    nombre: 'Emergencia',
    descripcion: 'Expedientes que ingresan por Emergencia.',
    icono: 'emergency',
    color: 'amber',
    orden: 20,
    activo: true,
  },
]

const asignacionesMock = new Map()

function etiquetasAsignadasMock(estacionId) {
  const clave = Number(estacionId)
  if (!asignacionesMock.has(clave)) asignacionesMock.set(clave, [1])
  const ids = asignacionesMock.get(clave)
  return ids
    .map((id) => catalogoMock.find((e) => e.id === id))
    .filter(Boolean)
    .map((etiqueta, indice) => ({ ...etiqueta, orden: indice + 1 }))
}

export async function listarEtiquetasEstacion(estacionId) {
  if (!estacionId) return []
  if (USE_MOCK) return etiquetasAsignadasMock(estacionId)
  try {
    return desenvolver(await client.get(`/etiquetas-archivo/estaciones/${estacionId}`))
  } catch (fallo) {
    // Compatibilidad con backends desplegados que aún no publican el endpoint:
    // se conserva la etiqueta histórica para no romper el registro de salidas.
    if (esEndpointAusente(fallo)) return [ETIQUETA_CLINICA_MUJER]
    throw fallo
  }
}

export async function listarCatalogoEtiquetas({ estado = 'todos' } = {}) {
  if (USE_MOCK) {
    return catalogoMock
      .filter((e) => estado === 'todos' || (estado === 'activos' ? e.activo : !e.activo))
      .map((e) => ({ ...e }))
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  }
  return desenvolver(await client.get('/etiquetas-archivo', { params: { estado } }))
}

export async function crearEtiquetaArchivo(datos) {
  if (USE_MOCK) {
    const nueva = {
      id: Math.max(0, ...catalogoMock.map((e) => e.id)) + 1,
      activo: true,
      orden: datos.orden ?? 0,
      icono: datos.icono || 'label',
      color: datos.color || 'primary',
      ...datos,
    }
    catalogoMock.push(nueva)
    return { ...nueva }
  }
  return desenvolver(await client.post('/etiquetas-archivo', datos))
}

export async function actualizarEtiquetaArchivo(id, datos) {
  if (USE_MOCK) {
    const indice = catalogoMock.findIndex((e) => e.id === id)
    if (indice < 0) throw Object.assign(new Error('Etiqueta no encontrada'), { status: 404 })
    catalogoMock[indice] = { ...catalogoMock[indice], ...datos }
    return { ...catalogoMock[indice] }
  }
  return desenvolver(await client.put(`/etiquetas-archivo/${id}`, datos))
}

export async function desactivarEtiquetaArchivo(id) {
  if (USE_MOCK) return actualizarEtiquetaArchivo(id, { activo: false })
  return desenvolver(await client.delete(`/etiquetas-archivo/${id}`))
}

export async function reactivarEtiquetaArchivo(id) {
  if (USE_MOCK) return actualizarEtiquetaArchivo(id, { activo: true })
  return desenvolver(await client.patch(`/etiquetas-archivo/${id}/reactivar`))
}

export async function listarAsignacionEtiquetas(estacionId) {
  if (!estacionId) return []
  if (USE_MOCK) return etiquetasAsignadasMock(estacionId)
  return desenvolver(await client.get(`/etiquetas-archivo/estaciones/${estacionId}`))
}

export async function guardarAsignacionEtiquetas(estacionId, etiquetaIds) {
  if (USE_MOCK) {
    asignacionesMock.set(Number(estacionId), [...etiquetaIds])
    return etiquetasAsignadasMock(estacionId)
  }
  return desenvolver(
    await client.put(`/etiquetas-archivo/estaciones/${estacionId}`, { etiquetaIds }),
  )
}

function esEndpointAusente(fallo) {
  const mensaje = String(fallo?.message ?? '')
  return (
    fallo?.status === 404 || fallo?.status === 405 || /no static resource|not found/i.test(mensaje)
  )
}
