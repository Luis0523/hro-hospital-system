import Icon from '@/shared/components/ui/Icon.jsx'

export default function ScannerExpediente({ value, onChange, onSubmit, onSimular, inputRef }) {
  return (
    <section
      aria-label="Búsqueda de expediente"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label htmlFor="codigo-expediente" className="mb-1 block text-sm font-medium text-slate-700">
        Buscar expediente por código
      </label>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex flex-1 items-center">
          <span className="pointer-events-none absolute left-4 flex items-center text-primary">
            <Icon name="barcode_scanner" className="text-[24px]" />
          </span>
          <input
            id="codigo-expediente"
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escanee o escriba el código del expediente..."
            className="h-12 w-full rounded-xl border border-slate-300 bg-surface-container-low pl-14 pr-4 text-title-md text-on-surface outline-none transition focus:border-hro-blue focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-hro-blue px-4 text-title-sm text-white transition hover:bg-blue-800 active:scale-95 sm:flex-none"
          >
            <Icon name="search" className="text-[20px]" />
            Buscar
          </button>
          {onSimular && (
            <button
              type="button"
              onClick={onSimular}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container px-4 text-title-sm text-on-surface transition hover:bg-surface-container-high active:scale-95"
            >
              <Icon name="barcode_scanner" className="text-[20px] text-primary" />
              Simular
            </button>
          )}
        </div>
      </form>
      <p className="mt-1 text-body-sm text-slate-500">
        Campo simulado: no usa cámara ni lector real. Pendiente de identificador en el backend.
      </p>
    </section>
  )
}
