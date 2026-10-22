import { useEffect, useState } from 'react'
import { Button, Input } from '@/shared/components/ui'

const AGENTE_URL = import.meta.env.VITE_PRINT_AGENT_URL || 'http://127.0.0.1:17777'
const CLAVE_TURNO = 'hro_prueba_turno'

function leerTurno() {
  const guardado = Number(localStorage.getItem(CLAVE_TURNO))
  return Number.isInteger(guardado) && guardado > 0 ? guardado : 1
}

function formatearFechaHora(fecha) {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const aaaa = fecha.getFullYear()
  const hh = String(fecha.getHours()).padStart(2, '0')
  const min = String(fecha.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${hh}:${min}`
}

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

export default function PruebaImpresionPage() {
  const [turno, setTurno] = useState(leerTurno)
  const [especialidad, setEspecialidad] = useState('Medicina General')
  const [clinica, setClinica] = useState('01')
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

  async function imprimirTicket() {
    setImprimiendo(true)
    setMensaje(null)

    try {
      const respuesta = await solicitar(
        `${AGENTE_URL}/print`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turno,
            especialidad,
            clinica,
            fechaHora: formatearFechaHora(new Date()),
          }),
        },
        10000,
      )

      const datos = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || `El agente respondió con estado ${respuesta.status}`)
      }

      const siguiente = turno + 1
      setTurno(siguiente)
      localStorage.setItem(CLAVE_TURNO, String(siguiente))
      setConectado(true)
      setMensaje({
        tono: 'ok',
        texto: `Ticket #${String(turno).padStart(3, '0')} enviado a la impresora (${datos.duracionMs} ms).`,
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

  function reiniciarContador() {
    setTurno(1)
    localStorage.setItem(CLAVE_TURNO, '1')
    setMensaje(null)
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-on-surface">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="space-y-2">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Impresión térmica · 80 mm
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-headline-sm">Ticket de turno</h1>
            <EstadoAgente conectado={conectado} />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Esta página no consulta el backend. Solo envía el ticket al agente local que está
            corriendo en esta computadora.
          </p>
        </header>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-modal">
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Número de turno
            </p>
            <p className="text-[64px] font-bold leading-none text-primary">
              #{String(turno).padStart(3, '0')}
            </p>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {especialidad || 'Sin especialidad'} · Clínica {clinica || '—'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_140px]">
            <Input
              label="Especialidad asignada"
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
              onChange={(evento) => setClinica(evento.target.value)}
            />
          </div>

          <p className="mt-3 text-xs text-on-surface-variant">
            La fecha y hora se toman al momento de imprimir:{' '}
            <span className="font-semibold text-on-surface">
              {formatearFechaHora(ahora)}
            </span>
          </p>

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={imprimiendo || !especialidad.trim() || !clinica.trim()}
            onClick={imprimirTicket}
          >
            {imprimiendo ? 'Enviando a la impresora…' : 'Imprimir ticket'}
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

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={reiniciarContador}>
              Reiniciar contador
            </Button>
          </div>
        </section>

        <p className="text-center text-xs text-on-surface-variant">
          El contador se guarda en este navegador y avanza solo cuando la impresión se envía
          correctamente.
        </p>
      </div>
    </main>
  )
}
