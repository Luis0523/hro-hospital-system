import Icon from '@/shared/components/ui/Icon.jsx'
import { aIso, hoyIso } from '@/shared/utils/fecha'

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

export default function CalendarioMensual({
  mes,
  dias = [],
  seleccionada,
  onSeleccionar,
  onCambiarMes,
  onHoy,
}) {
  const hoy = hoyIso()
  const porFecha = new Map(dias.map((dia) => [dia.fecha, dia]))

  const anio = mes.getFullYear()
  const mesIdx = mes.getMonth()
  const primerDia = new Date(anio, mesIdx, 1)
  const totalDias = new Date(anio, mesIdx + 1, 0).getDate()
  const desfase = (primerDia.getDay() + 6) % 7

  const celdas = Array.from({ length: desfase }, () => null)
  for (let dia = 1; dia <= totalDias; dia += 1) {
    const fecha = aIso(new Date(anio, mesIdx, dia))
    celdas.push({ dia, info: porFecha.get(fecha) ?? { fecha } })
  }
  while (celdas.length % 7 !== 0) celdas.push(null)

  function estilo(info) {
    if (!info || info.noLaborable) {
      return 'bg-surface-container/50 text-on-surface-variant'
    }
    if (info.fecha === seleccionada) {
      return 'bg-primary text-on-primary shadow-md scale-[1.02] z-10'
    }
    if (info.disponible) {
      return 'bg-secondary-fixed/30 text-on-surface hover:bg-secondary-fixed/50 shadow-card'
    }
    return 'bg-surface-container-low text-on-surface hover:bg-surface-container'
  }

  function etiqueta(info) {
    if (!info) return ''
    if (info.noLaborable) return 'Guardia'
    if (info.fecha === seleccionada) return `${info.cuposDisponibles ?? 0} cupos activos`
    if (info.disponible) return `${info.cuposDisponibles} cupos`
    return 'Sin cupo'
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => onCambiarMes(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-card hover:bg-surface-variant active:scale-95"
            >
              <Icon name="chevron_left" className="text-[20px]" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => onCambiarMes(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-card hover:bg-surface-variant active:scale-95"
            >
              <Icon name="chevron_right" className="text-[20px]" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-headline-lg uppercase tracking-tight text-on-surface">
              {MESES[mesIdx]} {anio}
            </h2>
            <span className="text-label-sm uppercase text-on-surface-variant">
              Periodo ordinario
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHoy}
            className="flex h-8 items-center rounded-lg bg-surface-container-lowest px-3 text-title-sm text-primary shadow-card transition hover:bg-surface-container-high"
          >
            Ir a hoy
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1 text-label-sm text-on-surface-variant shadow-card">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-container" />
            Disponible
            <span className="ml-2 h-2.5 w-2.5 rounded-full bg-on-error-container" />
            Sin cupo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 rounded-lg bg-surface-container-low py-1 text-center text-title-sm uppercase tracking-wider text-on-surface-variant">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="py-1">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((celda, indice) => {
          if (!celda) {
            return (
              <div
                key={`vacio-${indice}`}
                className="min-h-[92px] rounded-lg bg-surface-container-low/50 opacity-40"
              />
            )
          }

          const { info, dia } = celda
          const esHoy = info.fecha === hoy
          const habilitada = !info.noLaborable

          return (
            <button
              key={info.fecha}
              type="button"
              disabled={!habilitada}
              onClick={() => onSeleccionar(info)}
              className={`flex min-h-[92px] flex-col justify-between rounded-lg p-2 text-left transition-all ${estilo(
                info,
              )} ${habilitada ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span
                    className={info.fecha === seleccionada ? 'text-headline-md' : 'text-title-md'}
                  >
                    {String(dia).padStart(2, '0')}
                  </span>
                  {esHoy && (
                    <span
                      className={`rounded px-1 text-label-sm font-bold ${
                        info.fecha === seleccionada
                          ? 'bg-on-primary text-primary'
                          : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      HOY
                    </span>
                  )}
                </span>
                {!info.noLaborable && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      info.disponible ? 'bg-secondary-container' : 'bg-error'
                    }`}
                  />
                )}
              </div>
              {etiqueta(info) && (
                <span
                  className={`rounded px-1.5 py-0.5 text-center text-label-sm font-bold ${
                    info.noLaborable
                      ? 'text-outline'
                      : info.fecha === seleccionada
                        ? 'bg-primary-container text-on-primary'
                        : info.disponible
                          ? 'bg-secondary-fixed-dim/40 text-on-secondary-container'
                          : 'bg-error-container/60 text-on-error-container'
                  }`}
                >
                  {etiqueta(info)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
