import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EstadoConexion from './EstadoConexion.jsx'

describe('EstadoConexion', () => {
  it('muestra el estado conectado', () => {
    render(<EstadoConexion estado="conectado" />)
    expect(screen.getByText('En línea')).toBeInTheDocument()
  })

  it('muestra el estado reconectando', () => {
    render(<EstadoConexion estado="reconectando" />)
    expect(screen.getByText('Reconectando…')).toBeInTheDocument()
  })

  it('muestra el estado desconectado por defecto', () => {
    render(<EstadoConexion />)
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
  })
})
