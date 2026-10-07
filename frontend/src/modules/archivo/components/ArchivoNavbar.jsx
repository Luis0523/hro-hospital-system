import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'
import { USUARIO_ARCHIVO_POR_DEFECTO } from '../identidadArchivo'

// Navegación de la Estación de Archivo. Barra lateral izquierda (vertical),
// colapsable en móvil y escritorio. Incluye el control de tema, los datos del
// usuario y el cierre de sesión al pie, para que el encabezado quede compacto.
// "Expedientes para COEX" es la vista operativa actual (/archivo); las demás
// secciones son navegación provisional sin lógica de negocio (SCRUM-148) más el
// registro rápido de carnets.
export const SECCIONES_ARCHIVO = [
  { to: '/archivo', etiqueta: 'Expedientes para COEX', icono: 'folder_shared', exacto: true },
  { to: '/archivo/carnets', etiqueta: 'Seguimiento de carnets', icono: 'badge' },
  { to: '/archivo/depuracion', etiqueta: 'Depuración de expedientes', icono: 'delete_sweep' },
  {
    to: '/archivo/salidas-externas',
    etiqueta: 'Salidas externas de expedientes',
    icono: 'outbound',
  },
]

function claseEnlace({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
    isActive ? 'bg-hro-blue text-white' : 'text-on-surface-variant hover:bg-surface-container'
  }`
}

export default function ArchivoNavbar({ abierto = false, onNavegar, usuario }) {
  const { cerrarSesion, rutaLogin } = useAuth()
  const { tema, alternarTema } = useTema()
  const navigate = useNavigate()
  const esOscuro = tema === 'oscuro'

  // Cierra la sesión y va al destino correcto según el modo:
  // /login (keycloak) o /sesion-cerrada (mock).
  function manejarCierreSesion() {
    cerrarSesion()
    navigate(rutaLogin)
  }

  return (
    <aside
      id="menu-archivo"
      aria-label="Menú de la Estación de Archivo"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-outline-variant bg-surface-container-lowest transition-transform duration-200 ${
        abierto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hro-blue text-white">
            <Icon name="folder_shared" className="text-[20px]" />
          </span>
          <div className="min-w-0">
            <p className="text-label-sm uppercase leading-none tracking-widest text-primary">
              SIGHO
            </p>
            <span className="block truncate text-title-sm font-semibold leading-tight text-on-surface">
              Estación de Archivo
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavegar}
          aria-label="Ocultar menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
        >
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>

      <nav
        aria-label="Navegación de la Estación de Archivo"
        className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
      >
        <p className="px-3 pb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
          Secciones
        </p>
        <ul className="flex flex-col gap-1">
          {SECCIONES_ARCHIVO.map((item) => (
            <li key={item.to} className="min-w-0">
              <NavLink to={item.to} end={item.exacto} onClick={onNavegar} className={claseEnlace}>
                <Icon name={item.icono} className="text-[20px] shrink-0" />
                <span className="min-w-0 break-words">{item.etiqueta}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-2 pt-4">
          <button
            type="button"
            onClick={alternarTema}
            aria-pressed={esOscuro}
            className="flex w-full items-center gap-3 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name={esOscuro ? 'light_mode' : 'dark_mode'} className="text-[20px] shrink-0" />
            {esOscuro ? 'Modo claro' : 'Modo oscuro'}
          </button>

          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="truncate text-title-sm font-semibold text-on-surface">
              {usuario?.nombre ?? USUARIO_ARCHIVO_POR_DEFECTO.nombre}
            </p>
            <p className="truncate text-body-sm text-on-surface-variant">
              {usuario?.puesto ?? USUARIO_ARCHIVO_POR_DEFECTO.puesto}
            </p>
          </div>

          <div className="border-t border-outline-variant pt-2">
            <button
              type="button"
              onClick={manejarCierreSesion}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name="logout" className="text-[20px] shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
    </aside>
  )
}
