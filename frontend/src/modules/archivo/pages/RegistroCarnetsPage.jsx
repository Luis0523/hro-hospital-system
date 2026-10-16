import { useEffect, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Modal, Spinner, Table } from '@/shared/components/ui'
import { formatearFechaLarga, hoyIso } from '@/shared/utils/fecha'
import EnfermeriaEstacionLayout from '@/modules/enfermeria/components/EnfermeriaEstacionLayout.jsx'
import { useEstacion } from '@/shared/context/EstacionContext.jsx'
import { ETIQUETAS_ESTADO_CARNET, listarEstaciones } from '@/modules/carnets/api/carnetsApi'
import { codigoCarnet } from '@/modules/carnets/utils/codigoCarnet'
import { formatearExpediente } from '@/shared/utils/expediente'
import ReporteCarnetsPanel from '../components/carnets/ReporteCarnetsPanel.jsx'
import SelectorEspecialidades from '../components/carnets/SelectorEspecialidades.jsx'
import { useEscanerCodigo } from '../hooks/useEscanerCodigo'
import { useRegistroCarnets } from '../hooks/useRegistroCarnets'

const COLUMNAS = [
  { key: 'correlativo', label: 'Correlativo' },
  { key: 'especialidadNombre', label: 'Especialidad' },
  { key: 'numeroExpediente', label: 'Expediente' },
  { key: 'pacienteNombre', label: 'Paciente' },
  { key: 'estado', label: 'Estado' },
  { key: 'hora', label: 'Hora' },
]

function horaDe(carnet) {
  const instante = carnet?.registradoEn
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Etiquetas del carnet (prioritario / privado de libertad). Nada si no tiene.
function EtiquetasCarnet({ carnet, className = '' }) {
  if (!carnet?.prioritario && !carnet?.privadoLibertad) return null
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {carnet.prioritario && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-label-sm font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
          <Icon name="priority_high" className="text-[14px]" />
          Prioritario
        </span>
      )}
      {carnet.privadoLibertad && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-label-sm font-semibold text-rose-900 dark:bg-rose-500/20 dark:text-rose-200">
          <Icon name="lock" className="text-[14px]" />
          Privado de libertad
        </span>
      )}
    </div>
  )
}

function celdaCarnet(fila, clave) {
  if (clave === 'correlativo') {
    return (
      <span className="inline-flex items-center justify-center rounded bg-primary px-2 py-0.5 font-mono text-[13px] font-bold text-on-primary">
        {codigoCarnet(fila)}
      </span>
    )
  }
  if (clave === 'numeroExpediente') {
    return (
      <span className="font-mono font-semibold text-primary">
        {formatearExpediente(fila.numeroExpediente)}
      </span>
    )
  }
  if (clave === 'estado') {
    return (
      <span className="text-label-sm text-on-surface-variant">
        {ETIQUETAS_ESTADO_CARNET[fila.estado] ?? fila.estado}
      </span>
    )
  }
  if (clave === 'hora') {
    return <span className="font-mono text-on-surface-variant">{horaDe(fila)}</span>
  }
  if (clave === 'pacienteNombre') {
    return (
      <div className="space-y-1">
        <span>{fila.pacienteNombre}</span>
        <EtiquetasCarnet carnet={fila} />
      </div>
    )
  }
  return fila[clave]
}

