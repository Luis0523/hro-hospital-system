import { COLUMNAS_HISTORIAL } from '../cuadernoRojoCampos'
import { agruparPorMesAnio } from '../utils/agruparHistorial'

function celda(valor) {
  return valor === null || valor === undefined || valor === '' ? '—' : valor
}

// Historial del Cuaderno Rojo. La tabla siempre expone las cinco columnas;
// cuando no hay registros se muestra un estado vacío dentro de la misma tabla.
// Los grupos por mes/año solo aparecen cuando existan registros reales.
export default function CuadernoRojoHistorial({ registros = [] }) {
  const grupos = agruparPorMesAnio(registros)
  const vacio = grupos.length === 0

  return (
    <section aria-label="Historial de registros" className="space-y-4">
      <h3 className="text-title-md text-on-surface">Historial de registros</h3>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">Historial de registros del Cuaderno Rojo</caption>
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
              {COLUMNAS_HISTORIAL.map((columna) => (
                <th key={columna.clave} scope="col" className="px-3 py-3 font-semibold">
                  {columna.etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vacio ? (
              <tr>
                <td
                  colSpan={COLUMNAS_HISTORIAL.length}
                  className="px-3 py-10 text-center text-on-surface-variant"
                >
                  <span className="block font-semibold text-on-surface">
                    Aún no hay registros en el historial.
                  </span>
                  <span className="mt-1 block">
                    Los registros aparecerán aquí cuando se habilite la integración con el backend.
                  </span>
                </td>
              </tr>
            ) : (
              grupos.map((grupo) => <GrupoHistorial key={grupo.clave} grupo={grupo} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GrupoHistorial({ grupo }) {
  return (
    <>
      <tr className="border-b border-outline-variant bg-surface-container-low/60">
        <th
          scope="colgroup"
          colSpan={COLUMNAS_HISTORIAL.length}
          className="px-3 py-2 text-left font-semibold text-on-surface-variant"
        >
          {grupo.etiqueta}
        </th>
      </tr>
      {grupo.registros.map((registro, indice) => (
        <tr
          key={registro?.id ?? `${grupo.clave}-${indice}`}
          className="border-b border-outline-variant/60"
        >
          {COLUMNAS_HISTORIAL.map((columna) => (
            <td key={columna.clave} className="px-3 py-2 tabular-nums text-on-surface">
              {celda(registro?.[columna.clave])}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
