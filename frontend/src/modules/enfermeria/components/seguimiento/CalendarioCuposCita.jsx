import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { aIso, formatearFechaLarga, hoyIso } from '@/shared/utils/fecha'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function inicioDeSemana(fecha) {
  const inicio = new Date(fecha)
  const desfase = (inicio.getDay() + 6) % 7
  inicio.setDate(inicio.getDate() - desfase)
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

export function rangoDePeriodo(vista, cursor) {
  if (vista === 'semana') {
    const inicio = inicioDeSemana(cursor)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + 6)
    return { inicio, fin, fechaInicio: aIso(inicio), fechaFin: aIso(fin) }
  }

  const inicio = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const fin = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  return { inicio, fin, fechaInicio: aIso(inicio), fechaFin: aIso(fin) }
}

function etiquetaPeriodo(vista, cursor) {
  if (vista === 'semana') {
    const { inicio, fin } = rangoDePeriodo(vista, cursor)
    const mismoMes = inicio.getMonth() === fin.getMonth()
    const desde = `${inicio.getDate()} ${mismoMes ? '' : `${MESES[inicio.getMonth()]} `}`
    return `Semana del ${desde}al ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`
  }
  return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
}

function celdasDelPeriodo(vista, cursor) {
  if (vista === 'semana') {
    const inicio = inicioDeSemana(cursor)
    return Array.from({ length: 7 }, (_, indice) => {
      const fecha = new Date(inicio)
      fecha.setDate(fecha.getDate() + indice)
      return { fecha: aIso(fecha), dia: fecha.getDate() }
    })
  }

  const anio = cursor.getFullYear()
  const mes = cursor.getMonth()
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7
  const total = new Date(anio, mes + 1, 0).getDate()
  return [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: total }, (_, indice) => {
      const dia = indice + 1
      const fecha = new Date(anio, mes, dia)
      return { fecha: aIso(fecha), dia }
    }),
  ]
}

export default function CalendarioCuposCita({
  vista,
  cursor,
  dias = [],
  fechaSeleccionada,
  cargando = false,
  onCambiarVista,
  onNavegar,
  onMesActual,
  onSeleccionar,
}) {
  const hoy = hoyIso()
  const porFecha = new Map(dias.map((dia) => [dia.fecha, dia]))
  const celdas = celdasDelPeriodo(vista, cursor)

  function infoDe(fecha) {
    return (
      porFecha.get(fecha) ?? {
        fecha,
        capacidadMaxima: 0,
        cuposDisponibles: 0,
        disponible: false,
        noLaborable: false,
      }
    )
  }

  function estadoDe(info) {
    const pasado = info.fecha < hoy
    const seleccionado = info.fecha === fechaSeleccionada
    const tieneAgenda = (info.capacidadMaxima ?? 0) > 0 && !info.noLaborable
    const disponible =
      !pasado && !info.noLaborable && (info.cuposDisponibles ?? 0) > 0 && info.disponible !== false

    if (seleccionado) {
      return {
        disponible,
        etiqueta: `${info.cuposDisponibles ?? 0} cupos`,
        clase:
          'border-primary bg-primary text-on-primary shadow-md ring-2 ring-primary/30 scale-[1.01]',
      }
    }
    if (pasado) {
      return {
        disponible: false,
        etiqueta: tieneAgenda ? 'Fecha pasada' : 'Sin atención',
        clase:
          'border-outline-variant/50 bg-surface-container/40 text-on-surface-variant opacity-50',
      }
    }
    if (disponible) {
      return {
        disponible: true,
        etiqueta: `${info.cuposDisponibles} cupos`,
        clase:
          'border-primary/40 bg-primary-container/15 text-on-surface hover:border-primary hover:bg-primary-container/25',
      }
    }
    if (tieneAgenda) {
      return {
        disponible: false,
        etiqueta: 'Lleno',
        clase: 'border-error/30 bg-error-container/25 text-on-error-container',
      }
    }
    return {
      disponible: false,
      etiqueta: 'Sin atención',
      clase: 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Periodo anterior"
            onClick={() => onNavegar(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-on-surface transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name="chevron_left" className="text-[20px]" />
          </button>
          <button
            type="button"
            aria-label="Periodo siguiente"
            onClick={() => onNavegar(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-on-surface transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name="chevron_right" className="text-[20px]" />
          </button>
          <h3 className="ml-2 text-headline-sm text-on-surface">
            {etiquetaPeriodo(vista, cursor)}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={vista === 'semana'}
            onClick={() => onCambiarVista('semana')}
            className={`rounded-lg px-3 py-1.5 text-label-md font-semibold transition ${
              vista === 'semana'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            aria-pressed={vista === 'mes'}
            onClick={() => onCambiarVista('mes')}
            className={`rounded-lg px-3 py-1.5 text-label-md font-semibold transition ${
              vista === 'mes'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={onMesActual}
            className="rounded-lg bg-surface-container-low px-3 py-1.5 text-label-md font-semibold text-primary transition hover:bg-surface-container"
          >
            Mes actual
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Con cupos
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-error" />
          Lleno
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
          Sin atención
        </span>
      </div>

      {vista === 'mes' && (
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          {DIAS_SEMANA.map((dia) => (
            <span key={dia} className="py-1">
              {dia}
            </span>
          ))}
        </div>
      )}

      {cargando ? (
        <Spinner label="Consultando cupos disponibles..." />
      ) : vista === 'semana' ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-7">
          {celdas.map((celda) => {
            const info = infoDe(celda.fecha)
            const estado = estadoDe(info)
            return (
              <button
                key={celda.fecha}
                type="button"
                disabled={!estado.disponible}
                onClick={() => onSeleccionar(celda.fecha)}
                aria-pressed={celda.fecha === fechaSeleccionada}
                aria-label={`${formatearFechaLarga(celda.fecha)} · ${estado.etiqueta}`}
                className={`flex min-h-[128px] flex-col justify-between rounded-xl border p-3 text-left transition ${estado.clase}`}
              >
                <span className="text-label-sm uppercase tracking-wider">
                  {DIAS_SEMANA[(new Date(`${celda.fecha}T00:00:00`).getDay() + 6) % 7]}
                </span>
                <span className="text-headline-md font-bold">{celda.dia}</span>
                <span className="rounded-md bg-surface-container-lowest/80 px-2 py-1 text-center text-label-sm font-semibold text-on-surface">
                  {estado.etiqueta}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((celda, indice) => {
            if (!celda) return <div key={`vacio-${indice}`} className="min-h-[84px]" />
            const info = infoDe(celda.fecha)
            const estado = estadoDe(info)
            const esHoy = celda.fecha === hoy
            return (
              <button
                key={celda.fecha}
                type="button"
                disabled={!estado.disponible}
                onClick={() => onSeleccionar(celda.fecha)}
                aria-pressed={celda.fecha === fechaSeleccionada}
                aria-current={esHoy ? 'date' : undefined}
                aria-label={`${formatearFechaLarga(celda.fecha)} · ${estado.etiqueta}`}
                className={`flex min-h-[84px] flex-col justify-between rounded-lg border p-2 text-left transition ${estado.clase}`}
              >
                <span className="flex items-center justify-between gap-1">
                  <span className="text-title-sm font-bold">
                    {String(celda.dia).padStart(2, '0')}
                  </span>
                  {esHoy && (
                    <span className="rounded bg-surface-container-high px-1 text-[9px] font-bold text-on-surface">
                      HOY
                    </span>
                  )}
                </span>
                <span className="rounded bg-surface-container-lowest/80 px-1 py-0.5 text-center text-[10px] font-semibold text-on-surface">
                  {estado.etiqueta}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
