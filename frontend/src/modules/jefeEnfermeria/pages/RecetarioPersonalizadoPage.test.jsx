import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { calcularEdad, hoyIso } from '@/shared/utils/fecha'

const { buscarPacienteRecetarioMock } = vi.hoisted(() => ({
  buscarPacienteRecetarioMock: vi.fn(),
}))

vi.mock('../api/recetarioApi', () => ({
  buscarPacienteRecetario: buscarPacienteRecetarioMock,
}))

import RecetarioPersonalizadoPage from './RecetarioPersonalizadoPage.jsx'

const ANCHO_ORIGINAL = window.innerWidth

const PACIENTE = {
  id: '00000000-0000-0000-0000-000000000000',
  dpi: '2456789010101',
  nombres: 'María Fernanda',
  apellidos: 'López Morales',
  fechaNacimiento: '1990-04-12',
  sexo: 'F',
  telefono: null,
  direccion: null,
  numeroExpediente: '30954',
}

function renderPagina() {
  return render(<RecetarioPersonalizadoPage />)
}

async function buscarPaciente(user, expediente = '30954') {
  await user.type(screen.getByLabelText(/número de expediente/i), expediente)
  await user.click(screen.getByRole('button', { name: /^buscar$/i }))
}

async function seleccionarPaciente(user) {
  buscarPacienteRecetarioMock.mockResolvedValue(PACIENTE)
  renderPagina()
  await buscarPaciente(user)
  await screen.findByRole('heading', { name: /María Fernanda López Morales/i })
}

async function abrirFormulario(user) {
  await user.click(screen.getByRole('button', { name: /agregar medicamento/i }))
  return screen.findByRole('dialog')
}

async function completarMedicamento(user, dialogo) {
  await user.type(within(dialogo).getByLabelText(/^medicamento/i), 'Amoxicilina')
  await user.type(within(dialogo).getByLabelText(/^dosis/i), '500 mg')
  await user.type(within(dialogo).getByLabelText(/vía de administración/i), 'Oral')
  await user.type(within(dialogo).getByLabelText(/^frecuencia/i), 'Cada 8 horas')
  fireEvent.change(within(dialogo).getByLabelText(/fecha y hora de inicio/i), {
    target: { value: '2026-11-01T08:00' },
  })
  await user.type(within(dialogo).getByLabelText(/^cantidad solicitada/i), '21')
}

async function completarSolicitud(user) {
  await user.type(screen.getByLabelText(/^cama$/i), '12')
  await user.type(screen.getByLabelText(/^servicio$/i), 'Medicina Interna')
  await user.type(screen.getByLabelText(/^diagnóstico$/i), 'Neumonía')
  await user.type(screen.getByLabelText(/^nombre del médico$/i), 'Dra. Ana Pérez')
  await user.type(screen.getByLabelText(/^observaciones$/i), 'Paciente estable.')
}

async function agregarMedicamento(user) {
  const dialogo = await abrirFormulario(user)
  await completarMedicamento(user, dialogo)
  await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

beforeEach(() => {
  buscarPacienteRecetarioMock.mockReset()
})

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    value: ANCHO_ORIGINAL,
    configurable: true,
    writable: true,
  })
})

