import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import TopHud from './TopHud.jsx'

describe('TopHud', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('cambia el tema desde el botón del encabezado', async () => {
    render(
      <ThemeProvider>
        <TopHud
          usuario={{ nombre: 'Ana López', puesto: 'Enfermera' }}
          terminal="BOX-04"
          turnoActual={42}
          tableroActivo
        />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: /cambiar a tema/i }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
