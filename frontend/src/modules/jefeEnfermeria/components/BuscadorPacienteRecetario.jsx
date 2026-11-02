import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'

export default function BuscadorPacienteRecetario({
  expediente,
  onExpedienteChange,
  onBuscar,
  buscando = false,
}) {
  const puedeBuscar = Boolean(expediente.trim()) && !buscando

  return (
    <form
      onSubmit={onBuscar}
      className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <Input
          label="Número de expediente"
          name="numeroExpediente"
          value={expediente}
          onChange={(event) => onExpedienteChange(event.target.value)}
          placeholder="Ej. 30954"
          autoComplete="off"
          autoFocus
        />
      </div>
      <Button type="submit" disabled={!puedeBuscar} className="sm:mb-0.5">
        <Icon name="search" className="text-[18px]" />
        {buscando ? 'Buscando...' : 'Buscar'}
      </Button>
    </form>
  )
}
