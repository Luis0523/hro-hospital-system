import Icon from '@/shared/components/ui/Icon.jsx'

// Encabezado compacto de la Estación de Archivo. El control de tema y los
// datos del usuario viven en la barra lateral (ArchivoNavbar) para no ocupar
// espacio en móvil; aquí solo queda el botón de menú y la marca SIGHO.
export default function ArchivoHeader({ menuAbierto = false, onAlternarMenu }) {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={onAlternarMenu}
          aria-label={menuAbierto ? 'Ocultar menú' : 'Mostrar menú'}
          aria-expanded={menuAbierto}
          aria-controls="menu-archivo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
        >
          <Icon name={menuAbierto ? 'menu_open' : 'menu'} className="text-[22px]" />
        </button>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hro-blue text-white">
          <Icon name="folder_shared" className="text-[20px]" />
        </span>

        <div className="min-w-0">
          <p className="text-label-sm uppercase leading-none tracking-widest text-primary">SIGHO</p>
          <h1 className="truncate text-title-sm font-semibold leading-tight text-on-surface">
            Estación de Archivo
          </h1>
        </div>
      </div>
    </header>
  )
}
