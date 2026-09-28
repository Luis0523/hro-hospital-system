import { Input, Select } from '@/shared/components/ui'

export default function FiltrosArchivo({
  fecha,
  onFecha,
  subespecialidadId,
  onSubespecialidad,
  subespecialidades = [],
}) {
  const opcionesSubespecialidades = [
    { value: '', label: 'Todas las subespecialidades' },
    ...subespecialidades.map((subespecialidad) => ({
      value: subespecialidad.id,
      label: subespecialidad.nombre,
    })),
  ]

  return (
    <section
      aria-label="Filtros de expedientes"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Fecha de consulta"
          name="fecha"
          type="date"
          value={fecha}
          onChange={(event) => onFecha(event.target.value)}
        />
        <Select
          label="Subespecialidad"
          value={subespecialidadId}
          onChange={onSubespecialidad}
          options={opcionesSubespecialidades}
          placeholder="Todas las subespecialidades"
        />
      </div>
    </section>
  )
}
