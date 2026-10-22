import { beforeEach, describe, expect, it } from 'vitest'
import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarSeguimientoMock } from '../api/seguimientoApi'
import SeguimientoEnfermeriaDosPage from './SeguimientoEnfermeriaDosPage.jsx'

configure({ asyncUtilTimeout: 5000 })

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/seguimiento-enfermeria-dos']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <SeguimientoEnfermeriaDosPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

function detalle() {
  return within(screen.getByTestId('detalle-turno'))
}

beforeEach(() => {
  localStorage.clear()
  reiniciarSeguimientoMock()
})

describe('SeguimientoEnfermeriaDosPage', () => {
  it('muestra el libro, las etapas y las clínicas al cargar', async () => {
    renderPagina()

    expect(
      await screen.findByRole('heading', {
        name: 'Control de turnos y expedientes · Prueba',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('detalle-turno')).toBeInTheDocument()
    expect(screen.getByTestId('etapa-registrado')).toHaveTextContent('Registrado')
    expect(screen.getByRole('heading', { name: 'Clínicas físicas' })).toBeInTheDocument()
  })

  it('registra automáticamente con la única clínica de la especialidad', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    expect(etapa).toHaveFocus()
    await user.keyboard('{Enter}')

    const oncologia = () => screen.getByRole('button', { name: /^Oncología\./ })
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(oncologia()).toHaveFocus())
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()
    await waitFor(() => expect(oncologia()).toHaveFocus())
    expect(detalle().getByText(/Clínica 2/)).toBeInTheDocument()
  }, 20000)

  it('con varias clínicas espera la selección manual antes de registrar', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    expect(etapa).toHaveFocus()
    await user.keyboard('{Enter}')

    const medicina = () => screen.getByRole('button', { name: /^Medicina Interna\./ })
    await waitFor(() => expect(medicina()).toHaveFocus())
    await user.keyboard('{Enter}')

    expect(screen.queryByRole('button', { name: 'MI-39, Registrado' })).not.toBeInTheDocument()
    expect(
      screen.getByText(/Medicina Interna: elija la clínica para el turno MI-39/),
    ).toBeInTheDocument()

    const clinica = await screen.findByRole('button', { name: /^Clínica 3:/ })
    await user.click(clinica)

    expect(await screen.findByRole('button', { name: 'MI-39, Registrado' })).toBeInTheDocument()
    expect(detalle().getByText(/Clínica 3/)).toBeInTheDocument()
  }, 20000)

  it('mantiene el flujo sin la etapa Recibido', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    const nefrologia = screen.getByRole('button', { name: /^Nefrología\./ })
    nefrologia.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('button', { name: 'NEF-04, Registrado' })).toBeInTheDocument()
    expect(detalle().getByText(/sin asignar/)).toBeInTheDocument()
    expect(screen.queryByTestId('etapa-recibido')).not.toBeInTheDocument()
    expect(screen.getByTestId('etapa-en_clinica')).toHaveTextContent('En clínica')
  }, 20000)

  it('usa la clínica preasignada al pasar de Registrado a En clínica', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    const oncologia = screen.getByRole('button', { name: /^Oncología\./ })
    oncologia.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })

    await user.click(screen.getByTestId('etapa-en_clinica'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, En clínica' })).toBeInTheDocument()
    expect(detalle().getByText(/Clínica 2/)).toBeInTheDocument()
  }, 20000)

  it('permite cambiar la clínica antes de En clínica', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    const medicina = screen.getByRole('button', { name: /^Medicina Interna\./ })
    medicina.focus()
    await user.keyboard('{Enter}')
    await screen.findByText(/Medicina Interna: elija la clínica/)

    const clinica1 = screen.getByRole('button', { name: /^Clínica 1:/ })
    await waitFor(() => expect(clinica1).toHaveFocus())
    await user.keyboard('{Enter}')
    await screen.findByRole('button', { name: 'MI-39, Registrado' })

    await user.click(screen.getByRole('button', { name: 'Cambiar clínica' }))
    const clinica3 = screen.getByRole('button', { name: /^Clínica 3:/ })
    await user.click(clinica3)

    await waitFor(() => expect(detalle().getByText(/Clínica 3/)).toBeInTheDocument())
  }, 20000)
})
