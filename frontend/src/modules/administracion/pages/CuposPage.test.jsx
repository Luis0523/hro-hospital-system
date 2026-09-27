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

async function esperarTextoCatalogo(texto) {
  return waitFor(() =>
    expect(within(screen.getByTestId('catalogo-escritorio')).getByText(texto)).toBeInTheDocument(),
  )
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

  it('filtra médicos por estado y ofrece Reactivar solo en inactivos', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    expect(
      within(screen.getByTestId('catalogo-escritorio')).queryByText('Dr. Óscar Ramírez'),
    ).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')
    await esperarTextoCatalogo('Dr. Óscar Ramírez')

    const escritorio = screen.getByTestId('catalogo-escritorio')
    expect(within(escritorio).getByRole('button', { name: 'Reactivar' })).toBeInTheDocument()
    expect(within(escritorio).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('reactiva un médico inactivo', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')
    await esperarTextoCatalogo('Dr. Óscar Ramírez')

    const fila = within(screen.getByTestId('catalogo-escritorio'))
      .getByText('Dr. Óscar Ramírez')
      .closest('tr')
    await user.click(within(fila).getByRole('button', { name: 'Reactivar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, reactivar' }))

    expect(await screen.findByText('Médico reactivado')).toBeInTheDocument()
  })

  it('lista la programación general por defecto y muestra el colegiado del médico', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getAllByText('Dr. Carlos Méndez').length).toBeGreaterThan(0)
    expect(within(escritorio).getAllByText('Colegiado: COL-10021').length).toBeGreaterThan(0)
    expect(within(escritorio).getByText('Medicina General')).toBeInTheDocument()
    expect(within(escritorio).getByText('07:00 - 13:00')).toBeInTheDocument()
  })

  it('filtra la programación por médico', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await seleccionarOpcion(user, 'Todos los médicos', 'Dra. Sofía Reyes')

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Dra. Sofía Reyes')).toBeInTheDocument()
  })

  it('filtra la programación por subespecialidad', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await seleccionarOpcion(user, 'Todas las subespecialidades', 'Pediatría General')

    expect(within(await esperarCatalogo()).getByText('Dra. Sofía Reyes')).toBeInTheDocument()
  })

  it('filtra la programación por día', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await seleccionarOpcion(user, 'Todos los días', 'Lunes')

    await esperarTextoCatalogo('07:00 - 13:00')
  })

  it('combina filtros de subespecialidad y estado inactivos', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')
    await seleccionarOpcion(user, 'Todas las subespecialidades', 'Pediatría General')

    await esperarTextoCatalogo('Dra. Sofía Reyes')
  })

  it('limpia los filtros y vuelve al listado general de activos', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await seleccionarOpcion(user, 'Todas las subespecialidades', 'Pediatría General')
    await esperarTextoCatalogo('Dra. Sofía Reyes')

    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }))

    await esperarTextoCatalogo('Medicina General')
  })

  it('crea una programación y muestra día, horario, capacidad y duración', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await seleccionarOpcion(user, 'Seleccione un médico', 'Dra. Sofía Reyes')
    await seleccionarOpcion(user, 'Seleccione una subespecialidad', 'Medicina General')
    await seleccionarOpcion(user, 'Seleccione un día', 'Viernes')

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '12:00' } })
    await user.type(screen.getByLabelText(/Capacidad máxima/), '5')
    await user.clear(screen.getByLabelText(/Duración estimada/))
    await user.type(screen.getByLabelText(/Duración estimada/), '30')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Programación creada')).toBeInTheDocument()

    await esperarTextoCatalogo('Viernes')
    await esperarTextoCatalogo('09:00 - 12:00')
  })

  it('edita una programación con médico, subespecialidad y día bloqueados', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)

    const escritorio = await esperarCatalogo()
    await user.click(within(escritorio).getAllByRole('button', { name: 'Editar' })[0])

    expect(screen.getByText('Editar programación')).toBeInTheDocument()
    expect(screen.getByLabelText('Médico')).toBeDisabled()
    expect(screen.getByLabelText('Subespecialidad')).toBeDisabled()
    expect(screen.getByLabelText('Día')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '11:00' } })
    await user.clear(screen.getByLabelText(/Capacidad máxima/))
    await user.type(screen.getByLabelText(/Capacidad máxima/), '6')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Programación actualizada')).toBeInTheDocument()
    await esperarTextoCatalogo('08:00 - 11:00')
  })

  it('desactiva una programación con confirmación', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)

    const escritorio = await esperarCatalogo()
    await user.click(within(escritorio).getAllByRole('button', { name: 'Desactivar' })[0])
    await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

    expect(await screen.findByText('Programación desactivada')).toBeInTheDocument()
  })

  it('reactiva una programación con médico y subespecialidad activos', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')
    await seleccionarOpcion(user, 'Todas las subespecialidades', 'Pediatría General')

    const fila = within(screen.getByTestId('catalogo-escritorio'))
      .getAllByText('Dra. Sofía Reyes')[0]
      .closest('tr')
    await user.click(within(fila).getByRole('button', { name: 'Reactivar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, reactivar' }))

    expect(await screen.findByText('Programación reactivada')).toBeInTheDocument()
  })

  it('muestra el error del backend al reactivar con médico inactivo', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.selectOptions(screen.getByLabelText('Estado'), 'inactivos')

    const fila = within(screen.getByTestId('catalogo-escritorio'))
      .getAllByText('Dr. Óscar Ramírez')[0]
      .closest('tr')
    await user.click(within(fila).getByRole('button', { name: 'Reactivar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, reactivar' }))

    expect(await screen.findByText('No se pudo reactivar')).toBeInTheDocument()
    expect(screen.getByText(/el médico .* está inactivo/i)).toBeInTheDocument()
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
