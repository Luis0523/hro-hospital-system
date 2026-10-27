import Icon from './Icon.jsx'
import Modal from './Modal.jsx'

const PASOS = [
  { desde: 0, texto: 'Preparando la información…' },
  { desde: 35, texto: 'Construyendo el documento…' },
  { desde: 78, texto: 'Preparando la descarga…' },
]

export default function ModalGenerandoPdf({ abierto, progreso = 0 }) {
  const paso = [...PASOS].reverse().find((item) => progreso >= item.desde) ?? PASOS[0]
  const listo = progreso >= 100

  return (
    <Modal open={abierto} onClose={() => {}} size="sm">
      <div className="py-2 text-center" role="status" aria-live="polite">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
          <span className="absolute inset-2 rounded-full bg-primary/10" />
          <span className="relative flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
            <Icon name={listo ? 'task_alt' : 'picture_as_pdf'} className="text-[30px]" />
          </span>
        </div>

        <h3 className="mt-3 text-headline-sm font-bold text-on-surface">
          {listo ? 'Documento listo' : 'Creando documento PDF'}
        </h3>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          {listo ? 'Iniciando descarga…' : paso.texto}
        </p>

        <div
          className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface-container-high"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-hro-blue via-primary to-hro-celeste transition-[width] duration-150 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-label-sm text-on-surface-variant">
          <span>{listo ? 'Completado' : 'Procesando'}</span>
          <span className="font-mono font-bold">{Math.round(progreso)}%</span>
        </div>

        <p className="mt-4 text-label-sm text-on-surface-variant">
          No cierres esta ventana mientras se genera el reporte.
        </p>
      </div>
    </Modal>
  )
}
