import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  crearDiaNoLaborable,
  eliminarDiaNoLaborable,
  listarDiasNoLaborablesPorRango,
} from '../api/administracionApi.js'
import { mesActual, rangoMesISO, sumarMes } from '../utils/fechas.js'
import CalendarioNoLaborables from '../components/CalendarioNoLaborables.jsx'
import DiaNoLaborableForm from '../components/DiaNoLaborableForm.jsx'
import ListaDiasNoLaborables from '../components/ListaDiasNoLaborables.jsx'
import ModalCatalogo from '../components/ModalCatalogo.jsx'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'

const MENSAJE_CONFLICTO =
  'Existen citas registradas que deben resolverse previamente. Reprográmalas o cancélalas y vuelve a intentarlo.'

function extraerCantidadCitas(mensaje) {
  const coincidencia = /Existen (\d+) cita/i.exec(mensaje ?? '')
  return coincidencia ? Number(coincidencia[1]) : null
}

export default function CalendarioPage() {
  const { mostrarToast } = useToast()
  const inicial = mesActual()
  const [anio, setAnio] = useState(inicial.anio)
  const [mes, setMes] = useState(inicial.mes)
  const [dias, setDias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorFecha, setErrorFecha] = useState(null)
  const [alertaForm, setAlertaForm] = useState(null)

  const [porHabilitar, setPorHabilitar] = useState(null)
  const [habilitando, setHabilitando] = useState(false)

  const cargar = useCallback(async () => {
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

  useEffect(() => {
    cargar()
  }, [cargar])

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

  const cerrarModal = () => setModal(null)

  const guardar = async (valores) => {
    setGuardando(true)
    setErrorFecha(null)
    setAlertaForm(null)
    try {
      await crearDiaNoLaborable(valores)
      mostrarToast({ title: 'Día no laborable registrado', tone: 'success' })
      setModal(null)
      await cargar()
    } catch (fallo) {
      const mensaje = fallo?.message || ''
      if (/ya está registrada como día no laborable/i.test(mensaje)) {
        setErrorFecha('Esta fecha ya está registrada como día no laborable.')
      } else if (/cita\(s\) programada\(s\)/i.test(mensaje)) {
        const cantidad = extraerCantidadCitas(mensaje)
        const detalle = cantidad
          ? ` El sistema detectó ${cantidad} cita(s) agendada(s) para esa fecha.`
          : ''
        setAlertaForm({
          tone: 'warning',
          title: 'No se puede marcar esta fecha como no laborable',
          mensaje: `${MENSAJE_CONFLICTO}${detalle}`,
        })
      } else {
        setAlertaForm({
          tone: 'error',
          title: 'No se pudo registrar',
          mensaje: mensaje || 'Intente nuevamente en unos momentos.',
        })
      }
    } finally {
      setGuardando(false)
    }
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
      await cargar()
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
    modal?.modo === 'consultar' ? 'Detalle del día no laborable' : 'Nuevo día no laborable'

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-headline-md text-hro-blue">Calendario institucional</h2>
          <p className="text-sm text-slate-500">
            Administración de días no laborables, feriados y cierres institucionales.
          </p>
        </div>
        <Button onClick={() => abrirCrear()}>
          <Icon name="add" className="text-[18px]" />
          Agregar día no laborable
        </Button>
      </header>

      <Alert tone="info">
        El sistema verifica si una fecha afecta citas, programación médica o cupos antes de
        bloquearla. Si existen citas registradas, deben reprogramarse o cancelarse primero.
      </Alert>

      {cargando && <Spinner label="Cargando calendario institucional..." />}

      {!cargando && error && (
        <Alert tone="error" title="No se pudo cargar el calendario">
          <p>{error}</p>
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={cargar}>
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
            onSeleccionarDia={abrirCrear}
            onVerDia={abrirConsultar}
          />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Días no laborables del mes</h3>
            <ListaDiasNoLaborables
              dias={dias}
              onVer={abrirConsultar}
              onHabilitar={solicitarHabilitar}
            />
          </div>
        </div>
      )}

      <ModalCatalogo
        abierto={Boolean(modal)}
        modo={modal?.modo}
        titulo={tituloModal}
        onCerrar={cerrarModal}
        guardando={guardando}
        textoGuardar="Registrar"
      >
        {modal && (
          <DiaNoLaborableForm
            modo={modal.modo}
            fechaInicial={modal.fechaInicial}
            registro={modal.registro}
            errorFecha={errorFecha}
            alerta={alertaForm}
            onSubmit={guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(porHabilitar)}
        titulo="Habilitar fecha"
        mensaje="¿Deseas habilitar nuevamente esta fecha como día laborable? Dejará de aparecer como día no laborable."
        textoConfirmar="Sí, habilitar fecha"
        onConfirmar={confirmarHabilitar}
        onCancelar={cancelarHabilitar}
        procesando={habilitando}
      />
    </section>
  )
}
