import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado } from '../../estadosExpediente'

const MAX_VISIBLES = 20

function formatearHora(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function EtiquetaEstado({ estado }) {
  if (!estado) return null
  const meta = metadatosEstado(estado)
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-label-sm ${meta.color}`}>
      {meta.etiqueta}
    </span>
  )
}

// Feed de movimientos en vivo. Lista acotada con los eventos más recientes al
// frente; `aria-live="polite"` anuncia los nuevos sin interrumpir. Presentacional.
export default function FeedTiempoReal({ eventos = [] }) {
  const visibles = eventos.slice(0, MAX_VISIBLES)

  return (
    <section
      aria-label="Feed en tiempo real"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <h3 className="mb-3 text-title-md text-on-surface">Movimientos en vivo</h3>

      <div aria-live="polite">
        {visibles.length === 0 ? (
          <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Icon name="hourglass_empty" className="text-[16px]" />
            Esperando movimientos…
          </p>
        ) : (
          <ul className="space-y-2">
            {visibles.map((evento, indice) => (
              <li
                key={evento.id ?? `${evento.numeroExpediente}-${indice}`}
                className={`rounded-lg border border-outline-variant bg-surface-container-low p-2.5 ${
                  indice === 0 ? 'dashboard-feed-enter' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-label-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">
                    {evento.numeroExpediente ?? '—'}
                  </span>
                  <span className="tabular-nums">{formatearHora(evento.fechaMovimiento)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-body-sm">
                  {evento.estadoAnterior && (
                    <>
                      <EtiquetaEstado estado={evento.estadoAnterior} />
                      <Icon name="arrow_forward" className="text-[14px] text-on-surface-variant" />
                    </>
                  )}
                  <EtiquetaEstado estado={evento.estadoNuevo} />
                  {evento.usuarioNombre && (
                    <span className="text-on-surface-variant">· {evento.usuarioNombre}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
