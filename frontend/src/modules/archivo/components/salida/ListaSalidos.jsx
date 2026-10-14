import { Button, Icon } from '@/shared/components/ui'
import { ETIQUETAS_ESTADO_CARNET } from '@/modules/carnets/api/carnetsApi'
import { formatearExpediente } from '@/shared/utils/expediente'

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Lista de expedientes que están saliendo EN ESTA SESIÓN (empieza vacía y crece
// a medida que se marcan). La fila recién marcada entra con una animación verde
// + tachado y un ícono de confirmación. Arriba va el contador de salidas y el
// botón para generar el reporte.
export default function ListaSalidos({
  salidos,
  confirmandoIds,
  animandoIds,
  generandoPdf,
  onDescargarPdf,
}) {
  return (
    <section
      aria-label="Expedientes que están saliendo"
      aria-live="polite"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1 text-title-md font-bold text-on-surface">
          <Icon name="task_alt" className="text-[20px] text-emerald-600" />
          {salidos.length} expediente{salidos.length === 1 ? '' : 's'} han salido de archivo
        </h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={onDescargarPdf}
          disabled={generandoPdf || salidos.length === 0}
          title="Generar el reporte de salida de archivo (PDF)"
        >
          <Icon name="picture_as_pdf" className="text-[18px]" />
          {generandoPdf ? 'Generando…' : `Generar reporte (${salidos.length})`}
        </Button>
      </div>

      {salidos.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          Aún no ha marcado salidas en esta sesión.
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="sticky top-0 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Expediente</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Especialidad</th>
                <th className="px-3 py-2 text-center">Hora</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {salidos.map((carnet) => {
                const animando = animandoIds.has(carnet.id)
                const confirmando = confirmandoIds.has(carnet.id)
                return (
                  <tr
                    key={carnet.id}
                    className={`transition-colors duration-500 ${
                      animando ? 'hro-salida-ok' : confirmando ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`font-mono text-title-md font-bold ${
                          animando ? 'hro-salida-tachado text-emerald-700' : 'text-primary'
                        }`}
                      >
                        {formatearExpediente(carnet.numeroExpediente)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-on-surface">
                      {carnet.pacienteNombre}
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">{carnet.especialidadNombre}</td>
                    <td className="px-3 py-2 text-center font-mono text-on-surface-variant">
                      {horaDe(carnet.salidaArchivoEn)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {confirmando ? (
                        <span
                          className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant"
                          title="Confirmando en segundo plano"
                        >
                          <Icon name="sync" className="text-[16px] animate-spin" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                          title={ETIQUETAS_ESTADO_CARNET[carnet.estado] ?? carnet.estado}
                        >
                          <Icon name="check" className="text-[16px]" />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
