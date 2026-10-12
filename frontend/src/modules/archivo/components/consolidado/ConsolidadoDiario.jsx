import { Card, EmptyState, Icon } from '@/shared/components/ui'
import BarraEspecialidad from './BarraEspecialidad.jsx'
import {
  maximoPorEspecialidad,
  ordenarPorTotal,
  totalPorEspecialidad,
} from '../../utils/metricasConsolidado'

// Consolidado diario: total del día + sumatoria por especialidad. Presentacional.
export default function ConsolidadoDiario({ consolidado }) {
  if (!consolidado) return null

  const porEspecialidad = ordenarPorTotal(consolidado.porEspecialidad ?? [])
  const total = consolidado.total ?? totalPorEspecialidad(porEspecialidad)
  const maximo = maximoPorEspecialidad(porEspecialidad)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-3">
          <Icon name="folder_managed" className="text-[26px] text-primary" />
          <div>
            <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
              Total del día
            </p>
            <p className="text-metric-sub text-on-surface">{total}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <Icon name="delete_sweep" className="text-[26px] text-error" />
          <div>
            <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
              Depurados del día
            </p>
            <p className="text-metric-sub text-error">{consolidado.totalDepurados ?? 0}</p>
          </div>
        </Card>
      </div>

      {porEspecialidad.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="No hay carnets registrados para la fecha seleccionada."
        />
      ) : (
        <ul className="space-y-3">
          {porEspecialidad.map((item) => (
            <BarraEspecialidad
              key={item.especialidadId ?? item.especialidadNombre}
              etiqueta={item.especialidadNombre}
              total={item.total ?? 0}
              maximo={maximo}
              totalGeneral={total}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
