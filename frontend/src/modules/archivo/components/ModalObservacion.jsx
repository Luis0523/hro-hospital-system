import { Button, Modal } from '@/shared/components/ui'
import Icon from '@/shared/components/ui/Icon.jsx'

// Mini-modal para capturar la observación obligatoria de la transición
// `no-localizado`. No es infraestructura global: reutiliza `Modal` compartido.
export default function ModalObservacion({
  abierto,
  observacion,
  onObservacion,
  onConfirmar,
  onCancelar,
  procesando = false,
}) {
  const valido = observacion.trim().length > 0

  return (
    <Modal open={abierto} onClose={onCancelar} title="Motivo de no localizado">
      <div className="space-y-3">
        <p>
          Indique el motivo por el que no se localizó el expediente. La observación es obligatoria.
        </p>

        <div>
          <label
            htmlFor="observacion-no-localizado"
            className="mb-1 block text-sm font-medium text-on-surface"
          >
            Observación
          </label>
          <textarea
            id="observacion-no-localizado"
            rows={3}
            value={observacion}
            onChange={(event) => onObservacion(event.target.value)}
            placeholder="Ej. No estaba en la ubicación registrada"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2 text-sm text-on-surface outline-none transition focus:border-hro-blue focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirmar} disabled={!valido || procesando}>
            <Icon name="report" className="text-[18px]" />
            {procesando ? 'Registrando…' : 'Marcar no localizado'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
