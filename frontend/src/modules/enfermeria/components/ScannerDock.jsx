import Icon from '@/shared/components/ui/Icon.jsx'

export default function ScannerDock({ value, onChange, onSubmit, onSimular, inputRef }) {
  return (
    <footer className="fixed bottom-0 left-0 z-40 w-full bg-surface-container-lowest px-4 py-3 shadow-dock">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <form onSubmit={onSubmit} className="relative flex flex-1 items-center">
          <span className="pointer-events-none absolute left-4 flex items-center text-primary">
            <Icon name="barcode_scanner" className="text-[24px]" />
          </span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escanee el DPI o carné del paciente..."
            aria-label="DPI o carné del paciente"
            className="h-14 w-full rounded-xl bg-surface-container-low pl-14 pr-14 text-title-md text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container sm:pr-44"
          />
          <span className="absolute right-3 hidden items-center gap-1 rounded-lg bg-secondary-fixed px-2 py-1 text-on-secondary-container sm:flex">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-secondary-container" />
            <span className="text-label-sm font-bold uppercase tracking-tight">
              Lector listo para captura
            </span>
          </span>
        </form>

        <button
          type="button"
          onClick={onSimular}
          className="flex h-14 items-center gap-2 rounded-xl bg-surface-container px-4 text-on-surface transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container active:scale-95"
        >
          <Icon name="barcode_scanner" className="text-[22px] text-primary" />
          <span className="hidden text-title-sm sm:inline">Simular scan</span>
        </button>
      </div>
    </footer>
  )
}
