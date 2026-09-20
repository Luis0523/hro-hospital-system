import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminHeader from './components/AdminHeader.jsx'
import MenuLateral from './components/MenuLateral.jsx'

export default function AdministracionLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = () => setMenuAbierto(false)
  const alternarMenu = () => setMenuAbierto((abierto) => !abierto)

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
        <MenuLateral onNavegar={cerrarMenu} />
      </div>

      <div className="flex min-h-screen flex-col md:pl-64">
        <AdminHeader menuAbierto={menuAbierto} onAbrirMenu={alternarMenu} />
        <main id="contenido-principal" className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
