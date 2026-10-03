import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { autenticar } from '@/shared/api/authApi.js'

// Modo de autenticación: 'mock' (identidad simulada, dev/tests) o 'keycloak'
// (login real contra Keycloak con formulario propio).
// En modo test (Vitest) siempre se usa mock, igual que con VITE_USE_MOCK.
export const MODO_AUTH =
  import.meta.env.MODE === 'test' ? 'mock' : import.meta.env.VITE_AUTH_MODE || 'mock'

// Identidad simulada (modo mock). Se puede fijar por variables de entorno para
// probar áreas con otro rol, p. ej. Jefe de Enfermería.
const USUARIO_BASE = {
  id: 2,
  idExterno: 'enfermeria-01',
  nombre: 'Lic. Carmen Vega',
  puesto: 'Enfermera Jefe de Turno',
  rol: 'enfermeria',
  terminal: 'BOX-04 Triage',
}

const IDENTIDAD_ENV = {
  idExterno: import.meta.env.VITE_USUARIO_ID,
  nombre: import.meta.env.VITE_USUARIO_NOMBRE,
  puesto: import.meta.env.VITE_USUARIO_PUESTO,
  rol: import.meta.env.VITE_USUARIO_ROL,
  terminal: import.meta.env.VITE_USUARIO_TERMINAL,
}

// La identidad por entorno aplica solo fuera de tests y en modo mock.
const APLICAR_ENV = import.meta.env.MODE !== 'test' && MODO_AUTH === 'mock'
const envOverrides = APLICAR_ENV
  ? Object.fromEntries(Object.entries(IDENTIDAD_ENV).filter(([, valor]) => valor))
  : {}

const IDENTIDAD_FIJADA = APLICAR_ENV && Object.keys(envOverrides).length > 0

const USUARIO_DEV = { ...USUARIO_BASE, ...envOverrides }

const TOKEN_DEV = 'token-simulado-dev'
const CLAVE_SESION = 'hro_sesion'

const AuthContext = createContext(null)

function leerUsuario() {
  try {
    if (IDENTIDAD_FIJADA) return { ...USUARIO_DEV }
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

function autenticadoInicial() {
  if (!sesionActiva()) return false
  // En modo Keycloak se exige un token guardado; en mock siempre hay sesión.
  if (MODO_AUTH === 'keycloak') {
    try {
      return Boolean(localStorage.getItem('hro_token'))
    } catch {
      return false
    }
  }
  return true
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuario)
  const [autenticado, setAutenticado] = useState(autenticadoInicial)
  const [token, setToken] = useState(
    () => localStorage.getItem('hro_token') || (MODO_AUTH === 'mock' ? TOKEN_DEV : null),
  )

  useEffect(() => {
    if (!autenticado) return
    localStorage.setItem('hro_usuario', JSON.stringify(usuario))
    if (token) localStorage.setItem('hro_token', token)
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

  /** Login real (modo Keycloak): canjea credenciales y guarda token + identidad. */
  const iniciarSesionConCredenciales = useCallback(async (username, password) => {
    const { token: nuevoToken, usuario: identidad } = await autenticar({ username, password })
    const usuarioFinal = { ...USUARIO_BASE, ...identidad }
    localStorage.setItem(CLAVE_SESION, 'activa')
    localStorage.setItem('hro_token', nuevoToken)
    localStorage.setItem('hro_usuario', JSON.stringify(usuarioFinal))
    setUsuario(usuarioFinal)
    setToken(nuevoToken)
    setAutenticado(true)
    return usuarioFinal
  }, [])

  const value = {
    usuario,
    usuarioId: usuario.id,
    token,
    autenticado,
    modoAuth: MODO_AUTH,
    cerrarSesion,
    iniciarSesion,
    iniciarSesionConCredenciales,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
