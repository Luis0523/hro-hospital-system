import Alert from '@/shared/components/ui/Alert.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useLoteCoex } from '../hooks/useLoteCoex'
import ResumenLoteCoex from '../components/ResumenLoteCoex.jsx'
import SeccionLoteCoex from '../components/SeccionLoteCoex.jsx'

// Mesa COEX — Fase 1 (solo lectura). Carga el lote de la estación activa para
// la fecha de trabajo y lo separa en "Pendientes de recibir" y "En uso".
// No incluye transiciones, checklist, PDF ni actas.
export default function MesaCoexPage() {
  const {
    estacion,
    fecha,
    setFecha,
    subespecialidades,
    pendientesRecibir,
    enUso,
    total,
    cargando,
    error,
  } = useLoteCoex()

  return (
    <div className="min-h-screen bg-surface pb-10">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="folder_shared" className="text-[26px]" />
          </span>
          <div className="leading-tight">
            <p className="text-label-sm uppercase tracking-widest text-secondary">
              Hospital Regional de Occidente
            </p>
            <h1 className="text-headline-md text-on-surface">Mesa COEX</h1>
          </div>
          {estacion && (
            <div className="ml-auto text-right leading-tight">
              <p className="text-title-sm text-on-surface">{estacion.nombre ?? estacion.codigo}</p>
              <p className="text-label-sm uppercase text-on-surface-variant">
                {estacion.codigo}
                {estacion.ubicacion ? ` · ${estacion.ubicacion}` : ''}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="max-w-xs">
          <Input
            label="Fecha de trabajo"
            type="date"
            name="fecha"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
          />
        </div>

        {!estacion ? (
          <Alert tone="warning" title="Sin estación activa">
            Seleccione una estación de enfermería para cargar el lote de expedientes.
          </Alert>
        ) : cargando ? (
          <Spinner label="Cargando lote de la estación..." />
        ) : error ? (
          <Alert tone="error" title="No se pudo cargar el lote">
            {error.message || 'Error de comunicación con el servidor.'}
          </Alert>
        ) : total === 0 ? (
          <EmptyState
            title="Sin expedientes para la fecha seleccionada"
            description={
              subespecialidades.length === 0
                ? 'La estación no tiene subespecialidades activas para esta fecha.'
                : 'No hay citas con expediente registradas en las áreas de la estación.'
            }
          />
        ) : (
          <>
            <ResumenLoteCoex
              total={total}
              pendientesRecibir={pendientesRecibir.length}
              enUso={enUso.length}
            />
            <SeccionLoteCoex
              titulo="Pendientes de recibir"
              descripcion="Expedientes despachados por Archivo, en tránsito hacia la estación."
              filas={pendientesRecibir}
              vacio={{
                title: 'Sin pendientes de recibir',
                description: 'No hay expedientes en tránsito hacia la estación.',
              }}
            />
            <SeccionLoteCoex
              titulo="En uso"
              descripcion="Expedientes recibidos por la estación y actualmente en consulta."
              filas={enUso}
              vacio={{
                title: 'Sin expedientes en uso',
                description: 'No hay expedientes recibidos actualmente.',
              }}
            />
          </>
        )}
      </main>
    </div>
  )
}
