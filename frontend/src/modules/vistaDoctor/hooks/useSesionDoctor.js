import { useCallback, useState } from 'react'
import {
  crearSesionDoctor,
  guardarSesionDoctor,
  leerSesionDoctor,
  limpiarSesionDoctor,
} from '../identidadDoctor'

export function useSesionDoctor() {
  const [sesion, setSesion] = useState(() => leerSesionDoctor())

  const identificar = useCallback((medico, clinica, asignacion) => {
    const nueva = crearSesionDoctor({ medico, clinica, asignacion })
    if (!nueva) return null
    guardarSesionDoctor(nueva)
    setSesion(nueva)
    return nueva
  }, [])

  const cerrar = useCallback(() => {
    limpiarSesionDoctor()
    setSesion(null)
  }, [])

  return { sesion, identificar, cerrar }
}
