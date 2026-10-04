import { Navigate, useLocation } from 'react-router-dom'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'

/**
 * Exige una estación de enfermería seleccionada antes de entrar a la pantalla operativa.
 * Si no hay estación activa, redirige al "minilogin" de estación.
 */
export default function RequiereEstacion({ children }) {
  const { estacion } = useEstacion()
  const location = useLocation()

  if (!estacion) {
    return <Navigate to="/seleccion-estacion" replace state={{ from: location.pathname }} />
  }

  return children
}
