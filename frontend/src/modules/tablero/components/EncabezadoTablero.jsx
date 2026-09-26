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
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-primary px-4 py-2 text-on-primary md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-on-primary/15">
          <Icon name="local_hospital" className="text-[24px]" />
        </div>
        <div className="leading-tight">
          <p className="text-label-sm uppercase tracking-[0.3em] text-on-primary/70">
            Hospital Regional de Occidente
          </p>
          <h1 className="text-headline-md uppercase">Consulta Externa · Turnos</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="text-right leading-tight">
          <p className="text-headline-md tabular-nums">{formatearHora(ahora)}</p>
          <p className="text-label-sm capitalize text-on-primary/80">{formatearFecha(ahora)}</p>
        </div>
        {children}
      </div>
    </header>
  )
}
