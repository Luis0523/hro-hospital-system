import { useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Input from '@/shared/components/ui/Input.jsx'

function formularioDesde(valores = {}) {
  return {
    nombre: valores.nombre ?? '',
    dosis: valores.dosis ?? '',
    via: valores.via ?? '',
    frecuencia: valores.frecuencia ?? '',
    fechaHoraInicio: valores.fechaHoraInicio ?? '',
    cantidadSolicitada:
      valores.cantidadSolicitada == null ? '' : String(valores.cantidadSolicitada),
  }
}

function validar(formulario) {
  const errores = {}

  if (!formulario.nombre.trim()) {
    errores.nombre = 'El medicamento es obligatorio.'
  }
  if (!formulario.dosis.trim()) {
    errores.dosis = 'La dosis es obligatoria.'
  }
  if (!formulario.via.trim()) {
    errores.via = 'La vía de administración es obligatoria.'
  }
  if (!formulario.frecuencia.trim()) {
    errores.frecuencia = 'La frecuencia es obligatoria.'
  }
  if (!formulario.fechaHoraInicio.trim()) {
    errores.fechaHoraInicio = 'La fecha y hora de inicio es obligatoria.'
  }

  const solicitada = formulario.cantidadSolicitada.trim()
  if (!solicitada) {
    errores.cantidadSolicitada = 'La cantidad solicitada es obligatoria.'
  } else if (!Number.isFinite(Number(solicitada)) || Number(solicitada) <= 0) {
    errores.cantidadSolicitada = 'La cantidad solicitada debe ser mayor que 0.'
  }

  return errores
}

export default function FormularioMedicamentoRecetario({
  valoresIniciales,
  textoAccion = 'Agregar',
  campoEnfoque = 'nombre',
  onGuardar,
  onCancelar,
}) {
  const [formulario, setFormulario] = useState(() => formularioDesde(valoresIniciales ?? {}))
  const [errores, setErrores] = useState({})
  const [guardarEnCatalogo, setGuardarEnCatalogo] = useState(true)

  function actualizar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    if (errores[campo]) {
      setErrores((actuales) => ({ ...actuales, [campo]: null }))
    }
  }

  function manejarEnvio(evento) {
    evento.preventDefault()
    const nuevosErrores = validar(formulario)

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    onGuardar({
      nombre: formulario.nombre.trim(),
      dosis: formulario.dosis.trim(),
      via: formulario.via.trim(),
      frecuencia: formulario.frecuencia.trim(),
      fechaHoraInicio: formulario.fechaHoraInicio,
      cantidadSolicitada: Number(formulario.cantidadSolicitada),
      guardarEnCatalogo,
    })
  }

  function manejarTecla(evento) {
    if ((evento.ctrlKey || evento.metaKey) && evento.key === 'Enter') {
      evento.preventDefault()
      manejarEnvio(evento)
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      onKeyDown={manejarTecla}
      className="flex max-h-[calc(100dvh-10rem)] flex-col gap-4 overflow-hidden"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Medicamento *"
            name="nombre"
            value={formulario.nombre}
            onChange={(evento) => actualizar('nombre', evento.target.value)}
            error={errores.nombre}
            autoFocus={campoEnfoque === 'nombre'}
          />
          <Input
            label="Dosis *"
            name="dosis"
            value={formulario.dosis}
            onChange={(evento) => actualizar('dosis', evento.target.value)}
            error={errores.dosis}
          />
          <Input
            label="Vía de administración *"
            name="via"
            value={formulario.via}
            onChange={(evento) => actualizar('via', evento.target.value)}
            error={errores.via}
          />
          <Input
            label="Frecuencia *"
            name="frecuencia"
            value={formulario.frecuencia}
            onChange={(evento) => actualizar('frecuencia', evento.target.value)}
            error={errores.frecuencia}
          />
          <Input
            label="Fecha y hora de inicio *"
            name="fechaHoraInicio"
            type="datetime-local"
            value={formulario.fechaHoraInicio}
            onChange={(evento) => actualizar('fechaHoraInicio', evento.target.value)}
            error={errores.fechaHoraInicio}
            autoFocus={campoEnfoque === 'fechaHoraInicio'}
          />
          <Input
            label="Cantidad solicitada *"
            name="cantidadSolicitada"
            type="number"
            min="0"
            step="any"
            value={formulario.cantidadSolicitada}
            onChange={(evento) => actualizar('cantidadSolicitada', evento.target.value)}
            error={errores.cantidadSolicitada}
          />
        </div>

        <label className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3">
          <input
            type="checkbox"
            name="guardarEnCatalogo"
            checked={guardarEnCatalogo}
            onChange={(evento) => setGuardarEnCatalogo(evento.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-secondary-fixed-dim"
          />
          <span className="text-body-sm text-on-surface-variant">
            Guardar en el catálogo para reutilizarlo en otra solicitud.
          </span>
        </label>

        <p className="text-label-sm text-on-surface-variant">
          Sugerencia: Ctrl+Enter para guardar el medicamento.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-outline-variant pt-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancelar} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          {textoAccion}
        </Button>
      </div>
    </form>
  )
}
