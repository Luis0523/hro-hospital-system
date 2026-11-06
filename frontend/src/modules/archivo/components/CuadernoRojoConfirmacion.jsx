import { Button, Icon, Modal } from '@/shared/components/ui'
import { CAMPOS_CUADERNO_ROJO } from '../cuadernoRojoCampos'

const CAMPOS_CANTIDAD = CAMPOS_CUADERNO_ROJO.filter((campo) => campo.tipo !== 'fecha')

function fechaCorta(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

/**
 * Confirmación breve antes de reemplazar un registro existente. Recibe un
 * snapshot inmutable (`fecha` + `valores`) para que cambios posteriores del
 * formulario no alteren la operación confirmada.
 */
export default function CuadernoRojoConfirmacion({
  abierto,
  fecha,
  valores,
  guardando = false,
  onCancelar,
  onConfirmar,
}) {
  return (
    <Modal
      open={abierto}
      onClose={() => {
        if (!guardando) onCancelar?.()
      }}
      title="Actualizar registro"
    >
      <div className="space-y-4">
        <p>
          Se reemplazarán los valores guardados del{' '}
          <strong className="text-on-surface">{fechaCorta(fecha)}</strong>.
        </p>

        <dl className="grid grid-cols-2 gap-2">
          {CAMPOS_CANTIDAD.map((campo) => (
            <div
              key={campo.clave}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
            >
              <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                {campo.etiqueta}
              </dt>
              <dd className="text-right text-title-sm font-semibold tabular-nums text-on-surface">
                {valores?.[campo.clave] ?? '—'}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button className="min-h-11 w-full sm:w-auto" onClick={onConfirmar} disabled={guardando}>
            <Icon name="save" className="text-[18px]" />
            {guardando ? 'Guardando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
