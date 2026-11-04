import { Input } from '@/shared/components/ui'
import { CAMPOS_CUADERNO_ROJO } from '../cuadernoRojoCampos'

const CAMPOS_CANTIDAD = CAMPOS_CUADERNO_ROJO.filter((campo) => campo.tipo !== 'fecha')

/**
 * Campos del formulario del Cuaderno Rojo. Se usa dentro de los modales de
 * alta y edición; las acciones viven en el footer del modal.
 */
export default function CuadernoRojoFormulario({
  valores,
  errores,
  tocados,
  onCambiar,
  onBlur,
  onGuardar,
  formId = 'cuaderno-rojo-form',
  bloquearFecha = false,
  cargandoDia = false,
  guardando = false,
}) {
  const camposBloqueados = cargandoDia || guardando

  function manejarEnvio(evento) {
    evento.preventDefault()
    onGuardar?.()
  }

  return (
    <form
      id={formId}
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
          disabled={bloquearFecha || guardando}
          className="min-h-11 text-base sm:text-sm"
          error={tocados.fecha ? errores.fecha : undefined}
          hint={
            bloquearFecha ? 'La fecha del registro no cambia al editarlo.' : 'Un registro por día.'
          }
          onChange={(evento) => onCambiar('fecha', evento.target.value)}
          onBlur={() => onBlur('fecha')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
    </form>
  )
}
