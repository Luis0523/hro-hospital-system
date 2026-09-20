import { useState } from 'react'
import Icon from '@/shared/components/ui/Icon.jsx'
import EspecialidadesTab from '../components/EspecialidadesTab.jsx'
import EspaciosFisicosTab from '../components/EspaciosFisicosTab.jsx'
import SubespecialidadesTab from '../components/SubespecialidadesTab.jsx'

const PESTANAS = [
  { id: 'especialidades', etiqueta: 'Especialidades', icono: 'medical_services' },
  { id: 'subespecialidades', etiqueta: 'Subespecialidades', icono: 'account_tree' },
  { id: 'espacios', etiqueta: 'Espacios físicos', icono: 'meeting_room' },
]

export default function ClinicasPage() {
  const [pestana, setPestana] = useState('especialidades')

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Clínicas</h2>
        <p className="text-sm text-slate-500">
          Gestión de especialidades, subespecialidades y espacios físicos del hospital.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Catálogos clínicos"
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
        {pestana === 'especialidades' && <EspecialidadesTab />}
        {pestana === 'subespecialidades' && <SubespecialidadesTab />}
        {pestana === 'espacios' && <EspaciosFisicosTab />}
      </div>
    </section>
  )
}
