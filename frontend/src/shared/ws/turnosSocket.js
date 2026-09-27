import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// SockJS exige esquema http/https (él hace el upgrade a ws/wss según la página).
export function normalizarUrlSockjs(url) {
  return String(url).replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
}

export const WS_URL = normalizarUrlSockjs(import.meta.env.VITE_WS_URL || '/api/v1/ws-turnos')

export const TOPIC_TABLERO = '/topic/tablero'

export function topicClinica(clinicaId) {
  return `/topic/clinica/${clinicaId}`
}

/** Topic por estación: la estación de enfermería se suscribe al área de su estación. */
export function topicEstacion(estacionId) {
  return `/topic/estacion/${estacionId}`
}

export function crearClienteTurnos({
  topics = [TOPIC_TABLERO],
  onMensaje,
  onConectado,
  onDesconectado,
  onError,
  reconnectDelay = 5000,
} = {}) {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay,
  })

  client.onConnect = (frame) => {
    topics.forEach((topic) => {
      client.subscribe(topic, (mensaje) => {
        if (!onMensaje) return
        try {
          onMensaje(JSON.parse(mensaje.body), topic)
        } catch {
          onMensaje(mensaje.body, topic)
        }
      })
    })
    if (onConectado) onConectado(frame)
  }

  client.onStompError = (frame) => {
    if (onError) onError(frame.headers?.message || 'Error STOMP')
  }

  client.onWebSocketError = (event) => {
    if (onError) onError(event?.message || 'Error de WebSocket')
  }

  client.onWebSocketClose = () => {
    if (onDesconectado) onDesconectado()
  }

  return client
}
