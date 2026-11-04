import { Button, Icon, Input } from '@/shared/components/ui'
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

  const camposBloqueados = cargandoDia || guardando

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={manejarEnvio}
      aria-busy={cargandoDia}
      aria-label="Registro del día"
    >
      <div className="max-w-xs">
        <Input
          id="cuaderno-rojo-fecha"
          name="fecha"
          label="Fecha del registro"
          type="date"
          value={valores.fecha}
          disabled={guardando}
          className="min-h-11 text-base sm:text-sm"
          error={tocados.fecha ? errores.fecha : undefined}
          hint="Un registro por día."
          onChange={(evento) => onCambiar('fecha', evento.target.value)}
          onBlur={() => onBlur('fecha')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {CAMPOS_CANTIDAD.map((campo) => (
          <div key={campo.clave} className="min-w-0">
            <Input
              id={`cuaderno-rojo-${campo.clave}`}
              name={campo.clave}
              label={campo.etiqueta}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              autoComplete="off"
              disabled={camposBloqueados}
              className="min-h-11 text-right text-base tabular-nums sm:text-sm"
              value={valores[campo.clave]}
              error={tocados[campo.clave] ? errores[campo.clave] : undefined}
              onChange={(evento) => onCambiar(campo.clave, evento.target.value)}
              onBlur={() => onBlur(campo.clave)}
            />
          </div>
        ))}
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Cantidades enteras mayores o iguales a cero.
      </p>

      {existente && !cargandoDia && (
        <p className="text-body-sm text-on-surface-variant">
          Se actualizará el registro existente.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          disabled={guardando || cargandoDia}
          className="min-h-11 w-full sm:w-auto"
        >
          <Icon name="save" className="text-[18px]" />
          {guardando ? 'Guardando…' : existente ? 'Actualizar registro' : 'Guardar registro'}
        </Button>
      </div>
    </form>
  )
}
