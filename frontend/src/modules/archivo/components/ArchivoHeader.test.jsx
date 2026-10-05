import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import ArchivoHeader from './ArchivoHeader.jsx'

function renderHeader() {
  return render(
    <ThemeProvider>
      <ArchivoHeader />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ArchivoHeader — control claro/oscuro', () => {
  it('muestra el control de tema en el encabezado', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: /activar modo oscuro/i })).toBeInTheDocument()
  })

  it('alterna el tema reutilizando ThemeContext (clase dark y persistencia)', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: /activar modo oscuro/i }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('hro_tema')).toBe('oscuro')
    expect(screen.getByRole('button', { name: /activar modo claro/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /activar modo claro/i }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('hro_tema')).toBe('claro')
  })
})
