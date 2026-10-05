import Icon from '@/shared/components/ui/Icon.jsx'
import Card from '@/shared/components/ui/Card.jsx'

// Conteo derivado del lote cargado (no del backend global). Fase 1 solo lectura.
const INDICADORES = [
  { clave: 'total', etiqueta: 'En el lote', icono: 'inventory_2' },
  { clave: 'pendientesRecibir', etiqueta: 'Pendientes de recibir', icono: 'local_shipping' },
  { clave: 'enUso', etiqueta: 'En uso', icono: 'check_circle' },
]

export default function ResumenLoteCoex({ total = 0, pendientesRecibir = 0, enUso = 0 }) {
  const valores = { total, pendientesRecibir, enUso }

  return (
    <Card as="section" className="p-4">
      <h2 className="mb-3 flex items-center gap-2 text-title-md text-on-surface">
        <Icon name="monitoring" className="text-[20px] text-primary" />
        Resumen del lote
      </h2>
      <ul className="flex flex-wrap gap-2">
        {INDICADORES.map((indicador) => (
          <li
            key={indicador.clave}
            className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-md text-on-surface"
          >
            <Icon name={indicador.icono} className="text-[16px] text-primary" />
            <span>{indicador.etiqueta}</span>
            <span className="font-bold">{valores[indicador.clave]}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
