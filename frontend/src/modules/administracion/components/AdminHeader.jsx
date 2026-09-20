import { useAuth } from '@/shared/context/AuthContext.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

export default function AdminHeader({ onAbrirMenu, menuAbierto = false }) {
  const { usuario } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="menu-administracion"
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue md:hidden"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-hro-blue text-white">
            <Icon name="admin_panel_settings" className="text-[22px]" />
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-bold text-hro-blue">Panel de Administración</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Sistema Hospitalario HRO</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-slate-700">{usuario?.nombre}</p>
          <p className="text-xs uppercase text-slate-400">{usuario?.rol}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-hro-blue">
          <Icon name="person" className="text-[20px]" />
        </span>
      </div>
    </header>
  )
}
