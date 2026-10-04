import { useState } from 'react'

const DIAS = [
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
  { valor: 7, etiqueta: 'Domingo' },
]

const claseCampo =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim'

function valoresInicialesDe(registro) {
  return {
    diaSemana: registro?.diaSemana ?? 1,
    horaInicio: (registro?.horaInicio ?? '07:00:00').slice(0, 5),
    horaFin: (registro?.horaFin ?? '13:00:00').slice(0, 5),
    capacidadMaxima: registro?.capacidadMaxima ?? 10,
    duracionConsultaMinutos: registro?.duracionConsultaMinutos ?? 30,
  }
}

export default function HorarioForm({ valoresIniciales, soloLectura = false, onSubmit }) {
  const [formulario, setFormulario] = useState(() => valoresInicialesDe(valoresIniciales))
  const [errores, setErrores] = useState({})

  const actualizar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const nuevos = {}

    const capacidad = Number(formulario.capacidadMaxima)
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      nuevos.capacidadMaxima = 'La capacidad debe ser al menos 1'
    }
    const duracion = Number(formulario.duracionConsultaMinutos)
    if (!Number.isInteger(duracion) || duracion < 5) {
      nuevos.duracion = 'La duración debe ser al menos 5 minutos'
    }
    if (formulario.horaInicio >= formulario.horaFin) {
      nuevos.horas = 'La hora de fin debe ser posterior a la de inicio'
    }

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    onSubmit({
      diaSemana: Number(formulario.diaSemana),
      horaInicio: formulario.horaInicio,
      horaFin: formulario.horaFin,
      capacidadMaxima: capacidad,
      duracionConsultaMinutos: duracion,
    })
  }

  return (
    <form id="form-horario" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">Día</span>
        <select
          name="diaSemana"
          value={formulario.diaSemana}
          onChange={actualizar('diaSemana')}
          disabled={soloLectura}
          className={claseCampo}
        >
          {DIAS.map((dia) => (
            <option key={dia.valor} value={dia.valor}>
              {dia.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Hora inicio
          </span>
          <input
            type="time"
            value={formulario.horaInicio}
            onChange={actualizar('horaInicio')}
            disabled={soloLectura}
            className={claseCampo}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Hora fin
          </span>
          <input
            type="time"
            value={formulario.horaFin}
            onChange={actualizar('horaFin')}
            disabled={soloLectura}
            className={claseCampo}
          />
        </label>
      </div>
      {errores.horas && <p className="text-body-sm text-error">{errores.horas}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Capacidad máxima
          </span>
          <input
            type="number"
            min={1}
            value={formulario.capacidadMaxima}
            onChange={actualizar('capacidadMaxima')}
            disabled={soloLectura}
            className={claseCampo}
          />
          {errores.capacidadMaxima && (
            <span className="text-body-sm text-error">{errores.capacidadMaxima}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Duración consulta (min)
          </span>
          <input
            type="number"
            min={5}
            value={formulario.duracionConsultaMinutos}
            onChange={actualizar('duracionConsultaMinutos')}
            disabled={soloLectura}
            className={claseCampo}
          />
          {errores.duracion && <span className="text-body-sm text-error">{errores.duracion}</span>}
        </label>
      </div>
    </form>
  )
}
