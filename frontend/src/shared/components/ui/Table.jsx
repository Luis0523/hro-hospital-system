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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((columna) => (
              <th key={columna.key} className="px-4 py-3 font-semibold">
                {columna.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((fila) => (
            <tr key={fila[keyField]} className="hover:bg-cyan-50/40">
              {columns.map((columna) => (
                <td key={columna.key} className="px-4 py-3 text-slate-700">
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
