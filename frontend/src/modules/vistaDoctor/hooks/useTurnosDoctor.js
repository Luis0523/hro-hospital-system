import { useCallback, useEffect, useState } from 'react'
import { obtenerCola } from '../api/doctorApi'

const ESTADO_INICIAL = {
  estado: 'idle',
  turnos: [],
  ultimoLlamadoEn: 0,
  error: null,
}

export function useTurnosDoctor(asignacion, escenario, medicoId) {
  const [resultado, setResultado] = useState(ESTADO_INICIAL)
  const [intento, setIntento] = useState(0)
  const asignacionId = asignacion?.id ?? null
  const espacioFisicoId = asignacion?.espacioFisicoId ?? null

  useEffect(() => {
    if (asignacionId == null && espacioFisicoId == null) {
      setResultado(ESTADO_INICIAL)
      return undefined
    }

    let activo = true
    setResultado({ estado: 'loading', turnos: [], ultimoLlamadoEn: 0, error: null })

    obtenerCola({ asignacionId, espacioFisicoId, escenario, medicoId })
      .then((cola) => {
        if (!activo) return
        setResultado({
          estado: 'listo',
          turnos: cola.turnos,
          ultimoLlamadoEn: cola.ultimoLlamadoEn,
          error: null,
        })
      })
      .catch((error) => {
        if (!activo) return
        setResultado({ estado: 'error', turnos: [], ultimoLlamadoEn: 0, error })
      })

    return () => {
      activo = false
    }
  }, [asignacionId, espacioFisicoId, escenario, medicoId, intento])

  const recargar = useCallback(() => {
    setIntento((valor) => valor + 1)
  }, [])

  const actualizarEstado = useCallback((cola) => {
    setResultado({
      estado: 'listo',
      turnos: cola.turnos,
      ultimoLlamadoEn: cola.ultimoLlamadoEn ?? 0,
      error: null,
    })
  }, [])

  return { ...resultado, recargar, actualizarEstado }
}
