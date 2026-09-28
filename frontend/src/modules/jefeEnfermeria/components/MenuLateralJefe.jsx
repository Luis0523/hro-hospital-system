import { NavLink } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'

export const ITEMS_JEFE = [
  { to: '/jefe-enfermeria', etiqueta: 'Croquis del Día', icono: 'map', exacto: true },
  {
    to: '/jefe-enfermeria/horarios',
    etiqueta: 'Horario por subespecialidad',
    icono: 'schedule',
  },
  { to: '/jefe-enfermeria/estaciones', etiqueta: 'Estaciones', icono: 'point_of_sale' },
  { to: '/jefe-enfermeria/reportes', etiqueta: 'Estadísticas', icono: 'monitoring' },
]

export default function MenuLateralJefe({ onNavegar }) {
  return (
    <nav
      aria-label="Navegación de la Jefatura de Enfermería"
      className="flex h-full flex-col gap-1 overflow-y-auto bg-surface-container-lowest px-3 py-4"
    >
      <p className="px-3 pb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
        Secciones
      </p>

      {ITEMS_JEFE.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exacto}
          onClick={onNavegar}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-title-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
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
