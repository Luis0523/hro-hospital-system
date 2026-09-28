import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EstadoBadge from './EstadoBadge.jsx'

describe('EstadoBadge', () => {
  it('muestra el estado reemplazando guiones bajos', () => {
    render(<EstadoBadge estado="no_responde" />)
    expect(screen.getByText('no responde')).toBeInTheDocument()
  })

  it('usa el color por defecto ante un estado desconocido', () => {
    render(<EstadoBadge estado="desconocido" />)
    expect(screen.getByText('desconocido')).toHaveClass('bg-surface-container')
  })
})
