import Icon from '@/shared/components/ui/Icon.jsx'

// Resumen operativo del día adaptado al flujo Pendientes ↔ Localizados.
//
// No representa los estados históricos del expediente (pendiente_localizar,
// en_busqueda, etc.): esos metadatos siguen en `estadosExpediente.js` para la
// integración futura, pero esta interfaz solo distingue lo que el operador ya
// marcó como localizado durante la sesión.

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
    color: 'bg-amber-100 text-amber-800',
  },
  {
    clave: 'localizados',
    etiqueta: 'Localizados',
    icono: 'check_circle',
    color: 'bg-emerald-100 text-emerald-800',
  },
]

export default function ResumenEstados({ total = 0, pendientes = 0, localizados = 0 }) {
  const valores = { total, pendientes, localizados }

  return (
    <section
      aria-label="Resumen del día"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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
