import client from '@/shared/api/client'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

/** Catálogo de páginas/áreas del SIGHO (fallback local si el backend no responde). */
export const PAGINAS = [
  { clave: 'archivo', nombre: 'Estación de Archivo' },
  { clave: 'enfermeria', nombre: 'Estación de Enfermería' },
  { clave: 'administracion', nombre: 'Panel de Administración' },
  { clave: 'jefe_enfermeria', nombre: 'Área Jefe de Enfermería' },
]

/** Mapeo por defecto (coincide con el seed de la migración V17). */
export const MAPEO_DEFECTO = {
  archivo: ['archivo'],
  enfermeria: ['enfermeria'],
  medico: ['enfermeria'],
  personal_citas: ['enfermeria'],
  jefe_enfermeria: ['jefe_enfermeria'],
  administrador: ['archivo', 'enfermeria', 'administracion', 'jefe_enfermeria'],
}

/** Ruta de cada área y prioridad para elegir la pantalla inicial de un rol. */
export const RUTA_POR_AREA = {
  archivo: '/archivo',
  enfermeria: '/enfermeria',
  administracion: '/administracion',
  jefe_enfermeria: '/jefe-enfermeria',
}
export const PRIORIDAD_AREAS = ['administracion', 'enfermeria', 'archivo', 'jefe_enfermeria']

/** Pantalla inicial de un rol a partir de un mapeo rol → páginas dado. */
export function inicioSegunMapa(mapa, rol) {
  const paginas = (mapa && mapa[rol]) || []
  const area = PRIORIDAD_AREAS.find((candidata) => paginas.includes(candidata))
  return area ? RUTA_POR_AREA[area] : '/sin-acceso'
}

export async function listarPaginas() {
  if (USE_MOCK) return PAGINAS
  return desenvolver(await client.get('/paginas'))
}

export async function listarRolesPaginas() {
  if (USE_MOCK) {
    return Object.entries(MAPEO_DEFECTO).map(([rol, paginas]) => ({ rol, paginas }))
  }
  return desenvolver(await client.get('/roles-paginas'))
}

export async function actualizarRolPaginas(rol, paginas) {
  if (USE_MOCK) return { rol, paginas }
  return desenvolver(
    await client.put(`/roles-paginas/${encodeURIComponent(rol)}`, { paginas }),
  )
}
