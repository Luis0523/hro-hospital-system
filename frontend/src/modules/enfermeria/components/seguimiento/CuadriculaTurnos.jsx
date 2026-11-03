import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/shared/components/ui'
import { ETAPAS_SEGUIMIENTO, ETAPA_PREVIA } from '../../api/seguimientoApi'
import { estiloRegistro, etiquetaRegistro } from './estilosEtapas'

const SIMBOLOS = {
  registrado: '✓',
  en_clinica: '→',
  devuelto: '↩',
  archivo: '🗀',
}

const ESTILOS_CELDA = {
  registrado:
    'border-amber-600 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-500/25 dark:text-amber-100',
  en_clinica:
    'border-violet-600 bg-violet-100 text-violet-950 dark:border-violet-400 dark:bg-violet-500/25 dark:text-violet-100',
  devuelto:
    'border-rose-600 bg-rose-100 text-rose-950 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100',
  archivo:
    'border-emerald-600 bg-emerald-100 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-100',
  libre: 'border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant',
}

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

function columnasPara(total) {
  if (total > 100) return 13
  if (total > 16) return 10
  return 8
}

function rangosPara(maximo) {
  const tamanos = [20, 40, 60, 80, 100, 120, 150, 200]
  const tamano = tamanos.find((limite) => maximo <= limite) ?? Math.max(maximo, 1)
  const rangos = []
  for (let inicio = 1; inicio <= maximo; inicio += tamano) {
    rangos.push({ inicio, fin: Math.min(inicio + tamano - 1, maximo) })
  }
  return rangos
}

function CasillaTurno({ fila, numero, turno, filtro, seleccionada, onSeleccionar }) {
  const etapa = turno?.etapa ?? null
  const estilo = ESTILOS_CELDA[etapa] ?? ESTILOS_CELDA.libre
  const marca = etiquetaRegistro(turno)
  const nombreEtapa = turno
    ? ETAPAS_SEGUIMIENTO.find((item) => item.id === turno.etapa)?.nombre
    : null
  const etapaObjetivo = filtro ? ETAPA_PREVIA[filtro] : null
  const atenuada =
    Boolean(filtro) &&
    filtro !== 'registrado' &&
    (!turno || (turno.etapa !== etapaObjetivo && turno.etapa !== filtro))

  return (
    <button
      type="button"
      data-numero={numero}
      aria-label={`${etiquetaTurno(fila.codigo, numero)}, ${nombreEtapa ?? 'sin registro'}${
        marca ? `, ${marca}` : ''
      }`}
      aria-pressed={seleccionada}
      onClick={(evento) =>
        onSeleccionar(fila.id, fila.codigo, numero, { puntero: evento.detail > 0 })
      }
      className={`relative flex h-full min-h-12 w-full min-w-12 items-center justify-center rounded-md border-2 text-lg font-black tabular-nums transition touch-manipulation select-none focus-visible:z-20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95 dark:focus-visible:outline-indigo-400 ${estilo} ${estiloRegistro(
        turno,
      )} ${
        seleccionada
          ? 'z-10 outline outline-4 outline-offset-2 outline-indigo-600 ring-2 ring-indigo-500/60 dark:outline-indigo-400'
          : ''
      } ${atenuada ? 'opacity-30' : ''}`}
    >
      <span>{numero}</span>
      {etapa && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-0.5 text-[11px] leading-none opacity-80"
        >
          {SIMBOLOS[etapa]}
        </span>
      )}
      {marca && (
        <span
          aria-hidden="true"
          className="absolute bottom-0.5 left-1 text-[9px] font-bold uppercase leading-none opacity-80"
        >
          {turno?.tipoRegistro === 'presentacion' ? 'P' : 'PL'}
        </span>
      )}
    </button>
  )
}

// Cuadrícula de la especialidad seleccionada. Calcula las columnas para que
// los 130 turnos de Medicina Interna quepan sin scroll en 1024×768.
export default function CuadriculaTurnos({ fila, filtro, seleccionId, onSeleccionar }) {
  const [rangoInicio, setRangoInicio] = useState(null)
  const [numeroDirecto, setNumeroDirecto] = useState('')

  useEffect(() => {
    setRangoInicio(null)
    setNumeroDirecto('')
  }, [fila?.id])

  const rangos = useMemo(() => rangosPara(fila?.maximo ?? 0), [fila?.maximo])
  const columnas = columnasPara(fila?.maximo ?? 0)
  const slots = useMemo(() => {
    if (!fila) return []
    if (rangoInicio == null) return fila.slots
    const rango = rangos.find((item) => item.inicio === rangoInicio)
    if (!rango) return fila.slots
    return fila.slots.filter((slot) => slot.numero >= rango.inicio && slot.numero <= rango.fin)
  }, [fila, rangoInicio, rangos])
  const filasGrilla = Math.max(1, Math.ceil(slots.length / columnas))

  function irANumero(evento) {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    const numero = Number(numeroDirecto)
    if (!Number.isInteger(numero) || numero < 1 || numero > (fila?.maximo ?? 0)) return
    onSeleccionar(fila.id, fila.codigo, numero)
    setNumeroDirecto('')
  }

  if (!fila) {
    return (
      <section className="flex min-h-0 items-center justify-center p-6 text-body-md text-on-surface-variant">
        Seleccione una especialidad para ver sus turnos.
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-surface">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-outline-variant px-3 py-1.5">
        <h2 className="min-w-0 truncate text-headline-sm font-bold text-on-surface">
          {fila.nombre} <span className="text-on-surface-variant">·</span>{' '}
          <span className="tabular-nums">
            {fila.registrados}/{fila.maximo}
          </span>
        </h2>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
            Rango
          </span>
          <button
            type="button"
            onClick={() => setRangoInicio(null)}
            aria-pressed={rangoInicio === null}
            className={`min-h-9 rounded-md border px-2 text-label-sm font-semibold transition touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
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
              className={`min-h-9 rounded-md border px-2 text-label-sm font-semibold tabular-nums transition touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                rangoInicio === rango.inicio
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary'
              }`}
            >
              {rango.inicio}–{rango.fin}
            </button>
          ))}
          <label className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-lowest px-2">
            <Icon name="tag" className="text-[16px] text-on-surface-variant" />
            <span className="sr-only">Número de turno</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={fila.maximo}
              value={numeroDirecto}
              onChange={(evento) => setNumeroDirecto(evento.target.value)}
              onKeyDown={irANumero}
              placeholder="Ir a…"
              className="h-9 w-16 bg-transparent text-label-md font-semibold tabular-nums text-on-surface outline-none placeholder:text-on-surface-variant"
            />
          </label>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-2">
        <div
          role="grid"
          aria-label={`Turnos de ${fila.nombre}`}
          className="grid h-full w-full gap-1"
          style={{
            maxWidth: `${columnas * 90 + (columnas - 1) * 4}px`,
            gridTemplateColumns: `repeat(${columnas}, minmax(48px, 1fr))`,
            gridTemplateRows: `repeat(${filasGrilla}, minmax(48px, 1fr))`,
          }}
        >
          {slots.map(({ numero, turno }) => (
            <CasillaTurno
              key={numero}
              fila={fila}
              numero={numero}
              turno={turno}
              filtro={filtro}
              seleccionada={seleccionId === `${fila.id}-${numero}`}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
