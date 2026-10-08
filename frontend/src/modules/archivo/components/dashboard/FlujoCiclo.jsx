import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado, ORDEN_ESTADOS } from '../../estadosExpediente'
import { totalEstado } from '../../utils/metricasArchivo'

// Flujo del ciclo como secuencia de "píldoras" conectadas según ORDEN_ESTADOS,
// cada una con su total. Es solo lectura (no es un stepper interactivo).
// `no_localizado` (excepción) no forma parte de esta secuencia.
export default function FlujoCiclo({ porEstado = [] }) {
  const pasos = ORDEN_ESTADOS.map((estado) => ({
    estado,
    total: totalEstado(porEstado, estado),
  }))

  return (
    <section
      aria-label="Flujo del ciclo"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <h3 className="mb-3 text-title-md text-on-surface">Flujo del ciclo</h3>

      <ol className="flex flex-wrap items-center gap-2">
        {pasos.map((paso, indice) => {
          const meta = metadatosEstado(paso.estado)

          return (
            <li key={paso.estado} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md ${meta.color}`}
              >
                <Icon name={meta.icono} className="text-[16px]" />
                <span>{meta.etiqueta}</span>
                <span className="font-bold tabular-nums">{paso.total}</span>
              </span>
              {indice < pasos.length - 1 && (
                <Icon name="chevron_right" className="text-[18px] text-on-surface-variant" />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
