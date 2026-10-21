import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import AccesoDoctor from '../components/AccesoDoctor.jsx'
import AvisoDemo from '../components/AvisoDemo.jsx'
import EncabezadoDoctor from '../components/EncabezadoDoctor.jsx'
import ErrorClinica from '../components/ErrorClinica.jsx'
import ModalExpediente from '../components/ModalExpediente.jsx'
import ModalFinJornada from '../components/ModalFinJornada.jsx'
import ModalReabrirJornada from '../components/ModalReabrirJornada.jsx'
import ResumenJornada from '../components/ResumenJornada.jsx'
import TablaPacientesDoctor from '../components/TablaPacientesDoctor.jsx'
import { calcularEstadisticas } from '../api/doctorAcciones'
import {
  cerrarJornada,
  esModoDemo,
  descartarJornadaCerrada,
  jornadaCerradaCorrespondeA,
  limpiarJornadaOperativa,
  obtenerJornadaCerrada,
  reabrirJornada,
  registrarExpediente,
} from '../api/doctorApi'
import { useAccionesTurno } from '../hooks/useAccionesTurno'
import { useClinicaDoctor } from '../hooks/useClinicaDoctor'
import { useCooldown } from '../hooks/useCooldown'
import { useSesionDoctor } from '../hooks/useSesionDoctor'
import { useTurnosDoctor } from '../hooks/useTurnosDoctor'
import { sesionCorrespondeA } from '../identidadDoctor'

