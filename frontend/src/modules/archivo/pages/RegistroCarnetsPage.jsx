import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Modal, Table } from '@/shared/components/ui'
import { formatearFechaLarga, hoyIso } from '@/shared/utils/fecha'
import EnfermeriaEstacionLayout from '@/modules/enfermeria/components/EnfermeriaEstacionLayout.jsx'
import { ETIQUETAS_ESTADO_CARNET } from '@/modules/carnets/api/carnetsApi'
import { useEscanerCodigo } from '../hooks/useEscanerCodigo'
import { useRegistroCarnets } from '../hooks/useRegistroCarnets'

// Código visible del carnet: "ABREV-correlativo" (p. ej. PED-3) usando la
// abreviatura configurable de la especialidad; si no hay, solo el correlativo.
function codigoCarnet(carnet) {
  if (!carnet) return ''
  const abreviatura = carnet.especialidadAbreviatura
  return abreviatura ? `${abreviatura}-${carnet.correlativo}` : String(carnet.correlativo)
}

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

// Registro de carnets de la estación de enfermería: elegir especialidad,
// escanear/teclear el expediente y obtener el correlativo diario por especialidad.
export default function RegistroCarnetsPage() {
  const {
    expediente,
    setExpediente,
    especialidadId,
    setEspecialidadId,
    especialidades,
    registros,
    resultado,
    estado,
    mensaje,
    procesando,
    inputRef,
    registrar,
    enfocar,
  } = useRegistroCarnets()

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

  // Modal con el correlativo asignado: se cierra con Esc (Esc) o tras 8 s.
  const [modalAbierto, setModalAbierto] = useState(false)
  useEffect(() => {
    if (!resultado) return undefined
    setModalAbierto(true)
    const temporizador = setTimeout(() => setModalAbierto(false), 8000)
    return () => clearTimeout(temporizador)
  }, [resultado])

  return (
    <EnfermeriaEstacionLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Columna izquierda: encabezado + formulario de registro + resultado */}
          <div className="space-y-4 lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:pr-1">
            <header className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <h2 className="text-headline-sm text-on-surface">Registro de carnets</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Elija la especialidad, luego escanee o escriba el número de expediente.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-md text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Icon name="calendar_today" className="text-[16px] text-secondary" />
                  {formatearFechaLarga(hoyIso())}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="barcode_scanner" className="text-[16px] text-primary" />
                  Lector listo · foco permanente
                </span>
              </div>
            </header>

            <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <form onSubmit={manejarEnvio} className="space-y-3">
                <label
                  htmlFor="especialidad"
                  className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
                >
                  <Icon name="category" className="text-[18px] text-primary" />
                  Especialidad
                </label>
                <select
                  id="especialidad"
                  value={especialidadId}
                  onChange={(event) => setEspecialidadId(event.target.value)}
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-title-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Seleccione una especialidad…</option>
                  {especialidades.map((especialidad) => (
                    <option key={especialidad.id} value={especialidad.id}>
                      {especialidad.nombre}
                    </option>
                  ))}
                </select>

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

                <p id="expediente-ayuda" className="text-center text-label-sm text-on-surface-variant">
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

          {/* Columna derecha: últimos registros con scroll interno */}
          <section className="flex min-h-0 flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:h-full">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface">
                <Icon name="history" className="text-[20px] text-primary" />
                Últimos registros
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
                Total hoy: {registros.length}
              </span>
            </div>

            <div className="min-h-0 max-h-[60vh] flex-1 overflow-y-auto lg:max-h-none">
              <Table
                columns={COLUMNAS}
                data={registros}
                emptyMessage="Aún no hay carnets registrados hoy"
                renderCell={(fila, clave) => {
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
                        {fila.numeroExpediente}
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
                    return (
                      <span className="font-mono text-on-surface-variant">{horaDe(fila)}</span>
                    )
                  }
                  return fila[clave]
                }}
              />
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
                <dd className="font-mono font-bold text-primary">{resultado.numeroExpediente}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-label-sm uppercase text-on-surface-variant">Hora</dt>
                <dd className="font-mono text-on-surface-variant">{horaDe(resultado)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </EnfermeriaEstacionLayout>
  )
}
