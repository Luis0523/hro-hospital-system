import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hro_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const mensaje =
      error.response?.data?.message || error.message || 'Error de comunicación con el servidor'
    return Promise.reject(new Error(mensaje))
  },
)

export default client
