import { Icon } from '@/shared/components/ui'

// Buscador de la salida consultada al hospital: al escribir el número y presionar
// Enter, se consulta al API del hospital (a través del backend) y se registra la
// salida. La consulta entra a una mini-cola en segundo plano, así que el campo se
// limpia al instante y queda listo para el siguiente expediente.
export default function BuscadorSalidaHospital({
  value,
  onChange,
  inputRef,
  onAgregar,
  disabled = false,
  cola = 0,
}) {
  function manejarEnvio(evento) {
    evento.preventDefault()
    const agregado = onAgregar(value)
    if (agregado) {
      onChange('')
      inputRef?.current?.focus()
    }
  }

  return (
    <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <form onSubmit={manejarEnvio} className="space-y-3">
        <label
          htmlFor="salida-hosp-expediente"
          className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="badge" className="text-[18px] text-primary" />
          Expediente (consulta al Registro Médico)
        </label>

        <div className="relative flex items-center">
          <Icon
            name="qr_code_scanner"
            className="pointer-events-none absolute left-4 text-[28px] text-primary"
          />
          <input
            id="salida-hosp-expediente"
            ref={inputRef}
            value={value}
            onChange={(evento) => onChange(evento.target.value)}
            onFocus={(evento) => evento.target.select()}
            autoComplete="off"
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="done"
            disabled={disabled}
            placeholder="Escriba o escanee el número de expediente"
            aria-describedby="salida-hosp-ayuda"
            className="h-16 w-full rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                inputRef?.current?.focus()
              }}
              aria-label="Limpiar campo"
              className="absolute right-3 flex items-center justify-center rounded-full p-2 text-on-surface-variant transition hover:text-on-surface"
            >
              <Icon name="backspace" className="text-[22px]" />
            </button>
          )}
        </div>

        {cola > 0 && (
          <p
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 text-label-sm font-semibold text-on-surface-variant"
            aria-live="polite"
          >
            <Icon name="sync" className="animate-spin text-[16px]" />
            Consultando {cola}…
          </p>
        )}

        <p id="salida-hosp-ayuda" className="text-center text-label-sm text-on-surface-variant">
          Escriba el número y presione <strong>Enter</strong>. Se consulta al hospital y se registra
          la salida.
        </p>
      </form>
    </section>
  )
}
