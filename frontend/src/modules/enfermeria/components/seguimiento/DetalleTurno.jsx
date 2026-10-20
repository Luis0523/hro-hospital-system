import { Button, Icon } from '@/shared/components/ui'
import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

// Panel de detalle: etapa actual, clínica asignada y siguiente acción.
export default function DetalleTurno({ seleccion, especialidadNombre, onAccion, procesando }) {
  if (!seleccion) {
    return (
      <aside className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center">
        <Icon name="touch_app" className="text-[32px] text-primary" />
        <p className="text-title-sm text-on-surface">Seleccione un correlativo</p>
        <p className="text-body-sm text-on-surface-variant">
          Toque una casilla del libro para registrar un turno, recibirlo o gestionar su devolución.
        </p>
      </aside>
    )
  }

  const { codigo, numero, turno } = seleccion
  const id = `${codigo}-${String(numero).padStart(2, '0')}`
  const indice = turno ? ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa) : -1
  const siguiente = ETAPAS_SEGUIMIENTO[indice + 1]
  const finalizado = turno?.etapa === 'archivo'
  const estilo = estiloDeEtapa(turno?.etapa)
  const nombreEtapa = turno ? ETAPAS_SEGUIMIENTO[indice]?.nombre : null

  let textoAccion = 'Registrar turno'
  if (turno?.etapa === 'recibido') textoAccion = 'Asignar desde las clínicas ↓'
  else if (finalizado) textoAccion = 'Proceso completado'
  else if (turno) textoAccion = `Marcar: ${siguiente.nombre}`

  let pista = 'Registre el correlativo para comenzar el seguimiento.'
  if (turno?.etapa === 'recibido') {
    pista = 'Seleccione una clínica física en la franja inferior para registrar el reparto.'
  } else if (turno?.etapa === 'archivo') {
    pista = 'La devolución al Archivo está completada.'
  } else if (turno) {
    pista = `Siguiente paso: ${siguiente.nombre}.`
  }

  return (
    <aside
      aria-live="polite"
      className="flex min-h-[240px] flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
          Turno seleccionado
        </h2>
        <span className="rounded-md bg-surface-container-high px-2 py-1 text-label-sm text-on-surface">
          {String(numero).padStart(2, '0')}
        </span>
      </div>

      <div>
        <p className="text-metric-sub leading-none text-on-surface">{id}</p>
        <p className="mt-1 min-h-[32px] text-body-sm text-on-surface-variant">
          {especialidadNombre}
        </p>
      </div>

      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-bold ${estilo.fondo} ${estilo.texto}`}
      >
        <span className={`h-2 w-2 rounded-full ${estilo.punto}`} aria-hidden="true" />
        {nombreEtapa ?? 'Sin registrar'}
      </span>

      <div className="grid grid-cols-2 gap-2 border-y border-outline-variant py-2">
        <div>
          <span className="block text-label-sm text-on-surface-variant">Clínica asignada</span>
          <strong className="mt-0.5 block text-body-sm text-on-surface">
            {turno?.clinicaId ? `Clínica ${turno.clinicaId}` : 'Sin asignar'}
          </strong>
        </div>
        <div>
          <span className="block text-label-sm text-on-surface-variant">Etapa del proceso</span>
          <strong className="mt-0.5 block text-body-sm text-on-surface">
            {turno ? `${indice + 1} de 5` : 'Sin iniciar'}
          </strong>
        </div>
      </div>

      <p className="flex-1 text-body-sm leading-relaxed text-on-surface-variant">{pista}</p>

      <Button
        className="w-full"
        data-testid="accion-turno"
        onClick={onAccion}
        disabled={procesando || finalizado}
        aria-label={textoAccion}
      >
        {textoAccion}
      </Button>
    </aside>
  )
}
