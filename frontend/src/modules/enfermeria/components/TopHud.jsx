import Icon from '@/shared/components/ui/Icon.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'

export default function TopHud({
  usuario,
  terminal,
  turnoActual,
  pacienteActual,
  tableroActivo,
  onToggleTablero,
  onPasarSiguiente,
  onVerPacientes,
  onAbrirPerfil,
  pasandoSiguiente = false,
}) {
  const { tema, alternarTema } = useTema()

  return (
    <header className="w-full bg-surface-container shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="medical_services" className="text-[24px]" />
          </div>
          <div className="leading-tight">
            <h1 className="text-headline-sm uppercase tracking-tight text-on-surface">
              Estación de Enfermería
            </h1>
            <p className="text-label-sm text-on-surface-variant">
              Terminal Clínico • Unidad de Cuidados Intensivos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1 rounded-full bg-surface-container-lowest px-3 py-1 text-label-sm text-on-surface-variant shadow-card md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-container" />
            EN LÍNEA • ESTACIÓN 04
          </span>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title="Cambiar tema"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-card transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <Icon name={tema === 'oscuro' ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
          </button>
          <div className="text-right leading-tight">
            <p className="text-title-sm text-on-surface">{usuario?.nombre}</p>
            <p className="text-label-sm uppercase text-on-surface-variant">{usuario?.puesto}</p>
          </div>
          <button
            type="button"
            onClick={onAbrirPerfil}
            aria-label="Menú de usuario"
            aria-haspopup="dialog"
            title="Menú de usuario"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <Icon name="person" className="text-[20px]" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-surface-container-lowest px-2 py-1 shadow-card">
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Terminal:
            </span>
            <span className="text-title-sm font-bold text-primary">{terminal}</span>
          </span>
          <span className="flex items-center gap-1 rounded bg-surface-container-lowest px-2 py-1 shadow-card">
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Turno actual:
            </span>
            <span className="text-title-sm text-on-surface">
              #{String(turnoActual).padStart(3, '0')}
              {pacienteActual ? ` • ${pacienteActual}` : ''}
            </span>
          </span>
          <button
            type="button"
            onClick={onVerPacientes}
            title="Temporal: ver pacientes registrados"
            className="flex items-center gap-1 rounded bg-surface-container-lowest px-2 py-1 text-primary shadow-card transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <Icon name="folder_shared" className="text-[16px]" />
            <span className="text-label-sm font-semibold uppercase tracking-wider">Pacientes</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTablero}
            className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-lowest px-4 text-left shadow-card transition hover:bg-surface-container-high active:scale-95"
          >
            <div className="flex flex-col">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Pantalla de sala
              </span>
              <span className="flex items-center gap-1 text-title-sm uppercase text-on-surface">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    tableroActivo ? 'animate-pulse bg-secondary-container' : 'bg-outline'
                  }`}
                />
                Tablero de turnos: {tableroActivo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <span
              className={`flex h-6 w-12 items-center rounded-full p-0.5 transition-colors ${
                tableroActivo
                  ? 'justify-end bg-secondary-container/30'
                  : 'justify-start bg-surface-container-highest'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full shadow-sm ${
                  tableroActivo ? 'bg-secondary-container' : 'bg-outline'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onPasarSiguiente}
            disabled={pasandoSiguiente}
            className="flex h-12 items-center gap-2 rounded-xl bg-primary-container px-6 text-headline-sm uppercase tracking-wide text-on-primary shadow-md transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-secondary-fixed-dim active:scale-95 disabled:opacity-60"
          >
            <Icon name="skip_next" className="text-[26px]" />
            <span>{pasandoSiguiente ? 'Llamando...' : 'Pasar siguiente'}</span>
            <Icon name="chevron_right" className="text-[20px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
