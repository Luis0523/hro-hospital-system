import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Identidad simulada (modo dev, sin auth real). Los valores se pueden
// sobreescribir por variables de entorno para probar áreas con otro rol,
// p. ej. el área de Jefe de Enfermería (VITE_USUARIO_ROL=jefe_enfermeria,
// VITE_USUARIO_ID=jefe-enfermeria-01).
const USUARIO_DEV = {
  id: 2,
  idExterno: import.meta.env.VITE_USUARIO_ID || 'enfermeria-01',
  nombre: import.meta.env.VITE_USUARIO_NOMBRE || 'Lic. Carmen Vega',
  puesto: import.meta.env.VITE_USUARIO_PUESTO || 'Enfermera Jefe de Turno',
  rol: import.meta.env.VITE_USUARIO_ROL || 'enfermeria',
  terminal: import.meta.env.VITE_USUARIO_TERMINAL || 'BOX-04 Triage',
}

const TOKEN_DEV = 'token-simulado-dev'
const CLAVE_SESION = 'hro_sesion'

const AuthContext = createContext(null)

function leerUsuario() {
  try {
    const guardado = localStorage.getItem('hro_usuario')
    return guardado ? { ...USUARIO_DEV, ...JSON.parse(guardado) } : USUARIO_DEV
  } catch {
    return USUARIO_DEV
  }
}

function sesionActiva() {
  try {
    return localStorage.getItem(CLAVE_SESION) !== 'cerrada'
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuario)
  const [autenticado, setAutenticado] = useState(sesionActiva)
  const [token, setToken] = useState(() => localStorage.getItem('hro_token') || TOKEN_DEV)

  useEffect(() => {
    if (!autenticado) return
    localStorage.setItem('hro_usuario', JSON.stringify(usuario))
    localStorage.setItem('hro_token', token)
  }, [usuario, token, autenticado])

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('hro_usuario')
    localStorage.removeItem('hro_token')
    localStorage.setItem(CLAVE_SESION, 'cerrada')
    setAutenticado(false)
  }, [])

  const iniciarSesion = useCallback(() => {
    localStorage.setItem(CLAVE_SESION, 'activa')
    setUsuario(leerUsuario())
    setToken(localStorage.getItem('hro_token') || TOKEN_DEV)
    setAutenticado(true)
  }, [])

  const value = {
    usuario,
    usuarioId: usuario.id,
    token,
    autenticado,
    cerrarSesion,
    iniciarSesion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
