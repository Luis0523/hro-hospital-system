import { useMemo } from 'react'

// Tabla 2 — Detalle de Historias Desarchivadas por Consulta (por día).
// Las especialidades son dinámicas (catálogo real); el TOTAL por día alimenta el
// HDC de la Tabla 1.
export default function TablaDetalleConsulta({ detalle = [] }) {
  const especialidades = useMemo(() => {
    const mapa = new Map()
    for (const fila of detalle) {
      for (const item of fila.porEspecialidad ?? []) {
        const clave = item.especialidadId ?? item.especialidadNombre
        if (!mapa.has(clave)) mapa.set(clave, item.especialidadNombre)
      }
    }
    return [...mapa.entries()]
      .map(([clave, nombre]) => ({ clave, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [detalle])

  function valor(fila, clave) {
    const item = (fila.porEspecialidad ?? []).find(
      (candidato) => (candidato.especialidadId ?? candidato.especialidadNombre) === clave,
    )
    return item?.total ?? 0
  }

  return (
    <section className="space-y-2">
      <h3 className="text-title-md text-on-surface">
        Tabla 2 · Detalle de Historias Desarchivadas por Consulta
      </h3>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[40rem] text-left text-body-sm">
          <thead className="bg-surface-container-low text-label-sm uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                DÍA
              </th>
              {especialidades.map((especialidad) => (
                <th key={especialidad.clave} scope="col" className="px-3 py-2 font-semibold">
                  {especialidad.nombre}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 font-semibold">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {detalle.map((fila) => (
              <tr key={fila.dia} className="hover:bg-surface-container-low/60">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-on-surface-variant">
                  {fila.dia}
                </td>
                {especialidades.map((especialidad) => (
                  <td
                    key={especialidad.clave}
                    className="px-3 py-2 tabular-nums text-on-surface-variant"
                  >
                    {valor(fila, especialidad.clave)}
                  </td>
                ))}
                <td className="px-3 py-2 font-semibold tabular-nums text-on-surface">
                  {fila.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-label-sm text-on-surface-variant">
        El TOTAL de esta tabla alimenta el HDC de la Tabla 1.
      </p>
    </section>
  )
}
