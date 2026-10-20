import { useCallback, useRef, useState } from 'react'
import { llamarTurno, marcarAtendido, marcarNoResponde } from '../api/doctorApi'
import {
  ACCION_ATENDER,
  ACCION_LLAMAR,
  ACCION_NO_RESPONDE,
  esAccionPermitida,
} from '../api/doctorAcciones'

const MENSAJES = {
  [ACCION_LLAMAR]: 'Llamado registrado localmente en esta pestaña.',
  [ACCION_NO_RESPONDE]: 'Turno marcado como “No respondió”.',
  [ACCION_ATENDER]: 'Atención registrada localmente en esta pestaña.',
}

export function useAccionesTurno({ medico, asignacion, escenario, onActualizar }) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const bloqueoRef = useRef(false)

  const ejecutar = useCallback(
    async (accion, turno) => {
      if (!medico || !asignacion || !turno) return
      if (bloqueoRef.current) return

      if (!esAccionPermitida(accion, turno.estado)) {
        setError({
          code: 'TRANSICION_INVALIDA',
          message: 'La acción no es válida para el estado actual del turno.',
        })
        return
      }

      bloqueoRef.current = true
      setProcesando(true)
      setError(null)
      setMensaje(null)

      const base = {
        asignacionId: asignacion.id,
        medicoId: medico.id,
        turnoId: turno.id,
        escenario,
      }

      try {
        let resultado
        if (accion === ACCION_LLAMAR) resultado = await llamarTurno(base)
        else if (accion === ACCION_NO_RESPONDE) resultado = await marcarNoResponde(base)
        else if (accion === ACCION_ATENDER) {
          resultado = await marcarAtendido({ ...base, medico })
        } else {
          throw new Error('Acción no reconocida.')
        }

        if (onActualizar) onActualizar(resultado)
        setMensaje(
          accion === ACCION_ATENDER
            ? `Atención registrada localmente para ${turno.pacienteNombre}.`
            : MENSAJES[accion],
        )
      } catch (fallo) {
        setError(fallo)
      } finally {
        bloqueoRef.current = false
        setProcesando(false)
      }
    },
    [medico, asignacion, escenario, onActualizar],
  )

  const limpiar = useCallback(() => {
    setError(null)
    setMensaje(null)
  }, [])

  return { ejecutar, procesando, error, mensaje, limpiar }
}
