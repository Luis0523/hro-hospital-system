import Icon from '@/shared/components/ui/Icon.jsx'

export default function LibroCitasHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hro-blue text-white">
          <Icon name="menu_book" className="text-[24px]" />
        </span>
        <div className="min-w-0">
          <p className="text-label-sm uppercase tracking-widest text-primary">Sistema Hospitalario HRO</p>
          <h1 className="text-headline-sm text-on-surface">Libro de Citas</h1>
        </div>
      </div>
    </header>
  )
}
