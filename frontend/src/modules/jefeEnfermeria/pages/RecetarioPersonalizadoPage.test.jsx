import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatearFechaCorta, hoyIso } from '@/shared/utils/fecha'

const { buscarPacienteRecetarioMock } = vi.hoisted(() => ({
  buscarPacienteRecetarioMock: vi.fn(),
}))

vi.mock('../api/recetarioApi', () => ({
  buscarPacienteRecetario: buscarPacienteRecetarioMock,
}))

import RecetarioPersonalizadoPage from './RecetarioPersonalizadoPage.jsx'

const ANCHO_ORIGINAL = window.innerWidth

const PACIENTE = {
  numeroExpediente: '837871',
  nombreCompleto: 'María Fernanda López Morales',
  nombres: 'María Fernanda López Morales',
  apellidos: '',
}

function renderPagina() {
  return render(<RecetarioPersonalizadoPage />)
}

async function buscarPaciente(user, expediente = '837871') {
  await user.type(screen.getByLabelText(/número de expediente/i), expediente)
  await user.click(screen.getByRole('button', { name: /^buscar$/i }))
}

async function seleccionarPaciente(user) {
  buscarPacienteRecetarioMock.mockResolvedValue(PACIENTE)
  renderPagina()
  await buscarPaciente(user)
  await screen.findByRole('heading', { name: 'María Fernanda López Morales' })
  await screen.findByLabelText(/^cama/i)
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
  await user.type(screen.getByLabelText(/^cama/i), '12')
  await user.type(screen.getByLabelText(/^servicio/i), 'Medicina Interna')
  await user.type(screen.getByLabelText(/^diagnóstico/i), 'Neumonía')
  await user.type(screen.getByLabelText(/^nombre del médico/i), 'Dra. Ana Pérez')
  await user.type(screen.getByLabelText(/^observaciones/i), 'Paciente estable.')
}

