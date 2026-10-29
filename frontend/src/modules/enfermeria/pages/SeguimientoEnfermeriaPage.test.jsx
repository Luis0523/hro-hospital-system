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
    expect(screen.getByTestId('etapa-registrado')).toHaveTextContent('Registrar')
    expect(screen.getByTestId('etapa-en_clinica')).toHaveTextContent('Recibir/Repartir')
    expect(screen.queryByTestId('etapa-recibido')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clínicas físicas' })).toBeInTheDocument()
  })

  it('registra, envía a clínica y descuenta devoluciones por clínica', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-en_clinica'))
    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    expect(
      await screen.findByRole('button', { name: 'ONC-05, Recibir/Repartir' }),
    ).toBeInTheDocument()

    await user.click(screen.getByTestId('etapa-devuelto'))
    expect(
      screen.queryByRole('button', { name: 'ONC-05, Recibir/Repartir' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Devoluciones por clínica' })).toBeInTheDocument()

    const fila = screen.getByText('Clínica 2').closest('tr')
    const celdas = () => within(fila).getAllByRole('cell')
    const valores = () =>
      celdas()
        .slice(1, 4)
        .map((celda) => Number(celda.textContent))

    await user.click(within(fila).getByRole('button', { name: 'Restar 1' }))
    await waitFor(() => expect(Number(celdas()[2].textContent)).toBe(1))
    const [asignados, devueltos, pendientes] = valores()
    expect(pendientes).toBe(asignados - devueltos)

    await user.click(within(fila).getByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(Number(celdas()[2].textContent)).toBe(0))
    expect(valores()[2]).toBe(valores()[0])
  }, 20000)

  it('permite cambiar el tipo de registro de un turno ya registrado', async () => {
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

    const editor = () => within(screen.getByTestId('editor-tipo-registro'))
    expect(editor().getByRole('button', { name: 'Privado de libertad' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(editor().getByRole('button', { name: 'Presentación' }))
    expect(
      await screen.findByRole('button', { name: 'ONC-05, Registrado, presentación' }),
    ).toBeInTheDocument()
    expect(editor().getByRole('button', { name: 'Presentación' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(editor().getByRole('button', { name: 'Sin marca' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()

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

  it('doble Enter registra el turno como presentación', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('etapa-registrado')
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}')

    const oncologia = screen.getByRole('button', { name: /^Oncología\./ })
    await waitFor(() => expect(oncologia).toHaveFocus())
    await user.keyboard('{Enter}{Enter}')

    expect(
      await screen.findByRole('button', { name: 'ONC-05, Registrado, presentación' }),
    ).toBeInTheDocument()
  }, 20000)

  it('mantiene la clínica destino para asignar varios turnos seguidos', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })
    await user.click(screen.getByRole('button', { name: 'ONC-06, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-06, Registrado' })

    await user.click(screen.getByTestId('etapa-en_clinica'))
    const clinica = screen.getByRole('button', { name: /^Clínica 2:/ })
    await user.click(clinica)
    expect(clinica).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    expect(
      await screen.findByRole('button', { name: 'ONC-05, Recibir/Repartir' }),
    ).toBeInTheDocument()
    expect(clinica).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'ONC-06, Registrado' }))
    expect(
      await screen.findByRole('button', { name: 'ONC-06, Recibir/Repartir' }),
    ).toBeInTheDocument()
    expect(clinica).toHaveAttribute('aria-pressed', 'true')
  }, 20000)

  it('muestra el historial y permite revertir un turno en clínica', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })

    await user.click(screen.getByTestId('etapa-en_clinica'))
    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    await screen.findByRole('button', { name: 'ONC-05, Recibir/Repartir' })

    await user.click(screen.getByRole('button', { name: 'Ver historial del turno' }))
    expect(await screen.findByText('Registrado → Recibir/Repartir')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revertir' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()
  }, 20000)

  it('en modo Archivo oculta las casillas y muestra la salida a Archivo', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-archivo'))

    expect(
      await screen.findByRole('heading', { name: 'Salida de Enfermería a Archivo' }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Escriba o escanee el expediente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^ONC-05,/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Personal' }))
    expect(screen.getByRole('combobox', { name: /clínica/i })).toBeInTheDocument()
  })

  it('abre el registro manual de salida a Archivo', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-archivo'))
    await user.click(await screen.findByRole('button', { name: 'Registro manual' }))

    const dialogo = await screen.findByRole('dialog', { name: 'Registro manual de salida' })
    expect(within(dialogo).getByLabelText('Número de expediente')).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Nombre completo')).toBeInTheDocument()
  }, 20000)

  it('elimina un registro erróneo y deja la casilla en blanco', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar registro' }))
    await user.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))

    expect(await screen.findByRole('button', { name: 'ONC-05, sin registro' })).toBeInTheDocument()
  }, 20000)

  it('revierte un turno enviado a clínica y lo deja en Registrado', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByTestId('etapa-registrado'))
    await user.click(screen.getByRole('button', { name: 'ONC-05, sin registro' }))
    await screen.findByRole('button', { name: 'ONC-05, Registrado' })

    await user.click(screen.getByTestId('etapa-en_clinica'))
    await user.click(screen.getByRole('button', { name: /^Clínica 2:/ }))
    await user.click(screen.getByRole('button', { name: 'ONC-05, Registrado' }))
    expect(
      await screen.findByRole('button', { name: 'ONC-05, Recibir/Repartir' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revertir' }))
    expect(await screen.findByRole('button', { name: 'ONC-05, Registrado' })).toBeInTheDocument()
  }, 20000)

  it('filtra por etapa sin controles de búsqueda ni registro', async () => {
    const user = userEvent.setup()
    renderPagina()

    const etapa = await screen.findByTestId('etapa-en_clinica')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'true')
    await user.click(etapa)
    expect(etapa).toHaveAttribute('aria-pressed', 'false')

    expect(screen.queryByLabelText('Buscar especialidad o turno')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver todos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Registrar turno$/ })).not.toBeInTheDocument()
  })
})
