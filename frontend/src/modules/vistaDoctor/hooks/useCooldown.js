import { useEffect, useState } from 'react'
import { COOLDOWN_MS, calcularRestanteMs } from '../api/doctorAcciones'

export function useCooldown(ultimoLlamadoEn) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (!ultimoLlamadoEn) return undefined

    let intervalo
    const actualizar = () => {
      const momento = Date.now()
      setAhora(momento)
      if (momento - Number(ultimoLlamadoEn) >= COOLDOWN_MS) {
        clearInterval(intervalo)
      }
    }

    intervalo = setInterval(actualizar, 500)
    actualizar()
    return () => clearInterval(intervalo)
  }, [ultimoLlamadoEn])

  const restanteMs = calcularRestanteMs(ultimoLlamadoEn, ahora)
  return {
    ahora,
    restanteMs,
    restanteSegundos: Math.ceil(restanteMs / 1000),
  }
}
