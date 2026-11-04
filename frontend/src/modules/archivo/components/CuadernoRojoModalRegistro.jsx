import { Alert, Button, Icon, Modal } from '@/shared/components/ui'
import CuadernoRojoFormulario from './CuadernoRojoFormulario.jsx'

const FORM_ID = 'cuaderno-rojo-form'

/**
 * Modal compartido para registrar un día nuevo o editar uno existente.
 * La fecha solo se puede cambiar al crear; al editar queda asociada al registro.
 */
export default function CuadernoRojoModalRegistro({
  abierto,
  modo = 'crear',
  valores,
  errores,
  tocados,
  existente = false,
  cargandoDia = false,
  guardando = false,
  onCambiar,
  onBlur,
  onGuardar,
  onCerrar,
  onEditarExistente,
}) {
  const esEdicion = modo === 'editar'
  const fechaOcupada = !esEdicion && existente
  const titulo = esEdicion ? 'Editar registro' : 'Registrar nuevo día'

  return (
    <Modal
      open={abierto}
      onClose={() => {
        if (!guardando) onCerrar?.()
      }}
      title={titulo}
      size="md"
    >
      <div className="space-y-4">
        {fechaOcupada && (
          <Alert tone="warning" title="Esta fecha ya tiene un registro">
            <p>No se creará un duplicado. Puede editar el registro existente.</p>
            {onEditarExistente && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 min-h-11"
                onClick={onEditarExistente}
              >
                <Icon name="edit" className="text-[16px]" />
                Editar registro existente
              </Button>
            )}
          </Alert>
        )}

        <CuadernoRojoFormulario
          formId={FORM_ID}
          valores={valores}
          errores={errores}
          tocados={tocados}
          onCambiar={onCambiar}
          onBlur={onBlur}
          onGuardar={onGuardar}
          bloquearFecha={esEdicion}
          cargandoDia={cargandoDia}
          guardando={guardando}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            className="min-h-11 w-full sm:w-auto"
            disabled={guardando || cargandoDia || fechaOcupada}
          >
            <Icon name="save" className="text-[18px]" />
            {guardando ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Guardar registro'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
