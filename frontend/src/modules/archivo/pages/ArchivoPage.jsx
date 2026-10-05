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
import ExpedienteDetalle from '../components/ExpedienteDetalle.jsx'
import ModalObservacion from '../components/ModalObservacion.jsx'
import { accionArchivo } from '../accionesArchivo'

// Estados que cuentan como "pendiente" (aún no localizado) para el resumen.
const ESTADOS_PENDIENTES = new Set([
  'sin_ciclo',
  'pendiente_localizar',
  'en_busqueda',
  'no_localizado',
])

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
  const cicloDetalle = useCicloExpediente()

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
  const [filaEnProceso, setFilaEnProceso] = useState(null)
  const [observacionPara, setObservacionPara] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [enviandoObservacion, setEnviandoObservacion] = useState(false)
  const [detalleFila, setDetalleFila] = useState(null)

  // Guardas inmediatas contra doble ejecución (búsqueda y mutaciones).
  const busquedaEnCurso = useRef(false)
  const mutacionEnCurso = useRef(false)

  const filas = useMemo(() => ordenarPorHora(expedientes), [expedientes])

  const resumen = useMemo(() => {
    const operativas = filas.filter((fila) => Boolean(fila.expedienteId))
    return {
      total: operativas.length,
      pendientes: operativas.filter((fila) => ESTADOS_PENDIENTES.has(fila.estadoActual)).length,
      localizados: operativas.filter((fila) => fila.estadoActual === 'localizado').length,
    }
  }, [filas])

  const sinExpediente = filas.length - filas.filter((fila) => Boolean(fila.expedienteId)).length

  // Al cambiar un filtro se reinicia el resaltado del buscador.
  useEffect(() => {
    setResaltado(null)
  }, [fecha, subespecialidadId])

  // Lleva el foco/scroll a la fila encontrada por el buscador.
  useEffect(() => {
    if (resaltado == null) return
    const fila = document.querySelector(`[data-expediente-id="${resaltado}"]`)
    fila?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    fila?.querySelector('button')?.focus()
  }, [resaltado])

  async function ejecutarAccion(fila, accion, datos = {}) {
    if (mutacionEnCurso.current) return false
    mutacionEnCurso.current = true
    setFilaEnProceso(fila.id)
    try {
      if (accion.id === 'check_in') {
        await cicloAcciones.checkIn(fila.expedienteId, { citaId: fila.citaId })
      } else if (accion.id === 'iniciar_busqueda') {
        await cicloAcciones.iniciarBusqueda(fila.cicloId)
      } else if (accion.id === 'localizar') {
        await cicloAcciones.localizar(fila.cicloId)
      } else if (accion.id === 'despachar') {
        await cicloAcciones.despachar(fila.cicloId)
      } else if (accion.id === 'archivar') {
        await cicloAcciones.archivar(fila.cicloId)
      } else if (accion.id === 'no_localizado') {
        await cicloAcciones.marcarNoLocalizado(fila.cicloId, { observacion: datos.observacion })
      } else if (accion.id === 'reintentar_busqueda') {
        await cicloAcciones.reintentarBusqueda(fila.cicloId)
      }

      await recargar()
      mostrarToast({
        tone: 'success',
        title: 'Acción realizada',
        message: fila.numeroExpediente
          ? `${accion.etiqueta} · ${fila.numeroExpediente}`
          : accion.etiqueta,
      })
      return true
    } catch (fallo) {
      // No hay cambio optimista: el estado anterior se conserva.
      mostrarToast({
        tone: 'error',
        title: 'No se pudo completar la acción',
        message: fallo.message,
      })
      return false
    } finally {
      mutacionEnCurso.current = false
      setFilaEnProceso(null)
    }
  }

  function manejarAccion(accion, fila) {
    if (accion.requiereObservacion) {
      setObservacionPara(fila)
      setObservacion('')
      return
    }
    ejecutarAccion(fila, accion)
  }

  async function confirmarObservacion() {
    const texto = observacion.trim()
    if (!texto || enviandoObservacion || !observacionPara) return
    setEnviandoObservacion(true)
    try {
      const exito = await ejecutarAccion(observacionPara, accionArchivo('no_localizado'), {
        observacion: texto,
      })
      if (exito) {
        setObservacionPara(null)
        setObservacion('')
      }
    } finally {
      setEnviandoObservacion(false)
    }
  }

  function cancelarObservacion() {
    setObservacionPara(null)
    setObservacion('')
  }

  function abrirDetalle(fila) {
    setDetalleFila(fila)
    if (fila.cicloId) {
      cicloDetalle.obtenerCiclo(fila.citaId).catch(() => {})
    }
  }

  function cerrarDetalle() {
    setDetalleFila(null)
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

      // SCRUM-179: si la fila tiene expediente físico y aún no tiene ciclo, el
      // escaneo inicia el tracking con el endpoint atómico de check-in (una sola
      // vez). NO se dispara localizar automáticamente.
      if (fila.expedienteId && fila.estadoActual === 'sin_ciclo') {
        await ejecutarAccion(fila, accionArchivo('check_in'))
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

  const cicloDetalleActual =
    detalleFila && cicloDetalle.ciclo?.citaId === detalleFila.citaId ? cicloDetalle.ciclo : null

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
          total={resumen.total}
          pendientes={resumen.pendientes}
          localizados={resumen.localizados}
        />

        <section aria-label="Jornada de expedientes" aria-busy={cargando} className="space-y-3">
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
                  se pueden operar.
                </Alert>
              )}
              <ul className="space-y-2">
                {filas.map((fila) => (
                  <ListadoCompactoExpediente
                    key={fila.id}
                    expediente={fila}
                    resaltado={fila.id === resaltado}
                    procesando={filaEnProceso === fila.id}
                    onAccion={manejarAccion}
                    onVerDetalle={abrirDetalle}
                  />
                ))}
              </ul>
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

      <ExpedienteDetalle
        fila={detalleFila}
        ciclo={cicloDetalleActual}
        cargandoDatos={cicloDetalle.cargando}
        abierto={Boolean(detalleFila)}
        onCerrar={cerrarDetalle}
      />

      <ModalObservacion
        abierto={Boolean(observacionPara)}
        observacion={observacion}
        onObservacion={setObservacion}
        onConfirmar={confirmarObservacion}
        onCancelar={cancelarObservacion}
        procesando={enviandoObservacion}
      />
    </ArchivoLayout>
  )
}
