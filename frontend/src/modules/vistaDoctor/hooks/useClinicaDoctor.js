import { useCallback, useEffect, useState } from 'react'
import { resolverClinicaPorQr } from '../api/doctorApi'

const ESTADO_INICIAL = {
  estado: 'loading',
  clinica: null,
  asignacion: null,
  error: null,
}

export function useClinicaDoctor(espacioFisicoId) {
  const [resultado, setResultado] = useState(ESTADO_INICIAL)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    setResultado(ESTADO_INICIAL)

    resolverClinicaPorQr(espacioFisicoId)
      .then(({ clinica, asignacion }) => {
        if (!activo) return
        setResultado({ estado: 'listo', clinica, asignacion, error: null })
      })
      .catch((error) => {
        if (!activo) return
        setResultado({ estado: 'error', clinica: null, asignacion: null, error })
      })

    return () => {
      activo = false
    }
  }, [espacioFisicoId, intento])

  const reintentar = useCallback(() => {
    setIntento((valor) => valor + 1)
  }, [])

  return { ...resultado, reintentar }
}
