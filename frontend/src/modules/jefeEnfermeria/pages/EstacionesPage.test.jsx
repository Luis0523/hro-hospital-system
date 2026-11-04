import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarJefeMock } from '../api/mockData.js'
import EstacionesPage from './EstacionesPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <EstacionesPage />
    </ToastProvider>,
  )
}

describe('EstacionesPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('lista las estaciones y muestra la cobertura de hoy', async () => {
    renderPagina()

    expect(await screen.findByTestId('estacion-EST-01')).toBeInTheDocument()
    expect((await screen.findAllByText(/en servicio/i)).length).toBeGreaterThan(0)
  })

  it('ordena especialidades por estación sin afectar a las demás', async () => {
    const user = userEvent.setup()
    renderPagina()

    const estacion1 = await screen.findByTestId('estacion-EST-01')
    await user.click(within(estacion1).getByRole('button', { name: 'Orden de especialidades' }))

    const dialogo = await screen.findByRole('dialog', { name: /Orden de especialidades/ })
    await waitFor(() =>
      expect(within(dialogo).getAllByRole('listitem')[0]).toHaveTextContent('Medicina Interna'),
    )

    await user.click(within(dialogo).getByRole('button', { name: 'Subir Cardiología' }))
    expect(within(dialogo).getAllByRole('listitem')[0]).toHaveTextContent('Cardiología')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar orden' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(within(estacion1).getByRole('button', { name: 'Orden de especialidades' }))
    const reabierto = await screen.findByRole('dialog', { name: /Orden de especialidades/ })
    await waitFor(() =>
      expect(within(reabierto).getAllByRole('listitem')[0]).toHaveTextContent('Cardiología'),
    )
    await user.click(within(reabierto).getByRole('button', { name: 'Cancelar' }))

    const estacion2 = screen.getByTestId('estacion-EST-02')
    await user.click(within(estacion2).getByRole('button', { name: 'Orden de especialidades' }))
    const dialogo2 = await screen.findByRole('dialog', { name: /Orden de especialidades/ })
    await waitFor(() =>
      expect(within(dialogo2).getAllByRole('listitem')[0]).toHaveTextContent('Pediatría'),
    )
  })

  it('mantiene disponible el orden de clínicas existente', async () => {
    const user = userEvent.setup()
    renderPagina()

    const estacion1 = await screen.findByTestId('estacion-EST-01')
    await user.click(within(estacion1).getByRole('button', { name: 'Ordenar clínicas' }))

    const dialogo = await screen.findByRole('dialog', { name: /Orden de clínicas/ })
    await waitFor(() => expect(within(dialogo).getAllByRole('listitem').length).toBeGreaterThan(1))
    expect(
      within(dialogo).getAllByRole('button', { name: /^(Subir|Bajar) / }).length,
    ).toBeGreaterThan(0)
  })

  it('crea una estación nueva', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('estacion-EST-01')
    await user.click(screen.getByRole('button', { name: /nueva estación/i }))

    const dialogo = await screen.findByRole('dialog')
    const campos = within(dialogo).getAllByRole('textbox')
    await user.type(campos[0], 'EST-09')
    await user.type(campos[1], 'Nueva Área')
    await user.click(within(dialogo).getByRole('button', { name: /crear/i }))

    expect(await screen.findByTestId('estacion-EST-09')).toBeInTheDocument()
  })
})
