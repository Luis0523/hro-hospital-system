import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useAcceso } from '@/shared/context/AccesoContext.jsx'

/**
 * Guard de acceso por área: exige sesión y, en modo keycloak, que el rol del
 * token tenga permitida el área según la configuración (rol → páginas).
 * Si no, redirige a la pantalla inicial del rol (o a "sin acceso").
 *
 * En modo mock/test no se aplica, para no romper el desarrollo ni las pruebas.
 */
export default function RutaPorRol({ area }) {
  const { autenticado, usuario, modoAuth } = useAuth()
  const { puedeAcceder, inicioSegunRol } = useAcceso()
  const location = useLocation()

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  if (modoAuth === 'keycloak' && area && !puedeAcceder(usuario?.rol, area)) {
    const destino = inicioSegunRol(usuario?.rol)
    return <Navigate to={destino !== location.pathname ? destino : '/sin-acceso'} replace />
  }

  return <Outlet />
}
