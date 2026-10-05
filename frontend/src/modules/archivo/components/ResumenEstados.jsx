import Icon from '@/shared/components/ui/Icon.jsx'

// Resumen operativo del día derivado de la JORNADA REAL (no de un checklist
// local). Definiciones explícitas:
//   - Total: expedientes operativos de la jornada (con expedienteId).
//   - Pendientes: estadoActual en { sin_ciclo, pendiente_localizar, en_busqueda,
//     no_localizado } (aún no localizados).
//   - Localizados: estadoActual === 'localizado'.
// No se cuenta `en_transito_entrega` como localizado.

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
    clave: 'localizados',
    etiqueta: 'Localizados',
    icono: 'check_circle',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
]

export default function ResumenEstados({ total = 0, pendientes = 0, localizados = 0 }) {
  const valores = { total, pendientes, localizados }

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
