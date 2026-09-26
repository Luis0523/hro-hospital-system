import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'

const estadoEstilo = {
  disponible: 'bg-secondary-fixed text-on-secondary-container',
  ocupada: 'bg-surface-container-high text-on-surface-variant',
}

export default function SelectorEstacion({
  estaciones = [],
  seleccionada,
  onSeleccionar,
  onConfirmar,
  usuario,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="medical_services" className="text-[26px]" />
          </div>
          <div className="leading-tight">
            <p className="text-label-sm uppercase tracking-widest text-secondary">
              Hospital Regional de Occidente
            </p>
            <h1 className="text-headline-md text-on-surface">Estación de Enfermería</h1>
          </div>
          {usuario?.nombre && (
            <div className="ml-auto text-right leading-tight">
              <p className="text-title-sm text-on-surface">{usuario.nombre}</p>
              {usuario.puesto && (
                <p className="text-label-sm uppercase text-on-surface-variant">{usuario.puesto}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">Seleccione su estación</h2>
          <p className="text-body-md text-on-surface-variant">
            Elija el puesto desde el cual realizará la atención (check-in, turnos y agendamiento).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {estaciones.map((estacion) => {
            const activa = seleccionada === estacion.id
            return (
              <button
                key={estacion.id}
                type="button"
                onClick={() => onSeleccionar(estacion.id)}
                aria-pressed={activa}
                className={`flex flex-col gap-3 rounded-xl border p-4 text-left shadow-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                  activa
                    ? 'border-primary-container bg-secondary-fixed/30 ring-2 ring-primary-container'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                      <Icon name="point_of_sale" className="text-[20px]" />
                    </span>
                    <span className="text-headline-sm text-on-surface">{estacion.terminal}</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-label-sm font-semibold capitalize ${
                      estadoEstilo[estacion.estado] ??
                      'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {estacion.estado}
                  </span>
                </div>

                <div className="space-y-1 text-body-sm">
                  <p className="flex items-center gap-1 text-on-surface">
                    <Icon name="domain" className="text-[16px] text-primary" />
                    {estacion.clinicaNombre}
                  </p>
                  <p className="flex items-center gap-1 text-on-surface-variant">
                    <Icon name="location_on" className="text-[16px]" />
                    {estacion.ubicacion}
                  </p>
                </div>

                {activa && (
                  <span className="flex items-center gap-1 text-label-sm font-semibold text-primary">
                    <Icon name="check_circle" className="text-[16px]" /> Estación seleccionada
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-outline-variant bg-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-body-sm text-on-surface-variant">
            {seleccionada
              ? 'Confirme para entrar a la estación.'
              : 'Seleccione una estación para continuar.'}
          </p>
          <Button size="lg" disabled={!seleccionada} onClick={onConfirmar}>
            <Icon name="login" className="text-[20px]" />
            Entrar a la estación
          </Button>
        </div>
      </footer>
    </div>
  )
}
