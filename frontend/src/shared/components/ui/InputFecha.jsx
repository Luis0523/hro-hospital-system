import { useEffect, useState } from 'react'

// Campo de fecha en formato dd/mm/aaaa (independiente del idioma del navegador,
// que en `<input type="date">` fuerza mm/dd/yyyy si el navegador está en inglés).
// Se acepta teclear los dígitos con las barras; al completar una fecha válida se
// emite el valor ISO (YYYY-MM-DD) por `onChange`.

function isoADdMmAaaa(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

function ddMmAaaaAIso(texto) {
  const coincidencia = String(texto).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!coincidencia) return null
  const [, dia, mes, anio] = coincidencia
  const d = Number(dia)
  const m = Number(mes)
  if (d < 1 || d > 31 || m < 1 || m > 12) return null
  return `${anio}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function InputFecha({ label, value, onChange, className = '', id, ...props }) {
  const inputId = id || props.name
  const [texto, setTexto] = useState(() => isoADdMmAaaa(value))

  // Sincroniza cuando el valor ISO cambia desde afuera.
  useEffect(() => {
    setTexto(isoADdMmAaaa(value))
  }, [value])

  function manejarCambio(evento) {
    const siguiente = evento.target.value
    setTexto(siguiente)
    // Acepta dd/mm/aaaa (tecleado) o ISO YYYY-MM-DD (pegado/programático).
    const iso = ddMmAaaaAIso(siguiente) ?? (/^\d{4}-\d{2}-\d{2}$/.test(siguiente) ? siguiente : null)
    if (iso) onChange?.(iso)
  }

  return (
    <label className="block space-y-1" htmlFor={inputId}>
      {label && <span className="block text-sm font-medium text-on-surface">{label}</span>}
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        value={texto}
        onChange={manejarCambio}
        className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim ${className}`}
        {...props}
      />
    </label>
  )
}
