import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarJefeMock } from '../api/mockData.js'
import HorariosPage from './HorariosPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <HorariosPage />
    </ToastProvider>,
  )
}

async function crearHorario(user) {
  await user.click(screen.getByRole('button', { name: /nuevo horario/i }))
  const dialogo = await screen.findByRole('dialog')
  await user.click(within(dialogo).getByRole('button', { name: /crear/i }))
  await screen.findByText('Horario creado')
}

describe('HorariosPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('empieza sin horarios para la subespecialidad y crea uno', async () => {
    const user = userEvent.setup()
    renderPagina()

    expect(await screen.findByText(/no tiene horarios configurados/i)).toBeInTheDocument()

    await crearHorario(user)

    expect((await screen.findAllByText('Lunes')).length).toBeGreaterThan(0)
  })

  it('desactiva un horario con confirmación', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByText(/no tiene horarios configurados/i)
    await crearHorario(user)

    await user.click(screen.getAllByRole('button', { name: /desactivar/i })[0])
    const dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /sí, desactivar/i }))

    expect(await screen.findByText('Horario desactivado')).toBeInTheDocument()
  })
})
