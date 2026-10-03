import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { inicioPorRol } from '@/shared/api/authApi.js'

const CUENTAS_DEMO = [
  { etiqueta: 'Archivo', icono: 'folder_shared', username: 'archivo01', password: 'archivo' },
  { etiqueta: 'Enfermería', icono: 'health_and_safety', username: 'enfermeria01', password: 'enfermeria' },
  { etiqueta: 'Administrador', icono: 'admin_panel_settings', username: 'admin', password: 'admin' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { autenticado, usuario, iniciarSesionConCredenciales } = useAuth()

  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [recordar, setRecordar] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  // Si ya hay sesión, ir directo a la pantalla del rol.
  useEffect(() => {
    if (autenticado) {
      navigate(inicioPorRol(usuario?.rol), { replace: true })
    }
  }, [autenticado, usuario, navigate])

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (enviando) return
    setError(null)
    setEnviando(true)
    try {
      const usuarioFinal = await iniciarSesionConCredenciales(identificador.trim(), password)
      navigate(inicioPorRol(usuarioFinal.rol), { replace: true })
    } catch (fallo) {
      setError(
        fallo.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : fallo.message || 'No se pudo iniciar sesión.',
      )
    } finally {
      setEnviando(false)
    }
  }

  function usarCuentaDemo(cuenta) {
    setIdentificador(cuenta.username)
    setPassword(cuenta.password)
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-primary px-4 py-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-secondary-container opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary-fixed opacity-15 blur-3xl" />

      <header className="z-10 flex w-full items-center justify-between text-on-primary">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px]">local_hospital</span>
          <span className="text-label-sm uppercase tracking-wider">
            Hospital Regional de Occidente
          </span>
        </div>
        <span className="hidden items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-label-sm sm:inline-flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-fixed-dim" />
          Terminal activa
        </span>
      </header>

      <main className="z-10 mx-auto flex w-full max-w-xl flex-1 items-center py-8">
        <div className="w-full rounded-2xl bg-surface-container-lowest p-6 text-on-surface shadow-modal sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo-hro.png"
              alt="Hospital Regional de Occidente"
              className="mb-3 h-16 max-w-[260px] object-contain"
            />
            <span className="mb-2 inline-flex items-center gap-1 rounded bg-surface-container px-3 py-1 text-label-sm uppercase tracking-wide text-secondary">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              SIGHO · Gestión Hospitalaria
            </span>
            <h1 className="text-headline-lg text-on-surface">Iniciar Sesión</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Portal Asistencial y Administrativo · Hospital Regional de Occidente
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={manejarEnvio}>
            <div className="flex flex-col gap-1 text-left">
              <label
                htmlFor="identifier-input"
                className="flex items-center justify-between text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                <span>Usuario institucional</span>
                <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[20px] text-outline">
                  badge
                </span>
                <input
                  id="identifier-input"
                  type="text"
                  autoComplete="username"
                  required
                  value={identificador}
                  onChange={(evento) => setIdentificador(evento.target.value)}
                  placeholder="archivo01 / admin"
                  className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3 text-body-md text-on-surface shadow-sm outline-none transition focus:border-hro-blue focus:ring-2 focus:ring-secondary-fixed-dim"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label
                htmlFor="password-input"
                className="text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                Contraseña institucional
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[20px] text-outline">
                  lock
                </span>
                <input
                  id="password-input"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-10 text-body-md text-on-surface shadow-sm outline-none transition focus:border-hro-blue focus:ring-2 focus:ring-secondary-fixed-dim"
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setMostrarPassword((valor) => !valor)}
                  className="absolute right-2 rounded p-1 text-outline transition hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mostrarPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(evento) => setRecordar(evento.target.checked)}
                  className="h-4 w-4 rounded accent-hro-blue"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Recordar sesión en esta terminal
                </span>
              </label>
              <span className="inline-flex items-center gap-1 text-label-sm text-outline">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Acceso auditado
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded bg-error-container px-3 py-2 text-body-sm text-on-error-container"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded bg-primary-container px-4 py-2.5 text-title-sm uppercase tracking-wider text-on-primary shadow-md transition hover:bg-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{enviando ? 'Autenticando…' : 'Ingresar al sistema'}</span>
              <span className="material-symbols-outlined text-[20px]">
                {enviando ? 'sync' : 'arrow_forward'}
              </span>
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded bg-surface-container-low p-3 text-left">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-secondary">
              verified
            </span>
            <p className="text-label-sm leading-snug text-on-surface-variant">
              <strong className="text-on-surface">Conexión cifrada:</strong> acceso auditado y
              registrado. Su terminal queda identificada para control clínico.
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-5 border-t border-outline-variant pt-4">
              <span className="block text-center text-label-sm uppercase tracking-wider text-outline">
                Perfiles de acceso rápido (solo desarrollo)
              </span>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {CUENTAS_DEMO.map((cuenta) => (
                  <button
                    key={cuenta.username}
                    type="button"
                    onClick={() => usarCuentaDemo(cuenta)}
                    className="flex items-center gap-1 rounded bg-surface-container px-3 py-1 text-label-sm text-on-surface transition hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      {cuenta.icono}
                    </span>
                    {cuenta.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="z-10 flex flex-col items-center justify-between gap-2 text-center text-body-sm text-on-primary/80 sm:flex-row">
        <span>© 2026 Hospital Regional de Occidente · SIGHO</span>
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Servidor seguro · Quetzaltenango
        </span>
      </footer>
    </div>
  )
}
