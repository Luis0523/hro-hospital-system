import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

// Navegación provisional de la Estación de Archivo. "Expedientes para COEX" es
// la vista operativa actual (/archivo); las demás secciones son navegación
// provisional sin lógica de negocio todavía (SCRUM-148).
export const SECCIONES_ARCHIVO = [
  { to: '/archivo', etiqueta: 'Expedientes para COEX', icono: 'folder_shared', exacto: true },
  { to: '/archivo/depuracion', etiqueta: 'Depuración de expedientes', icono: 'delete_sweep' },
  {
    to: '/archivo/salidas-externas',
    etiqueta: 'Salidas externas de expedientes',
    icono: 'outbound',
  },
]

function claseEnlace({ isActive }) {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
    isActive ? 'bg-hro-blue text-white' : 'text-slate-600 hover:bg-slate-100'
  }`
}

export default function ArchivoNavbar() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  // Reutiliza el mecanismo de sesión existente (AuthContext) y la ruta pública
  // /sesion-cerrada, igual que la estación de Enfermería.
  function manejarCierreSesion() {
    cerrarSesion()
    navigate('/sesion-cerrada')
  }

  return (
    <nav
      aria-label="Navegación de la Estación de Archivo"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
          {SECCIONES_ARCHIVO.map((item) => (
            <li key={item.to} className="min-w-0">
              <NavLink to={item.to} end={item.exacto} className={claseEnlace}>
                <Icon name={item.icono} className="text-[18px]" />
                <span className="truncate">{item.etiqueta}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={manejarCierreSesion}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
        >
          <Icon name="logout" className="text-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
