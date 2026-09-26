import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { autenticado } = useAuth()

  if (!autenticado) {
    return <Navigate to="/sesion-cerrada" replace />
  }

  return children
}
