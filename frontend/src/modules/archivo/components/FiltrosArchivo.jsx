import { Input, Select } from '@/shared/components/ui'

export default function FiltrosArchivo({
  fecha,
  onFecha,
  clinicaId,
  onClinica,
  medicoId,
  onMedico,
  clinicas = [],
  medicos = [],
}) {
  const opcionesClinicas = [
    { value: '', label: 'Todas las clínicas' },
    ...clinicas.map((clinica) => ({ value: clinica.id, label: clinica.nombre })),
  ]

  const opcionesMedicos = [
    { value: '', label: 'Todos los médicos' },
    ...medicos.map((medico) => ({ value: medico.id, label: medico.nombre })),
  ]

  return (
    <section
      aria-label="Filtros de expedientes"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Fecha de consulta"
          name="fecha"
          type="date"
          value={fecha}
          onChange={(event) => onFecha(event.target.value)}
        />
        <Select
          label="Clínica"
          value={clinicaId}
          onChange={onClinica}
          options={opcionesClinicas}
          placeholder="Todas las clínicas"
        />
        <Select
          label="Médico"
          value={medicoId}
          onChange={onMedico}
          options={opcionesMedicos}
          placeholder="Todos los médicos"
        />
      </div>
    </section>
  )
}
