import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearExpediente } from '@/shared/utils/expediente'
import { descargarBlob } from '@/modules/archivo/utils/descargarBlob'
import {
  descargarSalidasEnfermeriaArchivoPdf,
  listarSalidasEnfermeriaArchivo,
  registrarSalidaEnfermeriaArchivo,
} from '../../api/salidaEnfermeriaArchivoApi'

const ETIQUETAS = [
  { id: 'normal', nombre: 'Normal', icono: 'description' },
  { id: 'privado_libertad', nombre: 'Privado de libertad', icono: 'lock' },
  { id: 'personal', nombre: 'Personal', icono: 'badge' },
  { id: 'presentacion', nombre: 'Presentación', icono: 'gavel' },
]

const ESTILO_ETIQUETA = {
  normal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  privado_libertad: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  personal: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  presentacion: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
}

function horaDe(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function nombreEtiqueta(tipo) {
  return ETIQUETAS.find((etiqueta) => etiqueta.id === tipo)?.nombre ?? 'Normal'
}

export default function SalidaEnfermeriaArchivo({ estacionId, fecha, clinicas = [] }) {
  const { mostrarToast } = useToast()
  const inputRef = useRef(null)
  const [salidas, setSalidas] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('normal')
  const [clinicaPersonalId, setClinicaPersonalId] = useState('')
  const [primeraVez, setPrimeraVez] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  async function cargar() {
    if (!estacionId) {
      setSalidas([])
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setSalidas(await listarSalidasEnfermeriaArchivo({ fecha, estacionId }))
    } catch (fallo) {
      setError(fallo)
      setSalidas([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, estacionId])

  function elegirTipo(nuevoTipo) {
    setTipo(nuevoTipo)
    if (nuevoTipo !== 'personal') setClinicaPersonalId('')
  }

  async function agregar(evento) {
    evento.preventDefault()
    const numero = query.trim()
    if (!numero) return
    if (!estacionId) {
      mostrarToast({ tone: 'warning', title: 'Seleccione la estación antes de registrar.' })
      return
    }
    if (tipo === 'personal' && !clinicaPersonalId) {
      mostrarToast({
        tone: 'warning',
        title: 'Seleccione la clínica para el expediente Personal.',
      })
      return
    }
    setPendientes((prev) => [...prev, numero])
    setQuery('')
    inputRef.current?.focus()
    try {
      const nueva = await registrarSalidaEnfermeriaArchivo({
        numeroExpediente: numero,
        estacionId,
        fecha,
        tipo,
        primeraVez,
        clinicaPersonalId: tipo === 'personal' ? clinicaPersonalId : null,
      })
      setSalidas((prev) => [nueva, ...prev])
      setPrimeraVez(false)
      mostrarToast({
        tone: 'success',
        title: `${formatearExpediente(numero)} · ${nombreEtiqueta(tipo)}`,
        message: 'Salida de Enfermería a Archivo registrada.',
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.status === 409 ? 'Expediente ya registrado' : 'No se pudo registrar',
        message: fallo?.message,
      })
    } finally {
      setPendientes((prev) => prev.filter((item) => item !== numero))
    }
  }

  async function descargarPdf() {
    setGenerandoPdf(true)
    try {
      const blob = await descargarSalidasEnfermeriaArchivoPdf({ fecha, estacionId })
      if (blob) descargarBlob(blob, `salida-enfermeria-archivo-${fecha}.pdf`)
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-headline-md text-on-surface">Salida de Enfermería a Archivo</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Registre el expediente por número, elija su etiqueta y genere el reporte del día.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={descargarPdf}
          disabled={generandoPdf || salidas.length === 0}
        >
          <Icon name="picture_as_pdf" className="text-[18px]" />
          {generandoPdf ? 'Generando…' : `Generar reporte (${salidas.length})`}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-2">
        <span className="px-1 text-label-md font-bold uppercase tracking-wide text-on-surface-variant">
          Etiqueta
        </span>
        {ETIQUETAS.map((etiqueta) => (
          <button
            key={etiqueta.id}
            type="button"
            aria-pressed={tipo === etiqueta.id}
            onClick={() => elegirTipo(etiqueta.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-label-md font-semibold transition ${
              tipo === etiqueta.id
                ? 'border-primary bg-primary text-on-primary shadow-sm'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'
            }`}
          >
            <Icon name={etiqueta.icono} className="text-[16px]" />
            {etiqueta.nombre}
          </button>
        ))}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-label-md font-semibold text-on-surface">
          <input
            type="checkbox"
            checked={primeraVez}
            onChange={(evento) => setPrimeraVez(evento.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Primera vez
        </label>
        {tipo === 'personal' && (
          <label className="flex items-center gap-2 text-label-sm font-semibold text-on-surface-variant">
            Clínica
            <select
              value={clinicaPersonalId}
              onChange={(evento) => setClinicaPersonalId(evento.target.value)}
              className="h-9 min-w-[170px] rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Seleccione clínica…</option>
              {clinicas.map((clinica) => (
                <option key={clinica.id} value={clinica.id}>
                  {clinica.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <form onSubmit={agregar} className="mt-4">
        <label
          htmlFor="salida-enfermeria-expediente"
          className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="badge" className="text-[18px] text-primary" />
          Número de expediente
        </label>
        <div className="relative mt-2 flex items-center">
          <Icon
            name="qr_code_scanner"
            className="pointer-events-none absolute left-4 text-[26px] text-primary"
          />
          <input
            id="salida-enfermeria-expediente"
            ref={inputRef}
            value={query}
            onChange={(evento) => setQuery(evento.target.value)}
            onFocus={(evento) => evento.target.select()}
            autoComplete="off"
            inputMode="numeric"
            placeholder="Escriba o escanee el expediente"
            className="h-14 w-full rounded-lg bg-surface-container-low pl-14 pr-4 text-[24px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
          />
        </div>
        <p className="mt-1 text-center text-label-sm text-on-surface-variant">
          Presione <strong>Enter</strong> para registrar la salida.
        </p>
        {pendientes.length > 0 && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant">
            <Icon name="sync" className="animate-spin text-[16px]" />
            Registrando {pendientes.length}…
          </p>
        )}
      </form>

      {error && (
        <div className="mt-3">
          <Alert tone="error" title="No se pudieron cargar las salidas">
            {error.message}
          </Alert>
        </div>
      )}

      <div className="mt-4">
        {cargando ? (
          <Spinner label="Cargando salidas…" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant">
            <div className="max-h-[52vh] overflow-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="sticky top-0 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2">Expediente</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Etiqueta</th>
                    <th className="px-3 py-2 text-center">Primera vez</th>
                    <th className="px-3 py-2">Clínica (Personal)</th>
                    <th className="px-3 py-2 text-center">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {pendientes.map((numero) => (
                    <tr key={`pend-${numero}`} className="bg-emerald-50/60 dark:bg-emerald-950/20">
                      <td className="px-3 py-2 font-mono font-bold text-on-surface-variant">
                        {formatearExpediente(numero)}
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">Consultando…</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-label-sm font-bold ${ESTILO_ETIQUETA[tipo]}`}
                        >
                          {nombreEtiqueta(tipo)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-on-surface-variant">—</td>
                      <td className="px-3 py-2 text-on-surface-variant">—</td>
                      <td className="px-3 py-2 text-center text-on-surface-variant">—</td>
                    </tr>
                  ))}
                  {salidas.map((salida) => (
                    <tr key={salida.id}>
                      <td className="px-3 py-2 font-mono text-title-md font-bold text-primary">
                        {formatearExpediente(salida.numeroExpediente)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-on-surface">
                        {salida.pacienteNombre}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-label-sm font-bold ${ESTILO_ETIQUETA[salida.tipo] ?? ESTILO_ETIQUETA.normal}`}
                        >
                          {nombreEtiqueta(salida.tipo)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-on-surface-variant">
                        {salida.primeraVez ? 'Sí' : 'No'}
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">
                        {salida.clinicaPersonalNombre ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-on-surface-variant">
                        {horaDe(salida.registradoEn)}
                      </td>
                    </tr>
                  ))}
                  {salidas.length === 0 && pendientes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-on-surface-variant">
                        Aún no hay salidas registradas para esta estación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
