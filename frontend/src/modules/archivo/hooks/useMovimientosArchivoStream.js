import { useCallback, useEffect, useState } from 'react'
import { crearClienteTurnos } from '@/shared/ws/turnosSocket'
import { mapearEventoMovimiento } from '../api/archivoMappers'
import { crearEmisorMovimientosMock } from '../api/dashboardMock'
import { USANDO_DATOS_MOCK } from '../api/dashboardArchivoApi'

// Topic confirmado del backend para la bitácora de movimientos de Archivo.
// NO usar /topic/tablero (es de turnos).
export const TOPIC_ARCHIVO_MOVIMIENTOS = '/topic/archivo/movimientos'

const MAX_EVENTOS = 50

// Suscripción en tiempo real a los movimientos del ciclo. En modo mock (o test)
// usa un emisor simulado; en modo real se conecta por STOMP/SockJS. Limpia
// siempre el timer/socket al desmontar.
export function useMovimientosArchivoStream({
  topic = TOPIC_ARCHIVO_MOVIMIENTOS,
  habilitado = true,
} = {}) {
  const [eventos, setEventos] = useState([])
  const [estado, setEstado] = useState('detenido')
  const [intento, setIntento] = useState(0)

  const reconectar = useCallback(() => setIntento((actual) => actual + 1), [])

  useEffect(() => {
    if (!habilitado) {
      setEstado('detenido')
      return undefined
    }

    const agregar = (evento) => {
      if (!evento) return
      setEventos((previos) => [evento, ...previos].slice(0, MAX_EVENTOS))
    }

    if (USANDO_DATOS_MOCK) {
      setEstado('simulado')
      const emisor = crearEmisorMovimientosMock({ onEvento: agregar })
      return () => emisor.detener()
    }

    setEstado('reconectando')
    const cliente = crearClienteTurnos({
      topics: [topic],
      onMensaje: (mensaje) => agregar(mapearEventoMovimiento(mensaje)),
      onConectado: () => setEstado('en_vivo'),
      onDesconectado: () => setEstado('reconectando'),
      onError: () => setEstado('reconectando'),
    })
    cliente.activate()

    return () => cliente.deactivate()
  }, [topic, habilitado, intento])

  return { eventos, estado, reconectar }
}
