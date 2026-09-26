import EmptyState from './EmptyState'

export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'Sin registros',
  renderCell,
}) {
  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
          <tr>
            {columns.map((columna) => (
              <th key={columna.key} className="px-4 py-3 font-semibold">
                {columna.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {data.map((fila) => (
            <tr key={fila[keyField]} className="hover:bg-surface-container-low/60">
              {columns.map((columna) => (
                <td key={columna.key} className="px-4 py-3 text-on-surface">
                  {renderCell ? renderCell(fila, columna.key) : fila[columna.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
