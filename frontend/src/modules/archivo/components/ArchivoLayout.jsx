import { useCallback, useEffect, useState } from 'react'
import { resolverUsuarioArchivo } from '../identidadArchivo'
import { useIdentidadEstacionArchivo } from '../hooks/useIdentidadEstacionArchivo'
import ArchivoHeader from './ArchivoHeader.jsx'
import ArchivoNavbar from './ArchivoNavbar.jsx'

// Envoltura común de la Estación de Archivo: encabezado superior + barra
// lateral izquierda colapsable (se oculta/despliega en móvil y escritorio) y
// el cierre de sesión fijado al pie de la barra. En escritorio la barra
// empuja el contenido; en móvil se muestra como panel superpuesto.
export default function ArchivoLayout({ children }) {
  const { identidad, identidadLista } = useIdentidadEstacionArchivo()
  const usuarioArchivo = resolverUsuarioArchivo(identidad)
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])
  const alternarMenu = useCallback(() => setMenuAbierto((abierto) => !abierto), [])

  useEffect(() => {
    if (!menuAbierto) return undefined

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') cerrarMenu()
    }

    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [menuAbierto, cerrarMenu])

  return (
    <div className="min-h-screen bg-surface">
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <ArchivoNavbar abierto={menuAbierto} onNavegar={cerrarMenu} usuario={usuarioArchivo} />

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${
          menuAbierto ? 'md:pl-64' : ''
        }`}
      >
        <ArchivoHeader menuAbierto={menuAbierto} onAlternarMenu={alternarMenu} />
        {identidadLista ? children : null}
      </div>
    </div>
  )
}
