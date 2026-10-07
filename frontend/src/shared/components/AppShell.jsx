import { useCallback, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'

// Envoltura común de las estaciones del SIGHO: encabezado superior compacto +
// barra lateral izquierda colapsable (se oculta/despliega en móvil y
// escritorio). El control de tema, los datos del usuario y el cierre de sesión
// viven en la barra, para no ocupar espacio en el encabezado.
function claseEnlace({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
    isActive ? 'bg-hro-blue text-white' : 'text-on-surface-variant hover:bg-surface-container'
  }`
}

function Marca({ titulo }) {
  return (
    <div className="min-w-0">
      <p className="text-label-sm uppercase leading-none tracking-widest text-primary">SIGHO</p>
      <span className="block truncate text-title-sm font-semibold leading-tight text-on-surface">
        {titulo}
      </span>
    </div>
  )
}

export default function AppShell({
  titulo,
  icono = 'dashboard',
  secciones = [],
  usuario,
  contexto = null,
  children,
}) {
  const { usuario: usuarioSesion, cerrarSesion, rutaLogin } = useAuth()
  const { tema, alternarTema } = useTema()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  const esOscuro = tema === 'oscuro'
  const usuarioMostrado = usuario ?? usuarioSesion

  const cerrar = useCallback(() => setAbierto(false), [])
  const alternar = useCallback(() => setAbierto((valor) => !valor), [])

  useEffect(() => {
    if (!abierto) return undefined
    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') cerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [abierto, cerrar])

  function manejarCierreSesion() {
    cerrarSesion()
    navigate(rutaLogin)
  }

  return (
    <div className="min-h-screen bg-surface">
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={cerrar}
          aria-hidden="true"
        />
      )}

      <aside
        id="menu-lateral"
        aria-label={`Menú de ${titulo}`}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-outline-variant bg-surface-container-lowest transition-transform duration-200 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hro-blue text-white">
              <Icon name={icono} className="text-[20px]" />
            </span>
            <Marca titulo={titulo} />
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Ocultar menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <nav
          aria-label={`Navegación de ${titulo}`}
          className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
        >
          {secciones.length > 0 && (
            <>
              <p className="px-3 pb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                Secciones
              </p>
              <ul className="flex flex-col gap-1">
                {secciones.map((item) => (
                  <li key={item.to} className="min-w-0">
                    <NavLink
                      to={item.to}
                      end={item.exacto}
                      onClick={cerrar}
                      className={claseEnlace}
                    >
                      <Icon name={item.icono} className="text-[20px] shrink-0" />
                      <span className="min-w-0 break-words">{item.etiqueta}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-auto space-y-2 pt-4">
            {contexto}

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
                {usuarioMostrado?.nombre ?? 'Usuario'}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">
                {usuarioMostrado?.puesto ?? usuarioMostrado?.rol ?? ''}
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

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${
          abierto ? 'md:pl-64' : ''
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <button
              type="button"
              onClick={alternar}
              aria-label={abierto ? 'Ocultar menú' : 'Mostrar menú'}
              aria-expanded={abierto}
              aria-controls="menu-lateral"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name={abierto ? 'menu_open' : 'menu'} className="text-[22px]" />
            </button>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hro-blue text-white">
              <Icon name={icono} className="text-[20px]" />
            </span>

            <div className="min-w-0">
              <p className="text-label-sm uppercase leading-none tracking-widest text-primary">
                SIGHO
              </p>
              <h1 className="truncate text-title-sm font-semibold leading-tight text-on-surface">
                {titulo}
              </h1>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
