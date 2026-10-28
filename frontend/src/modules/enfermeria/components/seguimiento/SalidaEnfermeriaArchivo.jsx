import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Icon, Modal, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearExpediente } from '@/shared/utils/expediente'
import { descargarBlob } from '@/modules/archivo/utils/descargarBlob'
import ModalGenerandoPdf from './ModalGenerandoPdf.jsx'
import {
  actualizarSalidaEnfermeriaArchivo,
  descargarSalidasEnfermeriaArchivoPdf,
  eliminarSalidaEnfermeriaArchivo,
  listarSalidasEnfermeriaArchivo,
  registrarSalidaEnfermeriaArchivo,
} from '../../api/salidaEnfermeriaArchivoApi'

const ETIQUETAS = [
  { id: 'normal', nombre: 'Normal', icono: 'description' },
  { id: 'privado_libertad', nombre: 'Privado de libertad', icono: 'lock' },
  { id: 'personal', nombre: 'Personal', icono: 'badge' },
  { id: 'presentacion', nombre: 'Presentación', icono: 'gavel' },
  { id: 'clinica_mujer', nombre: 'Clínica de la Mujer', icono: 'female' },
]

const ESTILO_ETIQUETA = {
  normal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  privado_libertad: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  personal: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  presentacion: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  clinica_mujer: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
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

function normalizarBusqueda(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]/g, '')
    .toLowerCase()
}