describe('RecetarioPersonalizadoPage', () => {
  it('renderiza la solicitud y mantiene medicamentos bloqueados sin paciente', () => {
    renderPagina()

    expect(
      screen.getByRole('heading', { name: 'Solicitud de Medicamentos Especiales' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Recetario personalizado · Jefatura de Enfermería')).toBeInTheDocument()
    expect(screen.getByLabelText(/número de expediente/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Medicamentos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /agregar medicamento/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /imprimir formato no\. 2/i }),
    ).not.toBeInTheDocument()
  })

  it('exige un expediente antes de buscar', () => {
    renderPagina()

    expect(screen.getByRole('button', { name: /^buscar$/i })).toBeDisabled()
    expect(buscarPacienteRecetarioMock).not.toHaveBeenCalled()
  })

  it('muestra loading mientras consulta', async () => {
    const user = userEvent.setup()
    let resolver
    buscarPacienteRecetarioMock.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )

    renderPagina()
    await buscarPaciente(user)

    expect(await screen.findByRole('status')).toHaveTextContent('Buscando paciente...')

    resolver(PACIENTE)
    expect(
      await screen.findByRole('heading', { name: /María Fernanda López Morales/i }),
    ).toBeInTheDocument()
  })

  it('muestra los datos API del paciente, sin DPI ni dirección', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    expect(screen.getByRole('heading', { name: 'Datos del paciente' })).toBeInTheDocument()
    expect(screen.getByText('30954')).toBeInTheDocument()
    expect(screen.queryByText('3095-4')).not.toBeInTheDocument()
    expect(screen.getByText(`${calcularEdad(PACIENTE.fechaNacimiento)} años`)).toBeInTheDocument()
    expect(screen.getByText('No registrado')).toBeInTheDocument()
    expect(screen.queryByText('2456789010101')).not.toBeInTheDocument()
    expect(screen.queryByText('Dirección')).not.toBeInTheDocument()
    expect(buscarPacienteRecetarioMock).toHaveBeenCalledWith('30954')
  })

  it('permite editar cama, servicio, diagnóstico, fecha, médico y observaciones', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const fecha = screen.getByLabelText(/^fecha$/i)
    expect(fecha).toHaveValue(hoyIso())
    fireEvent.change(fecha, { target: { value: '2026-12-01' } })
    expect(fecha).toHaveValue('2026-12-01')

    await user.type(screen.getByLabelText('Cama'), '12')
    await user.type(screen.getByLabelText('Servicio'), 'Medicina Interna')
    await user.type(screen.getByLabelText('Diagnóstico'), 'Neumonía')
    await user.type(screen.getByLabelText('Nombre del médico'), 'Dra. Ana Pérez')
    await user.type(screen.getByLabelText('Observaciones'), 'Paciente estable.')

    expect(screen.getByLabelText('Cama')).toHaveValue('12')
    expect(screen.getByLabelText('Servicio')).toHaveValue('Medicina Interna')
    expect(screen.getByLabelText('Diagnóstico')).toHaveValue('Neumonía')
    expect(screen.getByLabelText('Nombre del médico')).toHaveValue('Dra. Ana Pérez')
    expect(screen.getByLabelText('Observaciones')).toHaveValue('Paciente estable.')
    expect(
      screen.getByText('La firma del médico se realizará en el formato impreso.'),
    ).toBeInTheDocument()
  })

  it('muestra paciente no encontrado', async () => {
    const user = userEvent.setup()
    buscarPacienteRecetarioMock.mockResolvedValue(null)

    renderPagina()
    await buscarPaciente(user)

    expect(await screen.findByText('Paciente no encontrado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /agregar medicamento/i })).not.toBeInTheDocument()
  })

  it('muestra un error controlado si falla la consulta', async () => {
    const user = userEvent.setup()
    buscarPacienteRecetarioMock.mockRejectedValue(new Error('Fallo de red'))

    renderPagina()
    await buscarPaciente(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo de red')
    expect(screen.queryByRole('button', { name: /agregar medicamento/i })).not.toBeInTheDocument()
  })

  it('usa los campos reales del HRO y valida los obligatorios', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    expect(within(dialogo).getByLabelText(/^medicamento/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^dosis/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/vía de administración/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^frecuencia/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/fecha y hora de inicio/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^cantidad solicitada/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^cantidad despachada/i)).toBeInTheDocument()
    expect(within(dialogo).queryByLabelText(/presentación/i)).not.toBeInTheDocument()
    expect(within(dialogo).queryByLabelText(/^duración/i)).not.toBeInTheDocument()
    expect(within(dialogo).queryByLabelText(/indicaciones/i)).not.toBeInTheDocument()

    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    expect(within(dialogo).getByText('El medicamento es obligatorio.')).toBeInTheDocument()
    expect(
      within(dialogo).getByText('La fecha y hora de inicio es obligatoria.'),
    ).toBeInTheDocument()
    expect(within(dialogo).getByText('La cantidad solicitada es obligatoria.')).toBeInTheDocument()
  })

  it('rechaza cantidad solicitada igual a cero', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await user.type(within(dialogo).getByLabelText(/^medicamento/i), 'Amoxicilina')
    await user.type(within(dialogo).getByLabelText(/^dosis/i), '500 mg')
    await user.type(within(dialogo).getByLabelText(/vía de administración/i), 'Oral')
    await user.type(within(dialogo).getByLabelText(/^frecuencia/i), 'Cada 8 horas')
    fireEvent.change(within(dialogo).getByLabelText(/fecha y hora de inicio/i), {
      target: { value: '2026-11-01T08:00' },
    })
    await user.type(within(dialogo).getByLabelText(/^cantidad solicitada/i), '0')
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    expect(
      within(dialogo).getByText('La cantidad solicitada debe ser mayor que 0.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Amoxicilina')).not.toBeInTheDocument()
  })

  it('agrega un medicamento con cantidad despachada opcional y lo elimina', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await completarMedicamento(user, dialogo)
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Amoxicilina')).toBeInTheDocument()
    expect(screen.getByText('500 mg')).toBeInTheDocument()
    expect(screen.getByText('Oral')).toBeInTheDocument()
    expect(screen.getByText('Cada 8 horas')).toBeInTheDocument()
    expect(screen.getByText('2026-11-01 08:00')).toBeInTheDocument()
    expect(screen.getByText('21')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar Amoxicilina' }))

    expect(screen.queryByText('Amoxicilina')).not.toBeInTheDocument()
    expect(screen.getByText('Sin medicamentos agregados')).toBeInTheDocument()
  })

  it('edita un medicamento sin duplicar la fila', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await completarMedicamento(user, dialogo)
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Editar Amoxicilina' }))

    const edicion = await screen.findByRole('dialog')
    expect(within(edicion).getByText('Editar medicamento')).toBeInTheDocument()
    expect(within(edicion).getByLabelText(/^medicamento/i)).toHaveValue('Amoxicilina')
    expect(within(edicion).getByLabelText(/^cantidad solicitada/i)).toHaveValue(21)
    expect(within(edicion).getByLabelText(/fecha y hora de inicio/i)).toHaveValue(
      '2026-11-01T08:00',
    )

    const dosis = within(edicion).getByLabelText(/^dosis/i)
    await user.clear(dosis)
    await user.type(dosis, '1 g')
    await user.type(within(edicion).getByLabelText(/^cantidad despachada/i), '5')
    await user.click(within(edicion).getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getAllByText('Amoxicilina')).toHaveLength(1)
    expect(screen.getByText('1 g')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('cancela la edición sin modificar el medicamento', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await completarMedicamento(user, dialogo)
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Editar Amoxicilina' }))
    const edicion = await screen.findByRole('dialog')
    const nombre = within(edicion).getByLabelText(/^medicamento/i)
    await user.clear(nombre)
    await user.type(nombre, 'Ibuprofeno')
    await user.click(within(edicion).getByRole('button', { name: /cancelar/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Amoxicilina')).toBeInTheDocument()
    expect(screen.queryByText('Ibuprofeno')).not.toBeInTheDocument()
  })

  it('en móvil muestra tarjetas con Editar y Eliminar en lugar de tabla', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 412,
      configurable: true,
      writable: true,
    })

    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await completarMedicamento(user, dialogo)
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(screen.getByTestId('medicamentos-movil')).toBeInTheDocument()
    expect(screen.queryByTestId('medicamentos-tabla')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar Amoxicilina' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar Amoxicilina' })).toBeInTheDocument()
  })

  it('mantiene la impresión deshabilitada si faltan datos de la solicitud', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    expect(screen.getByRole('button', { name: /imprimir formato no\. 2/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /imprimir formato no\. 1/i })).toBeDisabled()
    expect(
      screen.getByText(/Faltan: cama, servicio, diagnóstico, médico, al menos un medicamento/i),
    ).toBeInTheDocument()
  })

  it('habilita la impresión con la solicitud completa y llama a window.print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()

    try {
      await seleccionarPaciente(user)
      await completarSolicitud(user)
      await agregarMedicamento(user)

      const boton2 = screen.getByRole('button', { name: /imprimir formato no\. 2/i })
      const boton1 = screen.getByRole('button', { name: /imprimir formato no\. 1/i })
      expect(boton2).toBeEnabled()
      expect(boton1).toBeEnabled()

      await user.click(boton2)
      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1))

      await user.click(boton1)
      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(2))
    } finally {
      printSpy.mockRestore()
    }
  })
})
