import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'

/**
 * Guard de rol para las áreas restringidas.
 *
 * Mientras no exista autenticación real, `aplicar` es `false` (NO bloquea):
 * deja el cableado listo para conectarlo al auth del hospital más adelante.
 * Cuando el auth esté disponible, basta con pasar `aplicar` (o activarlo por
 * defecto) para exigir uno de los roles permitidos.
 */
export const ROLES_JEFE_ENFERMERIA = ['jefe_enfermeria', 'administrador']

export default function RequiereRol({
  children,
  roles = ROLES_JEFE_ENFERMERIA,
  aplicar = false,
}) {
  const { autenticado, usuario } = useAuth()

  if (!autenticado) {
    return <Navigate to="/sesion-cerrada" replace />
  }

  // TODO(auth): cuando exista el proveedor real, activar esta verificación.
  if (aplicar && !roles.includes(usuario?.rol)) {
    return <Navigate to="/sesion-cerrada" replace />
  }

  return children
}
