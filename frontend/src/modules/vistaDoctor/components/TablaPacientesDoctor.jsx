import { useEffect, useRef, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import AccionesPaciente from './AccionesPaciente.jsx'
import EstadoTurnoBadge from './EstadoTurnoBadge.jsx'
import { formatearEspera, minutosDeEspera } from '../api/doctorMappers'
import { evaluarLlamado, ordenarCola } from '../api/doctorAcciones'
import '../vistaDoctor.css'

function textoExpediente(turno) {
  return turno.identificado && turno.expediente ? turno.expediente : 'Sin registrar'
}

function textoPaciente(turno) {
  return turno.identificado ? turno.pacienteNombre : 'Pendiente de identificar'
}

function tiempoDeEspera(turno, ahora) {
  return formatearEspera(minutosDeEspera(turno, ahora))
}

export default function TablaPacientesDoctor({
  clinica,
  asignacion,
  turnos = [],
  cargando = false,
  error = null,
  onReintentar,
  onAccion,
  onRegistrarExpediente,
  procesando = false,
  jornadaCerrada = false,
  ultimoLlamadoEn = 0,
  ahora = Date.now(),
}) {
  const [hayMasMovil, setHayMasMovil] = useState(false)
  const scrollMovilRef = useRef(null)
  const turnosOrdenados = ordenarCola(turnos)
  const tituloClinica = clinica
    ? `Clínica ${clinica.numero} · ${asignacion?.subespecialidadNombre ?? clinica.nombre}`
    : 'Clínica'

  useEffect(() => {
    const elemento = scrollMovilRef.current
    if (!elemento) {
      setHayMasMovil(false)
      return undefined
    }

    const actualizar = () => {
      setHayMasMovil(elemento.scrollHeight > elemento.clientHeight + 2)
    }

    actualizar()
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(actualizar) : null
    observador?.observe(elemento)
    globalThis.addEventListener?.('resize', actualizar)

    return () => {
      observador?.disconnect()
      globalThis.removeEventListener?.('resize', actualizar)
    }
  }, [turnos, cargando, error])

  return (
    <section aria-labelledby="pacientes-doctor" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pacientes-doctor" className="text-headline-sm text-on-surface">
            Pacientes de la clínica
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
            La lista pertenece a la clínica y no se filtra por médico.
          </p>
        </div>
        <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant">
          {tituloClinica}
        </span>
      </div>

      {cargando && <Spinner label="Cargando pacientes…" />}

      {!cargando && error && (
        <Alert tone="error" title="No se pudo cargar la cola de pacientes">
          <p className="text-sm">{error.message || 'Ocurrió un problema al leer la lista.'}</p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="mt-3 min-h-[44px]"
            onClick={onReintentar}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {!cargando && !error && turnosOrdenados.length === 0 && (
        <EmptyState
          title="No hay pacientes en cola"
          description="La clínica no tiene turnos activos para la fecha."
          action={
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="min-h-[44px]"
              onClick={onReintentar}
            >
              Actualizar
            </Button>
          }
        />
      )}

      {!cargando && !error && turnosOrdenados.length > 0 && (
        <>
          <div
            className="scroll-pacientes hidden max-h-[60vh] overflow-x-auto overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest [scrollbar-gutter:stable] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue md:block xl:max-h-[38rem]"
            data-testid="tabla-pacientes"
            role="region"
            aria-label={`Lista de pacientes de ${tituloClinica}`}
            tabIndex={0}
          >
            <table className="w-full min-w-[60rem] text-left text-sm">
              <caption className="sr-only">
                Pacientes de {tituloClinica}. Lista de la clínica, sin filtro por médico.
              </caption>
              <thead
                className="sticky top-0 z-10 bg-surface-container-low text-sm uppercase tracking-wide text-on-surface-variant shadow-sm"
                data-testid="cabecera-tabla-pacientes"
              >
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Correlativo
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Expediente
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Paciente
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Espera
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {turnosOrdenados.map((turno) => {
                  const evaluacion = evaluarLlamado(turno, turnosOrdenados, ahora, ultimoLlamadoEn)
                  const expedienteValidado = Boolean(turno.identificado && turno.expediente)

                  return (
                    <tr key={turno.id} className="align-top hover:bg-surface-container-low/60">
                      <td className="px-4 py-4">
                        <span className="inline-flex min-h-[44px] min-w-[4rem] items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 text-lg font-bold text-primary">
                          {turno.correlativo ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm font-semibold text-on-surface">
                        {textoExpediente(turno)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-base font-semibold text-on-surface">
                          {textoPaciente(turno)}
                        </p>
                        {turno.intentosLlamado > 1 && (
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {turno.intentosLlamado} intentos de llamado
                          </p>
                        )}
                        {turno.estado !== 'atendido' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mt-2 min-h-[44px] text-sm"
                            onClick={() => onRegistrarExpediente?.(turno)}
                            disabled={jornadaCerrada || procesando}
                          >
                            {expedienteValidado ? 'Editar expediente' : 'Registrar expediente'}
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <EstadoTurnoBadge estado={turno.estado} />
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">
                        {tiempoDeEspera(turno, ahora)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[12rem]">
                          <AccionesPaciente
                            estado={turno.estado}
                            onAccion={(accion) => onAccion?.(accion, turno)}
                            procesando={procesando}
                            deshabilitado={jornadaCerrada}
                            permitidoLlamado={evaluacion.permitido}
                            motivoLlamado={evaluacion.motivo}
                            cooldownSegundos={evaluacion.cooldownSegundos ?? 0}
                            expedienteValidado={expedienteValidado}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {hayMasMovil && (
            <p className="text-sm text-on-surface-variant md:hidden">Desliza para ver más</p>
          )}

          <div
            className="scroll-pacientes max-h-[60vh] space-y-4 overflow-y-auto pr-1 [scrollbar-gutter:stable] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue md:hidden xl:max-h-[38rem]"
            data-testid="lista-pacientes-movil"
            role="region"
            aria-label={`Lista de pacientes de ${tituloClinica}`}
            tabIndex={0}
            ref={scrollMovilRef}
          >
            {turnosOrdenados.map((turno) => {
              const evaluacion = evaluarLlamado(turno, turnosOrdenados, ahora, ultimoLlamadoEn)
              const expedienteValidado = Boolean(turno.identificado && turno.expediente)

              return (
                <article
                  key={turno.id}
                  className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex min-h-[44px] min-w-[4rem] items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 text-lg font-bold text-primary">
                      {turno.correlativo ?? '—'}
                    </span>
                    <EstadoTurnoBadge estado={turno.estado} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                      Paciente
                    </p>
                    <p className="mt-1 text-base font-semibold text-on-surface">
                      {textoPaciente(turno)}
                    </p>
                    {turno.intentosLlamado > 1 && (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {turno.intentosLlamado} intentos de llamado
                      </p>
                    )}
                    {turno.estado !== 'atendido' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2 min-h-[44px] w-full text-sm"
                        onClick={() => onRegistrarExpediente?.(turno)}
                        disabled={jornadaCerrada || procesando}
                      >
                        {expedienteValidado ? 'Editar expediente' : 'Registrar expediente'}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                        Expediente
                      </p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold text-on-surface">
                        {textoExpediente(turno)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                        Espera
                      </p>
                      <p className="mt-1 text-base text-on-surface">
                        {tiempoDeEspera(turno, ahora)}
                      </p>
                    </div>
                  </div>

                  <AccionesPaciente
                    estado={turno.estado}
                    onAccion={(accion) => onAccion?.(accion, turno)}
                    procesando={procesando}
                    deshabilitado={jornadaCerrada}
                    permitidoLlamado={evaluacion.permitido}
                    motivoLlamado={evaluacion.motivo}
                    cooldownSegundos={evaluacion.cooldownSegundos ?? 0}
                    expedienteValidado={expedienteValidado}
                  />
                </article>
              )
            })}
          </div>

          <p className="text-sm text-on-surface-variant">
            Los cambios se guardan solo en esta pestaña. No se envían al tablero real.
          </p>
        </>
      )}
    </section>
  )
}
