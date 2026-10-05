import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

// Navegación de la vista Libro de Citas: SOLO la sección activa y "Cerrar
// sesión". No enlaza a otros módulos (Archivo, Enfermería, Administración…).
export const SECCIONES_LIBRO_CITAS = [
  { to: '/libro-citas', etiqueta: 'Libro de Citas', icono: 'menu_book', exacto: true },
]

function claseEnlace({ isActive }) {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
    isActive ? 'bg-hro-blue text-white' : 'text-on-surface-variant hover:bg-surface-container'
  }`
}

export default function LibroCitasNavbar() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  // Reutiliza el mecanismo de sesión existente (AuthContext) y la ruta pública
  // /sesion-cerrada, igual que las estaciones de Archivo y Enfermería.
  function manejarCierreSesion() {
    cerrarSesion()
    navigate('/sesion-cerrada')
  }

  return (
    <nav
      aria-label="Navegación de Libro de Citas"
      className="border-b border-outline-variant bg-surface-container-lowest"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
          {SECCIONES_LIBRO_CITAS.map((item) => (
            <li key={item.to} className="min-w-0">
              <NavLink to={item.to} end={item.exacto} className={claseEnlace}>
                <Icon name={item.icono} className="text-[18px]" />
                <span className="min-w-0 break-words">{item.etiqueta}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={manejarCierreSesion}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
        >
          <Icon name="logout" className="text-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
