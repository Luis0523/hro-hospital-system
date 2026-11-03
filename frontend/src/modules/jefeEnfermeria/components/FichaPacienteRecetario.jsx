import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import { calcularEdad } from '@/shared/utils/fecha'

function mostrar(valor) {
  if (valor == null || String(valor).trim() === '') return 'No registrado'
  return valor
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</dt>
      <dd className="truncate text-title-sm text-on-surface">{mostrar(valor)}</dd>
    </div>
  )
}

export default function FichaPacienteRecetario({ paciente, solicitud, onCambio }) {
  if (!paciente) return null

  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const edad = calcularEdad(paciente.fechaNacimiento)

  return (
    <Card as="section" className="space-y-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-container">
          <Icon name="person" className="text-[24px]" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-headline-sm text-on-surface">{mostrar(nombre)}</h3>
          <p className="text-body-sm text-on-surface-variant">Paciente localizado</p>
        </div>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Dato etiqueta="Número de registro / expediente" valor={paciente.numeroExpediente} />
        <Dato etiqueta="Edad" valor={edad != null ? `${edad} años` : null} />
        <Dato etiqueta="Teléfono" valor={paciente.telefono} />
      </dl>

      <div className="space-y-3 border-t border-outline-variant pt-4">
        <div>
          <h4 className="text-title-md text-on-surface">Datos de la solicitud</h4>
          <p className="text-body-sm text-on-surface-variant">
            Complete los datos manuales del formato.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Cama"
            name="cama"
            value={solicitud.cama}
            onChange={(evento) => onCambio('cama', evento.target.value)}
          />
          <Input
            label="Servicio"
            name="servicio"
            value={solicitud.servicio}
            onChange={(evento) => onCambio('servicio', evento.target.value)}
          />
          <Input
            label="Diagnóstico"
            name="diagnostico"
            value={solicitud.diagnostico}
            onChange={(evento) => onCambio('diagnostico', evento.target.value)}
            className="sm:col-span-2"
          />
          <Input
            label="Fecha"
            name="fecha"
            type="date"
            value={solicitud.fecha}
            onChange={(evento) => onCambio('fecha', evento.target.value)}
          />
          <Input
            label="Nombre del médico"
            name="medicoNombre"
            value={solicitud.medicoNombre}
            onChange={(evento) => onCambio('medicoNombre', evento.target.value)}
          />
        </div>

        <p className="text-label-sm text-on-surface-variant">
          La firma del médico se realizará en el formato impreso.
        </p>
      </div>
    </Card>
  )
}
