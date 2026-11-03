import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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

function aIso(digitos) {
  if (digitos.length !== 8) return ''
  return `${digitos.slice(4)}-${digitos.slice(2, 4)}-${digitos.slice(0, 2)}`
}

export default function CampoFechaDepuracion({
  label,
  value,
  onChange,
  name,
  id,
  error = false,
  describedBy,
  ...props
}) {
  const inputRef = useRef(null)
  const [texto, setTexto] = useState(() => isoATexto(value))
  const [seleccion, setSeleccion] = useState(null)

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return
    setTexto(isoATexto(value))
  }, [value])

  useLayoutEffect(() => {
    if (seleccion == null || !inputRef.current) return
    inputRef.current.setSelectionRange(seleccion, seleccion)
    setSeleccion(null)
  }, [texto, seleccion])

  function emitir(digitos) {
    onChange?.(aIso(digitos))
  }

  function manejarCambio(evento) {
    const entrada = evento.target
    const cursor = entrada.selectionStart ?? entrada.value.length
    const digitosAntes = entrada.value.slice(0, cursor).replace(/\D/g, '').length
    const digitos = entrada.value.replace(/\D/g, '').slice(0, 8)
    const formateado = formatearDigitos(digitos)

    setTexto(formateado)
    setSeleccion(posicionParaDigitos(formateado, digitosAntes))
    emitir(digitos)
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
    emitir(siguientes)
  }

  const inputId = id || name

  return (
    <label className="block space-y-1" htmlFor={inputId}>
      {label && <span className="block text-sm font-medium text-on-surface">{label}</span>}
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
        aria-invalid={error}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-secondary-fixed-dim ${
          error
            ? 'border-error focus:border-error'
            : 'border-outline-variant focus:border-primary-container'
        }`}
      />
    </label>
  )
}
