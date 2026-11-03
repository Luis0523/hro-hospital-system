import { Button, Icon } from '@/shared/components/ui'
import { formatearExpediente } from '@/shared/utils/expediente'

export default function UltimaDepuracionPanel({ depuracion, onDeshacer, deshaciendo = false }) {
  if (!depuracion) return null

  const paciente = String(depuracion.pacienteNombre ?? '').trim()
  const numero = formatearExpediente(depuracion.numeroExpediente) || '—'

  return (
    <section
      aria-labelledby="ultima-depuracion-titulo"
      className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="min-w-0">
        <h3
          id="ultima-depuracion-titulo"
          className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
        >
          <Icon name="undo" className="text-[20px] text-primary" />
          Última depuración de la sesión
        </h3>
        <p className="mt-1 break-words text-body-md text-on-surface">
          Última depuración: <strong className="font-mono text-primary">{numero}</strong>
          {paciente && <span className="text-on-surface-variant"> · {paciente}</span>}
        </p>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          Solo se revierte esta operación simulada; las depuraciones históricas no se modifican.
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="md"
        className="min-h-11 w-full shrink-0 sm:w-auto"
        onClick={onDeshacer}
        disabled={deshaciendo}
      >
        <Icon name="undo" className="text-[18px]" />
        Deshacer
      </Button>
    </section>
  )
}
