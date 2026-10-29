import { Button, Icon } from '@/shared/components/ui'
import { formatearExpediente } from '@/shared/utils/expediente'
import { clasesEtiqueta } from '../../utils/coloresEtiqueta'

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Etiqueta de una salida, con compatibilidad para el campo histórico esClinicaMujer. */
export function etiquetaDeSalida(salida) {
  if (salida?.etiqueta) return salida.etiqueta
  if (salida?.esClinicaMujer) {
    return {
      id: 'clinica_mujer',
      codigo: 'clinica_mujer',
      nombre: 'Clínica de la Mujer',
      icono: 'female',
      color: 'rose',
    }
  }
  return null
}

function EtiquetaChip({ etiqueta, className = '' }) {
  if (!etiqueta) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-sm font-bold ${clasesEtiqueta(
        etiqueta.color,
      )} ${className}`}
    >
      <Icon name={etiqueta.icono || 'label'} className="text-[14px]" />
      {etiqueta.nombre}
    </span>
  )
}

function resumenPorEtiqueta(salidos) {
  const mapa = new Map()
  for (const salida of salidos) {
    const etiqueta = etiquetaDeSalida(salida)
    if (!etiqueta) continue
    const clave = etiqueta.codigo ?? etiqueta.nombre
    const actual = mapa.get(clave)
    mapa.set(clave, {
      etiqueta,
      total: (actual?.total ?? 0) + 1,
      orden: etiqueta.orden ?? Number.MAX_SAFE_INTEGER,
    })
  }
  return [...mapa.values()].sort((a, b) => a.orden - b.orden)
}

// Lista COMPARTIDA (por estación) de expedientes que han salido de archivo
// consultando al hospital. Incluye las filas en proceso (cola) con un spinner.
export default function ListaSalidosHospital({
  salidos,
  pendientes = [],
  generandoPdf,
  onDescargarPdf,
  onEliminar,
}) {
  const total = salidos.length
  const resumenEtiquetas = resumenPorEtiqueta(salidos)
  const totalActivos = salidos.filter((s) => s.clasificacion === 'activo').length
  const totalPasivos = salidos.filter((s) => s.clasificacion === 'pasivo').length
  const vacio = total === 0 && pendientes.length === 0

  return (
    <section
      aria-label="Expedientes que han salido de archivo"
      aria-live="polite"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1 text-title-md font-bold text-on-surface">
          <Icon name="task_alt" className="text-[20px] text-emerald-600" />
          {total} expediente{total === 1 ? '' : 's'} han salido de archivo
        </h2>

        {resumenEtiquetas.map(({ etiqueta, total: cantidad }) => (
          <span
            key={etiqueta.codigo ?? etiqueta.nombre}
            className="inline-flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-1 text-label-sm font-semibold text-on-surface-variant"
          >
            <EtiquetaChip etiqueta={etiqueta} />
            {cantidad}
          </span>
        ))}

        {total > 0 && (
          <span className="inline-flex items-center gap-2 rounded-md bg-surface-container-high px-2 py-1 text-label-sm font-semibold text-on-surface-variant">
            <span className="text-emerald-700 dark:text-emerald-300">{totalActivos} activos</span>
            <span className="text-amber-700 dark:text-amber-300">{totalPasivos} pasivos</span>
          </span>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={onDescargarPdf}
          disabled={generandoPdf || total === 0}
          title="Generar el reporte de salida de archivo (PDF)"
        >
          <Icon name="picture_as_pdf" className="text-[18px]" />
          {generandoPdf ? 'Generando…' : `Generar reporte (${total})`}
        </Button>
      </div>

      {vacio ? (
        <p className="text-body-sm text-on-surface-variant">
          Aún no hay salidas registradas en esta estación.
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="sticky top-0 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Expediente</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2 text-center">Hora</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {pendientes.map((p) => (
                <tr key={p.id} className="bg-emerald-50/60">
                  <td className="px-3 py-2">
                    <span className="font-mono text-title-md font-bold text-on-surface-variant">
                      {formatearExpediente(p.numeroExpediente)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
                      Consultando…
                      <EtiquetaChip etiqueta={etiquetaDeSalida(p)} />
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-on-surface-variant">—</td>
                  <td className="px-3 py-2 text-right">
                    <Icon
                      name="sync"
                      className="animate-spin text-[16px] text-on-surface-variant"
                    />
                  </td>
                </tr>
              ))}
              {salidos.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">
                    <span className="font-mono text-title-md font-bold text-primary">
                      {formatearExpediente(s.numeroExpediente)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-on-surface">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {s.pacienteNombre}
                      <EtiquetaChip etiqueta={etiquetaDeSalida(s)} />
                      {s.clasificacion && (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-label-sm font-bold ${
                            s.clasificacion === 'activo'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                          }`}
                        >
                          {s.clasificacion === 'activo' ? 'Activo' : 'Pasivo'}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-on-surface-variant">
                    {horaDe(s.registradoEn)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                        title="Salida registrada"
                      >
                        <Icon name="check" className="text-[16px]" />
                      </span>
                      <button
                        type="button"
                        onClick={() => onEliminar?.(s)}
                        aria-label={`Eliminar ${formatearExpediente(s.numeroExpediente)}`}
                        title="Eliminar registro"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-rose-300 text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
