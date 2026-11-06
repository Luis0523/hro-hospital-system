import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Campo de fecha en formato dd/mm/aaaa (independiente del idioma del navegador,
// que en `<input type="date">` fuerza mm/dd/yyyy si el navegador está en inglés).
// Aplica la máscara mientras se escribe y emite el valor ISO (YYYY-MM-DD) por
// `onChange` cuando la fecha es válida. `soloInput` devuelve únicamente el input
// para integrarlo en barras compactas.

function isoATexto(iso) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!coincidencia) return ''
  return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`
}

function formatearDigitos(valor) {
  const digitos = String(valor ?? '')
    .replace(/\D/g, '')
    .slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

function posicionParaDigitos(texto, cantidad) {
  if (cantidad <= 0) return 0
  let vistos = 0
  for (let indice = 0; indice < texto.length; indice += 1) {
    if (/\d/.test(texto[indice])) {
      vistos += 1
      if (vistos === cantidad) return indice + 1
    }
  }
  return texto.length
}

function textoAIso(texto) {
  const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto ?? ''))
  if (!coincidencia) return ''
  const [, dia, mes, anio] = coincidencia
  const d = Number(dia)
  const m = Number(mes)
  const a = Number(anio)
  if (d < 1 || m < 1 || m > 12) return ''
  const fecha = new Date(Date.UTC(a, m - 1, d))
  if (
    fecha.getUTCFullYear() !== a ||
    fecha.getUTCMonth() !== m - 1 ||
    fecha.getUTCDate() !== d
  ) {
    return ''
  }
  return `${anio}-${mes}-${dia}`
}

export default function InputFecha({
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
  const inputRef = useRef(null)
  const [texto, setTexto] = useState(() => isoATexto(value))
  const [seleccion, setSeleccion] = useState(null)

  useEffect(() => {
    setTexto(isoATexto(value))
  }, [value])

  useEffect(() => {
    const isoDelTexto = textoAIso(texto)
    if (isoDelTexto && isoDelTexto !== value) {
      setTexto(isoATexto(value))
      setSeleccion(null)
    }
  }, [texto, value])

  useLayoutEffect(() => {
    if (seleccion == null || !inputRef.current) return
    inputRef.current.setSelectionRange(seleccion, seleccion)
    setSeleccion(null)
  }, [texto, seleccion])

  function emitir(textoActual) {
    const iso = textoAIso(textoActual)
    if (iso) onChange?.(iso)
  }

  function manejarCambio(evento) {
    const entrada = evento.target
    const isoPegado = /^\d{4}-\d{2}-\d{2}$/.test(entrada.value) ? entrada.value : null
    if (isoPegado) {
      setTexto(isoATexto(isoPegado))
      onChange?.(isoPegado)
      return
    }

    const cursor = entrada.selectionStart ?? entrada.value.length
    const digitosAntes = entrada.value.slice(0, cursor).replace(/\D/g, '').length
    const digitos = entrada.value.replace(/\D/g, '').slice(0, 8)
    const formateado = formatearDigitos(digitos)

    setTexto(formateado)
    setSeleccion(posicionParaDigitos(formateado, digitosAntes))

    if (!digitos) {
      onChange?.('')
      return
    }
    emitir(formateado)
  }

  function manejarTecla(evento) {
    if (evento.key !== 'Backspace') return
    const entrada = evento.target
    if (entrada.selectionStart !== entrada.selectionEnd) return
    const cursor = entrada.selectionStart ?? 0
    if (texto[cursor - 1] !== '/') return

    evento.preventDefault()
    const digitos = texto.replace(/\D/g, '')
    const indiceDigito = texto.slice(0, cursor).replace(/\D/g, '').length
    const siguientes = digitos.slice(0, Math.max(0, indiceDigito - 1)) + digitos.slice(indiceDigito)
    const formateado = formatearDigitos(siguientes)

    setTexto(formateado)
    setSeleccion(posicionParaDigitos(formateado, Math.max(0, indiceDigito - 1)))
    emitir(formateado)
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
      ref={inputRef}
      id={inputId}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      value={texto}
      onChange={manejarCambio}
      onKeyDown={manejarTecla}
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
