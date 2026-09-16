import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || '/api/v1/ws'

export const TOPIC_TABLERO = '/topic/tablero'

export function topicClinica(clinicaId) {
  return `/topic/clinica/${clinicaId}`
}

export function crearClienteTurnos({
  topics = [TOPIC_TABLERO],
  onMensaje,
  onConectado,
  onError,
} = {}) {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
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

  return client
}
