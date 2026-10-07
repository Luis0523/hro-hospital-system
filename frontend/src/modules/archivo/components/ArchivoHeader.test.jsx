import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArchivoHeader from './ArchivoHeader.jsx'

describe('ArchivoHeader', () => {
  it('muestra la marca SIGHO y el título de la estación', () => {
    render(<ArchivoHeader />)

    expect(screen.getByText('SIGHO')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estación de Archivo' })).toBeInTheDocument()
  })

  it('el botón de menú muestra/oculta el menú', async () => {
    const user = userEvent.setup()
    const onAlternarMenu = vi.fn()
    const { rerender } = render(<ArchivoHeader onAlternarMenu={onAlternarMenu} />)

    await user.click(screen.getByRole('button', { name: 'Mostrar menú' }))
    expect(onAlternarMenu).toHaveBeenCalledTimes(1)

    rerender(<ArchivoHeader menuAbierto onAlternarMenu={onAlternarMenu} />)
    expect(screen.getByRole('button', { name: 'Ocultar menú' })).toBeInTheDocument()
  })
})
