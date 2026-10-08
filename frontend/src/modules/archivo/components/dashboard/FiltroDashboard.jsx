import { Input, Select } from '@/shared/components/ui'

// Barra de filtros del dashboard (rango de fechas + unidad/subespecialidad).
// Presentacional: recibe el estado y emite los cambios vía `onChange`.
export default function FiltroDashboard({ filtros, onChange, subespecialidades = [] }) {
  const opcionesUnidad = [
    { value: '', label: 'Todas las unidades' },
    ...subespecialidades.map((subespecialidad) => ({
      value: subespecialidad.id,
      label: subespecialidad.nombre,
    })),
  ]

  const actualizar = (parcial) => onChange({ ...filtros, ...parcial })

  return (
    <section
      aria-label="Filtros del dashboard"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Desde"
          name="desde"
          type="date"
          value={filtros.desde}
          onChange={(evento) => actualizar({ desde: evento.target.value })}
        />
        <Input
          label="Hasta"
          name="hasta"
          type="date"
          value={filtros.hasta}
          onChange={(evento) => actualizar({ hasta: evento.target.value })}
        />
        <Select
          label="Unidad / Subespecialidad"
          value={filtros.subespecialidadId}
          onChange={(valor) => actualizar({ subespecialidadId: valor })}
          options={opcionesUnidad}
          placeholder="Todas las unidades"
        />
      </div>
    </section>
  )
}
