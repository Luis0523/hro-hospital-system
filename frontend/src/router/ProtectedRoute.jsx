import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { autenticado, modoAuth } = useAuth()

  if (!autenticado) {
    return <Navigate to={modoAuth === 'keycloak' ? '/login' : '/sesion-cerrada'} replace />
  }

  return children
}
