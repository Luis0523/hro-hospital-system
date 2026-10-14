import { useNavigate } from 'react-router-dom'
import { Icon } from '@/shared/components/ui'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'

// Encabezado POS de la pantalla de salidas de archivo: sin barra lateral, con
// acceso rápido de vuelta a /archivo, la fecha, la hora en vivo, los contadores
// de la cola y el usuario.
export default function SalidaArchivoHeader({
  fecha,
  onFecha,
  hora,
  pendientes,
  confirmando,
  fallidos,
}) {
  const { usuario, cerrarSesion, rutaLogin } = useAuth()
  const { tema, alternarTema } = useTema()
  const navigate = useNavigate()
  const esOscuro = tema === 'oscuro'

  function manejarCierreSesion() {
    cerrarSesion()
    navigate(rutaLogin)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate('/archivo')}
          aria-label="Volver a Archivo"
          title="Volver a Archivo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:bg-surface-container"
        >
          <Icon name="arrow_back" className="text-[22px]" />
        </button>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hro-blue text-white">
          <Icon name="folder_shared" className="text-[20px]" />
        </span>

        <div className="min-w-0">
          <p className="text-label-sm uppercase leading-none tracking-widest text-primary">SIGHO</p>
          <h1 className="truncate text-title-sm font-semibold leading-tight text-on-surface">
            Salida de archivo
          </h1>
        </div>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          <label className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1">
            <Icon name="calendar_today" className="text-[18px] text-primary" />
            <input
              type="date"
              value={fecha}
              onChange={(evento) => onFecha(evento.target.value)}
              aria-label="Fecha de la salida"
              className="h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none"
            />
          </label>

          <span
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 font-mono text-label-md font-bold tabular-nums text-on-surface"
            title="Hora actual"
          >
            <Icon name="schedule" className="text-[18px] text-primary" />
            {hora}
          </span>

          <span className="hidden items-center gap-1 text-label-sm text-on-surface-variant lg:inline-flex">
            <Icon name="calendar_today" className="text-[16px] text-secondary" />
            {formatearFechaLarga(fecha)}
          </span>

          <span
            className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-label-sm font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
            title="Pendientes de marcar salida"
          >
            <Icon name="pending_actions" className="text-[16px]" />
            {pendientes}
          </span>

          {confirmando > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 text-label-sm font-semibold text-on-surface-variant"
              title="Salidas en segundo plano por confirmar"
            >
              <Icon name="sync" className="text-[16px] animate-spin" />
              {confirmando} por confirmar
            </span>
          )}

          {fallidos > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-error-container px-2 py-1 text-label-sm font-semibold text-on-error-container"
              title="Salidas que no se pudieron registrar"
            >
              <Icon name="error" className="text-[16px]" />
              {fallidos} con error
            </span>
          )}

          <button
            type="button"
            onClick={alternarTema}
            aria-pressed={esOscuro}
            aria-label={esOscuro ? 'Modo claro' : 'Modo oscuro'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:bg-surface-container"
          >
            <Icon name={esOscuro ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
          </button>

          <div className="hidden rounded-lg bg-surface-container-low px-3 py-1 sm:block">
            <p className="truncate text-title-sm font-semibold text-on-surface">
              {usuario?.nombre ?? 'Usuario'}
            </p>
            <p className="truncate text-body-sm text-on-surface-variant">{usuario?.rol ?? ''}</p>
          </div>

          <button
            type="button"
            onClick={manejarCierreSesion}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container"
          >
            <Icon name="logout" className="text-[20px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
