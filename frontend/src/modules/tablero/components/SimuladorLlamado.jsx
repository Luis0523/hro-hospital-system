import Icon from '@/shared/components/ui/Icon.jsx'
import { estaEnModoMock } from '../api/tableroApi'

/**
 * Herramienta EXCLUSIVA de desarrollo + modo mock. En producción
 * (`import.meta.env.DEV === false`) queda deshabilitada.
 */
export function simuladorHabilitado(env = import.meta.env) {
  return env.DEV === true && estaEnModoMock(env) && env.VITE_TABLERO_SIMULADOR_LLAMADO === 'true'
}

const CLASE_BOTON =
  'inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/25 focus:outline-none focus:ring-2 focus:ring-on-primary/60 disabled:cursor-not-allowed disabled:opacity-50'

export default function SimuladorLlamado({
  habilitado = false,
  hayAsignacion = true,
  puedeRellamar = false,
  onSimular,
  onRellamar,
}) {
  if (!habilitado) return null

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSimular}
        disabled={!hayAsignacion}
        aria-label="Simular llamado"
        className={CLASE_BOTON}
      >
        <Icon name="campaign" className="text-[18px]" />
        Simular llamado
      </button>

      <button
        type="button"
        onClick={onRellamar}
        disabled={!hayAsignacion || !puedeRellamar}
        aria-label="Re-llamar"
        className={CLASE_BOTON}
      >
        <Icon name="replay" className="text-[18px]" />
        Re-llamar
      </button>
    </div>
  )
}
