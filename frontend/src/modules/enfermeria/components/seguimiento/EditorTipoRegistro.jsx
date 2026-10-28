import { Icon } from '@/shared/components/ui'
import { TIPOS_REGISTRO } from '../../api/seguimientoApi'
import { CHIPS_REGISTRO } from './estilosEtapas'

// Editor de la marca de un turno YA registrado. A diferencia del selector de
// nuevos registros, aquí se puede cambiar o quitar la marca existente.
export default function EditorTipoRegistro({ turno, onCambiar, deshabilitado = false }) {
  if (!turno) return null
  const actual = turno.tipoRegistro ?? null

  return (
    <div
      data-testid="editor-tipo-registro"
      role="group"
      aria-label="Tipo de registro del turno"
      className="mt-2 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-2"
    >
      <span className="text-label-sm font-semibold text-on-surface-variant">Tipo de registro:</span>
      {TIPOS_REGISTRO.map((tipo) => {
        const activo = actual === tipo.id
        return (
          <button
            key={tipo.id}
            type="button"
            aria-pressed={activo}
            disabled={deshabilitado}
            onClick={() => onCambiar?.(tipo.id)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-label-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-50 ${
              activo
                ? CHIPS_REGISTRO[tipo.id]
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Icon name={tipo.icono} className="text-[16px]" />
            {tipo.nombre}
          </button>
        )
      })}
      <button
        type="button"
        aria-pressed={actual === null}
        disabled={deshabilitado}
        onClick={() => onCambiar?.(null)}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-label-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-50 ${
          actual === null
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        <Icon name="label_off" className="text-[16px]" />
        Sin marca
      </button>
    </div>
  )
}
