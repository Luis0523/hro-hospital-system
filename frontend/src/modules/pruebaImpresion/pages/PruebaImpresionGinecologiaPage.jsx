import { useEffect, useMemo, useState } from 'react'
import { Button, Input } from '@/shared/components/ui'
import {
  formatearFechaHora,
  imprimirTicketGinecologia,
  payloadTicketGinecologia,
} from '@/shared/utils/impresionTicket'

const AGENTE_URL = import.meta.env.VITE_PRINT_AGENT_URL || 'http://127.0.0.1:17777'

async function solicitar(url, opciones = {}, ms = 5000) {
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), ms)
  try {
    return await fetch(url, { ...opciones, signal: control.signal })
  } finally {
    clearTimeout(temporizador)
  }
}

function EstadoAgente({ conectado }) {
  if (conectado === null) {
    return (
      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
        Verificando agente…
      </span>
    )
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        conectado
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-error-container text-on-error-container'
      }`}
    >
      {conectado ? 'Agente conectado' : 'Agente no disponible'}
    </span>
  )
}

// Mockup temporal de Ginecología: el número grande del ticket muestra la
// clínica en lugar del correlativo. No sustituye la pantalla oficial.
export default function PruebaImpresionGinecologiaPage() {
  const [especialidad, setEspecialidad] = useState('Ginecología')
  const [clinica, setClinica] = useState('1')
  const [conectado, setConectado] = useState(null)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    let cancelado = false

    async function revisarAgente() {
      try {
        const respuesta = await solicitar(`${AGENTE_URL}/health`, {}, 2500)
        const datos = await respuesta.json()
        if (!cancelado) setConectado(Boolean(datos.ok))
      } catch {
        if (!cancelado) setConectado(false)
      }
    }

    revisarAgente()
    const intervalo = setInterval(revisarAgente, 5000)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [])

  const payload = useMemo(() => {
    try {
      return payloadTicketGinecologia({ clinica, especialidad })
    } catch {
      return null
    }
  }, [clinica, especialidad])

  async function imprimirTicket() {
    if (!payload) return
    setImprimiendo(true)
    setMensaje(null)

    try {
      const datos = await imprimirTicketGinecologia({ clinica, especialidad })
      setConectado(true)
      setMensaje({
        tono: 'ok',
        texto: `Ticket temporal de Ginecología enviado (${datos.duracionMs ?? 0} ms).`,
      })
    } catch (error) {
      setConectado(false)
      setMensaje({
        tono: 'error',
        texto:
          error?.name === 'AbortError'
            ? 'El agente no respondió. Verifique que iniciar.bat esté abierto en esta computadora.'
            : error.message,
      })
    } finally {
      setImprimiendo(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-on-surface">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="space-y-2">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Impresión térmica · 80 mm · Mockup temporal
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-headline-sm">Ticket de Ginecología</h1>
            <EstadoAgente conectado={conectado} />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Esta pantalla es independiente del ticket oficial. Solo cambia el número grande: en
            lugar del correlativo se imprime el número de clínica. El resto del ticket no cambia.
          </p>
        </header>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-modal">
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Número grande (clínica)
            </p>
            <p className="text-[64px] font-bold leading-none text-primary">
              #{payload ? String(payload.turno).padStart(3, '0') : '---'}
            </p>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {especialidad || 'Ginecología'} · Clínica {clinica || '—'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_140px]">
            <Input
              label="Especialidad"
              name="especialidad"
              value={especialidad}
              maxLength={60}
              onChange={(evento) => setEspecialidad(evento.target.value)}
            />
            <Input
              label="Número de clínica"
              name="clinica"
              value={clinica}
              maxLength={16}
              inputMode="numeric"
              onChange={(evento) => setClinica(evento.target.value)}
            />
          </div>

          <p className="mt-3 text-xs text-on-surface-variant">
            La fecha y hora se toman al momento de imprimir:{' '}
            <span className="font-semibold text-on-surface">{formatearFechaHora(ahora)}</span>
          </p>

          {payload && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-container p-3 text-xs text-on-surface-variant">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={imprimiendo || !payload}
            onClick={imprimirTicket}
          >
            {imprimiendo ? 'Enviando a la impresora…' : 'Imprimir ticket temporal'}
          </Button>

          {mensaje && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-body-sm ${
                mensaje.tono === 'ok'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-error-container/60 text-on-error-container'
              }`}
            >
              {mensaje.texto}
            </p>
          )}

          {conectado === false && !mensaje && (
            <p className="mt-4 rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant">
              Abra <code className="font-mono">printer-agent/iniciar.bat</code> en esta computadora
              para habilitar la impresión.
            </p>
          )}
        </section>

        <p className="text-center text-xs text-on-surface-variant">
          Payload enviado al agente: el número de clínica viaja como <code>turno</code> y se repite
          en <code>clinica</code>.
        </p>
      </div>
    </main>
  )
}
