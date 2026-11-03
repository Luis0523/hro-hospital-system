import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@/shared/components/ui'
import Icon from '@/shared/components/ui/Icon.jsx'
import { normalizarExpedienteHablado } from '@/shared/speech/normalizarExpedienteHablado.js'
import { useReconocimientoVoz } from '@/shared/speech/useReconocimientoVoz.js'

function porcentaje(valor) {
  if (valor == null || Number.isNaN(valor)) return '—'
  return `${Math.round(valor * 100)} %`
}

export default function PruebaVozPage() {
  const {
    soportado,
    escuchando,
    transcripcion,
    parcial,
    alternativas,
    confianza,
    error,
    codigoError,
    iniciar,
    detener,
    limpiar,
  } = useReconocimientoVoz({ lang: 'es-MX' })

  const inputRef = useRef(null)
  const [valor, setValor] = useState('')

  const esLinux = typeof navigator !== 'undefined' && /Linux/i.test(navigator.userAgent || '')

  const interpretado = useMemo(() => normalizarExpedienteHablado(transcripcion), [transcripcion])

  useEffect(() => {
    if (transcripcion) setValor(interpretado.valor)
  }, [transcripcion, interpretado.valor])

  function alternarGrabacion() {
    if (escuchando) {
      detener()
      return
    }
    iniciar()
    inputRef.current?.focus()
  }

  function limpiarTodo() {
    limpiar()
    setValor('')
    inputRef.current?.focus()
  }

  const textoEscuchado = transcripcion || parcial

  return (
    <div className="min-h-screen bg-surface px-4 py-6 text-on-surface">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center gap-3">
          <Icon name="mic" className="text-[32px] text-primary" />
          <div>
            <h1 className="text-title-lg font-bold">Prueba de voz — número de expediente</h1>
            <p className="text-body-sm text-on-surface-variant">
              Demo aislada. No afecta al sistema. Requiere Chrome o Edge y conexión a internet.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm font-semibold">
            Web Speech API: {soportado ? 'disponible' : 'no disponible'}
          </span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm font-semibold">
            Idioma: es-MX
          </span>
          {escuchando && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">
              Escuchando…
            </span>
          )}
        </div>

        {!soportado && (
          <Alert tone="warning" title="Navegador sin soporte">
            Este navegador no soporta la Web Speech API. Use Chrome o Edge en un contexto HTTPS.
          </Alert>
        )}

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <label
            htmlFor="expediente-voz"
            className="mb-2 flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
          >
            <Icon name="badge" className="text-[18px] text-primary" />
            Número de expediente
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="expediente-voz"
              ref={inputRef}
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="901201"
              aria-describedby="expediente-voz-ayuda"
              className="h-20 flex-1 rounded-xl bg-surface-container-low px-4 font-mono text-4xl font-bold tracking-[0.15em] text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
            />

            <button
              type="button"
              onClick={alternarGrabacion}
              disabled={!soportado}
              aria-pressed={escuchando}
              className={`flex h-20 items-center justify-center gap-2 rounded-xl px-6 text-title-md font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                escuchando
                  ? 'bg-error text-on-error'
                  : 'bg-primary-container text-on-primary hover:brightness-110'
              }`}
            >
              <Icon name={escuchando ? 'stop_circle' : 'mic'} className="text-[28px]" />
              {escuchando ? 'Detener' : 'Grabar'}
            </button>
          </div>

          <p id="expediente-voz-ayuda" className="mt-2 text-body-sm text-on-surface-variant">
            Diga por pares (<strong>noventa doce cero uno</strong>) o dígito a dígito (
            <strong>nueve cero uno dos cero uno</strong>). El reconocimiento se detiene solo al
            dejar de hablar.
          </p>

          <div aria-live="polite" className="mt-2 min-h-6 text-body-sm text-primary">
            {escuchando && parcial ? parcial : ''}
          </div>
        </section>

        {error && (
          <Alert tone="warning" title="No se pudo capturar">
            <p>{error}</p>
            {codigoError === 'network' && (
              <>
                <p className="mt-2 font-semibold">Posibles causas:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>
                    Conexión, VPN o firewall: el reconocimiento de Chrome usa un servicio externo de
                    Google.
                  </li>
                  {esLinux && (
                    <li>
                      Está en Linux: Chromium/Chrome para Linux no incluye ese servicio de voz.
                      Pruebe Chrome en Windows/macOS o use un modelo local.
                    </li>
                  )}
                  <li>Pruebe desactivar bloqueadores de contenido o proxies que filtren Google.</li>
                </ul>
              </>
            )}
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
            <h2 className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              Escuchado
            </h2>
            <p className="mt-2 min-h-7 break-words font-mono text-title-md text-on-surface">
              {textoEscuchado || '—'}
            </p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Confianza: {porcentaje(confianza)}
            </p>

            {alternativas.length > 1 && (
              <ul className="mt-3 space-y-1">
                {alternativas.map((alternativa, indice) => (
                  <li
                    key={`${alternativa.texto}-${indice}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-2 py-1 text-body-sm"
                  >
                    <span className="font-mono">{alternativa.texto}</span>
                    <span className="text-on-surface-variant">
                      {porcentaje(alternativa.confianza)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {transcripcion && !escuchando && (
              <p className="mt-3 text-label-sm text-on-surface-variant">
                Captura terminada sola al dejar de hablar.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
            <h2 className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              Interpretado
            </h2>
            <p className="mt-2 min-h-12 break-words font-mono text-[32px] font-bold tracking-[0.1em] text-primary">
              {interpretado.valor || '—'}
            </p>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-label-sm font-semibold ${
                interpretado.valido ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
              }`}
            >
              {interpretado.valido ? 'Longitud válida (5 o 6 dígitos)' : interpretado.motivo}
            </span>

            <p className="mt-3 text-body-sm text-on-surface-variant">
              Desglose: {interpretado.grupos.length > 0 ? interpretado.grupos.join(' · ') : '—'}
            </p>

            {interpretado.advertencias.length > 0 && (
              <ul className="mt-2 space-y-1">
                {interpretado.advertencias.map((advertencia) => (
                  <li key={advertencia} className="text-label-sm text-error">
                    {advertencia}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={limpiarTodo}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-container px-4 font-semibold text-on-surface transition hover:bg-surface-container-high"
          >
            <Icon name="backspace" />
            Limpiar
          </button>
          <p className="text-label-sm text-on-surface-variant">
            El valor nunca se envía a ninguna parte; esta página no habla con el backend.
          </p>
        </div>
      </div>
    </div>
  )
}
