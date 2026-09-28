import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'

function valoresInicialesDe(registro) {
  return {
    codigo: registro?.codigo ?? '',
    nombre: registro?.nombre ?? '',
    ubicacion: registro?.ubicacion ?? '',
  }
}

export default function EstacionForm({
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

    const codigo = String(formulario.codigo).trim()
    if (!codigo) {
      nuevosErrores.codigo = 'El código es obligatorio'
    } else if (codigo.length > 30) {
      nuevosErrores.codigo = 'El código no puede exceder 30 caracteres'
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

    const datos = { codigo, nombre, ubicacion: ubicacion || null }

    if (modo === 'editar') {
      // El contrato de actualización acepta activo; se preserva el estado actual.
      onSubmit({ ...datos, activo: valoresIniciales?.activo ?? true })
      return
    }

    onSubmit(datos)
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="codigo"
        label="Código"
        value={formulario.codigo}
        onChange={actualizarCampo('codigo')}
        error={errores.codigo}
        disabled={soloLectura}
        maxLength={30}
        placeholder="Por ejemplo: EST-05"
      />
      <Input
        name="nombre"
        label="Nombre de la estación"
        value={formulario.nombre}
        onChange={actualizarCampo('nombre')}
        error={errores.nombre}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Consulta Externa — Pediatría"
      />
      <Input
        name="ubicacion"
        label="Ubicación (opcional)"
        value={formulario.ubicacion}
        onChange={actualizarCampo('ubicacion')}
        error={errores.ubicacion}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Edificio Consulta Externa, Nivel 2"
      />
    </form>
  )
}