async function agregarMedicamento(user) {
  const dialogo = await abrirFormulario(user)
  await completarMedicamento(user, dialogo)
  await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

function listaMedicamentos() {
  return screen.getByTestId('medicamentos-lista')
}

function panelGuardados() {
  return screen.getByRole('complementary', { name: 'Medicamentos guardados' })
}

function resumen() {
  return screen.getByRole('complementary', { name: 'Resumen de la solicitud' })
}

beforeEach(() => {
  buscarPacienteRecetarioMock.mockReset()
  localStorage.clear()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(window, 'innerWidth', {
    value: ANCHO_ORIGINAL,
    configurable: true,
    writable: true,
  })
})

describe('RecetarioPersonalizadoPage', () => {
  it('inicia con el buscador y sin secciones de captura', () => {
    renderPagina()

    expect(
      screen.getByRole('heading', { name: 'Solicitud de Medicamentos Especiales' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/número de expediente/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Medicamentos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir y guardar/i })).not.toBeInTheDocument()
  })

  it('exige un expediente numérico antes de buscar', async () => {
    const user = userEvent.setup()
    renderPagina()

    expect(screen.getByRole('button', { name: /^buscar$/i })).toBeDisabled()
    expect(buscarPacienteRecetarioMock).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/número de expediente/i), 'ABC123')
    expect(
      screen.getByText('El número de expediente debe contener solo números.'),
    ).toBeInTheDocument()
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
      await screen.findByRole('heading', { name: 'María Fernanda López Morales' }),
    ).toBeInTheDocument()
  })

  it('muestra solo el nombre y el expediente del paciente, con progreso y resumen', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    expect(screen.getByText('Paciente localizado')).toBeInTheDocument()
    expect(screen.getByText('Expediente 837871')).toBeInTheDocument()
    expect(screen.queryByText('2456789010101')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Progreso de la solicitud' })).toBeInTheDocument()
    expect(resumen()).toBeInTheDocument()
    expect(within(resumen()).getByText('María Fernanda López Morales')).toBeInTheDocument()
    expect(buscarPacienteRecetarioMock).toHaveBeenCalledWith('837871')
  })

  it('permite cambiar de paciente y vuelve al buscador', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    await user.click(screen.getByRole('button', { name: /cambiar paciente/i }))

    expect(screen.getByLabelText(/número de expediente/i)).toHaveValue('')
    expect(
      screen.queryByRole('heading', { name: 'María Fernanda López Morales' }),
    ).not.toBeInTheDocument()
  })

  it('permite editar cama, servicio, diagnóstico, fecha, médico y observaciones', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const fecha = screen.getByLabelText(/^fecha/i)
    expect(fecha).toHaveValue(hoyIso())
    expect(screen.getAllByText(formatearFechaCorta(hoyIso())).length).toBeGreaterThan(0)
    fireEvent.change(fecha, { target: { value: '2026-12-01' } })
    expect(fecha).toHaveValue('2026-12-01')

    await user.type(screen.getByLabelText(/^cama/i), '12')
    await user.type(screen.getByLabelText(/^servicio/i), 'Medicina Interna')
    await user.type(screen.getByLabelText(/^diagnóstico/i), 'Neumonía')
    await user.type(screen.getByLabelText(/^nombre del médico/i), 'Dra. Ana Pérez')
    await user.type(screen.getByLabelText(/^observaciones/i), 'Paciente estable.')

    expect(screen.getByLabelText(/^cama/i)).toHaveValue('12')
    expect(screen.getByLabelText(/^servicio/i)).toHaveValue('Medicina Interna')
    expect(screen.getByLabelText(/^diagnóstico/i)).toHaveValue('Neumonía')
    expect(screen.getByLabelText(/^nombre del médico/i)).toHaveValue('Dra. Ana Pérez')
    expect(screen.getByLabelText(/^observaciones/i)).toHaveValue('Paciente estable.')
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

  it('valida los campos obligatorios del medicamento y no pide cantidad despachada', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    expect(within(dialogo).getByLabelText(/^medicamento/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^dosis/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/vía de administración/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^frecuencia/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/fecha y hora de inicio/i)).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^cantidad solicitada/i)).toBeInTheDocument()
    expect(within(dialogo).queryByLabelText(/cantidad despachada/i)).not.toBeInTheDocument()

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
  })

  it('agrega un medicamento en tarjeta y lo elimina con confirmación', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    const tarjeta = within(listaMedicamentos()).getByText('Amoxicilina').closest('li')
    expect(within(tarjeta).getByText('500 mg')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Oral')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Cada 8 horas')).toBeInTheDocument()
    expect(within(tarjeta).getByText('1 nov 2026, 08:00')).toBeInTheDocument()
    expect(within(tarjeta).getByText('21')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar Amoxicilina' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(screen.queryByTestId('medicamentos-lista')).not.toBeInTheDocument()
    expect(screen.getByText('Sin medicamentos agregados')).toBeInTheDocument()
  })

  it('edita un medicamento sin duplicar la tarjeta', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    await user.click(screen.getByRole('button', { name: 'Editar Amoxicilina' }))

    const edicion = await screen.findByRole('dialog')
    expect(within(edicion).getByText('Editar medicamento')).toBeInTheDocument()
    expect(within(edicion).getByLabelText(/^medicamento/i)).toHaveValue('Amoxicilina')
    expect(within(edicion).getByLabelText(/^cantidad solicitada/i)).toHaveValue(21)

    const dosis = within(edicion).getByLabelText(/^dosis/i)
    await user.clear(dosis)
    await user.type(dosis, '1 g')
    await user.click(within(edicion).getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(listaMedicamentos()).getAllByText('Amoxicilina')).toHaveLength(1)
    expect(within(listaMedicamentos()).getByText('1 g')).toBeInTheDocument()
  })

  it('cancela la edición sin modificar el medicamento', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    await user.click(screen.getByRole('button', { name: 'Editar Amoxicilina' }))
    const edicion = await screen.findByRole('dialog')
    const nombre = within(edicion).getByLabelText(/^medicamento/i)
    await user.clear(nombre)
    await user.type(nombre, 'Ibuprofeno')
    await user.click(within(edicion).getByRole('button', { name: /cancelar/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(listaMedicamentos()).getByText('Amoxicilina')).toBeInTheDocument()
    expect(within(listaMedicamentos()).queryByText('Ibuprofeno')).not.toBeInTheDocument()
  })

  it('guarda el medicamento y lo reutiliza desde el panel sin reescribir sus datos', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    const panel = panelGuardados()
    expect(within(panel).getByText('Amoxicilina')).toBeInTheDocument()
    expect(within(panel).getByText('500 mg · Oral · Cada 8 horas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Usar Amoxicilina' }))

    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText(/^medicamento/i)).toHaveValue('Amoxicilina')
    expect(within(dialogo).getByLabelText(/^dosis/i)).toHaveValue('500 mg')
    expect(within(dialogo).getByLabelText(/vía de administración/i)).toHaveValue('Oral')
    expect(within(dialogo).getByLabelText(/^frecuencia/i)).toHaveValue('Cada 8 horas')
    expect(within(dialogo).getByLabelText(/fecha y hora de inicio/i)).toHaveValue('')
    expect(within(dialogo).getByLabelText(/^cantidad solicitada/i)).toHaveValue(null)

    fireEvent.change(within(dialogo).getByLabelText(/fecha y hora de inicio/i), {
      target: { value: '2026-11-02T10:00' },
    })
    await user.type(within(dialogo).getByLabelText(/^cantidad solicitada/i), '7')
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(
      within(listaMedicamentos()).getAllByRole('button', { name: 'Editar Amoxicilina' }),
    ).toHaveLength(2)
  })

  it('marca favoritos y quita medicamentos del catálogo con confirmación', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    await user.click(screen.getByRole('button', { name: 'Marcar Amoxicilina como favorito' }))
    expect(screen.getByRole('button', { name: 'Quitar Amoxicilina de favoritos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Quitar Amoxicilina del catálogo' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(within(panelGuardados()).getByText('Sin medicamentos guardados')).toBeInTheDocument()
  })

  it('no guarda en el catálogo si se desactiva la opción', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    const dialogo = await abrirFormulario(user)
    await completarMedicamento(user, dialogo)
    await user.click(within(dialogo).getByLabelText(/guardar en el catálogo/i))
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(panelGuardados()).getByText('Sin medicamentos guardados')).toBeInTheDocument()
    expect(within(listaMedicamentos()).getByText('Amoxicilina')).toBeInTheDocument()
  })

  it('duplica un medicamento para ajustar solo fecha y cantidad', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)
    await agregarMedicamento(user)

    await user.click(screen.getByRole('button', { name: 'Duplicar Amoxicilina' }))

    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText(/^medicamento/i)).toHaveValue('Amoxicilina')
    expect(within(dialogo).getByLabelText(/fecha y hora de inicio/i)).toHaveValue('')
    expect(within(dialogo).getByLabelText(/^cantidad solicitada/i)).toHaveValue(null)

    fireEvent.change(within(dialogo).getByLabelText(/fecha y hora de inicio/i), {
      target: { value: '2026-11-03T12:00' },
    })
    await user.type(within(dialogo).getByLabelText(/^cantidad solicitada/i), '3')
    await user.click(within(dialogo).getByRole('button', { name: /^agregar$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(
      within(listaMedicamentos()).getAllByRole('button', { name: 'Editar Amoxicilina' }),
    ).toHaveLength(2)
  })

  it('mantiene la impresión deshabilitada y muestra qué falta', async () => {
    const user = userEvent.setup()
    await seleccionarPaciente(user)

    expect(within(resumen()).getByRole('button', { name: /imprimir y guardar/i })).toBeDisabled()
    expect(
      within(resumen()).getByText(
        /Falta: cama, servicio, diagnóstico, médico, al menos un medicamento/i,
      ),
    ).toBeInTheDocument()
  })

  it('sugiere formato, imprime y nombra el archivo', async () => {
    const tituloOriginal = document.title
    const titulos = []
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {
      titulos.push(document.title)
    })
    const user = userEvent.setup()

    try {
      await seleccionarPaciente(user)
      await completarSolicitud(user)
      await agregarMedicamento(user)

      expect(within(resumen()).getByText('Automático · Formato No. 1')).toBeInTheDocument()
      const boton = within(resumen()).getByRole('button', { name: /imprimir y guardar/i })
      expect(boton).toBeEnabled()

      await user.click(boton)
      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1))

      expect(titulos[0]).toMatch(
        new RegExp(`^rec-${PACIENTE.numeroExpediente}-\\d{4}-\\d{2}-\\d{2}-\\d{2}-\\d{2}$`),
      )
      expect(document.title).toBe(tituloOriginal)
    } finally {
      printSpy.mockRestore()
      document.title = tituloOriginal
    }
  })

  it('guarda el recetario en el historial, lo muestra y permite reimprimirlo', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()

    try {
      await seleccionarPaciente(user)
      await completarSolicitud(user)
      await agregarMedicamento(user)

      await user.click(within(resumen()).getByRole('button', { name: /imprimir y guardar/i }))
      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1))

      await user.click(screen.getByRole('button', { name: /^historial$/i }))
      const dialogo = await screen.findByRole('dialog')

      expect(within(dialogo).getByText('María Fernanda López Morales')).toBeInTheDocument()
      expect(within(dialogo).getByText(/Formato No\. 1/)).toBeInTheDocument()
      expect(within(dialogo).getByText(/1 medicamento/)).toBeInTheDocument()

      await user.click(within(dialogo).getByRole('button', { name: /^ver$/i }))

      expect(
        within(dialogo).getByText(
          'Vista de solo lectura. Para cambiar datos debe crear una nueva solicitud.',
        ),
      ).toBeInTheDocument()
      expect(within(dialogo).queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()

      await user.click(within(dialogo).getByRole('button', { name: /reimprimir/i }))
      await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(2))
    } finally {
      printSpy.mockRestore()
    }
  })
})
