import { beforeEach, describe, expect, it } from 'vitest'
import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarSeguimientoMock } from '../api/seguimientoApi'
import SeguimientoEnfermeriaPage from './SeguimientoEnfermeriaPage.jsx'

configure({ asyncUtilTimeout: 5000 })

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

beforeEach(() => {
  reiniciarSeguimientoMock()
})

describe('SeguimientoEnfermeriaPage', () => {
  it('muestra el libro, las etapas y las clínicas al cargar', async () => {
    renderPagina()

    expect(
      await screen.findByRole('heading', { name: 'Control de turnos y expedientes' }),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('detalle-turno')).toBeInTheDocument()
    expect(screen.getByTestId('etapa-registrado')).toHaveTextContent('Registrado')
    expect(screen.getByRole('heading', { name: 'Clínicas físicas' })).toBeInTheDocument()
  })

  it('registra y avanza un correlativo con un clic por etapa', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-recibido'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Recibido' })).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-en_clinica'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Recibido' }))
    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    expect(await screen.findByRole('button', { name: 'ONC-05, En clínica' })).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-devuelto'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, En clínica' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Devuelto' })).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-archivo'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Devuelto' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Archivo' })).toBeInTheDocument()
  }, 20000)

  it('permite un solo tipo de registro y no lo edita después de registrar', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    const opciones = () => within(screen.getByTestId('opciones-registro'))
    const presentacion = () => opciones().getByRole('button', { name: 'Presentación' })
    const privado = () => opciones().getByRole('button', { name: 'Privado de libertad' })

    expect(opciones().queryByRole('button', { name: 'Sin marca' })).not.toBeInTheDocument()
    expect(presentacion()).toHaveAttribute('aria-pressed', 'false')
    expect(privado()).toHaveAttribute('aria-pressed', 'false')

    await user.click(presentacion())
    expect(presentacion()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'MI-39, sin registro' })).toHaveFocus()

    await user.click(privado())
    expect(presentacion()).toHaveAttribute('aria-pressed', 'false')
    expect(privado()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'MI-39, sin registro' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    const casilla = await screen.findByRole('button', {
      name: 'ONC-05, Registrado, privado de libertad',
    })
    expect(casilla.className).toContain('ring-rose-500')
    expect(casilla.className).not.toContain('ring-fuchsia-400')
    expect(screen.queryByTestId('editor-tipo-registro')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByTestId('etapa-registrado')).toHaveFocus())
    expect(presentacion()).toHaveAttribute('aria-pressed', 'false')
    expect(privado()).toHaveAttribute('aria-pressed', 'false')
  }, 20000)

  it('inicia en Registrado con Enter, elige el tipo con flechas y registra', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    expect(etapa).toHaveFocus()

    await user.keyboard('{Enter}')
    const opciones = () => within(screen.getByTestId('opciones-registro'))
    const presentacion = () => opciones().getByRole('button', { name: 'Presentación' })
    const privado = () => opciones().getByRole('button', { name: 'Privado de libertad' })
    await waitFor(() => expect(presentacion()).toHaveFocus())

    await user.keyboard('{ArrowRight}')
    expect(privado()).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'MI-39, sin registro' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('button', { name: 'MI-39, Registrado, privado de libertad' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('etapa-registrado')).toHaveFocus())
  }, 20000)

  it('permite omitir el tipo y llegar a la casilla con las flechas', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    const presentacion = () =>
      within(screen.getByTestId('opciones-registro')).getByRole('button', {
        name: 'Presentación',
      })
    await waitFor(() => expect(presentacion()).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'MI-39, sin registro' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'MI-39, Registrado' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('etapa-registrado')).toHaveFocus())
  }, 20000)

  it('filtra por etapa sin controles de búsqueda ni registro', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-recibido')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'true')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'false')

    expect(screen.queryByLabelText('Buscar especialidad o turno')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver todos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Registrar turno$/ })).not.toBeInTheDocument()
  })
})
