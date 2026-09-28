import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { normalizarEstadoTablero } from './tableroApi'

// SockJS exige esquema http/https (él hace el upgrade a ws/wss según la página).
// Aceptamos ws(s):// por comodidad y lo convertimos.
export function normalizarUrlSockjs(url) {
  return String(url).replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
}

export const WS_URL = normalizarUrlSockjs(import.meta.env.VITE_WS_URL || '/api/v1/ws-turnos')

export const TOPIC_TABLERO = '/topic/tablero'

/** Topic por estación: cada tablero/TV recibe solo el área de su estación. */
export function topicEstacion(estacionId) {
  return `/topic/estacion/${estacionId}`
}

// Suscripción principal actual: /topic/tablero (recibe todas las asignaciones).
// topicAsignacion se conserva para una futura optimización por pantalla,
// suscribiéndose únicamente a sus asignaciones específicas.
export function topicAsignacion(asignacionDiariaEspacioId) {
  return `/topic/clinica/${asignacionDiariaEspacioId}`
}

const RECONNECT_DELAY = 5000

export function crearClienteTablero({
  onMensaje,
  onConnected,
  onDisconnected,
  onError,
  topic = TOPIC_TABLERO,
  reconnectDelay = RECONNECT_DELAY,
} = {}) {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay,
  })

  let suscripcion = null

  const emitir = (cuerpo) => {
    if (!onMensaje) return
    let crudo
    try {
      crudo = JSON.parse(cuerpo)
    } catch {
      return
    }
    const estado = normalizarEstadoTablero(crudo)
    if (estado) onMensaje(estado)
  }

  client.onConnect = () => {
    if (suscripcion) {
      try {
        suscripcion.unsubscribe()
      } catch {
        suscripcion = null
      }
    }
    suscripcion = client.subscribe(
      typeof topic === 'function' ? topic() : topic,
      (mensaje) => emitir(mensaje.body),
    )
    if (onConnected) onConnected()
  }

  client.onStompError = (frame) => {
    if (onError) onError(frame?.headers?.message || 'Error STOMP')
  }

  client.onWebSocketError = (event) => {
    if (onError) onError(event?.message || 'No se pudo conectar con el tablero')
  }

  client.onWebSocketClose = () => {
    suscripcion = null
    if (onDisconnected) onDisconnected()
  }

  return {
    activar() {
      client.activate()
    },
    desactivar() {
      return client.deactivate()
    },
    get cliente() {
      return client
    },
  }
}
