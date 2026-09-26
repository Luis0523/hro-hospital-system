import { useEffect, useState } from 'react'
import Icon from '@/shared/components/ui/Icon.jsx'

function formatearHora(fecha) {
  return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EncabezadoTablero({ children }) {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 bg-primary px-6 py-4 text-on-primary">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-on-primary/15">
          <Icon name="local_hospital" className="text-[32px]" />
        </div>
        <div className="leading-tight">
          <p className="text-label-md uppercase tracking-[0.3em] text-on-primary/70">
            Hospital Regional de Occidente
          </p>
          <h1 className="text-headline-lg uppercase">Consulta Externa · Turnos</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right leading-tight">
          <p className="text-headline-lg tabular-nums">{formatearHora(ahora)}</p>
          <p className="text-label-md capitalize text-on-primary/80">{formatearFecha(ahora)}</p>
        </div>
        {children}
      </div>
    </header>
  )
}
