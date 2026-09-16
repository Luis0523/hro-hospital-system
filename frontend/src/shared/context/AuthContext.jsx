import { createContext, useContext, useEffect, useMemo } from 'react'

const USUARIO_DEV = {
  id: 2,
  idExterno: 'enfermeria-01',
  nombre: 'Lic. Carmen Vega',
  puesto: 'Enfermera Jefe de Turno',
  rol: 'enfermeria',
  terminal: 'BOX-04 Triage',
}

const AuthContext = createContext(null)

function leerUsuario() {
  try {
    const guardado = localStorage.getItem('hro_usuario')
    return guardado ? { ...USUARIO_DEV, ...JSON.parse(guardado) } : USUARIO_DEV
  } catch {
    return USUARIO_DEV
  }
}

export function AuthProvider({ children }) {
  const value = useMemo(() => {
    const usuario = leerUsuario()
    return {
      usuario,
      usuarioId: usuario.id,
      token: localStorage.getItem('hro_token') || 'token-simulado-dev',
      autenticado: true,
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('hro_usuario', JSON.stringify(value.usuario))
  }, [value.usuario])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
