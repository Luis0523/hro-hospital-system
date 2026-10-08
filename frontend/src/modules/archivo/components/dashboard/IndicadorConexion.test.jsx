import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import IndicadorConexion from './IndicadorConexion.jsx'

describe('IndicadorConexion', () => {
  it('muestra la etiqueta del estado', () => {
    render(<IndicadorConexion estado="en_vivo" />)

    expect(screen.getByLabelText('Conexión: En vivo')).toBeInTheDocument()
  })

  it('ofrece reconectar cuando no está en vivo', () => {
    const onReconectar = vi.fn()
    render(<IndicadorConexion estado="simulado" onReconectar={onReconectar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reconectar' }))

    expect(onReconectar).toHaveBeenCalledTimes(1)
  })

  it('no ofrece reconectar cuando está en vivo', () => {
    render(<IndicadorConexion estado="en_vivo" onReconectar={() => {}} />)

    expect(screen.queryByRole('button', { name: 'Reconectar' })).not.toBeInTheDocument()
  })
})
