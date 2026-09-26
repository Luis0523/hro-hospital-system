import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import UsuariosPage from './UsuariosPage.jsx'

describe('UsuariosPage', () => {
  it('mantiene el encabezado "Usuarios y roles"', () => {
    render(<UsuariosPage />)

    expect(screen.getByRole('heading', { name: 'Usuarios y roles' })).toBeInTheDocument()
  })

  it('informa que la gestión todavía no está disponible', () => {
    render(<UsuariosPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(/todavía no se encuentra disponible/i)
  })

  it('muestra las funcionalidades previstas', () => {
    render(<UsuariosPage />)

    expect(screen.getByRole('heading', { name: 'Gestión de usuarios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Asignación de roles' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Permisos por subespecialidad' }),
    ).toBeInTheDocument()
  })

  it('no ofrece acciones de gestión porque no existe contrato disponible', () => {
    render(<UsuariosPage />)

    expect(screen.queryByRole('button', { name: /agregar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /desactivar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /asignar/i })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('no renderiza tablas ni datos de usuarios simulados', () => {
    render(<UsuariosPage />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