function coincideSalida(salida, termino) {
  if (!termino) return true
  const texto = normalizarBusqueda(
    [
      salida.numeroExpediente,
      formatearExpediente(salida.numeroExpediente),
      salida.pacienteNombre,
      nombreEtiqueta(salida.tipo),
      salida.clinicaPersonalNombre,
    ]
      .filter(Boolean)
      .join(' '),
  )
  return texto.includes(termino)
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
  const [progresoPdf, setProgresoPdf] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [salidaEditando, setSalidaEditando] = useState(null)
  const [formEdicion, setFormEdicion] = useState(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const salidasFiltradas = useMemo(() => {
    const termino = normalizarBusqueda(busqueda)
    return salidas.filter((salida) => coincideSalida(salida, termino))
  }, [salidas, busqueda])

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

  function abrirEdicion(salida) {
    setSalidaEditando(salida)
    setFormEdicion({
      numeroExpediente: salida.numeroExpediente,
      tipo: salida.tipo,
      primeraVez: Boolean(salida.primeraVez),
      clinicaPersonalId: salida.clinicaPersonalId ?? '',
    })
  }

  function cerrarEdicion() {
    if (guardandoEdicion) return
    setSalidaEditando(null)
    setFormEdicion(null)
  }

  async function guardarEdicion(evento) {
    evento.preventDefault()
    if (!salidaEditando || !formEdicion || guardandoEdicion) return
    if (formEdicion.tipo === 'personal' && !formEdicion.clinicaPersonalId) {
      mostrarToast({
        tone: 'warning',
        title: 'Seleccione la clínica para el expediente Personal.',
      })
      return
    }
    setGuardandoEdicion(true)
    try {
      const actualizada = await actualizarSalidaEnfermeriaArchivo(salidaEditando.id, {
        numeroExpediente: formEdicion.numeroExpediente.trim(),
        tipo: formEdicion.tipo,
        primeraVez: formEdicion.primeraVez,
        clinicaPersonalId: formEdicion.tipo === 'personal' ? formEdicion.clinicaPersonalId : null,
      })
      setSalidas((actuales) =>
        actuales.map((salida) =>
          String(salida.id) === String(actualizada.id) ? actualizada : salida,
        ),
      )
      setSalidaEditando(null)
      setFormEdicion(null)
      mostrarToast({
        tone: 'success',
        title: 'Expediente actualizado',
        message: formatearExpediente(actualizada.numeroExpediente),
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: fallo?.status === 409 ? 'Expediente duplicado' : 'No se pudo actualizar',
        message: fallo?.message,
      })
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar || eliminando) return
    setEliminando(true)
    try {
      await eliminarSalidaEnfermeriaArchivo(porEliminar.id)
      setSalidas((actuales) =>
        actuales.filter((salida) => String(salida.id) !== String(porEliminar.id)),
      )
      mostrarToast({
        tone: 'info',
        title: 'Expediente eliminado',
        message: formatearExpediente(porEliminar.numeroExpediente),
      })
      setPorEliminar(null)
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo eliminar',
        message: fallo?.message,
      })
    } finally {
      setEliminando(false)
    }
  }

  async function descargarPdf() {
    if (generandoPdf) return
    setGenerandoPdf(true)
    setProgresoPdf(0)

    const inicio = Date.now()
    const simulacionMs = 2400
    const maximoMs = 12000
    const progresoTimer = setInterval(() => {
      const transcurrido = Date.now() - inicio
      const objetivo = Math.min(92, Math.round((transcurrido / simulacionMs) * 92))
      setProgresoPdf((actual) => Math.max(actual, objetivo))
    }, 50)

    let timeoutId = null
    try {
      const timeout = new Promise((_, rechazar) => {
        timeoutId = setTimeout(
          () => rechazar(new Error('La generación del documento tardó demasiado.')),
          maximoMs,
        )
      })
      const [blob] = await Promise.all([
        Promise.race([descargarSalidasEnfermeriaArchivoPdf({ fecha, estacionId }), timeout]),
        new Promise((resolver) => setTimeout(resolver, simulacionMs)),
      ])
      clearInterval(progresoTimer)
      setProgresoPdf(100)
      if (blob) {
        descargarBlob(blob, `salida-enfermeria-archivo-${fecha}.pdf`)
      }
      await new Promise((resolver) => setTimeout(resolver, 450))
    } catch (fallo) {
      clearInterval(progresoTimer)
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
    } finally {
      clearInterval(progresoTimer)
      if (timeoutId) clearTimeout(timeoutId)
      setGenerandoPdf(false)
      setProgresoPdf(0)
    }
  }

  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-headline-sm font-bold text-on-surface sm:text-headline-md">
            Salida de Enfermería a Archivo
          </h2>
          <p className="mt-0.5 text-body-sm leading-snug text-on-surface-variant">
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

      <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-outline-variant bg-surface-container-low p-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:p-2">
        <span className="col-span-2 px-1 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant sm:col-auto sm:text-label-md">
          Etiqueta
        </span>
        {ETIQUETAS.map((etiqueta) => (
          <button
            key={etiqueta.id}
            type="button"
            aria-pressed={tipo === etiqueta.id}
            onClick={() => elegirTipo(etiqueta.id)}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition sm:justify-start sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-label-md ${
              tipo === etiqueta.id
                ? 'border-primary bg-primary text-on-primary shadow-sm'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'
            }`}
          >
            <Icon name={etiqueta.icono} className="text-[16px]" />
            {etiqueta.nombre}
          </button>
        ))}
        <label className="col-span-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-sm font-semibold text-on-surface sm:col-auto sm:ml-auto sm:justify-start sm:py-1.5 sm:text-label-md">
          <input
            type="checkbox"
            checked={primeraVez}
            onChange={(evento) => setPrimeraVez(evento.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Primera vez
        </label>
        {tipo === 'personal' && (
          <label className="col-span-2 flex items-center gap-2 text-label-sm font-semibold text-on-surface-variant sm:col-auto sm:ml-auto">
            Clínica
            <select
              value={clinicaPersonalId}
              onChange={(evento) => setClinicaPersonalId(evento.target.value)}
              className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface outline-none focus:border-primary sm:w-auto sm:min-w-[170px]"
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

      <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-2.5">
        <label
          htmlFor="buscar-salida-enfermeria"
          className="mb-1.5 flex items-center gap-1 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant"
        >
          <Icon name="search" className="text-[16px] text-primary" />
          Buscar archivo
        </label>
        <div className="flex items-center gap-2">
          <input
            id="buscar-salida-enfermeria"
            aria-label="Buscar archivo"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Expediente, paciente o etiqueta"
            className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {busqueda && (
            <Button variant="ghost" size="sm" onClick={() => setBusqueda('')}>
              Limpiar
            </Button>
          )}
          <span className="whitespace-nowrap text-label-sm text-on-surface-variant">
            {salidasFiltradas.length} de {salidas.length}
          </span>
        </div>
      </div>

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
          <>
            <div className="space-y-2 sm:hidden">
              {pendientes.map((numero) => (
                <article
                  key={`pend-card-${numero}`}
                  className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-title-md font-bold text-on-surface-variant">
                      {formatearExpediente(numero)}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-label-sm font-bold ${ESTILO_ETIQUETA[tipo]}`}
                    >
                      {nombreEtiqueta(tipo)}
                    </span>
                  </div>
                  <p className="mt-1 text-body-sm text-on-surface-variant">Consultando…</p>
                  <div className="mt-2 flex items-center gap-1 text-label-sm text-on-surface-variant">
                    <Icon name="sync" className="animate-spin text-[16px]" />
                    Registrando salida
                  </div>
                </article>
              ))}
              {salidasFiltradas.map((salida) => (
                <article
                  key={`salida-card-${salida.id}`}
                  className="rounded-xl border border-outline-variant bg-surface-container-low p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-title-md font-bold text-primary">
                      {formatearExpediente(salida.numeroExpediente)}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-label-sm font-bold ${ESTILO_ETIQUETA[salida.tipo] ?? ESTILO_ETIQUETA.normal}`}
                    >
                      {nombreEtiqueta(salida.tipo)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-on-surface">{salida.pacienteNombre}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-label-sm">
                    <div>
                      <dt className="text-on-surface-variant">Primera vez</dt>
                      <dd className="font-semibold text-on-surface">
                        {salida.primeraVez ? 'Sí' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Hora</dt>
                      <dd className="font-semibold text-on-surface">
                        {horaDe(salida.registradoEn)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-on-surface-variant">Clínica (Personal)</dt>
                      <dd className="font-semibold text-on-surface">
                        {salida.clinicaPersonalNombre ?? '—'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-2 flex justify-end gap-1.5 border-t border-outline-variant pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => abrirEdicion(salida)}
                      aria-label={`Editar ${formatearExpediente(salida.numeroExpediente)}`}
                    >
                      <Icon name="edit" className="text-[16px]" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPorEliminar(salida)}
                      aria-label={`Eliminar ${formatearExpediente(salida.numeroExpediente)}`}
                    >
                      <Icon name="delete" className="text-[16px]" />
                      Eliminar
                    </Button>
                  </div>
                </article>
              ))}
              {salidasFiltradas.length === 0 && pendientes.length === 0 && (
                <p className="rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
                  {busqueda
                    ? 'No hay archivos que coincidan con la búsqueda.'
                    : 'Aún no hay salidas registradas para esta estación.'}
                </p>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-outline-variant sm:block">
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
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {pendientes.map((numero) => (
                      <tr
                        key={`pend-${numero}`}
                        className="bg-emerald-50/60 dark:bg-emerald-950/20"
                      >
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
                    {salidasFiltradas.map((salida) => (
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
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => abrirEdicion(salida)}
                              aria-label={`Editar ${formatearExpediente(salida.numeroExpediente)}`}
                            >
                              <Icon name="edit" className="text-[16px]" />
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setPorEliminar(salida)}
                              aria-label={`Eliminar ${formatearExpediente(salida.numeroExpediente)}`}
                            >
                              <Icon name="delete" className="text-[16px]" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {salidasFiltradas.length === 0 && pendientes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant">
                          {busqueda
                            ? 'No hay archivos que coincidan con la búsqueda.'
                            : 'Aún no hay salidas registradas para esta estación.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(salidaEditando)}
        onClose={cerrarEdicion}
        title="Editar expediente"
        footer={
          <>
            <Button variant="secondary" onClick={cerrarEdicion} disabled={guardandoEdicion}>
              Cancelar
            </Button>
            <Button type="submit" form="form-editar-salida" disabled={guardandoEdicion}>
              {guardandoEdicion ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        {formEdicion && (
          <form id="form-editar-salida" onSubmit={guardarEdicion} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-label-sm font-semibold text-on-surface">
                Número de expediente
              </span>
              <input
                value={formEdicion.numeroExpediente}
                onChange={(evento) =>
                  setFormEdicion((actual) => ({
                    ...actual,
                    numeroExpediente: evento.target.value,
                  }))
                }
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-label-sm font-semibold text-on-surface">Etiqueta</span>
              <select
                value={formEdicion.tipo}
                onChange={(evento) =>
                  setFormEdicion((actual) => ({
                    ...actual,
                    tipo: evento.target.value,
                    clinicaPersonalId:
                      evento.target.value === 'personal' ? actual.clinicaPersonalId : '',
                  }))
                }
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ETIQUETAS.map((etiqueta) => (
                  <option key={etiqueta.id} value={etiqueta.id}>
                    {etiqueta.nombre}
                  </option>
                ))}
              </select>
            </label>
            {formEdicion.tipo === 'personal' && (
              <label className="block space-y-1">
                <span className="text-label-sm font-semibold text-on-surface">Clínica</span>
                <select
                  value={formEdicion.clinicaPersonalId}
                  onChange={(evento) =>
                    setFormEdicion((actual) => ({
                      ...actual,
                      clinicaPersonalId: evento.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={formEdicion.primeraVez}
                onChange={(evento) =>
                  setFormEdicion((actual) => ({
                    ...actual,
                    primeraVez: evento.target.checked,
                  }))
                }
                className="h-4 w-4 rounded accent-primary"
              />
              Primera vez
            </label>
            <p className="text-label-sm text-on-surface-variant">
              Paciente actual: {salidaEditando?.pacienteNombre ?? '—'}
            </p>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(porEliminar)}
        onClose={() => {
          if (!eliminando) setPorEliminar(null)
        }}
        title="Eliminar expediente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPorEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Eliminar la salida del expediente{' '}
          <strong>{formatearExpediente(porEliminar?.numeroExpediente ?? '')}</strong>?
        </p>
      </Modal>

      <ModalGenerandoPdf abierto={generandoPdf} progreso={progresoPdf} />
    </section>
  )
}
