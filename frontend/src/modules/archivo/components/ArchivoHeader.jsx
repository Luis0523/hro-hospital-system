import Icon from '@/shared/components/ui/Icon.jsx'
import { USUARIO_ARCHIVO_POR_DEFECTO } from '../identidadArchivo'

export default function ArchivoHeader({ usuario }) {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hro-blue text-white">
            <Icon name="folder_shared" className="text-[24px]" />
          </span>
          <div className="min-w-0">
            <p className="text-label-sm uppercase tracking-widest text-primary">
              Sistema Hospitalario HRO
            </p>
            <h1 className="text-headline-sm text-on-surface">
              Estación de Archivo / Registro Médico
            </h1>
          </div>
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <p className="break-words text-title-sm text-on-surface">
            {usuario?.nombre ?? USUARIO_ARCHIVO_POR_DEFECTO.nombre}
          </p>
          <p className="break-words text-body-sm text-on-surface-variant">
            {usuario?.puesto ?? USUARIO_ARCHIVO_POR_DEFECTO.puesto}
          </p>
        </div>
      </div>
    </header>
  )
}
