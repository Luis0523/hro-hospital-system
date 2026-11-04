import Button from '@/shared/components/ui/Button.jsx'
import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

function mostrar(valor) {
  if (valor == null || String(valor).trim() === '') return 'No registrado'
  return valor
}

export default function FichaPacienteRecetario({ paciente, onCambiar }) {
  if (!paciente) return null

  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()

  return (
    <Card as="section" className="border-emerald-200 bg-emerald-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check_circle" className="text-[26px]" />
          </span>
          <div className="min-w-0">
            <p className="text-label-sm uppercase tracking-wide text-emerald-700">
              Paciente localizado
            </p>
            <h3 className="truncate text-headline-md text-on-surface">{mostrar(nombre)}</h3>
            <p className="text-body-md text-on-surface-variant">
              Expediente {mostrar(paciente.numeroExpediente)}
            </p>
          </div>
        </div>
        {onCambiar && (
          <Button variant="secondary" onClick={onCambiar} className="shrink-0">
            <Icon name="person_search" className="text-[18px]" />
            Cambiar paciente
          </Button>
        )}
      </div>
    </Card>
  )
}
