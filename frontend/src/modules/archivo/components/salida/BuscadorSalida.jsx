import { useEffect, useState } from 'react'
import { Icon } from '@/shared/components/ui'
import { formatearExpediente } from '@/shared/utils/expediente'

// Buscador de la pantalla de salidas: tecleo rápido del número de expediente con
// coincidencias locales en vivo. El primer resultado queda auto-seleccionado;
// Enter marca la salida y limpia el campo para continuar el lote.
export default function BuscadorSalida({
  value,
  onChange,
  coincidencias,
  inputRef,
  onMarcar,
  onSinCoincidencia,
}) {
  const [indice, setIndice] = useState(0)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setIndice(0)
  }, [value])

  function seleccionado() {
    return coincidencias[Math.min(indice, coincidencias.length - 1)] ?? coincidencias[0] ?? null
  }

  function manejarTecla(evento) {
    if (evento.key === 'ArrowDown' && coincidencias.length > 0) {
      evento.preventDefault()
      setIndice((actual) => (actual + 1) % coincidencias.length)
    } else if (evento.key === 'ArrowUp' && coincidencias.length > 0) {
      evento.preventDefault()
      setIndice((actual) => (actual - 1 + coincidencias.length) % coincidencias.length)
    }
  }

  function manejarEnvio(evento) {
    evento.preventDefault()
    const objetivo = seleccionado()
    if (objetivo) {
      onMarcar(objetivo)
      onChange('')
    } else {
      setShake(true)
      window.setTimeout(() => setShake(false), 400)
      onSinCoincidencia?.()
    }
  }

  return (
    <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <form onSubmit={manejarEnvio} className="space-y-3">
        <label
          htmlFor="salida-expediente"
          className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="badge" className="text-[18px] text-primary" />
          Expediente a marcar como salida
        </label>

        <div className="relative">
          <div
            className={`relative flex items-center ${shake ? 'hro-shake' : ''}`}
          >
            <Icon
              name="qr_code_scanner"
              className="pointer-events-none absolute left-4 text-[28px] text-primary"
            />
            <input
              id="salida-expediente"
              ref={inputRef}
              value={value}
              onChange={(evento) => onChange(evento.target.value)}
              onKeyDown={manejarTecla}
              autoComplete="off"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="done"
              placeholder="Escriba o escanee el número de expediente"
              aria-describedby="salida-expediente-ayuda"
              className="h-16 w-full rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
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

          {coincidencias.length > 0 && (
            <ul
              className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-popover"
              role="listbox"
              aria-label="Coincidencias"
            >
              {coincidencias.map((carnet, i) => (
                <li key={carnet.id} role="option" aria-selected={i === indice}>
                  <button
                    type="button"
                    onClick={() => onMarcar(carnet)}
                    onMouseEnter={() => setIndice(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition ${
                      i === indice ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-mono text-title-md font-bold text-primary">
                      {formatearExpediente(carnet.numeroExpediente)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body-sm text-on-surface">
                      {carnet.pacienteNombre}
                    </span>
                    <span className="shrink-0 text-label-sm text-on-surface-variant">
                      {carnet.especialidadNombre}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p id="salida-expediente-ayuda" className="text-center text-label-sm text-on-surface-variant">
          Escriba el número y presione <strong>Enter</strong> para marcar la salida. La primera
          coincidencia queda seleccionada automáticamente.
        </p>
      </form>
    </section>
  )
}
