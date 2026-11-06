import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { valoresIniciales } from '../cuadernoRojoCampos'
import CuadernoRojoModalRegistro from './CuadernoRojoModalRegistro.jsx'

function props(extra = {}) {
  return {
    abierto: true,
    modo: 'crear',
    valores: { ...valoresIniciales(), fecha: '2026-11-03' },
    errores: {},
    tocados: {},
    existente: false,
    cargandoDia: false,
    guardando: false,
    onCambiar: vi.fn(),
    onBlur: vi.fn(),
    onGuardar: vi.fn(),
    onCerrar: vi.fn(),
    onEditarExistente: vi.fn(),
    ...extra,
  }
}

describe('CuadernoRojoModalRegistro', () => {
  it('muestra el modal de registro nuevo con sus acciones', () => {
    render(<CuadernoRojoModalRegistro {...props()} />)

    expect(screen.getByRole('heading', { name: 'Registrar nuevo día' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha del registro/)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeInTheDocument()
  })

  it('muestra el modal de edición con fecha bloqueada y botón Actualizar', () => {
    render(<CuadernoRojoModalRegistro {...props({ modo: 'editar', existente: true })} />)

    expect(screen.getByRole('heading', { name: 'Editar registro' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha del registro/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
  })

  it('impide guardar y ofrece editar cuando la fecha ya existe', () => {
    const onEditarExistente = vi.fn()
    render(<CuadernoRojoModalRegistro {...props({ existente: true, onEditarExistente })} />)

    expect(screen.getByText('Esta fecha ya tiene un registro')).toBeInTheDocument()
    const guardar = screen.getByRole('button', { name: /guardar registro/i })
    expect(guardar).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /editar registro existente/i }))
    expect(onEditarExistente).toHaveBeenCalledTimes(1)
  })

  it('ejecuta el guardado desde el botón del footer', () => {
    const onGuardar = vi.fn()
    render(<CuadernoRojoModalRegistro {...props({ onGuardar })} />)

    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(onGuardar).toHaveBeenCalledTimes(1)
  })

  it('cancela y bloquea acciones mientras guarda', () => {
    const onCerrar = vi.fn()
    const { rerender } = render(<CuadernoRojoModalRegistro {...props({ onCerrar })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCerrar).toHaveBeenCalledTimes(1)

    rerender(<CuadernoRojoModalRegistro {...props({ guardando: true })} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
  })
})
