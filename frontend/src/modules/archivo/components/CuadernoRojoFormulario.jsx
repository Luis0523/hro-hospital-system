import { Alert, Button, Icon, Input } from '@/shared/components/ui'
import { CAMPOS_CUADERNO_ROJO } from '../cuadernoRojoCampos'

const CAMPOS_CANTIDAD = CAMPOS_CUADERNO_ROJO.filter((campo) => campo.tipo !== 'fecha')

/**
 * Formulario de captura del Cuaderno Rojo. Es controlado por `useCuadernoRojo`:
 * la fecha y las cantidades viven en `valores`; aquí solo se presentan.
 */
export default function CuadernoRojoFormulario({
  valores,
  errores,
  tocados,
  existente,
  cargandoDia,
  guardando,
  onCambiar,
  onBlur,
  onGuardar,
}) {
  function manejarEnvio(evento) {
    evento.preventDefault()
    onGuardar()
  }

  return (
    <form className="space-y-5" noValidate onSubmit={manejarEnvio}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Input
          id="cuaderno-rojo-fecha"
          name="fecha"
          label="Fecha"
          type="date"
          value={valores.fecha}
          error={tocados.fecha ? errores.fecha : undefined}
          hint="Un registro por día. Puede corregir fechas anteriores."
          onChange={(evento) => onCambiar('fecha', evento.target.value)}
          onBlur={() => onBlur('fecha')}
        />

        {CAMPOS_CANTIDAD.map((campo) => (
          <Input
            key={campo.clave}
            id={`cuaderno-rojo-${campo.clave}`}
            name={campo.clave}
            label={campo.etiqueta}
            type="text"
            inputMode="numeric"
            placeholder="0"
            autoComplete="off"
            value={valores[campo.clave]}
            error={tocados[campo.clave] ? errores[campo.clave] : undefined}
            onChange={(evento) => onCambiar(campo.clave, evento.target.value)}
            onBlur={() => onBlur(campo.clave)}
          />
        ))}
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Ingrese cantidades enteras iguales o mayores a cero.
      </p>

      {existente && (
        <Alert tone="info" title="Esta fecha ya tiene un registro">
          Al guardar se actualizarán los valores existentes; no se creará un duplicado.
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {cargandoDia && (
          <span className="text-body-sm text-on-surface-variant" role="status">
            Consultando el registro de la fecha…
          </span>
        )}
        <Button type="submit" disabled={guardando || cargandoDia} className="w-full sm:w-auto">
          <Icon name="save" className="text-[18px]" />
          {guardando ? 'Guardando…' : existente ? 'Actualizar registro' : 'Guardar registro'}
        </Button>
      </div>
    </form>
  )
}
