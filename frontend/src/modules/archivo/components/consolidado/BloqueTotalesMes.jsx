import { Card, Icon } from '@/shared/components/ui'
import BarraEspecialidad from './BarraEspecialidad.jsx'
import {
  calcularTotalInforme,
  maximoPorEspecialidad,
  ordenarPorTotal,
  totalPorEspecialidad,
} from '../../utils/metricasConsolidado'

// Bloque de cierre del consolidado mensual: acumulados del rango y resumen.
// Los campos que el sistema aún no captura (Tarjetas Índice, Sobres numerados)
// se muestran como "pendiente de captura"; no se inventan.
export default function BloqueTotalesMes({ totales = {}, informe = [] }) {
  const porEspecialidad = ordenarPorTotal(totales.porEspecialidad ?? [])
  const maximo = maximoPorEspecialidad(porEspecialidad)
  const totalGeneral = totalPorEspecialidad(porEspecialidad)
  const trabajoCapturado = informe.reduce(
    (total, fila) => total + calcularTotalInforme({ hdc: fila.hdc, hd: fila.hd }),
    0,
  )

  const tarjetas = [
    {
      clave: 'carnets',
      etiqueta: 'Total de carnets',
      valor: totales.totalCarnets ?? 0,
      icono: 'folder_managed',
    },
    {
      clave: 'depurados',
      etiqueta: 'Total depurados',
      valor: totales.totalDepurados ?? 0,
      icono: 'delete_sweep',
    },
    {
      clave: 'trabajo',
      etiqueta: 'Trabajo contabilizado (capturado)',
      valor: trabajoCapturado,
      icono: 'summarize',
    },
  ]

  const pendientes = [
    { clave: 'ti-archivadas', etiqueta: 'Tarjetas Índice archivadas', icono: 'style' },
    { clave: 'ti-depuradas', etiqueta: 'Tarjetas Índice depuradas', icono: 'style' },
    { clave: 'sobres', etiqueta: 'Sobres numerados', icono: 'mail' },
  ]

  return (
    <section className="space-y-4">
      <h3 className="text-title-md text-on-surface">Totales del mes</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <Card key={tarjeta.clave} className="flex items-center gap-3">
            <Icon name={tarjeta.icono} className="text-[24px] text-primary" />
            <div>
              <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
                {tarjeta.etiqueta}
              </p>
              <p className="text-metric-sub text-on-surface">{tarjeta.valor}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {pendientes.map((tarjeta) => (
          <Card key={tarjeta.clave} className="space-y-1">
            <p className="flex items-center gap-2 text-label-md uppercase tracking-wide text-on-surface-variant">
              <Icon name={tarjeta.icono} className="text-[18px]" />
              {tarjeta.etiqueta}
            </p>
            <p className="text-body-sm text-on-surface-variant">Pendiente de captura</p>
          </Card>
        ))}
      </div>

      {porEspecialidad.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-title-sm text-on-surface">Acumulado por especialidad</h4>
          <ul className="space-y-3">
            {porEspecialidad.map((item) => (
              <BarraEspecialidad
                key={item.especialidadId ?? item.especialidadNombre}
                etiqueta={item.especialidadNombre}
                total={item.total ?? 0}
                maximo={maximo}
                totalGeneral={totalGeneral}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
