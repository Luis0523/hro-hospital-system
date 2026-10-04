import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import JefeHeader from './components/JefeHeader.jsx'
import MenuLateralJefe from './components/MenuLateralJefe.jsx'

export default function JefeEnfermeriaLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])
  const alternarMenu = () => setMenuAbierto((abierto) => !abierto)

  useEffect(() => {
    if (!menuAbierto) return undefined

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') cerrarMenu()
    }

    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [menuAbierto, cerrarMenu])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 bg-on-surface/40 md:hidden"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <div
        id="menu-jefe-enfermeria"
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-outline-variant bg-surface-container-lowest transition-transform duration-200 md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        >
          <Icon name="close" className="text-[24px]" />
        </button>
        <MenuLateralJefe onNavegar={cerrarMenu} />
      </div>

      <div
        className="flex min-h-screen min-w-0 flex-col md:pl-64"
        aria-hidden={menuAbierto ? 'true' : undefined}
        inert={menuAbierto ? '' : undefined}
      >
        <JefeHeader menuAbierto={menuAbierto} onAbrirMenu={alternarMenu} />
        <main id="contenido-jefe" className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
