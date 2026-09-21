import { useRef, useState } from 'react'
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
  const tabsRef = useRef([])

  const manejarTeclado = (evento) => {
    const indiceActual = PESTANAS.findIndex((item) => item.id === pestana)
    let siguiente = null

    if (evento.key === 'ArrowRight') siguiente = (indiceActual + 1) % PESTANAS.length
    else if (evento.key === 'ArrowLeft')
      siguiente = (indiceActual - 1 + PESTANAS.length) % PESTANAS.length
    else if (evento.key === 'Home') siguiente = 0
    else if (evento.key === 'End') siguiente = PESTANAS.length - 1

    if (siguiente === null) return
    evento.preventDefault()
    setPestana(PESTANAS[siguiente].id)
    tabsRef.current[siguiente]?.focus()
  }

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
        onKeyDown={manejarTeclado}
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {PESTANAS.map((item, indice) => {
          const activa = item.id === pestana
          return (
            <button
              key={item.id}
              ref={(nodo) => {
                tabsRef.current[indice] = nodo
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={activa}
              aria-controls="panel-catalogos"
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
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

      <div role="tabpanel" id="panel-catalogos" aria-labelledby={`tab-${pestana}`}>
        {pestana === 'especialidades' && <EspecialidadesTab />}
        {pestana === 'subespecialidades' && <SubespecialidadesTab />}
        {pestana === 'espacios' && <EspaciosFisicosTab />}
      </div>
    </section>
  )
}
