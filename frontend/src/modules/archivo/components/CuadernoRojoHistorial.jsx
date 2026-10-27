import { Button, Icon, Spinner } from '@/shared/components/ui'
import { COLUMNAS_HISTORIAL } from '../cuadernoRojoCampos'
import { agruparPorMesAnio } from '../utils/agruparHistorial'

function celda(valor) {
  return valor === null || valor === undefined || valor === '' ? '—' : valor
}

function fechaCorta(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

const COLUMNAS_CANTIDAD = COLUMNAS_HISTORIAL.filter((columna) => columna.clave !== 'fecha')

/**
 * Historial de registros del Cuaderno Rojo. En escritorio se muestra como
 * tabla; en pantallas pequeñas, como tarjetas por día para evitar el scroll
 * horizontal. Los grupos por mes/año solo aparecen cuando hay registros.
 */
export default function CuadernoRojoHistorial({ registros = [], cargando = false, onRecargar }) {
  const grupos = agruparPorMesAnio(registros)
  const vacio = grupos.length === 0

  return (
    <section aria-label="Historial de registros" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-title-md text-on-surface">Historial de registros</h3>
          <p className="text-body-sm text-on-surface-variant">
            {registros.length === 0
              ? 'Aún no hay días registrados.'
              : `${registros.length} ${registros.length === 1 ? 'día registrado' : 'días registrados'}.`}
          </p>
        </div>

        {onRecargar && (
          <Button variant="secondary" size="sm" onClick={onRecargar} disabled={cargando}>
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-10">
          <Spinner label="Cargando historial…" />
        </div>
      ) : vacio ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-10 text-center">
          <span className="block font-semibold text-on-surface">
            Aún no hay registros en el historial.
          </span>
          <span className="mt-1 block text-body-sm text-on-surface-variant">
            Los días que guarde aparecerán aquí, agrupados por mes y año.
          </span>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas por día */}
          <div className="space-y-6 md:hidden">
            {grupos.map((grupo) => (
              <div key={grupo.clave} className="space-y-2">
                <h4 className="text-label-md uppercase tracking-wide text-on-surface-variant">
                  {grupo.etiqueta}
                </h4>
                <ul className="space-y-2">
                  {grupo.registros.map((registro, indice) => (
                    <li
                      key={registro?.id ?? `${grupo.clave}-${indice}`}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                    >
                      <p className="text-title-sm font-semibold text-on-surface">
                        {fechaCorta(registro?.fecha)}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                        {COLUMNAS_CANTIDAD.map((columna) => (
                          <div key={columna.clave}>
                            <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                              {columna.etiqueta}
                            </dt>
                            <dd className="text-title-sm tabular-nums text-on-surface">
                              {celda(registro?.[columna.clave])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla completa */}
          <div className="hidden overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Historial de registros del Cuaderno Rojo</caption>
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                  {COLUMNAS_HISTORIAL.map((columna) => (
                    <th key={columna.clave} scope="col" className="px-4 py-3 font-semibold">
                      {columna.etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <GrupoHistorial key={grupo.clave} grupo={grupo} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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
          className="px-4 py-2 text-left font-semibold text-on-surface-variant"
        >
          {grupo.etiqueta}
        </th>
      </tr>
      {grupo.registros.map((registro, indice) => (
        <tr
          key={registro?.id ?? `${grupo.clave}-${indice}`}
          className="border-b border-outline-variant/60 last:border-0"
        >
          {COLUMNAS_HISTORIAL.map((columna) => (
            <td key={columna.clave} className="px-4 py-3 tabular-nums text-on-surface">
              {columna.clave === 'fecha'
                ? fechaCorta(registro?.[columna.clave])
                : celda(registro?.[columna.clave])}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
