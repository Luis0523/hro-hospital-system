import EspecialidadesTab from '@/modules/administracion/components/EspecialidadesTab.jsx'

// El jefe de enfermería administra el catálogo de especialidades (nombre y
// abreviatura). La abreviatura es la sigla que aparece en el correlativo del
// carnet (p. ej. PED-3). Reutiliza el CRUD ya existente del panel admin.
export default function EspecialidadesPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-headline-md text-on-surface">Especialidades</h2>
        <p className="text-sm text-on-surface-variant">
          Agregue o edite especialidades, su abreviatura y el correlativo máximo diario. Medicina
          Interna usa 100 y las demás 18 por defecto; puede ajustarlo cuando lo necesite.
        </p>
      </header>
      <EspecialidadesTab conBuscador />
    </section>
  )
}
