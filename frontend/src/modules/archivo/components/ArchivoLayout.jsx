import { useAuth } from '@/shared/context/AuthContext.jsx'
import { resolverUsuarioArchivo } from '../identidadArchivo'
import ArchivoHeader from './ArchivoHeader.jsx'
import ArchivoNavbar from './ArchivoNavbar.jsx'

// Envoltura común de la Estación de Archivo: encabezado + navegación
// provisional. La comparten la vista operativa y las secciones provisionales.
export default function ArchivoLayout({ children }) {
  const { usuario } = useAuth()
  const usuarioArchivo = resolverUsuarioArchivo(usuario)

  return (
    <div className="min-h-screen bg-surface pb-10">
      <ArchivoHeader usuario={usuarioArchivo} />
      <ArchivoNavbar />
      {children}
    </div>
  )
}
