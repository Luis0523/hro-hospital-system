import Alert from '@/shared/components/ui/Alert.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado } from '../../estadosExpediente'
import { separarExcepcion } from '../../utils/metricasArchivo'

// Bloque destacado de excepciones del dashboard (estados marcados como
// `excepcion` en estadosExpediente.js, p. ej. no_localizado). No mezcla las
// excepciones con la secuencia normal. Presentacional.
export default function BloqueExcepciones({ porEstado = [] }) {
  const { excepcion } = separarExcepcion(porEstado)
  const total = excepcion.reduce((acumulado, item) => acumulado + (item.total ?? 0), 0)

  if (total === 0) {
    return (
      <Alert tone="success" title="Sin excepciones en el rango">
        No hay expedientes marcados como no localizados.
      </Alert>
    )
  }

  return (
    <Alert tone="warning" title="Excepciones que requieren atención">
      <ul className="mt-1 space-y-1">
        {excepcion.map((item) => {
          const meta = metadatosEstado(item.estado)
          return (
            <li key={item.estado} className="flex items-center gap-2">
              <Icon name={meta.icono} className="text-[16px]" />
              <span>{meta.etiqueta}:</span>
              <span className="font-bold tabular-nums">{item.total}</span>
            </li>
          )
        })}
      </ul>
    </Alert>
  )
}
