import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'

function valoresInicialesDe(registro) {
  return {
    numero: registro?.numero ?? '',
    nivel: registro?.nivel ?? '',
    capacidadCamillas: registro?.capacidadCamillas ?? 1,
    nombre: registro?.nombre ?? '',
    ubicacion: registro?.ubicacion ?? '',
  }
}

export default function EspacioFisicoForm({
  valoresIniciales,
  modo = 'crear',
  soloLectura = false,
  onSubmit,
}) {
  const [formulario, setFormulario] = useState(() => valoresInicialesDe(valoresIniciales))
  const [errores, setErrores] = useState({})

  const actualizarCampo = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const nuevosErrores = {}

    const numero = String(formulario.numero).trim()
    if (!numero) {
      nuevosErrores.numero = 'El número es obligatorio'
    } else if (numero.length > 30) {
      nuevosErrores.numero = 'El número no puede exceder 30 caracteres'
    }

    const nivel = Number(formulario.nivel)
    if (formulario.nivel === '' || Number.isNaN(nivel)) {
      nuevosErrores.nivel = 'El nivel es obligatorio'
    } else if (nivel < 1) {
      nuevosErrores.nivel = 'El nivel debe ser al menos 1'
    }

    const capacidad = Number(formulario.capacidadCamillas)
    if (formulario.capacidadCamillas === '' || Number.isNaN(capacidad)) {
      nuevosErrores.capacidadCamillas = 'Indique la capacidad de camillas'
    } else if (capacidad < 1) {
      nuevosErrores.capacidadCamillas = 'La capacidad debe ser al menos 1'
    }

    const nombre = String(formulario.nombre).trim()
    if (!nombre) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    } else if (nombre.length > 150) {
      nuevosErrores.nombre = 'El nombre no puede exceder 150 caracteres'
    }

    const ubicacion = String(formulario.ubicacion).trim()
    if (ubicacion.length > 150) {
      nuevosErrores.ubicacion = 'La ubicación no puede exceder 150 caracteres'
    }

    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      numero,
      nivel,
      capacidadCamillas: capacidad,
      nombre,
      ubicacion: ubicacion || null,
    }

    if (modo === 'editar') {
      // El contrato de actualización exige activo y reemplaza coordenadasPlano:
      // se preservan los valores actuales para no alterar datos fuera de alcance.
      onSubmit({
        ...datos,
        coordenadasPlano: valoresIniciales?.coordenadasPlano ?? null,
        activo: valoresIniciales?.activo ?? true,
      })
      return
    }

    onSubmit(datos)
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="numero"
        label="Número de sala / consultorio"
        value={formulario.numero}
        onChange={actualizarCampo('numero')}
        error={errores.numero}
        disabled={soloLectura}
        maxLength={30}
        placeholder="Por ejemplo: 101"
      />
      <Input
        name="nivel"
        type="number"
        min={1}
        label="Nivel / piso"
        value={formulario.nivel}
        onChange={actualizarCampo('nivel')}
        error={errores.nivel}
        disabled={soloLectura}
      />
      <Input
        name="capacidadCamillas"
        type="number"
        min={1}
        label="Capacidad de camillas"
        hint="Capacidad física de atención simultánea dentro del espacio."
        value={formulario.capacidadCamillas}
        onChange={actualizarCampo('capacidadCamillas')}
        error={errores.capacidadCamillas}
        disabled={soloLectura}
      />
      <Input
        name="nombre"
        label="Nombre del espacio físico"
        value={formulario.nombre}
        onChange={actualizarCampo('nombre')}
        error={errores.nombre}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Sala 101"
      />
      <Input
        name="ubicacion"
        label="Ubicación (opcional)"
        value={formulario.ubicacion}
        onChange={actualizarCampo('ubicacion')}
        error={errores.ubicacion}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Edificio Consulta Externa, Nivel 1"
      />
    </form>
  )
}
