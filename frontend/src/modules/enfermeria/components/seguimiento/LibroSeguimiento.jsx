import { useEffect, useRef, useState } from 'react'
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
  accesible = false,
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
      className={`relative rounded-md border font-bold transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
        accesible ? 'h-11 w-11 text-title-sm' : 'h-8 w-8 text-label-sm'
      } ${estilo.borde} ${estilo.fondo} ${estilo.texto} ${brillo} ${
        seleccionada
          ? 'z-10 outline outline-4 outline-offset-2 outline-indigo-600 ring-2 ring-indigo-500/60 dark:outline-indigo-400 dark:ring-indigo-400/50'
          : ''
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
  const [rangoInicio, setRangoInicio] = useState(null)
  const [accesible, setAccesible] = useState(() => {
    try {
      return localStorage.getItem('hro_seguimiento_accesible') === 'true'
    } catch {
      return false
    }
  })
  const nombreFiltro = ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === filtro)?.nombre
  const indicaciones = {
    registrado: 'Enter sobre una especialidad asigna el siguiente turno.',
    en_clinica:
      'Enter sobre una especialidad elige su turno; se usa la clínica ya asignada o la seleccionada.',
    devuelto: 'Enter sobre una especialidad devuelve su siguiente turno en clínica.',
    archivo: 'Enter sobre una especialidad envía su siguiente turno devuelto al archivo.',
  }
  const hint = nombreFiltro
    ? `Modo ${nombreFiltro}: ${indicaciones[filtro]}`
    : 'Elija una etapa. Use ↑/↓ entre especialidades y Enter para ejecutar.'
  useEffect(() => {
    try {
      localStorage.setItem('hro_seguimiento_accesible', String(accesible))
    } catch {
      // sin storage: se ignora
    }
  }, [accesible])

  const maximoGeneral = Math.max(0, ...filas.map((fila) => fila.maximo ?? 0))
  const tamanosRango = [20, 40, 60, 80, 100, 120, 150, 200]
  const rangoMaximo = tamanosRango.find((limite) => maximoGeneral <= limite) ?? maximoGeneral
  const rangos = []
  for (let inicio = 1; inicio <= maximoGeneral; inicio += rangoMaximo) {
    rangos.push({ inicio, fin: Math.min(inicio + rangoMaximo - 1, maximoGeneral) })
  }
  const rangoActivo = rangos.find((rango) => rango.inicio === rangoInicio) ?? null
  const filasVisibles = filas.map((fila) => ({
    ...fila,
    slots: rangoActivo
      ? fila.slots.filter(
          (slot) => slot.numero >= rangoActivo.inicio && slot.numero <= rangoActivo.fin,
        )
      : fila.slots,
  }))

  const primerVacio = filasVisibles
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
      onActivarEspecialidad?.(fila.id, fila.codigo, { tecla: evento.key })
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
    if (cabeceras.length === 0) return
    const indice = cabeceras.indexOf(evento.currentTarget)
    const delta = evento.key === 'ArrowDown' ? 1 : -1
    const siguiente = (indice + delta + cabeceras.length) % cabeceras.length
    const destino = cabeceras[siguiente]
    destino?.focus()
    destino?.scrollIntoView?.({ block: 'nearest' })
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card">
      <div className="border-b border-outline-variant p-4">{detalle}</div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
            Rango
          </span>
          <button
            type="button"
            onClick={() => setRangoInicio(null)}
            aria-pressed={rangoInicio === null}
            className={`rounded-md border px-2 py-1 text-label-sm font-semibold transition ${
              rangoInicio === null
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary'
            }`}
          >
            Todos
          </button>
          {rangos.map((rango) => (
            <button
              key={rango.inicio}
              type="button"
              onClick={() => setRangoInicio(rango.inicio)}
              aria-pressed={rangoInicio === rango.inicio}
              className={`rounded-md border px-2 py-1 text-label-sm font-semibold transition ${
                rangoInicio === rango.inicio
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary'
              }`}
            >
              {rango.inicio}–{rango.fin}
            </button>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-label-sm font-semibold text-on-surface">
          <input
            type="checkbox"
            checked={accesible}
            onChange={(evento) => setAccesible(evento.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Vista ampliada
        </label>
      </div>

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

      <div className="max-h-[58vh] space-y-2 overflow-y-auto overscroll-contain p-4 pr-3">
        {filasVisibles.length === 0 ? (
          <EmptyState title="Sin resultados" description="No hay especialidades para mostrar." />
        ) : (
          filasVisibles.map((fila) => (
            <div key={fila.id} className="grid gap-2 md:grid-cols-[190px_minmax(0,1fr)]">
              <button
                type="button"
                data-especialidad-header="true"
                data-especialidad-id={fila.id}
                aria-label={`${fila.nombre}. ${fila.registrados} de ${fila.maximo} registrados. Presione Enter para ejecutar el siguiente paso.`}
                onKeyDown={(evento) => manejarTeclaEspecialidad(evento, fila)}
                className={`flex w-full flex-col justify-center gap-0.5 rounded-lg border border-l-4 px-3 py-2 text-left transition hover:bg-surface-container focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400 ${
                  String(especialidadActivaId) === String(fila.id)
                    ? 'border-indigo-600 border-l-indigo-600 bg-indigo-500/20 ring-4 ring-indigo-500/60 shadow-popover dark:border-indigo-400 dark:border-l-indigo-400 dark:bg-indigo-500/25 dark:ring-indigo-400/60'
                    : 'border-outline-variant border-l-primary bg-surface-container-low'
                }`}
              >
                <span
                  className={
                    accesible
                      ? 'text-headline-md font-bold leading-tight text-on-surface'
                      : 'text-headline-sm font-bold leading-tight text-on-surface'
                  }
                >
                  {fila.nombre}
                </span>
                <span
                  className={
                    accesible
                      ? 'text-body-md text-on-surface-variant'
                      : 'text-body-sm text-on-surface-variant'
                  }
                >
                  {fila.registrados} / {fila.maximo} registrados · Enter
                </span>
              </button>

              <div
                className={
                  accesible
                    ? 'flex flex-wrap content-start gap-1.5'
                    : 'flex flex-wrap content-start gap-1'
                }
              >
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
                    accesible={accesible}
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
