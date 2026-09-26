import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import { nombreDia } from '../utils/dias.js'
import { desdeISO, diaSemanaISO, formatearFechaLarga } from '../utils/fechas.js'

/**
 * Listado de días no laborables en tarjetas compactas. Se usa en el panel
 * lateral estrecho del calendario, donde una tabla desbordaría y dejaría las
 * acciones fuera del área visible. Sin scroll horizontal.
 */
export default function ListaDiasNoLaborables({ dias = [], onVer, onHabilitar }) {
  if (dias.length === 0) {
    return (
      <EmptyState
        title="Mes sin días no laborables"
        description="No hay fechas bloqueadas en el mes que se está consultando."
      />
    )
  }

  return (
    <ul data-testid="lista-dias-no-laborables" className="space-y-3">
      {dias.map((dia) => {
        const { anio, mes, dia: numeroDia } = desdeISO(dia.fecha)
        return (
          <li key={dia.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{formatearFechaLarga(dia.fecha)}</p>
            <p className="text-xs text-slate-500">
              {nombreDia(diaSemanaISO(anio, mes, numeroDia))}
            </p>

            <p className="mt-2 break-words text-sm text-slate-700">{dia.motivo}</p>
            <p className="mt-1 break-words text-xs text-slate-500">
              Registrado por: {dia.creadoPorNombre || 'No disponible'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => onVer?.(dia)}>
                Ver
              </Button>
              <Button size="sm" variant="danger" onClick={() => onHabilitar?.(dia)}>
                Habilitar fecha
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
