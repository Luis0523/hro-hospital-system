import client from '@/shared/api/client'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

/** Catálogo de páginas/áreas del SIGHO (fallback local si el backend no responde). */
export const PAGINAS = [
  { clave: 'archivo', nombre: 'Estación de Archivo' },
  { clave: 'registro_carnets', nombre: 'Registro de carnets' },
  { clave: 'enfermeria', nombre: 'Estación de Enfermería' },
  { clave: 'coex', nombre: 'Mesa COEX' },
  { clave: 'libro_citas', nombre: 'Libro de Citas' },
  { clave: 'administracion', nombre: 'Panel de Administración' },
  { clave: 'jefe_enfermeria', nombre: 'Área Jefe de Enfermería' },
]

/** Mapeo por defecto (coincide con el seed de las migraciones V17/V20). */
export const MAPEO_DEFECTO = {
  archivo: ['archivo', 'registro_carnets', 'libro_citas'],
  enfermeria: ['enfermeria', 'coex'],
  medico: ['enfermeria'],
  personal_citas: ['libro_citas'],
  jefe_enfermeria: ['jefe_enfermeria'],
  administrador: [
    'archivo',
    'registro_carnets',
    'enfermeria',
    'coex',
    'libro_citas',
    'administracion',
    'jefe_enfermeria',
  ],
}

/** Ruta de cada área y prioridad para elegir la pantalla inicial de un rol. */
export const RUTA_POR_AREA = {
  archivo: '/archivo',
  registro_carnets: '/archivo/registro-carnets',
  enfermeria: '/enfermeria',
  coex: '/coex',
  libro_citas: '/libro-citas',
  administracion: '/administracion',
  jefe_enfermeria: '/jefe-enfermeria',
}
export const PRIORIDAD_AREAS = [
  'administracion',
  'enfermeria',
  'coex',
  'archivo',
  'libro_citas',
  'registro_carnets',
  'jefe_enfermeria',
]

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
  return desenvolver(await client.put(`/roles-paginas/${encodeURIComponent(rol)}`, { paginas }))
}
