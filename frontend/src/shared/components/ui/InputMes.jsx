import { useEffect, useState } from 'react'

// Campo de mes en formato mm/aaaa. Emite el valor ISO de período (YYYY-MM)
// por `onChange` cuando el mes es válido.

function valorATexto(valor) {
  const coincidencia = /^(\d{4})-(\d{2})$/.exec(String(valor ?? ''))
  if (!coincidencia) return ''
  return `${coincidencia[2]}/${coincidencia[1]}`
}

function formatearDigitos(valor) {
  const digitos = String(valor ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
}

function textoAValor(texto) {
  const coincidencia = /^(\d{2})\/(\d{4})$/.exec(String(texto ?? ''))
  if (!coincidencia) return ''
  const [, mes, anio] = coincidencia
  const m = Number(mes)
  if (m < 1 || m > 12) return ''
  return `${anio}-${mes}`
}

export default function InputMes({
  label,
  value,
  onChange,
  className = '',
  containerClassName = '',
  id,
  name,
  error,
  hint,
  disabled = false,
  soloInput = false,
  ...props
}) {
  const inputId = id || name
  const [texto, setTexto] = useState(() => valorATexto(value))

  useEffect(() => {
    setTexto(valorATexto(value))
  }, [value])

  useEffect(() => {
    const valorDelTexto = textoAValor(texto)
    if (valorDelTexto && valorDelTexto !== value) {
      setTexto(valorATexto(value))
    }
  }, [texto, value])

  function manejarCambio(evento) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, 6)
    const formateado = formatearDigitos(digitos)
    setTexto(formateado)

    if (!digitos) {
      onChange?.('')
      return
    }
    const valorMes = textoAValor(formateado)
    if (valorMes) onChange?.(valorMes)
  }

  const clases = soloInput
    ? `rounded-md bg-transparent outline-none ${className}`
    : `w-full rounded-lg border bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-secondary-fixed-dim ${
        error
          ? 'border-error focus:border-error'
          : 'border-outline-variant focus:border-primary-container'
      } ${className}`

  const campo = (
    <input
      {...props}
      id={inputId}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="mm/aaaa"
      maxLength={7}
      value={texto}
      onChange={manejarCambio}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={clases}
    />
  )

  if (soloInput) return campo

  return (
    <label className={`block space-y-1 ${containerClassName}`} htmlFor={inputId}>
      {label && <span className="block text-sm font-medium text-on-surface">{label}</span>}
      {campo}
      {hint && !error && <span className="block text-xs text-on-surface-variant">{hint}</span>}
      {error && <span className="block text-xs text-error">{error}</span>}
    </label>
  )
}
