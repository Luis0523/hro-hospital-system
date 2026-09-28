import { Link } from 'react-router-dom'

export default function EstacionNoDisponible({ nombre }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
          Sistema Hospitalario HRO
        </p>
        <h1 className="text-3xl font-bold text-primary">{nombre}</h1>
        <p className="text-on-surface-variant">Módulo planificado, aún no implementado.</p>
        <Link
          to="/enfermeria"
          className="inline-block rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:brightness-110"
        >
          Ir a Estación de Enfermería
        </Link>
      </div>
    </div>
  )
}
