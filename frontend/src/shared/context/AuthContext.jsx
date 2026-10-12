import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { autenticar, expiracionDeToken } from '@/shared/api/authApi.js'
import {
  EVENTO_SESION_EXPIRADA,
  EVENTO_TOKEN_RENOVADO,
  guardarSesion,
  leerExpiracion,
  limpiarSesion,
  renovarSesion,
} from '@/shared/api/sesion.js'

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

  // useLayoutEffect: la identidad efectiva debe quedar persistida en
  // `hro_usuario` ANTES de que los efectos de los componentes hijos disparen
  // peticiones (que `client.js` resuelve leyendo ese storage).
  useLayoutEffect(() => {
    if (!autenticado) return
    localStorage.setItem('hro_usuario', JSON.stringify(usuario))
    if (token) localStorage.setItem('hro_token', token)
  }, [usuario, token, autenticado])

  const cerrarSesion = useCallback(() => {
    limpiarSesion()
    try {
      localStorage.setItem(CLAVE_SESION, 'cerrada')
    } catch {
      // sin storage: se ignora
    }
    setAutenticado(false)
  }, [])

  const iniciarSesion = useCallback(() => {
    localStorage.setItem(CLAVE_SESION, 'activa')
    setUsuario(leerUsuario())
    setToken(localStorage.getItem('hro_token') || TOKEN_DEV)
    setAutenticado(true)
  }, [])

  // Permite que una estación asuma su identidad efectiva (rol/idExterno/nombre)
  // al montarse y la restaure al desmontarse. El efecto de persistencia de arriba
  // refleja el cambio en `hro_usuario`, que `client.js` lee para las cabeceras.
  const establecerIdentidad = useCallback((parcial) => {
    setUsuario((actual) => ({ ...actual, ...parcial }))
  }, [])

  /** Login real (modo Keycloak): canjea credenciales y guarda token, refresh e identidad. */
  const iniciarSesionConCredenciales = useCallback(async (username, password) => {
    const {
      token: nuevoToken,
      refreshToken,
      expiraEn,
      usuario: identidad,
    } = await autenticar({ username, password })
    const usuarioFinal = { ...USUARIO_BASE, ...identidad }
    localStorage.setItem(CLAVE_SESION, 'activa')
    guardarSesion({ token: nuevoToken, refreshToken, expiraEn })
    localStorage.setItem('hro_usuario', JSON.stringify(usuarioFinal))
    setUsuario(usuarioFinal)
    setToken(nuevoToken)
    setAutenticado(true)
    return usuarioFinal
  }, [])

  // Refresco silencioso: programa la renovación ~60 s antes de que expíe el
  // access token. Si el refresh falla, se cierra la sesión. En modo mock no aplica.
  useEffect(() => {
    if (MODO_AUTH !== 'keycloak' || !autenticado || !token) return undefined
    const expiraEn = leerExpiracion() ?? expiracionDeToken(token)
    if (!expiraEn) return undefined

    const ADELANTO_MS = 60_000
    const espera = Math.max(0, expiraEn - Date.now() - ADELANTO_MS)
    const id = setTimeout(async () => {
      try {
        setToken(await renovarSesion())
      } catch {
        cerrarSesion()
      }
    }, espera)
    return () => clearTimeout(id)
  }, [autenticado, token, cerrarSesion])

  // Sincroniza el estado React con los cambios de token/expiración que ocurren
  // fuera de React (el interceptor HTTP renueva o expira la sesión).
  useEffect(() => {
    function alRenovar(evento) {
      const nuevo = evento?.detail?.token
      if (nuevo) setToken(nuevo)
    }
    function alExpirar() {
      setAutenticado(false)
    }
    try {
      window.addEventListener(EVENTO_TOKEN_RENOVADO, alRenovar)
      window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    } catch {
      return undefined
    }
    return () => {
      try {
        window.removeEventListener(EVENTO_TOKEN_RENOVADO, alRenovar)
        window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
      } catch {
        // sin window: se ignora
      }
    }
  }, [])

  const value = {
    usuario,
    usuarioId: usuario.id,
    token,
    autenticado,
    modoAuth: MODO_AUTH,
    // Destino tras cerrar sesión: login real (keycloak) o pantalla de sesión cerrada (mock).
    rutaLogin: MODO_AUTH === 'keycloak' ? '/login' : '/sesion-cerrada',
    cerrarSesion,
    iniciarSesion,
    iniciarSesionConCredenciales,
    establecerIdentidad,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
