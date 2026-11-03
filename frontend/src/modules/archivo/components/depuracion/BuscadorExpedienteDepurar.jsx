import { useEffect, useState } from 'react'
import { Alert, Button, Icon } from '@/shared/components/ui'

const PATRON_MANUAL = /^\d*(-\d*)?$/

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
  manual = false,
  onAlternarModo,
}) {
  const [avisoManual, setAvisoManual] = useState(null)

  useEffect(() => {
    setAvisoManual(null)
    inputRef.current?.focus()
  }, [manual, inputRef])

  function manejarEnvio(event) {
    event.preventDefault()
    onEnviar()
  }

  function manejarCambioManual(valor) {
    if (!PATRON_MANUAL.test(valor)) {
      setAvisoManual('Use solo dígitos y un único guion interior.')
      return
    }

    if (valor.endsWith('-')) {
      setAvisoManual('El guion no puede quedar al inicio o al final.')
    } else {
      setAvisoManual(null)
    }
    onCambio(valor)
  }

  const valorNormal = numero.replace(/-/g, '')

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5">
      <form onSubmit={manejarEnvio} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="numero-expediente"
            className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
          >
            <Icon name="badge" className="text-[18px] text-primary" />
            Número de expediente
          </label>
          <Button
            type="button"
            variant={manual ? 'primary' : 'secondary'}
            size="sm"
            className="ml-auto min-h-11"
            onClick={onAlternarModo}
            disabled={procesando}
            aria-pressed={manual}
          >
            <Icon name="keyboard" className="text-[18px]" />
            {manual ? 'Captura normal' : 'Ingreso manual'}
          </Button>
        </div>

        <div className="relative flex w-full min-w-0 items-center">
          <Icon
            name="qr_code_scanner"
            className="pointer-events-none absolute left-4 text-[28px] text-primary"
          />
          {manual ? (
            <input
              id="numero-expediente"
              ref={inputRef}
              value={numero}
              onChange={(event) => manejarCambioManual(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoComplete="off"
              inputMode="numeric"
              enterKeyHint="done"
              pattern="[0-9-]*"
              maxLength={31}
              placeholder="Ej. 9275-81"
              aria-describedby="numero-expediente-ayuda"
              aria-busy={procesando}
              aria-invalid={Boolean(avisoManual)}
              className="h-16 w-full min-w-0 rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition placeholder:text-[18px] placeholder:tracking-normal focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 sm:placeholder:text-[22px]"
            />
          ) : (
            <input
              id="numero-expediente"
              ref={inputRef}
              value={valorNormal}
              onChange={(event) => onCambio(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoComplete="off"
              autoFocus
              inputMode="numeric"
              enterKeyHint="done"
              pattern="[0-9]*"
              maxLength={31}
              placeholder="Ej. 927581"
              aria-describedby="numero-expediente-ayuda"
              aria-busy={procesando}
              className="h-16 w-full min-w-0 rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition placeholder:text-[18px] placeholder:tracking-normal focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 sm:placeholder:text-[22px]"
            />
          )}
          {numero && (
            <button
              type="button"
              onClick={() => onCambio('')}
              aria-label="Limpiar campo"
              className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
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
          {manual
            ? 'Ingreso manual: escriba los dígitos y coloque un único guion interior. La búsqueda usa el número sin guion.'
            : 'Escriba o escanee solo dígitos; el guion se agrega al mostrar el expediente. La búsqueda es automática.'}
        </p>
        {avisoManual && (
          <p role="alert" className="text-center text-label-sm text-error">
            {avisoManual}
          </p>
        )}
      </form>
    </section>
  )
}
