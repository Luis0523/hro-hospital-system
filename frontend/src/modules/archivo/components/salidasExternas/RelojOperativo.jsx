import { useEffect, useState } from 'react'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  formatearFechaLargaGuatemala,
  horaConSegundosGuatemalaDe,
} from '../../utils/fechaGuatemala'

/**
 * Reloj de la estación: día de la semana, fecha completa y hora con segundos en
 * America/Guatemala. Aislado en su propio componente para que el tick de cada
 * segundo no vuelva a renderizar la pantalla completa.
 */
export default function RelojOperativo({ className = '' }) {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  const fecha = formatearFechaLargaGuatemala(ahora)
  const hora = horaConSegundosGuatemalaDe(ahora)

  return (
    <p
      title="Hora de Guatemala (America/Guatemala)"
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-label-md text-on-surface-variant ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <Icon name="schedule" className="text-[16px] text-secondary" />
        {fecha}
      </span>
      <span
        className="font-mono font-semibold tabular-nums text-on-surface"
        aria-label="Hora actual"
      >
        {hora}
      </span>
    </p>
  )
}
