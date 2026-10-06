import { useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'

const CLASE_BOTON =
  'inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5 text-label-md text-on-surface-variant transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue'

export default function LibroCitasHeader() {
  const { cerrarSesion, rutaLogin } = useAuth()
  const { tema, alternarTema } = useTema()
  const navigate = useNavigate()

  const esOscuro = tema === 'oscuro'
  const etiquetaTema = esOscuro ? 'Modo claro' : 'Modo oscuro'

  // Cierra sesión y va al destino correcto según el modo:
  // /login (keycloak) o /sesion-cerrada (mock).
  function manejarCierreSesion() {
    cerrarSesion()
    navigate(rutaLogin)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hro-blue text-white">
            <Icon name="menu_book" className="text-[24px]" />
          </span>
          <div className="min-w-0">
            <p className="text-label-sm uppercase tracking-widest text-primary">
              Sistema Hospitalario HRO
            </p>
            <h1 className="text-headline-sm text-on-surface">Libro de Citas</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={alternarTema}
            aria-label={etiquetaTema}
            aria-pressed={esOscuro}
            className={`${CLASE_BOTON} hover:bg-surface-container`}
          >
            <Icon name={esOscuro ? 'light_mode' : 'dark_mode'} className="text-[18px]" />
            {etiquetaTema}
          </button>

          <button
            type="button"
            onClick={manejarCierreSesion}
            className={`${CLASE_BOTON} hover:bg-error-container hover:text-on-error-container`}
          >
            <Icon name="logout" className="text-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}
