import { useEffect, useRef } from 'react'
import { EmptyState } from '@/shared/components/ui'
import { ETAPA_PREVIA, ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import SelectorTipoRegistro from './SelectorTipoRegistro'
import { estiloDeEtapa, estiloRegistro, etiquetaRegistro } from './estilosEtapas'

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

function CasillaTurno({
  especialidadId,
  codigo,
  numero,
  turno,
  seleccionada,
  filtro,
  onSeleccionar,
  casillaRef,
}) {
  const estilo = estiloDeEtapa(turno?.etapa)
  const brillo = estiloRegistro(turno)
  const marca = etiquetaRegistro(turno)
  const nombre = turno ? ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === turno.etapa)?.nombre : null
  const etapaObjetivo = filtro ? ETAPA_PREVIA[filtro] : null
  const atenuada =
    Boolean(filtro) &&
    filtro !== 'registrado' &&
    (!turno || (turno.etapa !== etapaObjetivo && turno.etapa !== filtro))

  return (
    <button
      ref={casillaRef}
      type="button"
      tabIndex={-1}
      aria-label={`${etiquetaTurno(codigo, numero)}, ${nombre ?? 'sin registro'}${
        marca ? `, ${marca}` : ''
      }`}
      aria-pressed={seleccionada}
      onClick={() => onSeleccionar(especialidadId, codigo, numero)}
      className={`relative h-8 w-8 rounded-md border text-label-sm font-bold transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${estilo.borde} ${estilo.fondo} ${estilo.texto} ${brillo} ${
        seleccionada ? 'outline outline-2 outline-offset-2 outline-primary' : ''
      } ${atenuada ? 'opacity-25' : ''}`}
    >
      {numero}
      {turno && (
        <span
          className={`absolute inset-x-1.5 bottom-1 h-0.5 rounded ${estilo.barra}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

// Libro digital: filtro por etapa y casillas de correlativos.
export default function LibroSeguimiento({
  filas,
  seleccionId,
  filtro,
  onSeleccionar,
  onActivarEspecialidad,
  especialidadActivaId = null,
  tipoRegistro,
  onCambiarTipoRegistro,
  enfoqueTipo = 0,
  enfoqueCasillas = 0,
  onIrACasillas,
  detalle = null,
}) {
  const primeraCasillaRef = useRef(null)
  const nombreFiltro = ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === filtro)?.nombre
  const indicaciones = {
    registrado: 'Enter sobre una especialidad asigna el siguiente turno.',
    recibido: 'Enter sobre una especialidad recibe su siguiente turno pendiente.',
    en_clinica: 'Enter sobre una especialidad elige su turno pendiente; luego pulse una clínica.',
    devuelto: 'Enter sobre una especialidad devuelve su siguiente turno en clínica.',
    archivo: 'Enter sobre una especialidad envía su siguiente turno devuelto al archivo.',
  }
  const hint = nombreFiltro
    ? `Modo ${nombreFiltro}: ${indicaciones[filtro]}`
    : 'Elija una etapa. Use ↑/↓ entre especialidades y Enter para ejecutar.'
  const primerVacio = filas
    .flatMap((fila) =>
      fila.slots
        .filter((slot) => !slot.turno)
        .map((slot) => ({
          especialidadId: fila.id,
          codigo: fila.codigo,
          numero: slot.numero,
        })),
    )
    .at(0)

  useEffect(() => {
    if (enfoqueCasillas === 0) return
    const casilla = primeraCasillaRef.current
    if (!casilla) return
    casilla.focus()
    casilla.scrollIntoView?.({ block: 'nearest' })
  }, [enfoqueCasillas])

  function manejarTeclaEspecialidad(evento, fila) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      evento.stopPropagation()
      onActivarEspecialidad?.(fila.id, fila.codigo)
      return
    }

    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return

    evento.preventDefault()
    evento.stopPropagation()
    const cabeceras = Array.from(
      evento.currentTarget
        .closest('section')
        ?.querySelectorAll('[data-especialidad-header="true"]') ?? [],
    )
    const indice = cabeceras.indexOf(evento.currentTarget)
    const destino = cabeceras[indice + (evento.key === 'ArrowDown' ? 1 : -1)]
    destino?.focus()
    destino?.scrollIntoView?.({ block: 'nearest' })
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card">
      <div className="border-b border-outline-variant p-4">{detalle}</div>

      {filtro === 'registrado' && (
        <div
          data-testid="opciones-registro"
          className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-2"
        >
          <span className="text-label-sm font-semibold text-on-surface-variant">
            Tipo de nuevo registro:
          </span>
          <SelectorTipoRegistro
            valor={tipoRegistro}
            onCambiar={onCambiarTipoRegistro}
            etiqueta="Tipo de nuevo registro"
            focusToken={enfoqueTipo}
            onSaltarACasillas={onIrACasillas}
          />
          <span className="text-label-sm text-on-surface-variant">
            Opcional · si no elige, el turno solo se registra
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-outline-variant px-4 py-2 text-label-sm text-on-surface-variant">
        <span>{hint}</span>
        <span className="flex flex-wrap items-center gap-3">
          {ETAPAS_SEGUIMIENTO.map((etapa) => (
            <span key={etapa.id} className="inline-flex items-center gap-1.5">
              <i
                className={`h-2 w-2 rounded-sm ${estiloDeEtapa(etapa.id).punto}`}
                aria-hidden="true"
              />
              {etapa.nombre}
            </span>
          ))}
        </span>
      </div>

      <div className="space-y-2 p-4">
        {filas.length === 0 ? (
          <EmptyState title="Sin resultados" description="No hay especialidades para mostrar." />
        ) : (
          filas.map((fila) => (
            <div key={fila.id} className="grid gap-2 md:grid-cols-[165px_minmax(0,1fr)]">
              <button
                type="button"
                data-especialidad-header="true"
                data-especialidad-id={fila.id}
                aria-label={`${fila.nombre}. ${fila.registrados} de ${fila.maximo} registrados. Presione Enter para ejecutar el siguiente paso.`}
                onKeyDown={(evento) => manejarTeclaEspecialidad(evento, fila)}
                className={`flex w-full flex-col justify-center rounded-lg border border-l-4 px-3 py-1.5 text-left transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                  String(especialidadActivaId) === String(fila.id)
                    ? 'border-primary-container border-l-primary bg-secondary-fixed/30 ring-1 ring-primary-container/40'
                    : 'border-outline-variant border-l-primary bg-surface-container-low'
                }`}
              >
                <span className="text-label-md text-on-surface">{fila.nombre}</span>
                <span className="text-label-sm text-on-surface-variant">
                  {fila.registrados} / {fila.maximo} registrados · Enter
                </span>
              </button>

              <div className="flex flex-wrap content-start gap-1">
                {fila.slots.map(({ numero, turno }) => (
                  <CasillaTurno
                    key={numero}
                    especialidadId={fila.id}
                    codigo={fila.codigo}
                    numero={numero}
                    turno={turno}
                    filtro={filtro}
                    seleccionada={seleccionId === `${fila.id}-${numero}`}
                    onSeleccionar={onSeleccionar}
                    casillaRef={
                      primerVacio?.especialidadId === fila.id && primerVacio?.numero === numero
                        ? primeraCasillaRef
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
