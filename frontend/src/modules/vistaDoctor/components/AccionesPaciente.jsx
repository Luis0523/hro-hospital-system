import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  ACCION_ATENDER,
  ACCION_LLAMAR,
  ACCION_NO_RESPONDE,
  puedeAtender,
  puedeNoResponder,
} from '../api/doctorAcciones'

function BotonAccion({
  children,
  icono,
  variant = 'secondary',
  onClick,
  disabled = false,
  procesando = false,
  motivo = '',
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      className="min-h-[48px] w-full px-3"
      onClick={onClick}
      disabled={disabled || procesando}
      aria-busy={procesando}
      title={disabled ? motivo : undefined}
    >
      <Icon name={icono} className="text-xl" />
      <span className="whitespace-normal text-center leading-tight">{children}</span>
    </Button>
  )
}

export default function AccionesPaciente({
  estado,
  onAccion,
  procesando = false,
  deshabilitado = false,
  permitidoLlamado = true,
  motivoLlamado = '',
  cooldownSegundos = 0,
  expedienteValidado = false,
}) {
  const motivoGeneral = deshabilitado ? 'La jornada está cerrada.' : 'Acción no disponible.'
  const esRellamado = estado === 'llamado' || estado === 'no_responde'
  const base = esRellamado ? 'Rellamar' : 'Llamar'
  const etiquetaLlamado = cooldownSegundos > 0 ? `${base} en ${cooldownSegundos} s` : base
  const motivoVisible = !permitidoLlamado && cooldownSegundos === 0 ? motivoLlamado : ''

  if (estado === 'atendido') {
    return (
      <p
        className="text-center text-sm text-on-surface-variant"
        aria-label="Turno atendido, sin acciones"
      >
        Sin acciones
      </p>
    )
  }

  if (estado === 'llamado') {
    return (
      <div className="space-y-2">
        <BotonAccion
          icono="replay"
          variant="primary"
          onClick={() => onAccion?.(ACCION_LLAMAR)}
          disabled={!permitidoLlamado || deshabilitado}
          procesando={procesando}
          motivo={deshabilitado ? motivoGeneral : motivoLlamado}
        >
          {etiquetaLlamado}
        </BotonAccion>
        {motivoVisible && <p className="text-sm text-on-surface-variant">{motivoVisible}</p>}

        <BotonAccion
          icono="cancel"
          onClick={() => onAccion?.(ACCION_NO_RESPONDE)}
          disabled={!puedeNoResponder(estado) || deshabilitado}
          procesando={procesando}
          motivo={motivoGeneral}
        >
          No respondió
        </BotonAccion>

        <BotonAccion
          icono="check_circle"
          onClick={() => onAccion?.(ACCION_ATENDER)}
          disabled={!puedeAtender(estado) || !expedienteValidado || deshabilitado}
          procesando={procesando}
          motivo={
            deshabilitado ? motivoGeneral : 'Registre y valide el expediente antes de atender.'
          }
        >
          Atendió
        </BotonAccion>
        {!expedienteValidado && (
          <p className="text-sm text-on-surface-variant">
            Registre el expediente para poder atender.
          </p>
        )}
      </div>
    )
  }

  if (estado === 'no_responde') {
    return (
      <div className="space-y-2">
        <BotonAccion
          icono="replay"
          variant="primary"
          onClick={() => onAccion?.(ACCION_LLAMAR)}
          disabled={!permitidoLlamado || deshabilitado}
          procesando={procesando}
          motivo={deshabilitado ? motivoGeneral : motivoLlamado}
        >
          {etiquetaLlamado}
        </BotonAccion>
        {motivoVisible && <p className="text-sm text-on-surface-variant">{motivoVisible}</p>}
      </div>
    )
  }

  if (estado === 'en_espera' || estado === 'reintegrado') {
    return (
      <div className="space-y-2">
        <BotonAccion
          icono="call"
          variant="primary"
          onClick={() => onAccion?.(ACCION_LLAMAR)}
          disabled={!permitidoLlamado || deshabilitado}
          procesando={procesando}
          motivo={deshabilitado ? motivoGeneral : motivoLlamado}
        >
          {etiquetaLlamado}
        </BotonAccion>
        {motivoVisible && <p className="text-sm text-on-surface-variant">{motivoVisible}</p>}
      </div>
    )
  }

  return <p className="text-center text-sm text-on-surface-variant">Sin acciones disponibles</p>
}
