import { useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import { formatearFechaLarga, formatearFechaHora } from '../utils/fechas.js'

const MAX_MOTIVO = 200

/**
 * Formulario de alta y detalle de un día no laborable.
 * El conflicto con citas y la unicidad de fecha los decide el backend; aquí solo
 * se validan campos y se presenta la respuesta funcionalmente.
 */
export default function DiaNoLaborableForm({
  modo = 'crear',
  fechaInicial = '',
  registro = null,
  errorFecha = null,
  alerta = null,
  onSubmit,
}) {
  const [fecha, setFecha] = useState(fechaInicial)
  const [motivo, setMotivo] = useState('')
  const [errores, setErrores] = useState({})

  const soloLectura = modo === 'consultar'

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const nuevosErrores = {}
    if (!fecha) nuevosErrores.fecha = 'La fecha es obligatoria'
    const motivoLimpio = motivo.trim()
    if (!motivoLimpio) {
      nuevosErrores.motivo = 'El motivo es obligatorio'
    } else if (motivoLimpio.length > MAX_MOTIVO) {
      nuevosErrores.motivo = `El motivo no puede exceder ${MAX_MOTIVO} caracteres`
    }
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return
    onSubmit?.({ fecha, motivo: motivoLimpio })
  }

  if (soloLectura) {
    return (
      <dl className="space-y-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Fecha</dt>
          <dd className="text-slate-700">{formatearFechaLarga(registro?.fecha)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Motivo</dt>
          <dd className="text-slate-700">{registro?.motivo}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Registrado por</dt>
          <dd className="text-slate-700">{registro?.creadoPorNombre || 'No disponible'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Fecha de registro</dt>
          <dd className="text-slate-700">
            {formatearFechaHora(registro?.creadoEn) || 'No disponible'}
          </dd>
        </div>
      </dl>
    )
  }

  return (
    <form id="form-catalogo" className="space-y-4" onSubmit={manejarEnvio} noValidate>
      {alerta && (
        <Alert tone={alerta.tone ?? 'warning'} title={alerta.title}>
          <p>{alerta.mensaje}</p>
        </Alert>
      )}

      <Input
        id="fecha"
        name="fecha"
        type="date"
        label="Fecha"
        value={fecha}
        onChange={(evento) => setFecha(evento.target.value)}
        error={errores.fecha || errorFecha}
        hint="Fecha que dejará de estar disponible para programación."
      />

      <Input
        id="motivo"
        name="motivo"
        type="text"
        label="Motivo"
        value={motivo}
        maxLength={MAX_MOTIVO}
        onChange={(evento) => setMotivo(evento.target.value)}
        error={errores.motivo}
        hint={`Máximo ${MAX_MOTIVO} caracteres.`}
      />
    </form>
  )
}
