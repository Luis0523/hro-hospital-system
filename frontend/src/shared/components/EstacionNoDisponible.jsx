import { Link } from 'react-router-dom'

export default function EstacionNoDisponible({ nombre }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-hro-celeste">
          Sistema Hospitalario HRO
        </p>
        <h1 className="text-3xl font-bold text-hro-blue">{nombre}</h1>
        <p className="text-slate-500">Módulo planificado, aún no implementado.</p>
        <Link
          to="/enfermeria"
          className="inline-block rounded-lg bg-hro-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Ir a Estación de Enfermería
        </Link>
      </div>
    </div>
  )
}
