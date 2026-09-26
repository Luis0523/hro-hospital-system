import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'
import CuposPage from './CuposPage.jsx'

// jsdom no implementa ResizeObserver y Headless UI (Listbox) lo requiere.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

function renderPagina() {
  return render(
    <ToastProvider>
      <CuposPage />
    </ToastProvider>,
  )
}

async function esperarCatalogo() {
  return screen.findByTestId('catalogo-escritorio')
}

async function abrirProgramacion(user) {
  await user.click(screen.getByRole('tab', { name: 'Programación y capacidad' }))
}

async function seleccionarOpcion(user, nombreBoton, nombreOpcion) {
  await user.click(screen.getByRole('button', { name: nombreBoton }))
  await user.click(await screen.findByRole('option', { name: nombreOpcion }))
}

describe('CuposPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('renderiza el heading y las dos pestañas con médicos cargados', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Cupos y capacidad' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Médicos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Programación y capacidad' })).toBeInTheDocument()

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Dr. Carlos Méndez')).toBeInTheDocument()
    expect(within(escritorio).getByText('COL-10021')).toBeInTheDocument()
  })

  it('muestra un indicador de carga al consultar médicos', () => {
    renderPagina()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('valida que el nombre y el colegiado sean obligatorios', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El número de colegiado es obligatorio')).toBeInTheDocument()
  })

  it('crea un médico y lo muestra en el listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await user.type(screen.getByLabelText('Nombre del médico'), 'Dr. Andrés Lima')
    await user.type(screen.getByLabelText('Número de colegiado'), 'COL-50001')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Médico registrado')).toBeInTheDocument()
    expect(within(await esperarCatalogo()).getByText('Dr. Andrés Lima')).toBeInTheDocument()
  })

  it('edita un médico existente', async () => {
    const user = userEvent.setup()
    renderPagina()
    const escritorio = await esperarCatalogo()

    await user.click(within(escritorio).getAllByRole('button', { name: 'Editar' })[0])
    expect(screen.getByText('Editar médico')).toBeInTheDocument()

    const campoNombre = screen.getByLabelText('Nombre del médico')
    await user.clear(campoNombre)
    await user.type(campoNombre, 'Dr. Carlos Méndez Actualizado')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Médico actualizado')).toBeInTheDocument()
    expect(
      within(await esperarCatalogo()).getByText('Dr. Carlos Méndez Actualizado'),
    ).toBeInTheDocument()
  })

  it('desactiva un médico con confirmación y lo retira del listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    const escritorio = await esperarCatalogo()

    await user.click(within(escritorio).getAllByRole('button', { name: 'Desactivar' })[0])
    expect(screen.getByText(/¿Deseas desactivar este registro\?/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

    expect(await screen.findByText('Médico desactivado')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(screen.getByTestId('catalogo-escritorio')).queryByText('Dr. Carlos Méndez'),
      ).not.toBeInTheDocument(),
    )
  })

  it('lista la programación al filtrar por médico, con día y horario', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)
    await seleccionarOpcion(user, 'Filtrar por médico', 'Dr. Carlos Méndez')

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Medicina General')).toBeInTheDocument()
    expect(within(escritorio).getByText('Lunes')).toBeInTheDocument()
    expect(within(escritorio).getByText('07:00 - 13:00')).toBeInTheDocument()
  })

  it('lista la programación al filtrar por subespecialidad', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)
    await user.click(screen.getByRole('button', { name: 'Médico' }))
    await user.click(await screen.findByRole('option', { name: 'Subespecialidad' }))
    await seleccionarOpcion(user, 'Filtrar por subespecialidad', 'Pediatría General')

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Dra. Sofía Reyes')).toBeInTheDocument()
  })

  it('crea una programación y muestra día, horario, capacidad y duración', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)
    await seleccionarOpcion(user, 'Filtrar por médico', 'Dra. Sofía Reyes')
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await seleccionarOpcion(user, 'Seleccione una subespecialidad', 'Medicina General')
    await seleccionarOpcion(user, 'Seleccione un día', 'Viernes')

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '12:00' } })
    await user.type(screen.getByLabelText(/Capacidad máxima/), '5')
    await user.clear(screen.getByLabelText(/Duración estimada/))
    await user.type(screen.getByLabelText(/Duración estimada/), '30')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Programación creada')).toBeInTheDocument()

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Viernes')).toBeInTheDocument()
    expect(within(escritorio).getByText('09:00 - 12:00')).toBeInTheDocument()
  })

  it('no muestra Editar en programación', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)
    await seleccionarOpcion(user, 'Filtrar por médico', 'Dr. Carlos Méndez')

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(within(escritorio).getAllByRole('button', { name: 'Ver' }).length).toBeGreaterThan(0)
  })

  it('aplica roving tabindex y navega entre pestañas con el teclado', async () => {
    const user = userEvent.setup()
    renderPagina()

    const medicos = screen.getByRole('tab', { name: 'Médicos' })
    const programacion = screen.getByRole('tab', { name: 'Programación y capacidad' })

    expect(medicos).toHaveAttribute('tabindex', '0')
    expect(programacion).toHaveAttribute('tabindex', '-1')

    medicos.focus()
    await user.keyboard('{ArrowRight}')

    expect(programacion).toHaveFocus()
    expect(programacion).toHaveAttribute('tabindex', '0')
    expect(medicos).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowLeft}')
    expect(medicos).toHaveFocus()
  })
})
