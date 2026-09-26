import { NavLink } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'

export const ITEMS_ADMINISTRACION = [
  { to: '/administracion', etiqueta: 'Dashboard', icono: 'dashboard', exacto: true },
  { to: '/administracion/usuarios', etiqueta: 'Usuarios y roles', icono: 'group' },
  { to: '/administracion/clinicas', etiqueta: 'Clínicas', icono: 'local_hospital' },
  { to: '/administracion/cupos', etiqueta: 'Cupos y capacidad', icono: 'event_seat' },
  {
    to: '/administracion/calendario',
    etiqueta: 'Calendario institucional',
    icono: 'calendar_month',
  },
  { to: '/administracion/reportes', etiqueta: 'Reportes', icono: 'bar_chart' },
  { to: '/administracion/auditoria', etiqueta: 'Auditoría', icono: 'security' },
]

export default function MenuLateral({ onNavegar }) {
  return (
    <nav
      aria-label="Navegación del Panel de Administración"
      className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4"
    >
      <p className="px-3 pb-2 text-label-sm uppercase tracking-wider text-outline">
        Administración Central
      </p>

      {ITEMS_ADMINISTRACION.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exacto}
          onClick={onNavegar}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`
          }
        >
          <Icon name={item.icono} className="text-[20px]" />
          <span>{item.etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  )
}
