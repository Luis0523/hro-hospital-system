import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { USANDO_DATOS_MOCK, buscarExpedientePorCodigo } from '../api/archivoApi'
import { useExpedientes } from '../hooks/useExpedientes'
import { useCicloExpediente } from '../hooks/useCicloExpediente'
import { useAccionesArchivo } from '../hooks/useAccionesArchivo'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import FiltrosArchivo from '../components/FiltrosArchivo.jsx'
import ResumenEstados from '../components/ResumenEstados.jsx'
import ListadoCompactoExpediente from '../components/ListadoCompactoExpediente.jsx'
import ScannerExpediente from '../components/ScannerExpediente.jsx'
import { esExpedienteLocalizado } from '../estadosExpediente'

// Orden estable por hora de cita ascendente.
function ordenarPorHora(expedientes) {
  return [...expedientes].sort((a, b) =>
    (a.horaEstimada ?? '99:99:99').localeCompare(b.horaEstimada ?? '99:99:99'),
  )
}

// Hora local de la última consulta del resumen (marca del frontend, no backend).
function horaCorta(fecha) {
  if (!fecha) return ''
  return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

// Relaciona un resultado de búsqueda con una fila de la jornada usando el
// contrato real: expedienteId (UUID) si ambos lo tienen; si no, el número.
function coincideConFila(fila, encontrado) {
  if (!fila || !encontrado) return false
  if (fila.expedienteId && encontrado.expedienteId) {
    return fila.expedienteId === encontrado.expedienteId
  }
  const referencia = encontrado.numeroExpediente ?? encontrado.codigo
  return Boolean(referencia) && fila.numeroExpediente === referencia
}

// Sección de checklist (Pendientes / Localizados). Sigue el lenguaje visual de
// checklist; el checkbox refleja el estado real, no un Set local.
function SeccionChecklist({
  titulo,
  icono,
  expedientes,
  resaltado,
  filasEnProceso,
  onToggle,
  vacio,
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-2 pt-1">
        <h2 className="flex items-center gap-2 text-title-md text-on-surface">
          <Icon name={icono} className="text-[20px] text-primary" />
          {titulo}
        </h2>
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
          {expedientes.length}
        </span>
      </div>

      {expedientes.length === 0 ? (
        <p className="px-2 pb-2 text-body-sm text-on-surface-variant">{vacio}</p>
      ) : (
        <ul className="space-y-2">
          {expedientes.map((expediente) => (
            <ListadoCompactoExpediente
              key={expediente.id}
              expediente={expediente}
              resaltado={expediente.id === resaltado}
              procesando={filasEnProceso.has(expediente.id)}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ArchivoPage() {
  const { mostrarToast } = useToast()
  const {
    fecha,
    setFecha,
    subespecialidadId,
    setSubespecialidadId,
    subespecialidades,
    expedientes,
    cargando,
    error,
    recargar,
  } = useExpedientes()

  const cicloAcciones = useCicloExpediente()

  const {
    resumen: resumenServidor,
    resumenActualizadoEn,
    cargandoResumen,
    cargandoResumenPdf,
    consultarResumen,
    descargarResumenPdf,
  } = useAccionesArchivo()

  const [codigo, setCodigo] = useState('')
  const [resaltado, setResaltado] = useState(null)
  const [filasEnProceso, setFilasEnProceso] = useState(() => new Set())

  // Guardas inmediatas: búsqueda y procesos por fila (no bloquean la jornada).
  const busquedaEnCurso = useRef(false)
  const procesosRef = useRef(new Set())

  const filas = useMemo(() => ordenarPorHora(expedientes), [expedientes])
  const operativas = useMemo(() => filas.filter((fila) => Boolean(fila.expedienteId)), [filas])
  const pendientes = useMemo(
    () => operativas.filter((fila) => !esExpedienteLocalizado(fila.estadoActual)),
    [operativas],
  )
  const localizados = useMemo(
    () => operativas.filter((fila) => esExpedienteLocalizado(fila.estadoActual)),
    [operativas],
  )
  const sinExpediente = filas.length - operativas.length

  // Al cambiar un filtro se reinicia el resaltado del buscador.
  useEffect(() => {
    setResaltado(null)
  }, [fecha, subespecialidadId])

  // Lleva el foco/scroll a la fila encontrada por el buscador.
  useEffect(() => {
    if (resaltado == null) return
    const fila = document.querySelector(`[data-expediente-id="${resaltado}"]`)
    fila?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    fila?.querySelector('input[type="checkbox"]')?.focus()
  }, [resaltado])

  function marcarEnProceso(id, activo) {
    if (activo) procesosRef.current.add(id)
    else procesosRef.current.delete(id)
    setFilasEnProceso(new Set(procesosRef.current))
  }

  // Ejecuta la secuencia interna que lleva el expediente hasta `localizado`
  // usando SOLO transiciones válidas. No hay cambio optimista: si un paso falla
  // se detiene (sin ejecutar los siguientes) y el checkbox permanece sin marcar.
  async function localizarExpediente(fila) {
    if (procesosRef.current.has(fila.id)) return
    marcarEnProceso(fila.id, true)
    try {
      let cicloId = fila.cicloId

      if (fila.estadoActual === 'sin_ciclo') {
        const ciclo = await cicloAcciones.checkIn(fila.expedienteId, { citaId: fila.citaId })
        cicloId = ciclo?.cicloId ?? cicloId
      } else if (fila.estadoActual === 'pendiente_localizar') {
        await cicloAcciones.iniciarBusqueda(fila.cicloId)
      } else if (fila.estadoActual === 'no_localizado') {
        await cicloAcciones.reintentarBusqueda(fila.cicloId)
      }

      // `en_busqueda` (o el resultado de los pasos previos) -> localizado.
      await cicloAcciones.localizar(cicloId)

      await recargar()
      mostrarToast({
        tone: 'success',
        title: 'Expediente localizado',
        message: fila.numeroExpediente ?? '',
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo localizar el expediente',
        message: fallo.message,
      })
    } finally {
      marcarEnProceso(fila.id, false)
    }
  }

  function alternarLocalizado(fila) {
    if (!fila.expedienteId || esExpedienteLocalizado(fila.estadoActual)) return
    localizarExpediente(fila)
  }

  // Check-in interno al escanear un expediente sin ciclo. NO localiza: la fila
  // sigue en "Pendientes de localizar" hasta que el operador marque el checkbox.
  async function checkInSilencioso(fila) {
    if (procesosRef.current.has(fila.id)) return
    marcarEnProceso(fila.id, true)
    try {
      await cicloAcciones.checkIn(fila.expedienteId, { citaId: fila.citaId })
      await recargar()
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo iniciar el tracking',
        message: fallo.message,
      })
    } finally {
      marcarEnProceso(fila.id, false)
    }
  }

  async function ejecutarBusqueda(valor) {
    const buscado = valor.trim()
    if (!buscado || busquedaEnCurso.current) return
    busquedaEnCurso.current = true
    try {
      const encontrado = await buscarExpedientePorCodigo(buscado)
      if (!encontrado) {
        setResaltado(null)
        mostrarToast({
          tone: 'error',
          title: 'Expediente no encontrado',
          message: 'Verifique el código escaneado.',
        })
        return
      }

      const fila = filas.find((registro) => coincideConFila(registro, encontrado))
      if (!fila) {
        setResaltado(null)
        mostrarToast({
          tone: 'warning',
          title: 'Expediente fuera del listado',
          message: 'El código existe, pero no aparece con los filtros actuales.',
        })
        return
      }

      setResaltado(fila.id)
      setCodigo('')

      if (fila.expedienteId && fila.estadoActual === 'sin_ciclo') {
        await checkInSilencioso(fila)
      }
    } catch (fallo) {
      mostrarToast({ tone: 'error', title: 'Error de búsqueda', message: fallo.message })
    } finally {
      busquedaEnCurso.current = false
    }
  }

  function manejarBusqueda(event) {
    event.preventDefault()
    ejecutarBusqueda(codigo)
  }

  function manejarCodigoEscaneado(valor) {
    setCodigo(valor)
    ejecutarBusqueda(valor)
  }

  async function manejarConsultarResumen() {
    try {
      const datos = await consultarResumen(fecha)
      if (datos) {
        mostrarToast({
          tone: 'success',
          title: 'Resumen del servidor',
          message: `Total de ciclos: ${datos.totalCiclos}`,
        })
      }
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo obtener el resumen',
        message: fallo.message,
      })
    }
  }

  async function manejarDescargarResumenPdf() {
    try {
      await descargarResumenPdf(fecha)
      mostrarToast({
        tone: 'success',
        title: 'Descarga iniciada',
        message: 'Resumen del día (PDF).',
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo descargar el resumen',
        message: fallo.message,
      })
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <ScannerExpediente
          value={codigo}
          onChange={setCodigo}
          onSubmit={manejarBusqueda}
          onCodigoEscaneado={manejarCodigoEscaneado}
        />

        <FiltrosArchivo
          fecha={fecha}
          onFecha={setFecha}
          subespecialidadId={subespecialidadId}
          onSubespecialidad={setSubespecialidadId}
          subespecialidades={subespecialidades}
        />

        <ResumenEstados
          total={operativas.length}
          pendientes={pendientes.length}
          localizados={localizados.length}
        />

        <section aria-label="Preparación de expedientes" aria-busy={cargando} className="space-y-4">
          {cargando ? (
            <Spinner label="Cargando expedientes..." />
          ) : error ? (
            <Alert tone="error" title="No se pudieron cargar los expedientes">
              {error.message}
            </Alert>
          ) : filas.length === 0 ? (
            <EmptyState
              title="Sin expedientes para esta fecha"
              description="Pruebe con otra fecha o subespecialidad."
            />
          ) : (
            <>
              {sinExpediente > 0 && (
                <Alert tone="warning" title="Citas sin expediente físico">
                  {sinExpediente} cita(s) de la jornada no tienen expediente físico registrado y no
                  se incluyen en el checklist.
                </Alert>
              )}
              <SeccionChecklist
                titulo="Pendientes de localizar"
                icono="pending_actions"
                expedientes={pendientes}
                resaltado={resaltado}
                filasEnProceso={filasEnProceso}
                onToggle={alternarLocalizado}
                vacio="No quedan expedientes pendientes."
              />
              <SeccionChecklist
                titulo="Expedientes localizados"
                icono="check_circle"
                expedientes={localizados}
                resaltado={resaltado}
                filasEnProceso={filasEnProceso}
                onToggle={alternarLocalizado}
                vacio="Todavía no se ha localizado ningún expediente."
              />
            </>
          )}
        </section>

        <section
          aria-label="Acciones del día"
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
        >
          <h2 className="text-title-md text-on-surface">Acciones del día</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Resumen y documentos generados por el backend de Archivo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={manejarConsultarResumen} disabled={cargandoResumen}>
              <Icon name="summarize" className="text-[18px]" />
              {cargandoResumen ? 'Consultando…' : 'Consultar resumen del día'}
            </Button>
            <Button
              variant="secondary"
              onClick={manejarDescargarResumenPdf}
              disabled={cargandoResumenPdf}
            >
              <Icon name="picture_as_pdf" className="text-[18px]" />
              {cargandoResumenPdf ? 'Generando PDF…' : 'Descargar resumen (PDF)'}
            </Button>
            <Button
              variant="secondary"
              disabled
              title="Bloqueado: se requieren expedienteId reales (UUID) desde /expedientes/jornada y una regla documentada de selección de expedientes."
            >
              <Icon name="assignment_add" className="text-[18px]" />
              Generar acta de recepción
            </Button>
            <Button
              variant="secondary"
              disabled
              title="Disponible cuando exista un acta creada (actaId real)."
            >
              <Icon name="download" className="text-[18px]" />
              Descargar PDF del acta
            </Button>
          </div>

          {resumenServidor && (
            <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-3">
              <div className="flex flex-wrap items-center gap-2 text-body-sm">
                {resumenActualizadoEn && (
                  <span className="text-on-surface-variant">
                    Actualizado: {horaCorta(resumenActualizadoEn)}
                  </span>
                )}
                {USANDO_DATOS_MOCK && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-label-sm font-semibold text-amber-800">
                    Datos simulados
                  </span>
                )}
              </div>
              <dl
                aria-label="Resumen del servidor"
                className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-sm sm:grid-cols-3"
              >
                {[
                  ['Total de ciclos', resumenServidor.totalCiclos],
                  ['Pendientes', resumenServidor.pendienteLocalizar],
                  ['Localizados', resumenServidor.localizado],
                  ['Entregados', resumenServidor.entregado],
                  ['No localizados', resumenServidor.noLocalizado],
                  ['Expedientes nuevos', resumenServidor.expedientesNuevos],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="flex items-center justify-between gap-2">
                    <dt className="text-on-surface-variant">{etiqueta}</dt>
                    <dd className="font-semibold text-on-surface">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      </main>
    </ArchivoLayout>
  )
}
