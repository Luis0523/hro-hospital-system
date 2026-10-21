import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { esModoDemo } from '../api/doctorApi'

export default function EncabezadoDoctor({ medico, clinica, asignacion }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary">
            <Icon name="local_hospital" className="text-2xl" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">SIGHO</p>
            <h1 className="break-words text-headline-md text-on-surface">Vista del doctor</h1>
          </div>
        </div>
        {esModoDemo && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            Demostración
          </span>
        )}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
            <Icon name="person" className="text-3xl" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-xl font-bold text-on-surface">{medico.nombre}</p>
            <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
              Colegiado {medico.colegiado}
            </p>
            <p className="text-sm text-on-surface-variant sm:text-base">
              {asignacion.subespecialidadNombre}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3 sm:min-w-[18rem]">
          <Icon name="location_on" className="mt-0.5 text-2xl text-primary" />
          <div className="min-w-0">
            <p className="break-words text-base font-semibold text-on-surface">
              Clínica {clinica.numero} · {clinica.nombre}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {asignacion.subespecialidadNombre} · Nivel {clinica.nivel}
            </p>
            <p className="text-sm text-on-surface-variant">{clinica.ubicacion}</p>
            {clinica.codigo && (
              <p className="mt-1 text-sm font-medium text-on-surface-variant">
                Código {clinica.codigo}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
