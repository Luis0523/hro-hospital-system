import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'

vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listarUsuarios: vi.fn(actual.listarUsuarios),
    listarRoles: vi.fn(actual.listarRoles),
    actualizarRolUsuario: vi.fn(actual.actualizarRolUsuario),
    activarUsuario: vi.fn(actual.activarUsuario),
    desactivarUsuario: vi.fn(actual.desactivarUsuario),
    listarPermisosUsuario: vi.fn(actual.listarPermisosUsuario),
    asignarPermisoSubespecialidad: vi.fn(actual.asignarPermisoSubespecialidad),
  }
})

import {
  actualizarRolUsuario,
  asignarPermisoSubespecialidad,
  listarUsuarios,
} from '../api/administracionApi.js'
import UsuariosPage from './UsuariosPage.jsx'

function renderPagina() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <UsuariosPage />
      </ToastProvider>
    </AuthProvider>,
  )
}

async function esperarTabla() {
  return screen.findByTestId('usuarios-escritorio')
}

function filaDe(nombre) {
  return within(screen.getByTestId('usuarios-escritorio')).getByText(nombre).closest('tr')
}

describe('UsuariosPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    localStorage.clear()
    listarUsuarios.mockClear()
    asignarPermisoSubespecialidad.mockClear()
    actualizarRolUsuario.mockClear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('muestra un estado de carga accesible', () => {
    listarUsuarios.mockImplementationOnce(() => new Promise(() => {}))
    renderPagina()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('lista los usuarios activos por defecto con rol y estado', async () => {
    renderPagina()
    const tabla = await esperarTabla()

    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(tabla).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(tabla).getByText('Jorge Salas')).toBeInTheDocument()
    expect(within(tabla).getByText('Administrador')).toBeInTheDocument()
    expect(within(tabla).queryByText('Marta Ruiz')).not.toBeInTheDocument()
  })

  it('filtra por estado inactivos', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')

    const tabla = await esperarTabla()
    expect(within(tabla).getByText('Marta Ruiz')).toBeInTheDocument()
    expect(within(tabla).queryByText('Ana Pérez')).not.toBeInTheDocument()
  })

  it('filtra por rol', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.selectOptions(screen.getByLabelText('Rol'), 'medico')

    const tabla = await esperarTabla()
    expect(within(tabla).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(tabla).queryByText('Ana Pérez')).not.toBeInTheDocument()
  })

  it('muestra estado vacío cuando el filtro no arroja resultados', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.selectOptions(screen.getByLabelText('Rol'), 'archivo')

    expect(await screen.findByText('Sin usuarios')).toBeInTheDocument()
  })

  it('ante un error muestra el mensaje y permite reintentar', async () => {
    listarUsuarios.mockRejectedValueOnce(new Error('Fallo de red'))
    const user = userEvent.setup()
    renderPagina()

    expect(await screen.findByText('Fallo de red')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByTestId('usuarios-escritorio')).toBeInTheDocument()
  })

  it('muestra el detalle con "No disponible" cuando ultimoAcceso es null', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Luis Gómez')).getByRole('button', { name: 'Ver' }))

    const detalle = await screen.findByRole('dialog')
    expect(within(detalle).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(detalle).getByText('luis-gomez')).toBeInTheDocument()
    expect(within(detalle).getByText('No disponible')).toBeInTheDocument()
  })

  it('desactiva un usuario con confirmación y lo retira del listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Ana Pérez')).getByRole('button', { name: 'Desactivar' }))
    expect(screen.getByText(/¿Deseas desactivar a Ana Pérez\?/)).toBeInTheDocument()
    expect(screen.getByText(/Este usuario tiene rol Administrador\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

    expect(await screen.findByText('Usuario desactivado')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(screen.getByTestId('usuarios-escritorio')).queryByText('Ana Pérez')).not.toBeInTheDocument(),
    )
  })

  it('advierte cuando se desactiva el usuario de la sesión actual', async () => {
    localStorage.setItem(
      'hro_usuario',
      JSON.stringify({ idExterno: 'ana-perez', rol: 'administrador', nombre: 'Ana Pérez' }),
    )
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Ana Pérez')).getByRole('button', { name: 'Desactivar' }))

    expect(
      screen.getByText(/usuario actualmente identificado en esta sesión/i),
    ).toBeInTheDocument()
  })

  it('cambia el rol enviando únicamente rolPrincipal', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Ana Pérez')).getByRole('button', { name: 'Ver' }))
    const detalle = await screen.findByRole('dialog')

    await user.selectOptions(within(detalle).getByLabelText('Rol principal'), 'enfermeria')
    await user.click(within(detalle).getByRole('button', { name: 'Guardar rol' }))

    expect(await screen.findByText('Rol actualizado')).toBeInTheDocument()
    expect(actualizarRolUsuario).toHaveBeenCalledWith(1, { rolPrincipal: 'enfermeria' })
  })

  it('lista permisos del usuario y permite filtrar por estado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Luis Gómez')).getByRole('button', { name: 'Permisos' }))
    const permisos = await screen.findByTestId('lista-permisos')

    expect(within(permisos).getByText('Medicina General')).toBeInTheDocument()
    expect(within(permisos).getByText(/Avanzar turno/)).toBeInTheDocument()

    const dialogo = screen.getByRole('dialog')
    await user.selectOptions(within(dialogo).getByLabelText('Estado'), 'inactivos')

    await waitFor(() =>
      expect(within(screen.getByTestId('lista-permisos')).getByText('Cardiología Clínica')).toBeInTheDocument(),
    )
  })

  it('asigna un permiso con el payload exacto', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Luis Gómez')).getByRole('button', { name: 'Permisos' }))
    const dialogo = await screen.findByRole('dialog')

    await within(dialogo).findByRole('option', { name: 'Pediatría General' })
    await user.selectOptions(within(dialogo).getByLabelText('Subespecialidad'), '3')
    await user.selectOptions(within(dialogo).getByLabelText('Tipo de permiso'), 'autorizar_cupo')
    await user.click(within(dialogo).getByRole('button', { name: 'Asignar permiso' }))

    expect(await screen.findByText('Permiso asignado')).toBeInTheDocument()
    expect(asignarPermisoSubespecialidad).toHaveBeenCalledWith({
      usuarioId: 2,
      subespecialidadId: 3,
      tipoPermiso: 'autorizar_cupo',
    })
  })

  it('muestra el error del backend ante un permiso duplicado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarTabla()

    await user.click(within(filaDe('Luis Gómez')).getByRole('button', { name: 'Permisos' }))
    const dialogo = await screen.findByRole('dialog')

    await within(dialogo).findByRole('option', { name: 'Medicina General' })
    await user.selectOptions(within(dialogo).getByLabelText('Subespecialidad'), '1')
    await user.selectOptions(within(dialogo).getByLabelText('Tipo de permiso'), 'avanzar_turno')
    await user.click(within(dialogo).getByRole('button', { name: 'Asignar permiso' }))

    expect(await screen.findByText('No se pudo asignar el permiso')).toBeInTheDocument()
    expect(screen.getByText(/ya tiene el permiso/i)).toBeInTheDocument()
  })

  it('no incluye creación de usuarios, contraseñas, PII ni buscador ficticio', async () => {
    renderPagina()
    await esperarTabla()

    expect(screen.queryByText(/crear usuario/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/restablecer contraseña/i)).not.toBeInTheDocument()
    expect(screen.queryByText('DPI')).not.toBeInTheDocument()
    expect(screen.queryByText(/sesiones/i)).not.toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.queryByPlaceholderText(/buscar/i)).toBeNull()
  })
})
