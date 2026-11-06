import { Button, Icon } from '@/shared/components/ui'

// Campo único de depuración. No consulta mientras se escribe: al presionar
// Enter o el botón se consulta al hospital y se registra la baja en un solo paso.
export default function BuscadorExpedienteDepurar({
  numero,
  onCambio,
  onEnviar,
  inputRef,
  procesando = false,
  cola = 0,
  aviso = null,
  onAbrirRegistroManual,
}) {
  function manejarEnvio(event) {
    event.preventDefault()
    const agregado = onEnviar(numero)
    if (agregado) {
      onCambio('')
      inputRef?.current?.focus()
    }
  }

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5">
      <form onSubmit={manejarEnvio} className="space-y-3" noValidate>
        <label
          htmlFor="numero-expediente"
          className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="badge" className="text-[18px] text-primary" />
          Número de expediente
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex flex-1 items-center">
            <Icon
              name="qr_code_scanner"
              className="pointer-events-none absolute left-4 text-[28px] text-primary"
            />
            <input
              id="numero-expediente"
              ref={inputRef}
              value={numero}
              onChange={(event) => onCambio(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoComplete="off"
              autoFocus
              inputMode="numeric"
              enterKeyHint="go"
              pattern="[0-9-]*"
              maxLength={31}
              placeholder="Ej. 927581"
              aria-describedby="numero-expediente-ayuda"
              aria-busy={procesando}
              className="h-16 w-full min-w-0 rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition placeholder:text-[18px] placeholder:tracking-normal focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 sm:placeholder:text-[22px]"
            />
            {numero && (
              <button
                type="button"
                onClick={() => {
                  onCambio('')
                  inputRef?.current?.focus()
                }}
                aria-label="Limpiar campo"
                className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <Icon name="backspace" className="text-[22px]" />
              </button>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-16 shrink-0 sm:px-6"
            disabled={!String(numero ?? '').trim()}
          >
            <Icon name="search" className="text-[24px]" />
            {procesando ? 'Depurando…' : 'Buscar y depurar'}
          </Button>
        </div>

        {cola > 0 && (
          <p
            role="status"
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 text-label-sm font-semibold text-on-surface-variant"
          >
            <Icon name="sync" className="animate-spin text-[16px]" />
            Procesando {cola}…
          </p>
        )}

        <p
          id="numero-expediente-ayuda"
          className="text-center text-label-sm text-on-surface-variant"
        >
          Escriba el número y presione <strong>Enter</strong> o el botón{' '}
          <strong>Buscar y depurar</strong>. Se consulta al hospital y se registra la baja.
        </p>

        {aviso && (
          <p role="alert" className="text-center text-label-sm text-error">
            {aviso}
          </p>
        )}

        {onAbrirRegistroManual && (
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onAbrirRegistroManual}
              title="Registrar una baja cuando el API del hospital no responde"
              className="min-h-9"
            >
              <Icon name="edit_note" className="text-[16px]" />
              Registrar manualmente
            </Button>
          </div>
        )}
      </form>
    </section>
  )
}
