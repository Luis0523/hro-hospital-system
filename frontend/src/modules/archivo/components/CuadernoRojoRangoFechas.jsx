import { useEffect, useState } from 'react'
import { Button, Icon, Input } from '@/shared/components/ui'
import { aplicarMascaraFecha, formatearFechaTexto, validarRangoFechas } from '../utils/rangoFechas'

/**
 * Filtro por rango de fechas. Los campos aceptan solo dígitos y aplican la
 * máscara dd/mm/aaaa; la API recibe siempre fechas ISO.
 */
export default function CuadernoRojoRangoFechas({
  filtros,
  onAplicar,
  onRestablecer,
  cargando = false,
}) {
  const [textoDesde, setTextoDesde] = useState(() => formatearFechaTexto(filtros?.desde))
  const [textoHasta, setTextoHasta] = useState(() => formatearFechaTexto(filtros?.hasta))
  const [errores, setErrores] = useState({})

  useEffect(() => {
    setTextoDesde(formatearFechaTexto(filtros?.desde))
    setTextoHasta(formatearFechaTexto(filtros?.hasta))
    setErrores({})
  }, [filtros?.desde, filtros?.hasta])

  function cambiarDesde(evento) {
    setTextoDesde(aplicarMascaraFecha(evento.target.value))
    setErrores((actuales) => ({ ...actuales, desde: undefined }))
  }

  function cambiarHasta(evento) {
    setTextoHasta(aplicarMascaraFecha(evento.target.value))
    setErrores((actuales) => ({ ...actuales, hasta: undefined }))
  }

  function aplicar(evento) {
    evento?.preventDefault()
    const revision = validarRangoFechas(textoDesde, textoHasta)
    if (!revision.valido) {
      setErrores(revision.errores)
      return
    }
    setErrores({})
    onAplicar?.({ desde: revision.desde, hasta: revision.hasta })
  }

  function restablecer() {
    setErrores({})
    onRestablecer?.()
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="w-full sm:w-40">
        <Input
          id="cuaderno-rojo-desde"
          name="desde"
          label="Desde"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="dd/mm/aaaa"
          value={textoDesde}
          error={errores.desde}
          onChange={cambiarDesde}
          className="min-h-11 text-base tabular-nums sm:text-sm"
        />
      </div>

      <div className="w-full sm:w-40">
        <Input
          id="cuaderno-rojo-hasta"
          name="hasta"
          label="Hasta"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="dd/mm/aaaa"
          value={textoHasta}
          error={errores.hasta}
          onChange={cambiarHasta}
          className="min-h-11 text-base tabular-nums sm:text-sm"
        />
      </div>

      <Button
        type="button"
        onClick={aplicar}
        disabled={cargando}
        className="min-h-11 w-full sm:w-auto"
      >
        <Icon name="filter_alt" className="text-[18px]" />
        Aplicar filtro
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={restablecer}
        disabled={cargando}
        className="min-h-11 w-full sm:w-auto"
      >
        <Icon name="restart_alt" className="text-[18px]" />
        Restablecer
      </Button>
    </div>
  )
}
