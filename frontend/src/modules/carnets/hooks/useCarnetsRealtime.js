import { useEffect, useRef } from 'react'
import { crearClienteTurnos } from '@/shared/ws/turnosSocket'

// Suscripción en tiempo real a los topics de carnets, con polling de respaldo.
// El backend publica en `/topic/archivo` y `/topic/estacion/{id}` al registrar
// un carnet y en cada transición.
export function useCarnetsRealtime({ topics = [], onEvento, intervaloRespaldoMs = 15000 } = {}) {
  const onEventoRef = useRef(onEvento)
  useEffect(() => {
    onEventoRef.current = onEvento
  }, [onEvento])

  const topicsKey = topics.filter(Boolean).join('|')

  useEffect(() => {
    if (!topicsKey) return undefined
    let client
    try {
      client = crearClienteTurnos({
        topics: topicsKey.split('|'),
        onMensaje: (payload) => onEventoRef.current?.(payload),
      })
      client.activate()
    } catch {
      // Sin socket disponible se mantiene el polling de respaldo.
      client = null
    }
    return () => {
      client?.deactivate?.()
    }
  }, [topicsKey])

  useEffect(() => {
    if (!intervaloRespaldoMs) return undefined
    const id = setInterval(() => onEventoRef.current?.(null), intervaloRespaldoMs)
    return () => clearInterval(id)
  }, [intervaloRespaldoMs])
}