// Registro de carnets de la estación de enfermería: elegir especialidad,
// escanear/teclear el expediente y obtener el correlativo diario por especialidad.
export default function RegistroCarnetsPage() {
  const { estacion, seleccionarEstacion } = useEstacion()
  const [estaciones, setEstaciones] = useState([])
  const {
    expediente,
    setExpediente,
    especialidadId,
    setEspecialidadId,
    prioritario,
    setPrioritario,
    privadoLibertad,
    setPrivadoLibertad,
    especialidades,
    recientes,
    registros,
    cargandoTabla,
    resultado,
    estado,
    mensaje,
    procesando,
    inputRef,
    registrar,
    corregir,
    eliminar,
    cargarRegistros,
    enfocar,
  } = useRegistroCarnets({ estacionId: estacion?.id })

  useEffect(() => {
    listarEstaciones()
      .then((lista) => setEstaciones(Array.isArray(lista) ? lista : []))
      .catch(() => setEstaciones([]))
  }, [])

  // Reloj en vivo (hora local) para operar contra el sistema.
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const horaActual = ahora.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Posicionarse en una estación (se persiste en el contexto de sesión).
  function manejarCambioEstacion(evento) {
    const id = Number(evento.target.value)
    const elegida = estaciones.find((e) => e.id === id)
    if (elegida) {
      seleccionarEstacion({
        id: elegida.id,
        codigo: elegida.codigo,
        nombre: elegida.nombre,
        ubicacion: elegida.ubicacion,
      })
    } else {
      seleccionarEstacion(null)
    }
  }

  function manejarEnvio(event) {
    event.preventDefault()
    registrar(expediente)
  }

  // Al leer un código con la cámara se dispara el registro automáticamente.
  const escaner = useEscanerCodigo((codigo) => {
    const valor = String(codigo ?? '').trim()
    if (!valor) return
    setExpediente(valor)
    registrar(valor)
  })

  // Panel lateral con el reporte de carnets por especialidad y sus límites.
  const [reporteAbierto, setReporteAbierto] = useState(false)
  // Modal con la tabla completa del día (GET manual).
  const [tablaAbierta, setTablaAbierta] = useState(false)

  // Corrección inmediata de especialidad de los últimos 2 registros.
  const [correccionPara, setCorreccionPara] = useState(null)
  const [nuevaEspecialidadId, setNuevaEspecialidadId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [corrigiendo, setCorrigiendo] = useState(false)
  const [eliminarPara, setEliminarPara] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  function abrirCorreccion(carnet) {
    setCorreccionPara(carnet)
    setNuevaEspecialidadId('')
    setMotivo('')
  }

  async function confirmarCorreccion() {
    if (!correccionPara || !nuevaEspecialidadId || !motivo.trim()) return
    setCorrigiendo(true)
    const ok = await corregir(correccionPara, {
      especialidadId: nuevaEspecialidadId,
      motivo: motivo.trim(),
    })
    setCorrigiendo(false)
    if (ok) setCorreccionPara(null)
  }

  async function confirmarEliminar() {
    if (!eliminarPara) return
    setEliminando(true)
    const ok = await eliminar(eliminarPara)
    setEliminando(false)
    if (ok) setEliminarPara(null)
  }

  async function abrirTabla() {
    setTablaAbierta(true)
    await cargarRegistros()
  }

  async function abrirReporte() {
    await cargarRegistros()
    setReporteAbierto(true)
  }

  // Al elegir la especialidad, devuelve el foco al lector para escanear sin clics extra.
  function manejarSeleccionEspecialidad(id) {
    setEspecialidadId(id)
    enfocar()
  }

  // Modal con el correlativo asignado: se cierra con Esc (Esc) o tras 8 s.
  const [modalAbierto, setModalAbierto] = useState(false)
  useEffect(() => {
    if (!resultado) return undefined
    setModalAbierto(true)
    const temporizador = setTimeout(() => setModalAbierto(false), 8000)
    return () => clearTimeout(temporizador)
  }, [resultado])

  // Enter cierra el modal de correlativo (además de Esc y el auto-cierre).
  useEffect(() => {
    if (!modalAbierto) return undefined
    const manejar = (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault()
        evento.stopPropagation()
        setModalAbierto(false)
      }
    }
    document.addEventListener('keydown', manejar, true)
    return () => document.removeEventListener('keydown', manejar, true)
  }, [modalAbierto])

  // Acciones del registro: se muestran en la barra superior (marca SIGHO).
  const acciones = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
          estacion
            ? 'border-outline-variant bg-surface-container-lowest'
            : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
        }`}
      >
        <Icon name="local_hospital" className="text-[18px] text-primary" />
        <span className="sr-only">Estación de enfermería</span>
        <select
          value={estacion?.id ?? ''}
          onChange={manejarCambioEstacion}
          aria-label="Estación de enfermería"
          title={estacion ? 'Estación activa' : 'Seleccione su estación'}
          className={`h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none ${
            estacion ? 'text-on-surface' : 'text-amber-800 dark:text-amber-200'
          }`}
        >
          <option value="">Sin estación…</option>
          {estaciones.map((e) => (
            <option key={e.id} value={e.id}>
              {e.codigo ? `${e.codigo} · ` : ''}
              {e.nombre}
            </option>
          ))}
        </select>
      </label>
      <span
        className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 font-mono text-label-md font-bold tabular-nums text-on-surface"
        title="Hora actual"
      >
        <Icon name="schedule" className="text-[18px] text-primary" />
        {horaActual}
      </span>
      <span className="hidden items-center gap-1 text-label-sm text-on-surface-variant lg:inline-flex">
        <Icon name="calendar_today" className="text-[16px] text-secondary" />
        {formatearFechaLarga(hoyIso())}
      </span>
      <Button variant="ghost" size="sm" onClick={abrirTabla}>
        <Icon name="list" className="text-[18px]" />
        Ver carnets de hoy
      </Button>
      <Button variant="secondary" size="sm" onClick={abrirReporte}>
        <Icon name="bar_chart" className="text-[18px]" />
        Reporte
      </Button>
    </div>
  )

  return (
    <EnfermeriaEstacionLayout acciones={acciones}>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <SelectorEspecialidades
          especialidades={especialidades}
          value={especialidadId}
          onChange={manejarSeleccionEspecialidad}
        />

        <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Columna izquierda: formulario de registro + resultado */}
          <div className="space-y-4 lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:pr-1">
            <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <form onSubmit={manejarEnvio} className="space-y-3">
                <label
                  htmlFor="expediente"
                  className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
                >
                  <Icon name="badge" className="text-[18px] text-primary" />
                  Expediente clínico
                </label>

                <div className="relative flex items-center">
                  <Icon
                    name="qr_code_scanner"
                    className="pointer-events-none absolute left-4 text-[28px] text-primary"
                  />
                  <input
                    id="expediente"
                    ref={inputRef}
                    value={expediente}
                    onChange={(event) => setExpediente(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    autoComplete="off"
                    autoFocus
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="done"
                    placeholder="Ej. 837871"
                    aria-describedby="expediente-ayuda"
                    className="h-16 w-full rounded-lg bg-surface-container-low pl-14 pr-12 text-[26px] font-bold tracking-wider text-on-surface shadow-inner outline-none transition focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20"
                  />
                  {expediente && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpediente('')
                        enfocar()
                      }}
                      aria-label="Limpiar campo"
                      className="absolute right-3 flex items-center justify-center rounded-full p-2 text-on-surface-variant transition hover:text-on-surface"
                    >
                      <Icon name="backspace" className="text-[22px]" />
                    </button>
                  )}
                </div>

                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">Etiquetas del carnet</legend>
                  <label
                    className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-title-sm font-semibold transition ${
                      prioritario
                        ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-200'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={prioritario}
                      onChange={(event) => setPrioritario(event.target.checked)}
                      className="h-5 w-5 accent-amber-500"
                    />
                    <Icon name="priority_high" className="text-[18px]" />
                    Prioritario
                  </label>
                  <label
                    className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-title-sm font-semibold transition ${
                      privadoLibertad
                        ? 'border-rose-400 bg-rose-100 text-rose-900 dark:border-rose-600 dark:bg-rose-500/20 dark:text-rose-200'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={privadoLibertad}
                      onChange={(event) => setPrivadoLibertad(event.target.checked)}
                      className="h-5 w-5 accent-rose-500"
                    />
                    <Icon name="lock" className="text-[18px]" />
                    Privado de libertad
                  </label>
                </fieldset>

                <Button type="submit" size="lg" className="w-full" disabled={procesando}>
                  <Icon name="assignment_turned_in" className="text-[24px]" />
                  {procesando ? 'Registrando…' : 'Registrar carnet'}
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
                      Apunte al código del carnet; se registrará solo al leerlo.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={escaner.detener}
                    >
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
                  id="expediente-ayuda"
                  className="text-center text-label-sm text-on-surface-variant"
                >
                  Escanee con la cámara, use el lector o escríbalo y presione Enter.
                </p>
              </form>
            </section>

            <section aria-live="polite" aria-atomic="true" className="space-y-3">
              {(estado === 'duplicado' || estado === 'error') && mensaje && (
                <Alert tone={estado === 'duplicado' ? 'warning' : 'error'} title={mensaje} />
              )}
            </section>
          </div>

          {/* Columna derecha: corrección rápida de los últimos 2 registros */}
          <section className="flex min-h-0 flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface">
                <Icon name="edit_note" className="text-[20px] text-primary" />
                Corrección rápida
              </span>
              <span className="text-label-sm text-on-surface-variant">Últimos 2 registros</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Si se registró en la especialidad equivocada, corríjalo aquí sin salir del registro.
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {recientes.length === 0 ? (
                <EmptyState
                  title="Aún no hay registros para corregir"
                  description="Los 2 últimos carnets registrados aparecerán aquí."
                />
              ) : (
                <ul className="space-y-3">
                  {recientes.map((carnet) => (
                    <li
                      key={carnet.id ?? carnet.correlativo ?? carnet.numeroExpediente}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded bg-primary px-2 py-0.5 font-mono text-[14px] font-bold text-on-primary">
                            {codigoCarnet(carnet)}
                          </span>
                          <span className="text-title-sm font-semibold text-on-surface">
                            {carnet.especialidadNombre}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-body-sm text-on-surface-variant">
                          <span className="font-mono font-semibold text-primary">
                            {formatearExpediente(carnet.numeroExpediente)}
                          </span>
                          {' · '}
                          {carnet.pacienteNombre}
                          {' · '}
                          {horaDe(carnet)}
                        </p>
                        <EtiquetasCarnet carnet={carnet} className="mt-2" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => abrirCorreccion(carnet)}
                        >
                          <Icon name="edit" className="text-[18px]" />
                          Corregir especialidad
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setEliminarPara(carnet)}>
                          <Icon name="delete" className="text-[18px]" />
                          Eliminar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <Modal
        open={modalAbierto && Boolean(resultado)}
        onClose={() => setModalAbierto(false)}
        title="Correlativo asignado"
        footer={
          <Button size="sm" onClick={() => setModalAbierto(false)}>
            Listo
          </Button>
        }
      >
        {resultado && (
          <div className="text-center">
            <p className="text-label-sm uppercase tracking-widest text-primary">
              Anotar con lápiz en el carnet
            </p>
            <p
              data-testid="correlativo-asignado"
              className="my-2 select-all font-mono text-[72px] font-black leading-none text-primary"
            >
              {codigoCarnet(resultado)}
            </p>
            <p className="text-title-md font-semibold text-on-surface">
              {resultado.especialidadNombre}
            </p>
            <dl className="mt-4 space-y-1 text-left">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-label-sm uppercase text-on-surface-variant">Paciente</dt>
                <dd className="truncate font-semibold text-on-surface" data-testid="paciente">
                  {resultado.pacienteNombre || 'Paciente sin nombre'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-label-sm uppercase text-on-surface-variant">Expediente</dt>
                <dd className="font-mono font-bold text-primary">
                  {formatearExpediente(resultado.numeroExpediente)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-label-sm uppercase text-on-surface-variant">Hora</dt>
                <dd className="font-mono text-on-surface-variant">{horaDe(resultado)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      <Modal
        open={tablaAbierta}
        onClose={() => setTablaAbierta(false)}
        title="Carnets de hoy"
        size="xl"
        footer={
          <Button size="sm" onClick={() => setTablaAbierta(false)}>
            Cerrar
          </Button>
        }
      >
        {cargandoTabla ? (
          <Spinner label="Cargando carnets…" />
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            <Table
              columns={COLUMNAS}
              data={registros}
              emptyMessage="Aún no hay carnets registrados hoy"
              renderCell={celdaCarnet}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(correccionPara)}
        onClose={() => {
          if (!corrigiendo) setCorreccionPara(null)
        }}
        title="Corregir especialidad"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCorreccionPara(null)}
              disabled={corrigiendo}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarCorreccion}
              disabled={corrigiendo || !nuevaEspecialidadId || !motivo.trim()}
            >
              {corrigiendo ? 'Corrigiendo…' : 'Corregir'}
            </Button>
          </>
        }
      >
        {correccionPara && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-container-low p-3 text-sm">
              <p className="text-on-surface-variant">Carnet</p>
              <p className="font-mono text-title-md font-bold text-primary">
                {codigoCarnet(correccionPara)} ·{' '}
                {formatearExpediente(correccionPara.numeroExpediente)}
              </p>
              <p className="text-on-surface-variant">
                Especialidad actual: <strong>{correccionPara.especialidadNombre}</strong>
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-on-surface">Nueva especialidad</span>
              <select
                value={nuevaEspecialidadId}
                onChange={(evento) => setNuevaEspecialidadId(evento.target.value)}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Seleccione…</option>
                {especialidades
                  .filter((esp) => String(esp.id) !== String(correccionPara.especialidadId))
                  .map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-on-surface">Motivo</span>
              <textarea
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej. Se registró en la especialidad equivocada"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <p className="text-label-sm text-on-surface-variant">
              Se asignará un nuevo correlativo en la nueva especialidad y quedará registrado el
              cambio.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(eliminarPara)}
        onClose={() => {
          if (!eliminando) setEliminarPara(null)
        }}
        title="Eliminar carnet"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEliminarPara(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </>
        }
      >
        {eliminarPara && (
          <div className="space-y-2">
            <p>
              ¿Eliminar el carnet{' '}
              <strong className="font-mono text-primary">{codigoCarnet(eliminarPara)}</strong> (
              {formatearExpediente(eliminarPara.numeroExpediente)}) de{' '}
              <strong>{eliminarPara.especialidadNombre}</strong>?
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Es un borrado definitivo. Si era el último correlativo de la especialidad, se libera
              (regresa al anterior).
            </p>
          </div>
        )}
      </Modal>

      <ReporteCarnetsPanel
        open={reporteAbierto}
        onClose={() => setReporteAbierto(false)}
        registros={registros}
        especialidades={especialidades}
      />
    </EnfermeriaEstacionLayout>
  )
}
