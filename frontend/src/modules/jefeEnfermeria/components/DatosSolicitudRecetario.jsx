import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import { formatearFechaCorta } from '@/shared/utils/fecha'

export default function DatosSolicitudRecetario({ solicitud, onCambio }) {
  return (
    <Card as="section" className="space-y-4">
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
          <Icon name="assignment" className="text-[20px]" />
        </span>
        <div>
          <h3 className="text-headline-sm text-on-surface">Datos de la solicitud</h3>
          <p className="text-body-sm text-on-surface-variant">
            Los campos marcados con * son obligatorios para imprimir.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6 sm:col-span-3">
          <Input
            label="Cama *"
            name="cama"
            value={solicitud.cama}
            onChange={(evento) => onCambio('cama', evento.target.value)}
            autoFocus
            inputMode="numeric"
          />
        </div>
        <div className="col-span-12 sm:col-span-5">
          <Input
            label="Servicio *"
            name="servicio"
            value={solicitud.servicio}
            onChange={(evento) => onCambio('servicio', evento.target.value)}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <Input
            label="Fecha *"
            name="fecha"
            type="date"
            value={solicitud.fecha}
            onChange={(evento) => onCambio('fecha', evento.target.value)}
            hint={formatearFechaCorta(solicitud.fecha)}
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Diagnóstico *"
            name="diagnostico"
            value={solicitud.diagnostico}
            onChange={(evento) => onCambio('diagnostico', evento.target.value)}
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Nombre del médico *"
            name="medicoNombre"
            value={solicitud.medicoNombre}
            onChange={(evento) => onCambio('medicoNombre', evento.target.value)}
          />
        </div>
      </div>

      <p className="text-label-sm text-on-surface-variant">
        La firma del médico se realizará en el formato impreso.
      </p>
    </Card>
  )
}
