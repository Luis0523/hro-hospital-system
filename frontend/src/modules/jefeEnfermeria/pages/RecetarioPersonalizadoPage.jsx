import { useEffect, useRef, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { esExpedienteValido, normalizarExpediente } from '@/modules/libroCitas/utils/expediente'
import { buscarPacienteRecetario } from '../api/recetarioApi'
import BuscadorPacienteRecetario from '../components/BuscadorPacienteRecetario.jsx'
import DatosSolicitudRecetario from '../components/DatosSolicitudRecetario.jsx'
import FichaPacienteRecetario from '../components/FichaPacienteRecetario.jsx'
import FormularioMedicamentoRecetario from '../components/FormularioMedicamentoRecetario.jsx'
import HistorialRecetarios from '../components/HistorialRecetarios.jsx'
import PanelMedicamentosGuardados from '../components/PanelMedicamentosGuardados.jsx'
import ResumenSolicitud from '../components/ResumenSolicitud.jsx'
import SolicitudMedicamentosFormato1 from '../components/SolicitudMedicamentosFormato1.jsx'
import SolicitudMedicamentosFormato2 from '../components/SolicitudMedicamentosFormato2.jsx'
import TablaMedicamentosRecetario from '../components/TablaMedicamentosRecetario.jsx'
import {
  alternarFavorito,
  eliminarMedicamentoDelCatalogo,
  guardarMedicamentoEnCatalogo,
  leerMedicamentosGuardados,
  limpiarCatalogoMedicamentos,
} from '../utils/medicamentosGuardados'
import {
  agregarAlHistorial,
  leerHistorialRecetarios,
  limpiarHistorialRecetarios,
} from '../utils/historialRecetarios'

// Pre-carga el logo institucional para que esté listo al abrir el diálogo de impresión.
const LOGO_INSTITUCIONAL = '/logo-hro.jpg'
if (typeof Image !== 'undefined') {
  const precarga = new Image()
  precarga.src = LOGO_INSTITUCIONAL
}

function esperarImagenes(limiteMs) {
  if (typeof document === 'undefined') return Promise.resolve()

  const pendientes = Array.from(document.images).filter((imagen) => !imagen.complete)
  if (pendientes.length === 0) return Promise.resolve()

  const cargadas = Promise.all(
    pendientes.map(
      (imagen) =>
        new Promise((resolver) => {
          imagen.addEventListener('load', resolver, { once: true })
          imagen.addEventListener('error', resolver, { once: true })
        }),
    ),
  )

  return Promise.race([cargadas, new Promise((resolver) => setTimeout(resolver, limiteMs))])
}

function marcaTiempoArchivo() {
  const ahora = new Date()
  const dosDigitos = (valor) => String(valor).padStart(2, '0')
  const fecha = `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(
    ahora.getDate(),
  )}`
  const hora = `${dosDigitos(ahora.getHours())}-${dosDigitos(ahora.getMinutes())}`
  return `${fecha}-${hora}`
}

function solicitudInicial() {
  return {
    paciente: null,
    cama: '',
    servicio: '',
    diagnostico: '',
    fecha: hoyIso(),
    medicoNombre: '',
    medicamentos: [],
    observaciones: '',
  }
}

function esMedicamentoValido(medicamento) {
  return (
    Boolean(String(medicamento?.nombre ?? '').trim()) &&
    Boolean(String(medicamento?.dosis ?? '').trim()) &&
    Boolean(String(medicamento?.via ?? '').trim()) &&
    Boolean(String(medicamento?.frecuencia ?? '').trim()) &&
    Boolean(String(medicamento?.fechaHoraInicio ?? '').trim()) &&
    Number(medicamento?.cantidadSolicitada) > 0
  )
}

function faltantesParaImprimir(solicitud) {
  const faltantes = []

  if (!solicitud.paciente) faltantes.push('paciente')
  if (!String(solicitud.cama ?? '').trim()) faltantes.push('cama')
  if (!String(solicitud.servicio ?? '').trim()) faltantes.push('servicio')
  if (!String(solicitud.diagnostico ?? '').trim()) faltantes.push('diagnóstico')
  if (!String(solicitud.fecha ?? '').trim()) faltantes.push('fecha')
  if (!String(solicitud.medicoNombre ?? '').trim()) faltantes.push('médico')
  if (!solicitud.medicamentos.some(esMedicamentoValido)) {
    faltantes.push('al menos un medicamento')
  }

  return faltantes
}

function Stepper({ paciente, totalMedicamentos, puedeImprimir }) {
  const pasos = [
    { numero: 1, etiqueta: 'Paciente', hecho: Boolean(paciente) },
    { numero: 2, etiqueta: 'Medicamentos', hecho: totalMedicamentos > 0 },
    { numero: 3, etiqueta: 'Revisar e imprimir', hecho: puedeImprimir },
  ]
  const activo = pasos.find((paso) => !paso.hecho)?.numero ?? 3

  return (
    <ol
      aria-label="Progreso de la solicitud"
      className="flex flex-wrap items-center gap-2 text-body-sm"
    >
      {pasos.map((paso, indice) => (
        <li key={paso.numero} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-[13px] font-semibold ${
              paso.hecho
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : paso.numero === activo
                  ? 'border-primary bg-primary-container text-on-primary'
                  : 'border-outline-variant text-on-surface-variant'
            }`}
          >
            {paso.hecho ? <Icon name="check" className="text-[16px]" /> : paso.numero}
          </span>
          <span
            className={
              paso.hecho || paso.numero === activo ? 'text-on-surface' : 'text-on-surface-variant'
            }
          >
            {paso.etiqueta}
          </span>
          {indice < pasos.length - 1 && (
            <span aria-hidden="true" className="mx-1 h-px w-6 bg-outline-variant sm:w-10" />
          )}
        </li>
      ))}
    </ol>
  )
}

export default function RecetarioPersonalizadoPage() {
  const [expediente, setExpediente] = useState('')
  const [solicitud, setSolicitud] = useState(solicitudInicial)
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [medicamentoEditando, setMedicamentoEditando] = useState(null)
  const [valoresIniciales, setValoresIniciales] = useState(null)
  const [campoEnfoque, setCampoEnfoque] = useState('nombre')
  const [medicamentosGuardados, setMedicamentosGuardados] = useState(() =>
    leerMedicamentosGuardados(),
  )
  const [formatoImprimiendo, setFormatoImprimiendo] = useState(null)
  const [solicitudImprimiendo, setSolicitudImprimiendo] = useState(null)
  const [formatoSeleccionado, setFormatoSeleccionado] = useState('auto')
  const [impresionRealizada, setImpresionRealizada] = useState(false)
  const [historial, setHistorial] = useState(() => leerHistorialRecetarios())
  const [historialAbierto, setHistorialAbierto] = useState(false)

  const secuenciaRef = useRef(0)
  const siguienteIdRef = useRef(0)
  const solicitudRef = useRef(solicitud)
  solicitudRef.current = solicitud
  const solicitudImprimiendoRef = useRef(null)
  const guardarHistorialRef = useRef(false)

  useEffect(() => {
    if (!formatoImprimiendo) return undefined

    let cancelado = false
    const limite = import.meta.env.MODE === 'test' ? 0 : 1500

    esperarImagenes(limite).finally(() => {
      if (cancelado) return

      const actual = solicitudImprimiendoRef.current ?? solicitudRef.current
      const numero = String(actual?.paciente?.numeroExpediente ?? '').trim() || 'sin-expediente'
      const tituloAnterior = typeof document !== 'undefined' ? document.title : ''
      if (typeof document !== 'undefined') {
        document.title = `rec-${numero}-${marcaTiempoArchivo()}`
      }

      const debeGuardar = guardarHistorialRef.current
      try {
        window.print()
      } finally {
        if (typeof document !== 'undefined') document.title = tituloAnterior
        if (debeGuardar && actual) {
          setHistorial(agregarAlHistorial({ solicitud: actual, formato: formatoImprimiendo }))
          setImpresionRealizada(true)
        }
        guardarHistorialRef.current = false
        setSolicitudImprimiendo(null)
        setFormatoImprimiendo(null)
      }
    })

    return () => {
      cancelado = true
    }
  }, [formatoImprimiendo])

  async function manejarBusqueda(evento) {
    evento?.preventDefault()
    const secuencia = ++secuenciaRef.current
    const codigo = normalizarExpediente(expediente)

    setSolicitud(solicitudInicial())
    setNoEncontrado(false)
    setErrorBusqueda(null)

    if (!codigo) {
      setBuscando(false)
      setErrorBusqueda('El número de expediente es obligatorio.')
      return
    }

    if (!esExpedienteValido(codigo)) {
      setBuscando(false)
      setErrorBusqueda('El número de expediente debe contener solo números.')
      return
    }

    setBuscando(true)

    try {
      const encontrado = await buscarPacienteRecetario(codigo)
      if (secuencia !== secuenciaRef.current) return

      if (!encontrado) {
        setNoEncontrado(true)
        return
      }

      setSolicitud((actual) => ({ ...actual, paciente: encontrado }))
    } catch (error) {
      if (secuencia !== secuenciaRef.current) return
      setErrorBusqueda(error?.message || 'No se pudo consultar el expediente.')
    } finally {
      if (secuencia === secuenciaRef.current) setBuscando(false)
    }
  }

  function cambiarExpediente(valor) {
    secuenciaRef.current += 1
    setExpediente(valor)
    setBuscando(false)
    setErrorBusqueda(null)
    setNoEncontrado(false)
  }

  function cambiarPaciente() {
    secuenciaRef.current += 1
    setSolicitud(solicitudInicial())
    setExpediente('')
    setBuscando(false)
    setErrorBusqueda(null)
    setNoEncontrado(false)
    setFormatoSeleccionado('auto')
    setImpresionRealizada(false)
  }

  function actualizarSolicitud(campo, valor) {
    setImpresionRealizada(false)
    setSolicitud((actual) => ({ ...actual, [campo]: valor }))
  }

  function abrirAgregar() {
    setMedicamentoEditando(null)
    setValoresIniciales(null)
    setCampoEnfoque('nombre')
    setModalAbierto(true)
  }

  function abrirEditar(medicamento) {
    setMedicamentoEditando(medicamento)
    setValoresIniciales(medicamento)
    setCampoEnfoque('nombre')
    setModalAbierto(true)
  }

  function usarMedicamentoGuardado(medicamento) {
    setMedicamentoEditando(null)
    setValoresIniciales({
      nombre: medicamento.nombre,
      dosis: medicamento.dosis,
      via: medicamento.via,
      frecuencia: medicamento.frecuencia,
      fechaHoraInicio: '',
      cantidadSolicitada: '',
    })
    setCampoEnfoque('fechaHoraInicio')
    setModalAbierto(true)
  }

  function duplicarMedicamento(medicamento) {
    setMedicamentoEditando(null)
    setValoresIniciales({
      ...medicamento,
      fechaHoraInicio: '',
      cantidadSolicitada: '',
    })
    setCampoEnfoque('fechaHoraInicio')
    setModalAbierto(true)
  }

  function quitarMedicamentoGuardado(id) {
    setMedicamentosGuardados(eliminarMedicamentoDelCatalogo(id))
  }

  function alternarFavoritoGuardado(id) {
    setMedicamentosGuardados(alternarFavorito(id))
  }

  function limpiarGuardados() {
    setMedicamentosGuardados(limpiarCatalogoMedicamentos())
  }

  function cerrarModal() {
    setModalAbierto(false)
    setMedicamentoEditando(null)
    setValoresIniciales(null)
    setCampoEnfoque('nombre')
  }

  function guardarMedicamento(datos) {
    const { guardarEnCatalogo, ...medicamentoDatos } = datos

    if (guardarEnCatalogo !== false) {
      setMedicamentosGuardados(guardarMedicamentoEnCatalogo(medicamentoDatos))
    }

    setImpresionRealizada(false)
    setSolicitud((actual) => {
      if (medicamentoEditando) {
        const id = medicamentoEditando.id
        return {
          ...actual,
          medicamentos: actual.medicamentos.map((medicamento) =>
            medicamento.id === id ? { ...medicamento, ...medicamentoDatos, id } : medicamento,
          ),
        }
      }

      const medicamento = { ...medicamentoDatos, id: `medicamento-${++siguienteIdRef.current}` }
      return { ...actual, medicamentos: [...actual.medicamentos, medicamento] }
    })
    cerrarModal()
  }

  function eliminarMedicamento(id) {
    const medicamento = solicitud.medicamentos.find((item) => item.id === id)
    const confirmado =
      typeof window === 'undefined' ||
      window.confirm(`¿Eliminar ${medicamento?.nombre ?? 'este medicamento'} de la solicitud?`)
    if (!confirmado) return

    setImpresionRealizada(false)
    setSolicitud((actual) => ({
      ...actual,
      medicamentos: actual.medicamentos.filter((item) => item.id !== id),
    }))
  }

  function cambiarFormato(valor) {
    setFormatoSeleccionado(valor)
    setImpresionRealizada(false)
  }

  const paciente = solicitud.paciente
  const totalMedicamentos = solicitud.medicamentos.length
  const faltantes = faltantesParaImprimir(solicitud)
  const puedeImprimir = faltantes.length === 0
  const formatoSugerido = totalMedicamentos === 1 ? '1' : '2'
  const formatoEfectivo = formatoSeleccionado === 'auto' ? formatoSugerido : formatoSeleccionado

  function imprimir() {
    if (!puedeImprimir) return
    setImpresionRealizada(false)
    guardarHistorialRef.current = true
    solicitudImprimiendoRef.current = solicitud
    setSolicitudImprimiendo(solicitud)
    setFormatoImprimiendo(formatoEfectivo)
  }

  function reimprimir(entrada) {
    guardarHistorialRef.current = false
    solicitudImprimiendoRef.current = entrada.solicitud
    setSolicitudImprimiendo(entrada.solicitud)
    setFormatoImprimiendo(entrada.formato)
  }

  function vaciarHistorial() {
    setHistorial(limpiarHistorialRecetarios())
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-headline-lg text-on-surface">Solicitud de Medicamentos Especiales</h2>
          <p className="text-body-md text-on-surface-variant">
            Recetario personalizado · Jefatura de Enfermería
          </p>
        </div>
        <Button variant="secondary" onClick={() => setHistorialAbierto(true)}>
          <Icon name="history" className="text-[18px]" />
          Historial
        </Button>
      </header>

      {!paciente ? (
        <div className="space-y-3">
          <BuscadorPacienteRecetario
            expediente={expediente}
            onExpedienteChange={cambiarExpediente}
            onBuscar={manejarBusqueda}
            buscando={buscando}
          />

          {buscando && <Spinner label="Buscando paciente..." />}

          {errorBusqueda && (
            <Alert tone="error" title="No se pudo consultar el paciente">
              {errorBusqueda}
            </Alert>
          )}

          {noEncontrado && (
            <EmptyState
              title="Paciente no encontrado"
              description="Verifique el número de expediente e intente de nuevo."
            />
          )}
        </div>
      ) : (
        <FichaPacienteRecetario paciente={paciente} onCambiar={cambiarPaciente} />
      )}

      {paciente && (
        <Stepper
          paciente={paciente}
          totalMedicamentos={totalMedicamentos}
          puedeImprimir={puedeImprimir}
        />
      )}

      {paciente && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <DatosSolicitudRecetario solicitud={solicitud} onCambio={actualizarSolicitud} />

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-headline-sm text-on-surface">Medicamentos</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Agregue uno nuevo o reutilice uno guardado.
                  </p>
                </div>
                <Button onClick={abrirAgregar}>
                  <Icon name="add" className="text-[18px]" />
                  Agregar medicamento
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                <PanelMedicamentosGuardados
                  medicamentos={medicamentosGuardados}
                  onUsar={usarMedicamentoGuardado}
                  onEliminar={quitarMedicamentoGuardado}
                  onAlternarFavorito={alternarFavoritoGuardado}
                  onLimpiar={limpiarGuardados}
                />

                <div className="min-w-0">
                  <TablaMedicamentosRecetario
                    medicamentos={solicitud.medicamentos}
                    onEditar={abrirEditar}
                    onEliminar={eliminarMedicamento}
                    onDuplicar={duplicarMedicamento}
                  />
                </div>
              </div>
            </section>

            <Card as="section" className="space-y-3">
              <div>
                <h3 className="text-headline-sm text-on-surface">Revisión</h3>
                <p className="text-body-sm text-on-surface-variant">
                  Observaciones finales antes de imprimir. El documento usa el formato institucional
                  y genera dos copias por hoja.
                </p>
              </div>
              <label className="block space-y-1" htmlFor="observaciones-solicitud">
                <span className="block text-title-md text-on-surface">Observaciones</span>
                <textarea
                  id="observaciones-solicitud"
                  name="observaciones"
                  rows="3"
                  value={solicitud.observaciones}
                  onChange={(evento) => actualizarSolicitud('observaciones', evento.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
                />
              </label>
              {puedeImprimir ? (
                <Alert tone="success" title="Solicitud completa">
                  Puede imprimir y guardar desde el resumen. Se sugiere{' '}
                  {formatoSugerido === '1' ? 'el Formato No. 1' : 'el Formato No. 2'}.
                </Alert>
              ) : (
                <Alert tone="warning" title="Complete la solicitud para imprimir">
                  Falta: {faltantes.join(', ')}.
                </Alert>
              )}
            </Card>
          </div>

          <ResumenSolicitud
            paciente={paciente}
            solicitud={solicitud}
            faltantes={faltantes}
            formato={formatoSeleccionado}
            formatoSugerido={formatoSugerido}
            onFormatoChange={cambiarFormato}
            onImprimir={imprimir}
            puedeImprimir={puedeImprimir}
            impresionRealizada={impresionRealizada}
          />
        </div>
      )}

      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        title={medicamentoEditando ? 'Editar medicamento' : 'Agregar medicamento'}
        size="lg"
      >
        {modalAbierto && (
          <FormularioMedicamentoRecetario
            valoresIniciales={valoresIniciales}
            campoEnfoque={campoEnfoque}
            textoAccion={medicamentoEditando ? 'Guardar cambios' : 'Agregar'}
            onGuardar={guardarMedicamento}
            onCancelar={cerrarModal}
          />
        )}
      </Modal>

      <Modal
        open={historialAbierto}
        onClose={() => setHistorialAbierto(false)}
        title="Historial de recetarios"
        size="xl"
      >
        <div className="max-h-[70dvh] overflow-y-auto pr-1">
          <HistorialRecetarios
            entradas={historial}
            onReimprimir={reimprimir}
            onLimpiar={vaciarHistorial}
          />
        </div>
      </Modal>

      {(formatoImprimiendo === '2' || formatoImprimiendo === 'ambos') && (
        <SolicitudMedicamentosFormato2 solicitud={solicitudImprimiendo ?? solicitud} copias={2} />
      )}
      {(formatoImprimiendo === '1' || formatoImprimiendo === 'ambos') && (
        <SolicitudMedicamentosFormato1 solicitud={solicitudImprimiendo ?? solicitud} copias={2} />
      )}
    </section>
  )
}
