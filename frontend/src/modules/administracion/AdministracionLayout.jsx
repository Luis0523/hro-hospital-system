import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import AdminHeader from './components/AdminHeader.jsx'
import MenuLateral from './components/MenuLateral.jsx'

export default function AdministracionLayout() {
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <div
        id="menu-administracion"
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue md:hidden"
        >
          <Icon name="close" className="text-[24px]" />
        </button>
        <MenuLateral onNavegar={cerrarMenu} />
      </div>

      <div
        className="flex min-h-screen min-w-0 flex-col md:pl-64"
        aria-hidden={menuAbierto ? 'true' : undefined}
        inert={menuAbierto ? '' : undefined}
      >
        <AdminHeader menuAbierto={menuAbierto} onAbrirMenu={alternarMenu} />
        <main id="contenido-principal" className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
