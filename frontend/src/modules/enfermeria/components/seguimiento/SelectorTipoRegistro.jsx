import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/components/ui'
import { TIPOS_REGISTRO } from '../../api/seguimientoApi'
import { CHIPS_REGISTRO } from './estilosEtapas'

const OPCIONES = TIPOS_REGISTRO.map((tipo) => ({ ...tipo, clave: tipo.id }))

const ESTILOS_ACTIVOS = CHIPS_REGISTRO

// Selector exclusivo: una sola opción puede quedar activa.
export default function SelectorTipoRegistro({
  valor,
  onCambiar,
  etiqueta = 'Tipo de registro',
  deshabilitado = false,
  className = '',
  focusToken = 0,
  onSaltarACasillas,
}) {
  const primerBotonRef = useRef(null)
  const botonesRef = useRef([])

  useEffect(() => {
    if (focusToken > 0) primerBotonRef.current?.focus()
  }, [focusToken])

  function manejarTeclas(evento) {
    if (evento.key === 'ArrowDown') {
      if (!onSaltarACasillas) return
      evento.preventDefault()
      evento.stopPropagation()
      onSaltarACasillas()
      return
    }

    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return

    evento.preventDefault()
    evento.stopPropagation()
    const actual = botonesRef.current.findIndex((boton) => boton === document.activeElement)
    const indiceValor = OPCIONES.findIndex((opcion) => opcion.id === valor)
    const base = actual >= 0 ? actual : Math.max(indiceValor, 0)
    const salto = evento.key === 'ArrowRight' ? 1 : -1
    const siguiente = (base + salto + OPCIONES.length) % OPCIONES.length
    botonesRef.current[siguiente]?.focus()
  }

  return (
    <div
      role="group"
      aria-label={etiqueta}
      onKeyDownCapture={manejarTeclas}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {OPCIONES.map((opcion, indice) => {
        const activo = valor === opcion.id
        return (
          <button
            key={opcion.clave}
            ref={(elemento) => {
              botonesRef.current[indice] = elemento
              if (indice === 0) primerBotonRef.current = elemento
            }}
            type="button"
            aria-pressed={activo}
            disabled={deshabilitado}
            onClick={() => onCambiar(opcion.id)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-label-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-50 ${
              activo
                ? ESTILOS_ACTIVOS[opcion.clave]
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Icon name={opcion.icono} className="text-[16px]" />
            {opcion.nombre}
          </button>
        )
      })}
    </div>
  )
}
