import { Alert, Button, Icon } from '@/shared/components/ui'

// Campo único de búsqueda de expediente para depurar. Presentacional: recibe el
// valor, el ref del input y los callbacks; el `escaner` (useEscanerCodigo) se
// pasa desde el contenedor para la lectura por cámara.
export default function BuscadorExpedienteDepurar({
  numero,
  onCambio,
  onEnviar,
  inputRef,
  procesando,
  escaner,
}) {
  function manejarEnvio(event) {
    event.preventDefault()
    onEnviar()
  }

  return (
    <section className="rounded-xl bg-surface-container-lowest p-4 shadow-card">
      <form onSubmit={manejarEnvio} className="space-y-3">
        <label
          htmlFor="numero-expediente"
          className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="badge" className="text-[18px] text-primary" />
          Número de expediente
        </label>

        <div className="relative flex items-center">
          <Icon
            name="qr_code_scanner"
            className="pointer-events-none absolute left-4 text-[28px] text-primary"
          />
          <input
            id="numero-expediente"
            ref={inputRef}
            value={numero}
            onChange={(event) => onCambio(event.target.value)}
            autoComplete="off"
            autoFocus
            inputMode="text"
            enterKeyHint="done"
            placeholder="Ej. EXP-2024-035"
            aria-describedby="numero-expediente-ayuda"
            className="h-16 w-full rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
          />
          {numero && (
            <button
              type="button"
              onClick={() => onCambio('')}
              aria-label="Limpiar campo"
              className="absolute right-3 flex items-center justify-center rounded-full p-2 text-on-surface-variant transition hover:text-on-surface"
            >
              <Icon name="backspace" className="text-[22px]" />
            </button>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={procesando || !numero.trim()}>
          <Icon name="search" className="text-[24px]" />
          {procesando ? 'Buscando…' : 'Buscar expediente'}
        </Button>

        {!escaner.activo && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={escaner.iniciar}
          >
            <Icon name="photo_camera" className="text-[24px]" />
            Escanear con cámara
          </Button>
        )}

        {escaner.activo && (
          <div className="space-y-2">
            <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-black">
              <video
                ref={escaner.videoRef}
                className="h-64 w-full object-cover"
                muted
                playsInline
                aria-label="Vista de cámara"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-64 rounded-lg border-2 border-white/80" />
              </div>
            </div>
            <p className="text-center text-label-sm text-on-surface-variant">
              Apunte al código del expediente; se buscará solo al leerlo.
            </p>
            <Button type="button" variant="ghost" className="w-full" onClick={escaner.detener}>
              <Icon name="close" className="text-[20px]" />
              Cerrar cámara
            </Button>
          </div>
        )}

        {escaner.error && (
          <Alert tone="warning" title="Cámara no disponible">
            {escaner.error}
          </Alert>
        )}

        <p
          id="numero-expediente-ayuda"
          className="text-center text-label-sm text-on-surface-variant"
        >
          Escanee con la cámara, use el lector o escríbalo: la búsqueda es automática.
        </p>
      </form>
    </section>
  )
}
