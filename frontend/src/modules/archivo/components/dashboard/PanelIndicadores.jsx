import TarjetaMetrica from './TarjetaMetrica.jsx'
import { formatearMinutos, promedioLocalizacion, totalEstado } from '../../utils/metricasArchivo'

// Grid de indicadores del dashboard. Presentacional: recibe `estadisticas`
// (forma del contrato) y deriva las tarjetas. No llama a la API.
export default function PanelIndicadores({ estadisticas }) {
  if (!estadisticas) return null

  const { totales = {}, porEstado = [], permanencia = [] } = estadisticas
  const pendientesLocalizar = totalEstado(porEstado, 'pendiente_localizar')
  const enBusqueda = totalEstado(porEstado, 'en_busqueda')
  const tiempoLocalizacion = promedioLocalizacion(permanencia)

  const indicadores = [
    {
      clave: 'total',
      etiqueta: 'Total de ciclos',
      valor: totales.totalCiclos ?? 0,
      icono: 'folder_managed',
    },
    {
      clave: 'nuevos',
      etiqueta: 'Expedientes nuevos',
      valor: totales.expedientesNuevos ?? 0,
      icono: 'fiber_new',
    },
    {
      clave: 'pendientes',
      etiqueta: 'Pendientes de localizar',
      valor: pendientesLocalizar,
      icono: 'search',
    },
    {
      clave: 'en-curso',
      etiqueta: 'En búsqueda / En tránsito',
      valor: enBusqueda + (totales.enTransito ?? 0),
      icono: 'travel_explore',
    },
    {
      clave: 'entregados',
      etiqueta: 'Entregados',
      valor: totales.entregado ?? 0,
      icono: 'check_circle',
    },
    {
      clave: 'archivados',
      etiqueta: 'Archivados',
      valor: totales.archivado ?? 0,
      icono: 'inventory',
    },
    {
      clave: 'no-localizados',
      etiqueta: 'No localizados',
      valor: totales.noLocalizado ?? 0,
      icono: 'error',
      variante: 'excepcion',
    },
  ]

  if (tiempoLocalizacion != null) {
    indicadores.push({
      clave: 'tiempo',
      etiqueta: 'Tiempo promedio de localización',
      valor: formatearMinutos(tiempoLocalizacion),
      icono: 'timer',
    })
  }

  return (
    <section aria-label="Indicadores del dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => (
          <TarjetaMetrica
            key={indicador.clave}
            testId={`metrica-${indicador.clave}`}
            etiqueta={indicador.etiqueta}
            valor={indicador.valor}
            icono={indicador.icono}
            variante={indicador.variante}
          />
        ))}
      </div>
    </section>
  )
}
