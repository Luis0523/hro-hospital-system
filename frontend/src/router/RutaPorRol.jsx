import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { inicioPorRol } from '@/shared/api/authApi.js'

/**
 * Guard de rol por área: además de exigir sesión, verifica que el rol del token
 * tenga permitido el área. Si no, redirige a la pantalla propia del rol (o a
 * "sin acceso" si su rol no corresponde a ninguna área).
 *
 * En modo mock/test no se aplica (para no romper el desarrollo ni las pruebas);
 * en modo keycloak sí, que es donde los roles vienen del token.
 */
export default function RutaPorRol({ roles }) {
  const { autenticado, usuario, modoAuth } = useAuth()
  const location = useLocation()

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  if (modoAuth === 'keycloak' && Array.isArray(roles) && !roles.includes(usuario?.rol)) {
    const destino = inicioPorRol(usuario?.rol)
    return (
      <Navigate
        to={destino !== location.pathname ? destino : '/sin-acceso'}
        replace
      />
    )
  }

  return <Outlet />
}
