import { beforeEach, describe, expect, it } from 'vitest'
import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
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
          <EstacionProvider>
            <ToastProvider>
              <SeguimientoEnfermeriaPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
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
    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Recibido' }))
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

    await user.click(privado())
    expect(presentacion()).toHaveAttribute('aria-pressed', 'false')
    expect(privado()).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    const casilla = await screen.findByRole('button', {
      name: 'ONC-05, Registrado, privado de libertad',
    })
    expect(casilla.className).toContain('ring-rose-500')
    expect(casilla.className).not.toContain('ring-fuchsia-400')
    expect(screen.queryByTestId('editor-tipo-registro')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByRole('button', { name: /^Oncología\./ })).toHaveFocus())
    expect(presentacion()).toHaveAttribute('aria-pressed', 'false')
    expect(privado()).toHaveAttribute('aria-pressed', 'false')
  }, 20000)

  it('inicia en Registrado con Enter y navega entre especialidades con las flechas', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    expect(etapa).toHaveFocus()

    await user.keyboard('{Enter}')
    const medicina = () => screen.getByRole('button', { name: /^Medicina Interna\./ })
    await waitFor(() => expect(medicina()).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    const oncologia = () => screen.getByRole('button', { name: /^Oncología\./ })
    expect(oncologia()).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(medicina()).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'MI-39, Registrado' })).toBeInTheDocument()
    await waitFor(() => expect(medicina()).toHaveFocus())
  }, 20000)

  it('Enter sobre una especialidad registra el siguiente correlativo y repite', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    await user.keyboard('{ArrowDown}')
    const oncologia = () => screen.getByRole('button', { name: /^Oncología\./ })
    await waitFor(() => expect(oncologia()).toHaveFocus())

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()
    await waitFor(() => expect(oncologia()).toHaveFocus())

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'ONC-06, Registrado' })).toBeInTheDocument()
    await waitFor(() => expect(oncologia()).toHaveFocus())
  }, 20000)

  it('mantiene la clínica destino para asignar varios turnos seguidos', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })
    await user.click(screen.getByRole('button', { name: 'ONC-06, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-06, Registrado' })

    await user.click(screen.getByTestId('etapa-recibido'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    await screen.findByRole('button', { name: 'ONC-05, Recibido' })
    await user.click(screen.getByRole('button', { name: 'ONC-06, Registrado' }))
    await screen.findByRole('button', { name: 'ONC-06, Recibido' })

    await user.click(screen.getByTestId('etapa-en_clinica'))
    const clinica = screen.getByRole('button', { name: /^Clínica 2:/ })
    await user.click(clinica)
    expect(clinica).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'ONC-05, Recibido' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, En clínica' })).toBeInTheDocument()
    expect(clinica).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'ONC-06, Recibido' }))
    expect(await screen.findByRole('button', { name: 'ONC-06, En clínica' })).toBeInTheDocument()
    expect(clinica).toHaveAttribute('aria-pressed', 'true')
  }, 20000)

  it('muestra el historial y permite revertir un turno recibido', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })

    await user.click(screen.getByTestId('etapa-recibido'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    await screen.findByRole('button', { name: 'ONC-05, Recibido' })

    await user.click(screen.getByRole('button', { name: 'Ver historial del turno' }))
    expect(await screen.findByText('Registrado → Recibido')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revertir' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()
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
