import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'

vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, crearProgramacion: vi.fn(actual.crearProgramacion) }
})

import { crearProgramacion } from '../api/administracionApi.js'
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

async function completarAlta(
  user,
  { medico, subespecialidad, dias, inicio = '09:00', fin = '12:00', capacidad = '5', duracion = '30' },
) {
  await seleccionarOpcion(user, 'Seleccione un médico', medico)
  await seleccionarOpcion(user, 'Seleccione una subespecialidad', subespecialidad)
  for (const dia of dias) {
    await user.click(screen.getByRole('checkbox', { name: dia }))
  }
  fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: inicio } })
  fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: fin } })
  await user.type(screen.getByLabelText(/Capacidad máxima/), capacidad)
  await user.clear(screen.getByLabelText(/Duración estimada/))
  await user.type(screen.getByLabelText(/Duración estimada/), duracion)
}

describe('CuposPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    crearProgramacion.mockClear()
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

  it('muestra 7 días seleccionables y permite marcar varios', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))

    const dias = screen.getAllByRole('checkbox')
    expect(dias).toHaveLength(7)

    await user.click(screen.getByRole('checkbox', { name: 'Lunes' }))
    await user.click(screen.getByRole('checkbox', { name: 'Miércoles' }))

    expect(screen.getByRole('checkbox', { name: 'Lunes' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Miércoles' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Viernes' })).not.toBeChecked()
  })

  it('exige al menos un día seleccionado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await seleccionarOpcion(user, 'Seleccione un médico', 'Dra. Sofía Reyes')
    await seleccionarOpcion(user, 'Seleccione una subespecialidad', 'Medicina General')
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '12:00' } })
    await user.type(screen.getByLabelText(/Capacidad máxima/), '5')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Seleccione al menos un día.')).toBeInTheDocument()
    expect(crearProgramacion).not.toHaveBeenCalled()
  })

  it('crea la programación en varios días con un POST secuencial por día', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await completarAlta(user, {
      medico: 'Dra. Sofía Reyes',
      subespecialidad: 'Medicina General',
      dias: ['Lunes', 'Miércoles', 'Viernes'],
    })
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Programación creada')).toBeInTheDocument()

    expect(crearProgramacion).toHaveBeenCalledTimes(3)
    expect(crearProgramacion.mock.calls.map(([datos]) => datos.diaSemana)).toEqual([1, 3, 5])
    crearProgramacion.mock.calls.forEach(([datos]) => {
      expect(datos).not.toHaveProperty('diasSemana')
      expect(typeof datos.diaSemana).toBe('number')
    })

    // Modal cerrado y listado refrescado con los tres horarios.
    await waitFor(() => expect(screen.queryByText('Nueva programación')).not.toBeInTheDocument())
    await waitFor(() =>
      expect(
        within(screen.getByTestId('catalogo-escritorio')).getAllByText('09:00 - 12:00').length,
      ).toBe(3),
    )
  })

  it('éxito parcial: conserva éxitos, deja solo el día fallido y reintenta únicamente ese', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    // Lunes ya existe para Dr. Carlos Méndez + Medicina General; Martes 13:00-16:00 no solapa.
    await completarAlta(user, {
      medico: 'Dr. Carlos Méndez',
      subespecialidad: 'Medicina General',
      dias: ['Lunes', 'Martes'],
      inicio: '13:00',
      fin: '16:00',
    })
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => expect(crearProgramacion).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/Martes — creada/)).toBeInTheDocument()
    expect(screen.getByText(/Lunes —/)).toBeInTheDocument()

    // Modal abierto; solo Lunes permanece seleccionado.
    expect(screen.getByText('Nueva programación')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Lunes' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Martes' })).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Reintentar días fallidos' }))

    await waitFor(() => expect(crearProgramacion).toHaveBeenCalledTimes(3))
    const ultima = crearProgramacion.mock.calls.at(-1)[0]
    expect(ultima.diaSemana).toBe(1)
    // Martes nunca se reenvía.
    expect(
      crearProgramacion.mock.calls.slice(2).some(([datos]) => datos.diaSemana === 2),
    ).toBe(false)
  })

  it('todos fallan: mantiene el formulario y los días seleccionados', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await completarAlta(user, {
      medico: 'Dr. Carlos Méndez',
      subespecialidad: 'Medicina General',
      dias: ['Lunes'],
    })
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => expect(crearProgramacion).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Nueva programación')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Lunes' })).toBeChecked()
    expect(screen.getByText(/Lunes —/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar días fallidos' })).toBeInTheDocument()
  })

  it('muestra el solapamiento devuelto por el backend asociado al día', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    // Dr. Carlos Méndez atiende Lunes 07:00-13:00 en Medicina General: el horario 08:00-10:00 se superpone.
    await completarAlta(user, {
      medico: 'Dr. Carlos Méndez',
      subespecialidad: 'Cardiología Clínica',
      dias: ['Lunes'],
      inicio: '08:00',
      fin: '10:00',
      capacidad: '2',
    })
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText(/se superpone/i)).toBeInTheDocument()
  })

  it('crea una programación de un solo día y la muestra en el listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()
    await abrirProgramacion(user)
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await completarAlta(user, {
      medico: 'Dra. Sofía Reyes',
      subespecialidad: 'Medicina General',
      dias: ['Viernes'],
    })
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Programación creada')).toBeInTheDocument()
    expect(crearProgramacion).toHaveBeenCalledTimes(1)
    expect(crearProgramacion.mock.calls[0][0].diaSemana).toBe(5)

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
