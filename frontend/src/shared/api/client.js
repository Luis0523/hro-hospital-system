import axios from 'axios'

const IDENTIDAD_POR_DEFECTO = {
  idExterno: 'enfermeria-01',
  rol: 'enfermeria',
  nombre: 'Enfermera de Consulta Externa',
}

function leerIdentidad() {
  try {
    const guardado = JSON.parse(localStorage.getItem('hro_usuario') || 'null')
    return { ...IDENTIDAD_POR_DEFECTO, ...(guardado || {}) }
  } catch {
    return IDENTIDAD_POR_DEFECTO
  }
}

function leerEstacionId() {
  try {
    const estacion = JSON.parse(localStorage.getItem('hro_estacion') || 'null')
    return estacion?.id ?? null
  } catch {
    return null
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const identidad = leerIdentidad()
  config.headers['X-Usuario-Id'] = identidad.idExterno ?? identidad.id
  config.headers['X-Usuario-Rol'] = identidad.rol ?? 'enfermeria'
  if (identidad.nombre) {
    config.headers['X-Usuario-Nombre'] = identidad.nombre
  }

  const token = localStorage.getItem('hro_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const estacionId = leerEstacionId()
  if (estacionId != null) {
    config.headers['X-Estacion-Id'] = String(estacionId)
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const mensaje =
      error.response?.data?.message || error.message || 'Error de comunicación con el servidor'
    const normalizado = new Error(mensaje)
    normalizado.status = status
    return Promise.reject(normalizado)
  },
)

export default client
