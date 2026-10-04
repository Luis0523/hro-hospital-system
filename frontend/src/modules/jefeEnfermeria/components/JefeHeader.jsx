import { useAuth } from '@/shared/context/AuthContext.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

export default function JefeHeader({ onAbrirMenu, menuAbierto = false }) {
  const { usuario } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="menu-jefe-enfermeria"
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
          <Icon name="local_hospital" className="text-[24px]" />
        </span>

        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-headline-sm uppercase tracking-tight text-on-surface">
            Jefatura Operativa de Enfermería
          </h1>
          <p className="hidden text-label-sm uppercase tracking-widest text-on-surface-variant sm:block">
            Gestión diaria de salas y cobertura asistencial
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 text-right leading-tight">
          <p className="truncate text-title-sm text-on-surface" title={usuario?.nombre}>
            {usuario?.nombre}
          </p>
          <p className="truncate text-label-sm uppercase text-on-surface-variant" title={usuario?.rol}>
            {usuario?.rol}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
          <Icon name="person" className="text-[20px]" />
        </span>
      </div>
    </header>
  )
}
