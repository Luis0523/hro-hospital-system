import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * Estación de enfermería activa en la sesión.
 * Es de la SESIÓN (rotación de personal), no del usuario: se elige en el "minilogin"
 * y se persiste en localStorage (`hro_estacion`) para enviarla en el header X-Estacion-Id.
 */
const CLAVE = 'hro_estacion'
const EstacionContext = createContext(null)

function leerEstacion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || 'null')
  } catch {
    return null
  }
}

export function EstacionProvider({ children }) {
  const [estacion, setEstacion] = useState(leerEstacion)

  useEffect(() => {
    try {
      if (estacion) localStorage.setItem(CLAVE, JSON.stringify(estacion))
      else localStorage.removeItem(CLAVE)
    } catch {
      /* localStorage no disponible: se ignora */
    }
  }, [estacion])

  const seleccionarEstacion = useCallback((nueva) => setEstacion(nueva), [])
  const limpiarEstacion = useCallback(() => setEstacion(null), [])

  const value = { estacion, seleccionarEstacion, limpiarEstacion }
  return <EstacionContext.Provider value={value}>{children}</EstacionContext.Provider>
}

export function useEstacion() {
  const context = useContext(EstacionContext)
  if (!context) throw new Error('useEstacion debe usarse dentro de EstacionProvider')
  return context
}
