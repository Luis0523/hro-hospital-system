import { useId } from 'react'
import { NOMBRES_MES } from '../utils/fechas.js'

const ANIOS_ANTES = 2
const ANIOS_DESPUES = 5

const CLASE_SELECT =
  'rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

function construirAnios(anioSeleccionado) {
  const base = new Date().getFullYear()
  const anios = []
  for (let anio = base - ANIOS_ANTES; anio <= base + ANIOS_DESPUES; anio += 1) {
    anios.push(anio)
  }
  // Incluye el año seleccionado si quedara fuera del rango dinámico.
  if (!anios.includes(anioSeleccionado)) {
    anios.push(anioSeleccionado)
    anios.sort((a, b) => a - b)
  }
  return anios
}

/**
 * Selector directo de mes y año para la navegación del calendario.
 * Usa <select> nativo con <label htmlFor> (accesible, navegable por teclado).
 */
export default function SelectorMesAnio({ anio, mes, onCambiarMes, onCambiarAnio, className = '' }) {
  const idMes = `selector-mes-${useId()}`
  const idAnio = `selector-anio-${useId()}`
  const anios = construirAnios(anio)

  return (
    <div className={`flex items-end justify-center gap-2 ${className}`}>
      <div className="space-y-1">
        <label
          htmlFor={idMes}
          className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
        >
          Mes
        </label>
        <select
          id={idMes}
          value={mes}
          onChange={(evento) => onCambiarMes(Number(evento.target.value))}
          className={CLASE_SELECT}
        >
          {NOMBRES_MES.map((nombre, indice) => (
            <option key={nombre} value={indice + 1}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={idAnio}
          className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
        >
          Año
        </label>
        <select
          id={idAnio}
          value={anio}
          onChange={(evento) => onCambiarAnio(Number(evento.target.value))}
          className={CLASE_SELECT}
        >
          {anios.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
