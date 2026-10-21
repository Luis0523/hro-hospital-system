import Icon from '@/shared/components/ui/Icon.jsx'

const METRICAS = [
  {
    clave: 'pendientes',
    etiqueta: 'Pendientes',
    detalle: 'Llamados o no respondidos',
    icono: 'assignment',
    clases:
      'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
  },
  {
    clave: 'enEspera',
    etiqueta: 'En espera',
    detalle: 'Aún no llamados',
    icono: 'schedule',
    clases:
      'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100',
  },
  {
    clave: 'atendidos',
    etiqueta: 'Atendidos',
    detalle: 'Consulta completada',
    icono: 'check_circle',
    clases:
      'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100',
  },
]

const VACIO = { pendientes: 0, enEspera: 0, atendidos: 0, total: 0 }

export default function ResumenJornada({ estadisticas = VACIO }) {
  const datos = { ...VACIO, ...estadisticas }

  return (
    <section aria-labelledby="resumen-jornada" className="space-y-3">
      <div>
        <h2 id="resumen-jornada" className="text-headline-sm text-on-surface">
          Resumen de la jornada
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
          Calculado con los turnos ficticios de esta pestaña.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-live="polite">
        {METRICAS.map((metrica) => (
          <div
            key={metrica.clave}
            data-testid={`metrica-${metrica.clave}`}
            className={`rounded-xl border p-3 text-center shadow-card sm:p-4 ${metrica.clases}`}
          >
            <Icon name={metrica.icono} className="text-2xl" />
            <p className="mt-1 text-metric-display" data-testid={`valor-${metrica.clave}`}>
              {datos[metrica.clave]}
            </p>
            <p className="text-sm font-semibold">{metrica.etiqueta}</p>
            <p className="mt-1 hidden text-sm leading-tight sm:block">{metrica.detalle}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-on-surface-variant">
        Pendientes incluye turnos llamados o marcados como no respondidos. En espera incluye turnos
        aún no llamados. Atendidos incluye consultas completadas.
      </p>
    </section>
  )
}
