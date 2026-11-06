import { Alert, Button, Icon, Modal } from '@/shared/components/ui'
import { formatearFechaTexto } from '../utils/rangoFechas'

const DATOS = [
  { clave: 'egresosHospitalarios', etiqueta: 'Egresos hospitalarios' },
  { clave: 'sobresEmergencia', etiqueta: 'Sobres emergencia' },
  { clave: 'sobresSellados', etiqueta: 'Sobres sellados' },
  { clave: 'tia', etiqueta: 'TIA' },
]

/**
 * Confirmación en dos pasos para eliminar un registro. Se muestra un único
 * modal por vez: primero el resumen y luego la advertencia destructiva.
 */
export default function CuadernoRojoEliminar({
  abierto,
  registro,
  paso = 1,
  eliminando = false,
  onContinuar,
  onCancelar,
  onConfirmar,
}) {
  if (!registro) return null

  const segundaConfirmacion = paso === 2

  return (
    <Modal
      open={abierto}
      onClose={() => {
        if (!eliminando) onCancelar?.()
      }}
      title={segundaConfirmacion ? 'Eliminar registro definitivamente' : 'Eliminar registro'}
    >
      <div className="space-y-4">
        {segundaConfirmacion ? (
          <Alert tone="error" title="Operación destructiva">
            El registro del {formatearFechaTexto(registro.fecha)} se eliminará de forma definitiva.
            Esta acción no se puede deshacer.
          </Alert>
        ) : (
          <>
            <p>
              ¿Desea eliminar el registro del{' '}
              <strong className="text-on-surface">{formatearFechaTexto(registro.fecha)}</strong>?
            </p>
            <dl className="grid grid-cols-2 gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3">
              {DATOS.map((dato) => (
                <div key={dato.clave}>
                  <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                    {dato.etiqueta}
                  </dt>
                  <dd className="text-title-sm font-semibold tabular-nums text-on-surface">
                    {registro[dato.clave] ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={onCancelar}
            disabled={eliminando}
          >
            Cancelar
          </Button>
          {segundaConfirmacion ? (
            <Button
              variant="danger"
              className="min-h-11 w-full sm:w-auto"
              onClick={onConfirmar}
              disabled={eliminando}
            >
              <Icon name="delete_forever" className="text-[18px]" />
              {eliminando ? 'Eliminando…' : 'Eliminar definitivamente'}
            </Button>
          ) : (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={onContinuar}
              disabled={eliminando}
            >
              <Icon name="arrow_forward" className="text-[18px]" />
              Continuar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
