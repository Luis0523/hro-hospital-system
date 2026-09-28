import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  actualizarDiaNoLaborable,
  crearDiaNoLaborable,
  eliminarDiaNoLaborable,
  listarDiasNoLaborablesPorRango,
} from '../api/administracionApi.js'
import { mesActual, rangoAnioISO, rangoMesISO, sumarMes } from '../utils/fechas.js'
import CalendarioNoLaborables from '../components/CalendarioNoLaborables.jsx'
import DiaNoLaborableForm from '../components/DiaNoLaborableForm.jsx'
import DisponibilidadCitaModal from '../components/DisponibilidadCitaModal.jsx'
import ListaDiasNoLaborables from '../components/ListaDiasNoLaborables.jsx'
import ModalCatalogo from '../components/ModalCatalogo.jsx'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import ModalConflictoCitas from '../components/ModalConflictoCitas.jsx'
import VistaAnualCalendario from '../components/VistaAnualCalendario.jsx'

const PESTANAS = [
  { id: 'mensual', etiqueta: 'Mensual', icono: 'calendar_month' },
  { id: 'anual', etiqueta: 'Vista anual', icono: 'calendar_view_month' },
]

export default function CalendarioPage() {
  const { mostrarToast } = useToast()
  const inicial = mesActual()

  const [pestana, setPestana] = useState('mensual')
  const tabsRef = useRef([])

  const [anio, setAnio] = useState(inicial.anio)
  const [mes, setMes] = useState(inicial.mes)
  const [dias, setDias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [anioAnual, setAnioAnual] = useState(inicial.anio)
  const [diasAnual, setDiasAnual] = useState([])
  const [cargandoAnual, setCargandoAnual] = useState(false)
  const [errorAnual, setErrorAnual] = useState(null)

  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorFecha, setErrorFecha] = useState(null)
  const [alertaForm, setAlertaForm] = useState(null)

  const [conflicto, setConflicto] = useState(null)
  const [payloadConflicto, setPayloadConflicto] = useState(null)
  const [confirmandoConflicto, setConfirmandoConflicto] = useState(false)
  const [disponiblePara, setDisponiblePara] = useState(null)

  const [porHabilitar, setPorHabilitar] = useState(null)
  const [habilitando, setHabilitando] = useState(false)

  const cargarMes = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { inicio, fin } = rangoMesISO(anio, mes)
      const lista = await listarDiasNoLaborablesPorRango(inicio, fin)
      setDias(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setDias([])
      setError(fallo?.message || 'No se pudo cargar el calendario institucional')
    } finally {
      setCargando(false)
    }
  }, [anio, mes])

  const cargarAnual = useCallback(async () => {
    setCargandoAnual(true)
    setErrorAnual(null)
    try {
      const { inicio, fin } = rangoAnioISO(anioAnual)
      const lista = await listarDiasNoLaborablesPorRango(inicio, fin)
      setDiasAnual(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setDiasAnual([])
      setErrorAnual(fallo?.message || 'No se pudo cargar la vista anual')
    } finally {
      setCargandoAnual(false)
    }
  }, [anioAnual])

  useEffect(() => {
    cargarMes()
  }, [cargarMes])

  useEffect(() => {
    if (pestana === 'anual') cargarAnual()
  }, [pestana, cargarAnual])

  const refrescarActual = useCallback(async () => {
    if (pestana === 'anual') {
      await cargarAnual()
    } else {
      await cargarMes()
    }
  }, [pestana, cargarAnual, cargarMes])

  const manejarTeclado = (evento) => {
    const indiceActual = PESTANAS.findIndex((item) => item.id === pestana)
    let siguiente = null

    if (evento.key === 'ArrowRight') siguiente = (indiceActual + 1) % PESTANAS.length
    else if (evento.key === 'ArrowLeft')
      siguiente = (indiceActual - 1 + PESTANAS.length) % PESTANAS.length
    else if (evento.key === 'Home') siguiente = 0
    else if (evento.key === 'End') siguiente = PESTANAS.length - 1

    if (siguiente === null) return
    evento.preventDefault()
    setPestana(PESTANAS[siguiente].id)
    tabsRef.current[siguiente]?.focus()
  }

  const cambiarMes = (delta) => {
    const siguiente = sumarMes(anio, mes, delta)
    setAnio(siguiente.anio)
    setMes(siguiente.mes)
    setModal(null)
  }

  const abrirCrear = (fechaInicial = '') => {
    setErrorFecha(null)
    setAlertaForm(null)
    setModal({ modo: 'crear', fechaInicial, registro: null })
  }

  const abrirConsultar = (registro) => {
    setErrorFecha(null)
    setAlertaForm(null)
    setModal({ modo: 'consultar', fechaInicial: '', registro })
  }

  const abrirEditar = (registro) => {
    setErrorFecha(null)
    setAlertaForm(null)
    setModal({ modo: 'editar', fechaInicial: '', registro })
  }

  const cerrarModal = () => setModal(null)

  const crear = async (valores, forzar = false) => {
    await crearDiaNoLaborable({ fecha: valores.fecha, motivo: valores.motivo, forzar })
    mostrarToast({ title: 'Día no laborable registrado', tone: 'success' })
    setModal(null)
    setConflicto(null)
    setPayloadConflicto(null)
    await cargarMes()
    if (pestana === 'anual') await cargarAnual()
  }

  const manejarGuardar = async (valores) => {
    setGuardando(true)
    setErrorFecha(null)
    setAlertaForm(null)

    try {
      if (modal?.modo === 'editar') {
        await actualizarDiaNoLaborable(modal.registro.id, { motivo: valores.motivo })
        mostrarToast({ title: 'Motivo actualizado', tone: 'success' })
        setModal(null)
        await refrescarActual()
        return
      }

      await crear(valores)
    } catch (fallo) {
      if (modal?.modo === 'editar') {
        mostrarToast({
          title: 'No se pudo guardar',
          message: fallo?.message || 'Intente nuevamente',
          tone: 'error',
        })
        return
      }

      // Decisión funcional por `codigo` (no por texto del mensaje).
      if (fallo?.codigo === 'DIA_NO_LABORABLE_YA_EXISTE') {
        setErrorFecha('Esta fecha ya está registrada como día no laborable.')
        return
      }
      if (fallo?.codigo === 'DIA_NO_LABORABLE_CON_CITAS') {
        setPayloadConflicto(valores)
        setConflicto(
          fallo.data ?? { fecha: valores.fecha, totalCitas: 0, citas: [] },
        )
        setModal(null)
        return
      }
      setAlertaForm({
        tone: 'error',
        title: 'No se pudo registrar',
        mensaje: fallo?.message || 'Intente nuevamente en unos momentos.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const cancelarConflicto = () => {
    setConflicto(null)
    if (payloadConflicto) {
      setModal({
        modo: 'crear',
        fechaInicial: payloadConflicto.fecha,
        registro: { motivo: payloadConflicto.motivo },
      })
    }
  }

  const confirmarConflicto = async () => {
    if (!payloadConflicto) return
    setConfirmandoConflicto(true)
    try {
      await crear(payloadConflicto, true)
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo registrar',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setConfirmandoConflicto(false)
    }
  }

  const manejarCitaReprogramada = (citaId) => {
    mostrarToast({ title: 'Cita reprogramada', tone: 'success' })
    setDisponiblePara(null)
    setConflicto((previo) => {
      if (!previo) return previo
      const citas = (previo.citas ?? []).filter((cita) => cita.id !== citaId)
      return { ...previo, citas, totalCitas: citas.length }
    })
  }

  const solicitarHabilitar = (registro) => setPorHabilitar(registro)
  const cancelarHabilitar = () => setPorHabilitar(null)
  const confirmarHabilitar = async () => {
    if (!porHabilitar) return
    setHabilitando(true)
    try {
      await eliminarDiaNoLaborable(porHabilitar.id)
      mostrarToast({ title: 'Fecha habilitada nuevamente', tone: 'success' })
      setPorHabilitar(null)
      await refrescarActual()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo habilitar la fecha',
        message: fallo?.message || 'Intente nuevamente',
        tone: 'error',
      })
    } finally {
      setHabilitando(false)
    }
  }

  const tituloModal =
    modal?.modo === 'consultar'
      ? 'Detalle del día no laborable'
      : modal?.modo === 'editar'
        ? 'Editar día no laborable'
        : 'Nuevo día no laborable'

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-headline-md text-primary">Calendario institucional</h2>
          <p className="text-sm text-outline">
            Administración de días no laborables, feriados y cierres institucionales.
          </p>
        </div>
        <Button onClick={() => abrirCrear()}>
          <Icon name="add" className="text-[18px]" />
          Agregar día no laborable
        </Button>
      </header>

      <div
        role="tablist"
        aria-label="Vistas del calendario"
        onKeyDown={manejarTeclado}
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-0.5"
      >
        {PESTANAS.map((item, indice) => {
          const activa = item.id === pestana
          return (
            <button
              key={item.id}
              ref={(nodo) => {
                tabsRef.current[indice] = nodo
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={activa}
              aria-controls="panel-calendario"
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-title-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                activa
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon name={item.icono} className="text-[18px]" />
              {item.etiqueta}
            </button>
          )
        })}
      </div>

      <Alert tone="info">
        El sistema verifica si una fecha afecta citas antes de bloquearla. Si existen citas activas,
        se muestran antes de confirmar; al forzar, las citas quedan pendientes de gestión manual.
      </Alert>

      <div role="tabpanel" id="panel-calendario" aria-labelledby={`tab-${pestana}`}>
        {pestana === 'mensual' && (
          <div className="space-y-4">
            {cargando && <Spinner label="Cargando calendario institucional..." />}

            {!cargando && error && (
              <Alert tone="error" title="No se pudo cargar el calendario">
                <p>{error}</p>
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={cargarMes}>
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}

            {!cargando && !error && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <CalendarioNoLaborables
                  anio={anio}
                  mes={mes}
                  diasNoLaborables={dias}
                  onMesAnterior={() => cambiarMes(-1)}
                  onMesSiguiente={() => cambiarMes(1)}
                  onCambiarMes={setMes}
                  onCambiarAnio={setAnio}
                  onSeleccionarDia={abrirCrear}
                  onVerDia={abrirConsultar}
                />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-on-surface">
                    Días no laborables del mes
                  </h3>
                  <ListaDiasNoLaborables
                    dias={dias}
                    onVer={abrirConsultar}
                    onEditarMotivo={abrirEditar}
                    onHabilitar={solicitarHabilitar}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {pestana === 'anual' && (
          <VistaAnualCalendario
            anio={anioAnual}
            dias={diasAnual}
            cargando={cargandoAnual}
            error={errorAnual}
            onReintentar={cargarAnual}
            onCambiarAnio={setAnioAnual}
            onVer={abrirConsultar}
            onEditarMotivo={abrirEditar}
            onHabilitar={solicitarHabilitar}
          />
        )}
      </div>

      <ModalCatalogo
        abierto={Boolean(modal)}
        modo={modal?.modo}
        titulo={tituloModal}
        onCerrar={cerrarModal}
        guardando={guardando}
        textoGuardar={modal?.modo === 'editar' ? 'Guardar cambios' : 'Registrar'}
      >
        {modal && (
          <DiaNoLaborableForm
            modo={modal.modo}
            fechaInicial={modal.fechaInicial}
            registro={modal.registro}
            errorFecha={errorFecha}
            alerta={alertaForm}
            onSubmit={manejarGuardar}
          />
        )}
      </ModalCatalogo>

      <ModalConflictoCitas
        abierto={Boolean(conflicto)}
        conflicto={conflicto}
        onCancelar={cancelarConflicto}
        onConfirmar={confirmarConflicto}
        onReprogramar={setDisponiblePara}
        procesando={confirmandoConflicto}
      />

      <DisponibilidadCitaModal
        abierto={Boolean(disponiblePara)}
        cita={disponiblePara}
        onCerrar={() => setDisponiblePara(null)}
        onReprogramada={manejarCitaReprogramada}
      />

      <ModalConfirmacion
        abierto={Boolean(porHabilitar)}
        titulo="Habilitar día"
        mensaje="¿Deseas habilitar nuevamente esta fecha como día laborable? Dejará de aparecer como día no laborable. Las citas no se ven afectadas."
        textoConfirmar="Sí, habilitar día"
        onConfirmar={confirmarHabilitar}
        onCancelar={cancelarHabilitar}
        procesando={habilitando}
      />
    </section>
  )
}
