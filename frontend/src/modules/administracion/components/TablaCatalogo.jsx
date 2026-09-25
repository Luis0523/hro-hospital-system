import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Table from '@/shared/components/ui/Table.jsx'

function EstadoActivo({ activo }) {
  const activoBool = Boolean(activo)
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
        activoBool ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
      }`}
    >
      {activoBool ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function valorCelda(fila, columna) {
  if (!columna) return null
  if (columna.key === 'activo') return <EstadoActivo activo={fila.activo} />
  if (typeof columna.render === 'function') return columna.render(fila)
  return fila[columna.key]
}

/**
 * Listado responsive de un catálogo: tabla en escritorio y tarjetas en móvil.
 * Maneja los estados de carga, error y vacío.
 */
export default function TablaCatalogo({
  columnas = [],
  datos = [],
  cargando = false,
  error = null,
  onReintentar,
  onVer,
  onEditar,
  onDesactivar,
  permitirEditar = true,
  vacioTitulo = 'Sin registros',
  vacioDescripcion,
}) {
  if (cargando) {
    return <Spinner label="Cargando catálogo..." />
  }

  if (error) {
    return (
      <Alert tone="error" title="No se pudo cargar la información">
        <p>{error}</p>
        {onReintentar && (
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={onReintentar}>
              Reintentar
            </Button>
          </div>
        )}
      </Alert>
    )
  }

  if (datos.length === 0) {
    return <EmptyState title={vacioTitulo} description={vacioDescripcion} />
  }

  const acciones = (fila) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" onClick={() => onVer?.(fila)}>
        Ver
      </Button>
      {permitirEditar && (
        <Button size="sm" variant="secondary" onClick={() => onEditar?.(fila)}>
          Editar
        </Button>
      )}
      {fila.activo && onDesactivar && (
        <Button size="sm" variant="danger" onClick={() => onDesactivar(fila)}>
          Desactivar
        </Button>
      )}
    </div>
  )

  const columnasEscritorio = [...columnas, { key: 'acciones', label: 'Acciones' }]

  return (
    <div>
      <div data-testid="catalogo-escritorio" className="hidden xl:block">
        <Table
          columns={columnasEscritorio}
          data={datos}
          emptyMessage={vacioTitulo}
          renderCell={(fila, key) =>
            key === 'acciones'
              ? acciones(fila)
              : valorCelda(
                  fila,
                  columnas.find((columna) => columna.key === key),
                )
          }
        />
      </div>

      <div data-testid="catalogo-movil" className="space-y-3 xl:hidden">
        {datos.map((fila) => (
          <div key={fila.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dl className="space-y-2">
              {columnas.map((columna) => (
                <div key={columna.key} className="flex items-start justify-between gap-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {columna.label}
                  </dt>
                  <dd className="text-right text-sm text-slate-700">{valorCelda(fila, columna)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-slate-100 pt-3">{acciones(fila)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
