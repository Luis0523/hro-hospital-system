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

export default function EspacioFisicoForm({ valoresIniciales, modo = 'crear', onSubmit }) {
  const [formulario, setFormulario] = useState(() => valoresInicialesDe(valoresIniciales))
  const [errores, setErrores] = useState({})

  const actualizarCampo = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const nuevosErrores = {}
    const numero = String(formulario.numero).trim()
    const nivel = Number(formulario.nivel)
    const capacidad = Number(formulario.capacidadCamillas)
    const nombre = String(formulario.nombre).trim()
    const ubicacion = String(formulario.ubicacion).trim()

    if (!numero) nuevosErrores.numero = 'El número es obligatorio'
    if (formulario.nivel === '' || Number.isNaN(nivel) || nivel < 1) {
      nuevosErrores.nivel = 'Indique un nivel válido'
    }
    if (Number.isNaN(capacidad) || capacidad < 1) {
      nuevosErrores.capacidadCamillas = 'La capacidad debe ser al menos 1'
    }
    if (!nombre) nuevosErrores.nombre = 'El nombre es obligatorio'

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
    <form id="form-espacio-fisico" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="numero"
        label="Número de clínica / consultorio"
        value={formulario.numero}
        onChange={actualizarCampo('numero')}
        error={errores.numero}
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
      />
      <Input
        name="capacidadCamillas"
        type="number"
        min={1}
        label="Capacidad de camillas"
        value={formulario.capacidadCamillas}
        onChange={actualizarCampo('capacidadCamillas')}
        error={errores.capacidadCamillas}
      />
      <Input
        name="nombre"
        label="Nombre de la clínica"
        value={formulario.nombre}
        onChange={actualizarCampo('nombre')}
        error={errores.nombre}
        maxLength={150}
        placeholder="Por ejemplo: Sala 101"
      />
      <Input
        name="ubicacion"
        label="Ubicación (opcional)"
        value={formulario.ubicacion}
        onChange={actualizarCampo('ubicacion')}
        maxLength={150}
        placeholder="Edificio Consulta Externa, Nivel 1"
      />
    </form>
  )
}
