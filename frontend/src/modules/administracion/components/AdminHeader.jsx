import { useAuth } from '@/shared/context/AuthContext.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

export default function AdminHeader({ onAbrirMenu, menuAbierto = false }) {
  const { usuario } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="menu-administracion"
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Icon name="admin_panel_settings" className="text-[22px]" />
          </span>
          <div className="min-w-0 leading-tight">
            <h1
              className="truncate text-base font-bold text-primary"
              title="Panel de Administración"
            >
              Panel de Administración
            </h1>
            <p className="hidden text-xs text-outline sm:block">Sistema Hospitalario HRO</p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 text-right leading-tight">
          <p className="truncate text-sm font-semibold text-on-surface" title={usuario?.nombre}>
            {usuario?.nombre}
          </p>
          <p className="truncate text-xs uppercase text-outline" title={usuario?.rol}>
            {usuario?.rol}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="person" className="text-[20px]" />
        </span>
      </div>
    </header>
  )
}
