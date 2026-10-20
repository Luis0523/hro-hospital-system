import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarSeguimientoMock } from '../api/seguimientoApi'
import SeguimientoEnfermeriaPage from './SeguimientoEnfermeriaPage.jsx'

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/seguimiento-enfermeria']}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SeguimientoEnfermeriaPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const accion = () => screen.getByTestId('accion-turno')

beforeEach(() => {
  reiniciarSeguimientoMock()
})

describe('SeguimientoEnfermeriaPage', () => {
  it('muestra el libro, las etapas y las clínicas al cargar', async () => {
    renderPagina()

    expect(
      await screen.findByRole('heading', { name: 'Control de turnos y expedientes' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Libro digital de recepción')).toBeInTheDocument()
    expect(screen.getByTestId('total-turnos')).toHaveTextContent('85')
    expect(screen.getByTestId('etapa-registrado')).toHaveTextContent('Registrado')
    expect(screen.getByRole('heading', { name: 'Clínicas físicas' })).toBeInTheDocument()
  })

  it('registra un correlativo y lo avanza hasta archivo', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByRole('button', { name: 'ONC-05, sin registro' }))
    expect(screen.getByText('ONC-05')).toBeInTheDocument()
    expect(accion()).toHaveTextContent('Registrar turno')

    await user.click(accion())
    await waitFor(() => expect(accion()).toHaveTextContent('Marcar: Recibido'))

    await user.click(accion())
    await waitFor(() => expect(accion()).toHaveTextContent('Asignar desde las clínicas ↓'))

    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    await waitFor(() => expect(accion()).toHaveTextContent('Marcar: Devuelto'))

    await user.click(accion())
    await waitFor(() => expect(accion()).toHaveTextContent('Marcar: Archivo'))

    await user.click(accion())
    await waitFor(() => expect(accion()).toHaveTextContent('Proceso completado'))
    expect(accion()).toBeDisabled()
  })

  it('filtra por etapa y busca por especialidad o correlativo', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-recibido')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'true')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'false')

    await user.type(screen.getByLabelText('Buscar especialidad o turno'), 'oncología')
    expect(screen.getByText('Oncología')).toBeInTheDocument()
    expect(screen.queryByText('Neurología')).not.toBeInTheDocument()
  })

  it('el botón Registrar turno prepara el primer correlativo disponible', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('Libro digital de recepción')
    await user.click(screen.getByRole('button', { name: /^Registrar turno$/ }))

    expect(screen.getByText('MI-39')).toBeInTheDocument()
  })
})
