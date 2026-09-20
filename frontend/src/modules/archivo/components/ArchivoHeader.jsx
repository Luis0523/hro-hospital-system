import Icon from '@/shared/components/ui/Icon.jsx'
import { USUARIO_ARCHIVO_POR_DEFECTO } from '../identidadArchivo'

export default function ArchivoHeader({ usuario }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hro-blue text-white">
            <Icon name="folder_shared" className="text-[24px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-label-sm uppercase tracking-widest text-hro-celeste">
              Sistema Hospitalario HRO
            </p>
            <h1 className="truncate text-headline-sm text-on-surface">
              Estación de Archivo / Registro Médico
            </h1>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-title-sm text-on-surface">
            {usuario?.nombre ?? USUARIO_ARCHIVO_POR_DEFECTO.nombre}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {usuario?.puesto ?? USUARIO_ARCHIVO_POR_DEFECTO.puesto}
          </p>
        </div>
      </div>
    </header>
  )
}
