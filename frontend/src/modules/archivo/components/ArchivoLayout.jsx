import { resolverUsuarioArchivo } from '../identidadArchivo'
import { useIdentidadEstacionArchivo } from '../hooks/useIdentidadEstacionArchivo'
import ArchivoHeader from './ArchivoHeader.jsx'
import ArchivoNavbar from './ArchivoNavbar.jsx'

// Envoltura común de la Estación de Archivo: encabezado + navegación
// provisional. La comparten la vista operativa y las secciones provisionales.
export default function ArchivoLayout({ children }) {
  const { identidad, identidadLista } = useIdentidadEstacionArchivo()
  const usuarioArchivo = resolverUsuarioArchivo(identidad)

  return (
    <div className="min-h-screen bg-surface pb-10">
      <ArchivoHeader usuario={usuarioArchivo} />
      <ArchivoNavbar />
      {identidadLista ? children : null}
    </div>
  )
}
