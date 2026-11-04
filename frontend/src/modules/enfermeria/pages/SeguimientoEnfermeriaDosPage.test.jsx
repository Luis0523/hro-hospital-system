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
    expect(screen.getByTestId('etapa-registrado')).toHaveTextContent('Registrar')
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
    expect(screen.getByTestId('etapa-en_clinica')).toHaveTextContent('Recibir/Repartir')
  }, 20000)

  it('usa la clínica preasignada al pasar de Registrado a Recibir/Repartir', async () => {
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
    expect(
      await screen.findByRole('button', { name: 'ONC-05, Recibir/Repartir' }),
    ).toBeInTheDocument()
    expect(detalle().getByText(/Clínica 2/)).toBeInTheDocument()
  }, 20000)

  it('permite cambiar la clínica antes de Recibir/Repartir', async () => {
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

  it('muestra Devoluciones por clínica en la etapa Devuelto', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-devuelto')
    await user.click(screen.getByTestId('etapa-devuelto'))

    expect(
      await screen.findByRole('heading', { name: 'Devoluciones por clínica' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Clínica 3')).toBeInTheDocument()
  }, 20000)

  it('muestra Salida de Enfermería a Archivo en la etapa Archivo', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-archivo')
    await user.click(screen.getByTestId('etapa-archivo'))

    expect(
      await screen.findByRole('heading', { name: 'Salida de Enfermería a Archivo' }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Escriba o escanee el expediente')).toBeInTheDocument()
  }, 20000)

  it('muestra las clínicas en la barra inferior de Recibir/Repartir, sin modal', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-en_clinica')
    await user.click(screen.getByTestId('etapa-en_clinica'))

    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Clínica 3:/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, 20000)

  it('selecciona la especialidad con un toque y registra al tocar el turno', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: /^Oncología\./ }))

    expect(screen.queryByRole('button', { name: 'ONC-05, Registrado' })).not.toBeInTheDocument()

    const siguiente = await screen.findByRole('button', { name: 'ONC-05, sin registro' })
    await user.click(siguiente)

    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()

    const celdaLibre = await screen.findByRole('button', { name: 'ONC-06, sin registro' })
    await user.dblClick(celdaLibre)

    expect(
      await screen.findByRole('button', { name: 'ONC-06, Registrado, presentación' }),
    ).toBeInTheDocument()
  }, 20000)

  it('no registra al tocar una especialidad si no hay una etapa seleccionada', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.click(screen.getByRole('button', { name: /^Oncología\./ }))

    const siguiente = await screen.findByRole('button', { name: 'ONC-05, sin registro' })
    expect(siguiente).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ONC-05, Registrado' })).not.toBeInTheDocument()
  }, 20000)
})