export default function VistaDoctorPage() {
  const [parametros] = useSearchParams()
  const clinicaQr = parametros.get('clinica')?.trim() ?? ''
  const escenario = parametros.get('escenario')?.trim() ?? ''
  const [reapertura, setReapertura] = useState(null)
  const [finJornadaAbierto, setFinJornadaAbierto] = useState(false)
  const [cerrandoJornada, setCerrandoJornada] = useState(false)
  const [expedienteTurno, setExpedienteTurno] = useState(null)
  const [mensajeExpediente, setMensajeExpediente] = useState(null)

  const {
    estado: estadoClinica,
    clinica,
    asignacion,
    error: errorClinica,
    reintentar: reintentarClinica,
  } = useClinicaDoctor(clinicaQr)

  const { sesion, identificar, cerrar } = useSesionDoctor()
  const sesionValida = estadoClinica === 'listo' && sesionCorrespondeA(sesion, clinica, asignacion)

  useEffect(() => {
    if (estadoClinica === 'listo' && sesion && !sesionCorrespondeA(sesion, clinica, asignacion)) {
      cerrar()
      limpiarJornadaOperativa()
      setReapertura(null)
    }
  }, [estadoClinica, sesion, clinica, asignacion, cerrar])

  const {
    estado: estadoTurnos,
    turnos,
    ultimoLlamadoEn,
    error: errorTurnos,
    recargar: recargarTurnos,
    actualizarEstado,
  } = useTurnosDoctor(sesionValida ? asignacion : null, escenario, sesion?.medico?.id)
  const { ahora } = useCooldown(ultimoLlamadoEn)

  const {
    ejecutar,
    procesando,
    error: errorAccion,
    mensaje: mensajeAccion,
  } = useAccionesTurno({
    medico: sesion?.medico,
    asignacion,
    escenario,
    onActualizar: actualizarEstado,
  })

  const estadisticas = calcularEstadisticas(turnos)

  function manejarIdentificado(medico) {
    const cerrada = obtenerJornadaCerrada()
    if (cerrada && jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion)) {
      setReapertura({ medico, jornada: cerrada })
      return
    }
    if (cerrada) descartarJornadaCerrada()
    identificar(medico, clinica, asignacion)
  }

  function confirmarReapertura() {
    if (!reapertura) return
    reabrirJornada()
    identificar(reapertura.medico, clinica, asignacion)
    setReapertura(null)
  }

  function abrirExpediente(turno) {
    setMensajeExpediente(null)
    setExpedienteTurno(turno)
  }

  async function asociarExpediente(expediente) {
    if (!expedienteTurno || !sesion) return
    const resultado = await registrarExpediente({
      asignacionId: asignacion.id,
      espacioFisicoId: asignacion.espacioFisicoId ?? clinica?.espacioFisicoId,
      medicoId: sesion.medico.id,
      numeroColegiado: sesion.medico.colegiado,
      turnoId: expedienteTurno.id,
      expediente,
      escenario,
    })
    actualizarEstado(resultado)
    setMensajeExpediente(
      esModoDemo ? 'Expediente registrado en esta demostración.' : 'Expediente vinculado al turno.',
    )
    setExpedienteTurno(null)
  }

  async function confirmarFinJornada() {
    if (!sesion) return
    setCerrandoJornada(true)
    try {
      cerrarJornada({
        medico: sesion.medico,
        clinica,
        asignacion,
        turnos,
      })
      cerrar()
      setFinJornadaAbierto(false)
    } finally {
      setCerrandoJornada(false)
    }
  }

  if (estadoClinica === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-on-surface">
        <Spinner label="Validando clínica…" />
      </div>
    )
  }

  if (estadoClinica === 'error') {
    return <ErrorClinica error={errorClinica} onReintentar={reintentarClinica} />
  }

  if (!sesionValida) {
    return (
      <>
        <AccesoDoctor
          clinica={clinica}
          asignacion={asignacion}
          onIdentificado={manejarIdentificado}
        />
        <ModalReabrirJornada
          abierto={Boolean(reapertura)}
          jornada={reapertura?.jornada}
          medico={reapertura?.medico}
          clinica={clinica}
          onCancelar={() => setReapertura(null)}
          onConfirmar={confirmarReapertura}
        />
      </>
    )
  }

  const cargandoTurnos = estadoTurnos === 'loading' || (sesionValida && estadoTurnos === 'idle')
  const errorTurnosVisible = estadoTurnos === 'error' ? errorTurnos : null

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
        <EncabezadoDoctor medico={sesion.medico} clinica={clinica} asignacion={asignacion} />
        <AvisoDemo />
        <ResumenJornada estadisticas={estadisticas} />

        {errorAccion && (
          <Alert tone="error" title="No se pudo completar la acción">
            {errorAccion.message || 'Ocurrió un problema al actualizar el turno.'}
          </Alert>
        )}
        {mensajeAccion && (
          <Alert tone="success" title="Acción registrada">
            {mensajeAccion}
          </Alert>
        )}
        {mensajeExpediente && (
          <Alert tone="success" title="Expediente actualizado">
            {mensajeExpediente}
          </Alert>
        )}

        <TablaPacientesDoctor
          clinica={clinica}
          asignacion={asignacion}
          turnos={turnos}
          cargando={cargandoTurnos}
          error={errorTurnosVisible}
          onReintentar={recargarTurnos}
          onAccion={ejecutar}
          onRegistrarExpediente={abrirExpediente}
          procesando={procesando}
          ultimoLlamadoEn={ultimoLlamadoEn}
          ahora={ahora}
        />

        <section className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Fin de jornada</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Cierra la sesión local del médico en esta pestaña. No modifica la jornada
              institucional.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="min-h-[48px] w-full sm:w-auto"
            onClick={() => setFinJornadaAbierto(true)}
            disabled={procesando || cerrandoJornada}
          >
            Fin de jornada
          </Button>
        </section>

        <footer className="pb-2 text-center text-sm text-on-surface-variant">
          SIGHO · Vista del doctor {esModoDemo ? '· Datos de demostración' : '· Datos del hospital'}
        </footer>

        <ModalExpediente
          abierto={Boolean(expedienteTurno)}
          turno={expedienteTurno}
          onCerrar={() => setExpedienteTurno(null)}
          onRegistrar={asociarExpediente}
        />

        <ModalFinJornada
          abierto={finJornadaAbierto}
          medico={sesion.medico}
          clinica={clinica}
          estadisticas={estadisticas}
          procesando={cerrandoJornada}
          onCancelar={() => {
            if (!cerrandoJornada) setFinJornadaAbierto(false)
          }}
          onConfirmar={confirmarFinJornada}
        />
      </main>
    </div>
  )
}
