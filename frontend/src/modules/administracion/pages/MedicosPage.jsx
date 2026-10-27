import MedicosTab from '../components/MedicosTab.jsx'

export default function MedicosPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-primary">Médicos</h2>
        <p className="text-sm text-on-surface-variant">
          Registro de médicos con nombre y número de colegiado. Se usan para identificar al
          profesional en clínicas y turnos.
        </p>
      </header>

      <MedicosTab />
    </section>
  )
}
