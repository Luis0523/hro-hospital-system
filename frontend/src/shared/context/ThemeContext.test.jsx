import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTema } from './ThemeContext.jsx'

function Consumidor() {
  const { tema, alternarTema } = useTema()
  return (
    <button type="button" onClick={alternarTema}>
      {tema}
    </button>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('inicia en claro y alterna a oscuro, aplicando la clase y persistiendo', async () => {
    render(
      <ThemeProvider>
        <Consumidor />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('claro')

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('oscuro')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('hro_tema')).toBe('oscuro')
  })

  it('respeta la preferencia guardada', () => {
    localStorage.setItem('hro_tema', 'oscuro')

    render(
      <ThemeProvider>
        <Consumidor />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('oscuro')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
