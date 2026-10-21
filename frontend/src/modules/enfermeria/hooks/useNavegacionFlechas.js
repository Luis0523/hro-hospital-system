import { useEffect } from 'react'

const SELECTOR =
  'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const DIRECCIONES = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

function centro(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

// Elige el elemento más cercano en la dirección de la flecha, priorizando
// que permanezca en la misma fila o columna.
export function elegirCandidato(rectActual, candidatos, direccion) {
  const [dirX, dirY] = DIRECCIONES[direccion] ?? [0, 0]
  if (!dirX && !dirY) return null

  const origen = centro(rectActual)
  let mejor = null
  let mejorPuntaje = Number.POSITIVE_INFINITY

  for (const candidato of candidatos) {
    const destino = centro(candidato.rect)
    const dx = destino.x - origen.x
    const dy = destino.y - origen.y
    const avance = dx * dirX + dy * dirY
    if (avance <= 1) continue

    const desvio = Math.abs(dirX ? dy : dx)
    const puntaje = avance + desvio * 2.5

    if (puntaje < mejorPuntaje) {
      mejorPuntaje = puntaje
      mejor = candidato.elemento
    }
  }

  return mejor
}

// Navegación espacial con las flechas dentro de un contenedor.
export function useNavegacionFlechas(ref) {
  useEffect(() => {
    const contenedor = ref.current
    if (!contenedor) return undefined

    function manejarTecla(evento) {
      if (!(evento.key in DIRECCIONES)) return
      if (evento.defaultPrevented) return
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return

      const objetivo = evento.target
      if (
        objetivo instanceof Element &&
        objetivo.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }

      const actual = document.activeElement
      if (!(actual instanceof HTMLElement) || !contenedor.contains(actual)) return

      const candidatos = Array.from(contenedor.querySelectorAll(SELECTOR))
        .filter(
          (elemento) =>
            elemento !== actual &&
            !elemento.hasAttribute('disabled') &&
            elemento.getAttribute('aria-hidden') !== 'true',
        )
        .map((elemento) => ({ elemento, rect: elemento.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 || rect.height > 0)

      const destino = elegirCandidato(actual.getBoundingClientRect(), candidatos, evento.key)
      if (!destino) return

      evento.preventDefault()
      destino.focus()
      destino.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }

    contenedor.addEventListener('keydown', manejarTecla)
    return () => contenedor.removeEventListener('keydown', manejarTecla)
  }, [ref])
}
