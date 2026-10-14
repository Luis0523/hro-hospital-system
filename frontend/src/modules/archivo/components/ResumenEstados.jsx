import Icon from '@/shared/components/ui/Icon.jsx'

// Resumen operativo del día derivado de los carnets (no de un checklist local):
//   - Total: carnets del día.
//   - Pendientes: aún sin salida de archivo (registrado / no_localizado).
//   - Con salida: ya salieron de archivo (salida_archivo / salida_enfermeria / resguardado).

const INDICADORES = [
  {
    clave: 'total',
    etiqueta: 'Total del día',
    icono: 'inventory_2',
    color: 'bg-surface-container text-on-surface',
  },
  {
    clave: 'pendientes',
    etiqueta: 'Pendientes',
    icono: 'pending_actions',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  },
  {
    clave: 'conSalida',
    etiqueta: 'Con salida',
    icono: 'check_circle',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
]

export default function ResumenEstados({ total = 0, pendientes = 0, conSalida = 0 }) {
  const valores = { total, pendientes, conSalida }

  return (
    <section
      aria-label="Resumen del día"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <h2 className="mb-3 flex items-center gap-2 text-title-md text-on-surface">
        <Icon name="monitoring" className="text-[20px] text-primary" />
        Resumen del día
      </h2>

      <ul className="flex flex-wrap gap-2">
        {INDICADORES.map((indicador) => (
          <li
            key={indicador.clave}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-label-md ${indicador.color}`}
          >
            <Icon name={indicador.icono} className="text-[16px]" />
            <span>{indicador.etiqueta}</span>
            <span className="font-bold">{valores[indicador.clave]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
