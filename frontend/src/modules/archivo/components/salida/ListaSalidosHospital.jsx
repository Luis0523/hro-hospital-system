import { Button, Icon } from '@/shared/components/ui'
import { formatearExpediente } from '@/shared/utils/expediente'

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Lista COMPARTIDA (por estación) de expedientes que han salido de archivo
// consultando al hospital. Incluye las filas en proceso (cola) con un spinner.
export default function ListaSalidosHospital({
  salidos,
  pendientes = [],
  generandoPdf,
  onDescargarPdf,
}) {
  const total = salidos.length
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
                  <td className="px-3 py-2 text-on-surface-variant">Consultando…</td>
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
                  <td className="px-3 py-2 font-semibold text-on-surface">{s.pacienteNombre}</td>
                  <td className="px-3 py-2 text-center font-mono text-on-surface-variant">
                    {horaDe(s.registradoEn)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                      title="Salida registrada"
                    >
                      <Icon name="check" className="text-[16px]" />
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
