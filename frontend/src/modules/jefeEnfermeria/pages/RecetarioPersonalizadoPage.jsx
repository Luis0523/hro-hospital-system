import { useEffect, useRef, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import EstadoBadge from '@/shared/components/ui/EstadoBadge.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { buscarPacienteRecetario } from '../api/recetarioApi'
import BuscadorPacienteRecetario from '../components/BuscadorPacienteRecetario.jsx'
import FichaPacienteRecetario from '../components/FichaPacienteRecetario.jsx'
import FormularioMedicamentoRecetario from '../components/FormularioMedicamentoRecetario.jsx'
import SolicitudMedicamentosFormato1 from '../components/SolicitudMedicamentosFormato1.jsx'
import SolicitudMedicamentosFormato2 from '../components/SolicitudMedicamentosFormato2.jsx'
import TablaMedicamentosRecetario from '../components/TablaMedicamentosRecetario.jsx'

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

export default function RecetarioPersonalizadoPage() {
  const [expediente, setExpediente] = useState('')
  const [solicitud, setSolicitud] = useState(solicitudInicial)
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [medicamentoEditando, setMedicamentoEditando] = useState(null)
  const [formatoImprimiendo, setFormatoImprimiendo] = useState(null)

  const secuenciaRef = useRef(0)
  const siguienteIdRef = useRef(0)

  useEffect(() => {
    if (!formatoImprimiendo) return

    try {
      window.print()
    } finally {
      setFormatoImprimiendo(null)
    }
  }, [formatoImprimiendo])

  async function manejarBusqueda(evento) {
    evento?.preventDefault()
    const secuencia = ++secuenciaRef.current
    const codigo = expediente.trim()

    setSolicitud(solicitudInicial())
    setNoEncontrado(false)
    setErrorBusqueda(null)

    if (!codigo) {
      setBuscando(false)
      setErrorBusqueda('El número de expediente es obligatorio.')
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
      setErrorBusqueda(error?.message || 'No se pudo consultar el paciente.')
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

  function actualizarSolicitud(campo, valor) {
    setSolicitud((actual) => ({ ...actual, [campo]: valor }))
  }

  function abrirAgregar() {
    setMedicamentoEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(medicamento) {
    setMedicamentoEditando(medicamento)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setMedicamentoEditando(null)
  }

  function guardarMedicamento(datos) {
    setSolicitud((actual) => {
      if (medicamentoEditando) {
        const id = medicamentoEditando.id
        return {
          ...actual,
          medicamentos: actual.medicamentos.map((medicamento) =>
            medicamento.id === id ? { ...medicamento, ...datos, id } : medicamento,
          ),
        }
      }

      const medicamento = { ...datos, id: `medicamento-${++siguienteIdRef.current}` }
      return { ...actual, medicamentos: [...actual.medicamentos, medicamento] }
    })
    cerrarModal()
  }

  function eliminarMedicamento(id) {
    setSolicitud((actual) => ({
      ...actual,
      medicamentos: actual.medicamentos.filter((medicamento) => medicamento.id !== id),
    }))
  }

  const paciente = solicitud.paciente
  const faltantes = faltantesParaImprimir(solicitud)
  const puedeImprimir = faltantes.length === 0

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-lg text-on-surface">Solicitud de Medicamentos Especiales</h2>
        <p className="text-body-md text-on-surface-variant">
          Recetario personalizado · Jefatura de Enfermería
        </p>
      </header>

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

      {paciente && (
        <section className="space-y-3">
          <h3 className="text-headline-sm text-on-surface">Datos del paciente</h3>
          <FichaPacienteRecetario
            paciente={paciente}
            solicitud={solicitud}
            onCambio={actualizarSolicitud}
          />
        </section>
      )}

      {paciente && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-headline-sm text-on-surface">Medicamentos</h3>
              <p className="text-body-sm text-on-surface-variant">
                Capture los medicamentos que formarán parte de la solicitud.
              </p>
            </div>
            <Button onClick={abrirAgregar}>
              <Icon name="add" className="text-[18px]" />
              Agregar medicamento
            </Button>
          </div>

          <Alert tone="warning">
            <p className="font-semibold">
              Borrador local · El guardado de la solicitud aún no está disponible.
            </p>
          </Alert>

          <TablaMedicamentosRecetario
            medicamentos={solicitud.medicamentos}
            onEditar={abrirEditar}
            onEliminar={eliminarMedicamento}
          />
        </section>
      )}

      {paciente && (
        <Card as="section" className="space-y-2">
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
        </Card>
      )}

      {paciente && (
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h3 className="text-title-md text-on-surface">Estado de farmacia</h3>
          <dl className="mt-3 grid gap-3 text-body-sm sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3">
              <dt className="text-on-surface-variant">Despacho de farmacia interna</dt>
              <dd>
                <EstadoBadge estado="pendiente" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3">
              <dt className="text-on-surface-variant">Recibo conforme</dt>
              <dd>
                <EstadoBadge estado="pendiente" />
              </dd>
            </div>
          </dl>
        </section>
      )}

      {paciente && (
        <section
          className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          data-testid="control-impresion"
        >
          <div>
            <h3 className="text-title-md text-on-surface">Imprimir solicitud</h3>
            <p className="text-body-sm text-on-surface-variant">
              Seleccione el formato que necesita imprimir.
            </p>
          </div>

          {!puedeImprimir && (
            <Alert tone="warning" title="Complete la solicitud para imprimir">
              Faltan: {faltantes.join(', ')}.
            </Alert>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <article className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                  <Icon name="description" className="text-[22px]" />
                </span>
                <div>
                  <h4 className="text-title-sm font-semibold text-on-surface">Formato No. 2</h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Solicitud con varios medicamentos.
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setFormatoImprimiendo('2')}
                disabled={!puedeImprimir}
              >
                <Icon name="print" className="text-[18px]" />
                Imprimir Formato No. 2
              </Button>
            </article>

            <article className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="description" className="text-[22px]" />
                </span>
                <div>
                  <h4 className="text-title-sm font-semibold text-on-surface">Formato No. 1</h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Solicitud individual de medicamento.
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setFormatoImprimiendo('1')}
                disabled={!puedeImprimir}
              >
                <Icon name="print" className="text-[18px]" />
                Imprimir Formato No. 1
              </Button>
            </article>
          </div>

          <div className="flex justify-end border-t border-outline-variant pt-3">
            <Button
              variant="ghost"
              onClick={() => setFormatoImprimiendo('ambos')}
              disabled={!puedeImprimir}
            >
              Imprimir ambos formatos
            </Button>
          </div>
        </section>
      )}

      {(formatoImprimiendo === '2' || formatoImprimiendo === 'ambos') && (
        <SolicitudMedicamentosFormato2 solicitud={solicitud} />
      )}
      {(formatoImprimiendo === '1' || formatoImprimiendo === 'ambos') && (
        <SolicitudMedicamentosFormato1 solicitud={solicitud} />
      )}

      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        title={medicamentoEditando ? 'Editar medicamento' : 'Agregar medicamento'}
        size="lg"
      >
        {modalAbierto && (
          <FormularioMedicamentoRecetario
            valoresIniciales={medicamentoEditando}
            textoAccion={medicamentoEditando ? 'Guardar cambios' : 'Agregar'}
            onGuardar={guardarMedicamento}
            onCancelar={cerrarModal}
          />
        )}
      </Modal>
    </section>
  )
}
