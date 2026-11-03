import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'

/**
 * Guard global de sesión: envuelve todas las rutas privadas de SIGHO.
 * Si no hay sesión, redirige al login (modo keycloak) o a la pantalla de
 * sesión cerrada (modo mock), recordando el destino para volver tras entrar.
 */
export default function RutaPrivada() {
  const { autenticado, modoAuth } = useAuth()
  const location = useLocation()
  const bypassLocal =
    import.meta.env.DEV &&
    import.meta.env.MODE !== 'test' &&
    import.meta.env.VITE_SALTAR_AUTH_LOCAL === 'true' &&
    location.pathname.startsWith('/seguimiento-enfermeria')

  if (bypassLocal) return <Outlet />

  if (!autenticado) {
    return (
      <Navigate
        to={modoAuth === 'keycloak' ? '/login' : '/sesion-cerrada'}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
