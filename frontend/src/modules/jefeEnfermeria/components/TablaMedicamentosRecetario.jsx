import { useEffect, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Table from '@/shared/components/ui/Table.jsx'

const COLUMNAS = [
  { key: 'nombre', label: 'Medicamento' },
  { key: 'dosisViaFrecuencia', label: 'Dosis / Vía / Frecuencia' },
  { key: 'fechaHoraInicio', label: 'Fecha / Hora de inicio' },
  { key: 'cantidadSolicitada', label: 'Cantidad solicitada' },
  { key: 'cantidadDespachada', label: 'Cantidad despachada' },
  { key: 'acciones', label: 'Acciones' },
]

const ANCHO_TABLA = 1024

function useAnchoViewport() {
  const [ancho, setAncho] = useState(() => {
    if (typeof window === 'undefined') return 1920
    const valor = Number(window.innerWidth)
    return Number.isFinite(valor) && valor > 0 ? valor : 1920
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const actualizar = () => setAncho(window.innerWidth)
    window.addEventListener('resize', actualizar)
    return () => window.removeEventListener('resize', actualizar)
  }, [])

  return ancho
}

function valor(valor) {
  return valor == null || String(valor).trim() === '' ? '—' : valor
}

function fechaHora(valor) {
  if (!valor) return '—'
  return String(valor).replace('T', ' ')
}

function Acciones({ medicamento, onEditar, onEliminar }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEditar(medicamento)}
        aria-label={`Editar ${medicamento.nombre}`}
      >
        Editar
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => onEliminar(medicamento.id)}
        aria-label={`Eliminar ${medicamento.nombre}`}
      >
        Eliminar
      </Button>
    </div>
  )
}

function DosisViaFrecuencia({ medicamento }) {
  return (
    <div className="space-y-0.5">
      <p>{valor(medicamento.dosis)}</p>
      <p>{valor(medicamento.via)}</p>
      <p>{valor(medicamento.frecuencia)}</p>
    </div>
  )
}

function Campo({ etiqueta, valor: dato }) {
  return (
    <div>
      <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</dt>
      <dd className="text-body-sm text-on-surface">{valor(dato)}</dd>
    </div>
  )
}

function TarjetaMedicamento({ medicamento, onEditar, onEliminar }) {
  return (
    <article
      data-testid={`medicamento-${medicamento.id}`}
      className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <header>
        <p className="text-title-md font-semibold text-on-surface">{medicamento.nombre}</p>
      </header>

      <dl className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Dosis / Vía / Frecuencia
          </dt>
          <dd className="text-body-sm text-on-surface">
            <DosisViaFrecuencia medicamento={medicamento} />
          </dd>
        </div>
        <Campo etiqueta="Fecha / Hora de inicio" valor={fechaHora(medicamento.fechaHoraInicio)} />
        <Campo etiqueta="Cantidad solicitada" valor={medicamento.cantidadSolicitada} />
        <Campo etiqueta="Cantidad despachada" valor={medicamento.cantidadDespachada} />
      </dl>

      <div className="border-t border-outline-variant pt-3">
        <Acciones medicamento={medicamento} onEditar={onEditar} onEliminar={onEliminar} />
      </div>
    </article>
  )
}

export default function TablaMedicamentosRecetario({ medicamentos = [], onEditar, onEliminar }) {
  const ancho = useAnchoViewport()

  if (medicamentos.length === 0) {
    return <EmptyState title="Sin medicamentos agregados" />
  }

  if (ancho < ANCHO_TABLA) {
    return (
      <div data-testid="medicamentos-movil" className="space-y-3">
        {medicamentos.map((medicamento) => (
          <TarjetaMedicamento
            key={medicamento.id}
            medicamento={medicamento}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    )
  }

  function renderCelda(fila, clave) {
    if (clave === 'nombre') {
      return <p className="font-semibold text-on-surface">{fila.nombre}</p>
    }

    if (clave === 'dosisViaFrecuencia') {
      return <DosisViaFrecuencia medicamento={fila} />
    }

    if (clave === 'fechaHoraInicio') {
      return fechaHora(fila.fechaHoraInicio)
    }

    if (clave === 'acciones') {
      return <Acciones medicamento={fila} onEditar={onEditar} onEliminar={onEliminar} />
    }

    return valor(fila[clave])
  }

  return (
    <div data-testid="medicamentos-tabla">
      <Table
        columns={COLUMNAS}
        data={medicamentos}
        keyField="id"
        emptyMessage="Sin medicamentos agregados"
        renderCell={renderCelda}
      />
    </div>
  )
}
