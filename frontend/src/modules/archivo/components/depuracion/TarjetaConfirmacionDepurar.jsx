import { Alert, Button, Icon, Input } from '@/shared/components/ui'

// Confirmación de baja lógica: muestra el paciente encontrado y permite
// registrar un motivo opcional antes de marcar el expediente como depurado.
export default function TarjetaConfirmacionDepurar({
  expediente,
  motivo,
  onMotivo,
  onConfirmar,
  procesando,
  yaDepurado = false,
}) {
  if (!expediente) return null

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="person_search" className="text-[22px]" />
        </span>
        <dl className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-label-sm uppercase text-on-surface-variant">Paciente</dt>
            <dd className="truncate font-semibold text-on-surface">
              {expediente.pacienteNombre || 'Paciente sin nombre'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-label-sm uppercase text-on-surface-variant">Expediente</dt>
            <dd className="font-mono font-bold text-primary">{expediente.numeroExpediente}</dd>
          </div>
        </dl>
      </div>

      {yaDepurado ? (
        <Alert tone="warning" title="Expediente ya depurado">
          Este expediente figura como “ya no existe en el sistema”.
        </Alert>
      ) : (
        <>
          <Alert tone="warning" title="Confirmación requerida">
            Este expediente quedará marcado como <strong>no existente</strong> en el sistema.
          </Alert>

          <Input
            label="Motivo (opcional)"
            name="motivo-depuracion"
            value={motivo}
            onChange={(event) => onMotivo(event.target.value)}
            placeholder="Ej. extraviado definitivamente, fusionado…"
          />

          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={onConfirmar}
            disabled={procesando}
          >
            <Icon name="delete_forever" className="text-[24px]" />
            {procesando ? 'Marcando…' : 'Marcar como depurado'}
          </Button>
        </>
      )}
    </section>
  )
}
