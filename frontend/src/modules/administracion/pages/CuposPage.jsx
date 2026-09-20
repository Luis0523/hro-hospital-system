import { useState } from 'react'
import Icon from '@/shared/components/ui/Icon.jsx'
import MedicosTab from '../components/MedicosTab.jsx'
import ProgramacionTab from '../components/ProgramacionTab.jsx'

const PESTANAS = [
  { id: 'medicos', etiqueta: 'Médicos', icono: 'medical_services' },
  { id: 'programacion', etiqueta: 'Programación y capacidad', icono: 'event_available' },
]

export default function CuposPage() {
  const [pestana, setPestana] = useState('medicos')

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Cupos y capacidad</h2>
        <p className="text-sm text-slate-500">
          Configuración de médicos y de su programación por subespecialidad (día, horario y
          capacidad). La disponibilidad diaria la calcula el sistema.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Médicos y programación"
        className="flex flex-wrap gap-1 border-b border-slate-200"
      >
        {PESTANAS.map((item) => {
          const activa = item.id === pestana
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={activa}
              aria-controls={`panel-${item.id}`}
              onClick={() => setPestana(item.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                activa
                  ? 'border-hro-blue text-hro-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon name={item.icono} className="text-[18px]" />
              {item.etiqueta}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`}>
        {pestana === 'medicos' && <MedicosTab />}
        {pestana === 'programacion' && <ProgramacionTab />}
      </div>
    </section>
  )
}
