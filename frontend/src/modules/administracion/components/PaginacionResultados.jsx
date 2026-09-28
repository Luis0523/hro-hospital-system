import Button from '@/shared/components/ui/Button.jsx'

/**
 * Paginación presentacional. No calcula totales: recibe la página actual (base 0),
 * el total de páginas y los límites `first`/`last` tal como los entrega el backend.
 */
export default function PaginacionResultados({
  pagina = 0,
  totalPaginas = 0,
  esPrimera = true,
  esUltima = true,
  onAnterior,
  onSiguiente,
  deshabilitado = false,
}) {
  if (!totalPaginas || totalPaginas < 1) return null

  const actual = Number(pagina) + 1

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <Button
        size="sm"
        variant="secondary"
        onClick={onAnterior}
        disabled={deshabilitado || esPrimera}
      >
        Anterior
      </Button>

      <p aria-live="polite" className="text-sm text-on-surface-variant">
        Página {actual} de {totalPaginas}
      </p>

      <Button
        size="sm"
        variant="secondary"
        onClick={onSiguiente}
        disabled={deshabilitado || esUltima}
      >
        Siguiente
      </Button>
    </nav>
  )
}
