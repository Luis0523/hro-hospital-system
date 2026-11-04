import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { formatearFechaHoraCorta } from '@/shared/utils/fecha'

function valor(valor) {
  return valor == null || String(valor).trim() === '' ? '—' : valor
}

function Campo({ etiqueta, valor: dato }) {
  return (
    <div className="min-w-0">
      <dt className="text-body-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</dt>
      <dd className="break-words text-title-sm text-on-surface">{valor(dato)}</dd>
    </div>
  )
}

function Acciones({ medicamento, onEditar, onEliminar, onDuplicar }) {
  return (
    <div className="flex items-center gap-1">
      {onDuplicar && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicar(medicamento)}
          aria-label={`Duplicar ${medicamento.nombre}`}
          title="Duplicar"
        >
          <Icon name="content_copy" className="text-[18px]" />
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEditar(medicamento)}
        aria-label={`Editar ${medicamento.nombre}`}
      >
        <Icon name="edit" className="text-[16px]" />
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEliminar(medicamento.id)}
        aria-label={`Eliminar ${medicamento.nombre}`}
        className="text-error hover:bg-error-container"
      >
        <Icon name="delete" className="text-[16px]" />
        Eliminar
      </Button>
    </div>
  )
}

export default function TablaMedicamentosRecetario({
  medicamentos = [],
  onEditar,
  onEliminar,
  onDuplicar,
}) {
  if (medicamentos.length === 0) {
    return (
      <EmptyState
        title="Sin medicamentos agregados"
        description="Agregue un medicamento nuevo o seleccione uno guardado."
      />
    )
  }

  return (
    <ul className="space-y-3" data-testid="medicamentos-lista">
      {medicamentos.map((medicamento) => (
        <li
          key={medicamento.id}
          data-testid={`medicamento-${medicamento.id}`}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-headline-sm text-on-surface">{medicamento.nombre}</p>
            </div>
            <Acciones
              medicamento={medicamento}
              onEditar={onEditar}
              onEliminar={onEliminar}
              onDuplicar={onDuplicar}
            />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant pt-3 sm:grid-cols-4">
            <Campo etiqueta="Dosis" valor={medicamento.dosis} />
            <Campo etiqueta="Vía" valor={medicamento.via} />
            <Campo etiqueta="Frecuencia" valor={medicamento.frecuencia} />
            <Campo etiqueta="Inicio" valor={formatearFechaHoraCorta(medicamento.fechaHoraInicio)} />
            <Campo etiqueta="Cantidad" valor={medicamento.cantidadSolicitada} />
          </dl>
        </li>
      ))}
    </ul>
  )
}
