import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarJefeMock } from '../api/mockData.js'
import CroquisPage from './CroquisPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <CroquisPage />
    </ToastProvider>,
  )
}

describe('CroquisPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('muestra las salas sin asignar del día', async () => {
    renderPagina()

    const sala = await screen.findByTestId('sala-101')
    expect(within(sala).getByText('Sin asignar')).toBeInTheDocument()
  })

  it('agrega y luego quita una subespecialidad de una sala', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('sala-101'))

    const dialogo = await screen.findByRole('dialog')
    await user.selectOptions(within(dialogo).getAllByRole('combobox')[0], '1')
    await user.click(within(dialogo).getByRole('button', { name: /agregar/i }))

    expect(
      await within(screen.getByTestId('sala-101')).findByText('Medicina General'),
    ).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /quitar/i }))

    expect(
      await within(screen.getByTestId('sala-101')).findByText('Sin asignar'),
    ).toBeInTheDocument()
  })

  it('permite varias subespecialidades en una misma sala', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('sala-201'))

    const dialogo = await screen.findByRole('dialog')
    await user.selectOptions(within(dialogo).getAllByRole('combobox')[0], '3')
    await user.click(within(dialogo).getByRole('button', { name: /agregar/i }))
    await user.selectOptions(within(screen.getByRole('dialog')).getAllByRole('combobox')[0], '4')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /agregar/i }))

    const sala = screen.getByTestId('sala-201')
    expect(await within(sala).findByText('Pediatría General')).toBeInTheDocument()
    expect(within(sala).getByText('Control de Niño Sano')).toBeInTheDocument()
    expect(within(sala).getByText('2 asignadas')).toBeInTheDocument()
  })

  it('crea, edita y desactiva una clínica física', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('sala-101')
    await user.click(screen.getByRole('button', { name: /nueva clínica/i }))

    let dialogo = await screen.findByRole('dialog')
    await user.type(within(dialogo).getByLabelText(/número de clínica/i), '501')
    await user.type(within(dialogo).getByLabelText(/nivel/i), '1')
    await user.clear(within(dialogo).getByLabelText(/capacidad de camillas/i))
    await user.type(within(dialogo).getByLabelText(/capacidad de camillas/i), '2')
    await user.type(within(dialogo).getByLabelText(/nombre de la clínica/i), 'Sala 501')
    await user.click(within(dialogo).getByRole('button', { name: /crear clínica/i }))

    expect(await screen.findByTestId('sala-501')).toBeInTheDocument()

    await user.click(screen.getByTestId('sala-501'))
    dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /editar clínica/i }))

    dialogo = await screen.findByRole('dialog')
    const numero = within(dialogo).getByLabelText(/número de clínica/i)
    await user.clear(numero)
    await user.type(numero, '502')
    await user.click(within(dialogo).getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByTestId('sala-502')).toBeInTheDocument()

    await user.click(screen.getByTestId('sala-502'))
    dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /desactivar/i }))

    dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /sí, desactivar/i }))

    expect(screen.queryByTestId('sala-502')).not.toBeInTheDocument()
  })

  it('cierra el día con confirmación', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('sala-101')
    await user.click(screen.getByRole('button', { name: /cerrar día/i }))

    const dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /sí, cerrar día/i }))

    expect(await screen.findByText('Asignación del día cerrada')).toBeInTheDocument()
  })
})
