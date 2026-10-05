import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { buscarPacientePorExpedienteMock } = vi.hoisted(() => ({
  buscarPacientePorExpedienteMock: vi.fn(),
}))

vi.mock('../api/libroCitasApi', () => ({
  buscarPacientePorExpediente: buscarPacientePorExpedienteMock,
}))

// jsdom no implementa ResizeObserver y Headless UI (Listbox) lo usa al cerrar.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

import FormularioCita from './FormularioCita.jsx'

// Valores ficticios reservados para tests. NO son expedientes/datos reales.
const EXPEDIENTE_FICTICIO = '999999999999'
const PACIENTE = { numeroExpediente: EXPEDIENTE_FICTICIO, nombre: 'Paciente Prueba' }

function renderFormulario(onAgregar = vi.fn()) {
  render(<FormularioCita onAgregar={onAgregar} />)
  return onAgregar
}

const campoFecha = () => screen.getByLabelText('Fecha de la cita')
const campoExpediente = () => screen.getByLabelText(/Número de expediente/i)
const botonBuscar = () => screen.getByRole('button', { name: /buscar expediente/i })
const botonAgregar = () => screen.getByRole('button', { name: /agregar a la lista/i })

async function elegirEspecialidad(nombre) {
  await userEvent.click(screen.getByRole('button', { name: /seleccione una especialidad/i }))
  await userEvent.click(screen.getByRole('option', { name: nombre }))
}

async function escribirYBuscar(expediente = EXPEDIENTE_FICTICIO) {
  fireEvent.change(campoExpediente(), { target: { value: expediente } })
  await userEvent.click(botonBuscar())
}

beforeEach(() => {
  buscarPacientePorExpedienteMock.mockReset()
  buscarPacientePorExpedienteMock.mockResolvedValue(PACIENTE)
})

describe('FormularioCita', () => {
  it('renderiza fecha, especialidad, expediente y el botón deshabilitado', () => {
    renderFormulario()

    expect(campoFecha()).toBeInTheDocument()
    expect(campoExpediente()).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /seleccione una especialidad/i }),
    ).toBeInTheDocument()
    expect(botonAgregar()).toBeDisabled()
  })

  it('escribir un expediente numérico NO consulta al API', () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: EXPEDIENTE_FICTICIO } })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
  })

  it('un click en "Buscar expediente" realiza exactamente una consulta', async () => {
    renderFormulario()

    await escribirYBuscar()

    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledTimes(1)
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledWith(EXPEDIENTE_FICTICIO)
    expect(await screen.findByTestId('nombre-paciente')).toHaveTextContent('Paciente Prueba')
  })

  it('el botón Buscar está deshabilitado para vacío, letras y guion', () => {
    renderFormulario()

    expect(botonBuscar()).toBeDisabled()

    fireEvent.change(campoExpediente(), { target: { value: 'ABC123' } })
    expect(botonBuscar()).toBeDisabled()

    fireEvent.change(campoExpediente(), { target: { value: '12-34' } })
    expect(botonBuscar()).toBeDisabled()

    fireEvent.change(campoExpediente(), { target: { value: EXPEDIENTE_FICTICIO } })
    expect(botonBuscar()).toBeEnabled()
  })

  it('rechaza el formato con guion sin consultar', () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '12-34' } })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
    expect(screen.getByText(/solo números/i)).toBeInTheDocument()
  })

  it('muestra "Expediente no encontrado" ante 404 (null)', async () => {
    buscarPacientePorExpedienteMock.mockResolvedValue(null)
    renderFormulario()

    await escribirYBuscar()

    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
  })

  it('distingue un error de integración (502) de un 404', async () => {
    buscarPacientePorExpedienteMock.mockRejectedValue(
      Object.assign(
        new Error('No fue posible consultar el sistema hospitalario. Intente de nuevo.'),
        { status: 502, tipo: 'INTEGRACION' },
      ),
    )
    renderFormulario()

    await escribirYBuscar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'No fue posible consultar el sistema hospitalario. Intente de nuevo.',
    )
    expect(screen.queryByText('Expediente no encontrado')).not.toBeInTheDocument()
  })

  it('al modificar el expediente limpia el paciente y no lanza consulta nueva', async () => {
    renderFormulario()
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledTimes(1)

    fireEvent.change(campoExpediente(), { target: { value: '111111' } })

    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledTimes(1)
    expect(botonAgregar()).toBeDisabled()
  })

  it('una respuesta async obsoleta no pisa la búsqueda nueva', async () => {
    const pendientes = []
    buscarPacientePorExpedienteMock.mockImplementation(
      () => new Promise((resolve) => pendientes.push(resolve)),
    )
    renderFormulario()

    await escribirYBuscar('111111')
    await escribirYBuscar('222222')
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledTimes(2)

    act(() => pendientes[1]({ numeroExpediente: '222222', nombre: 'Paciente Nuevo' }))
    await screen.findByText('Paciente Nuevo')

    await act(async () => {
      pendientes[0]({ numeroExpediente: '111111', nombre: 'Paciente Viejo' })
    })

    expect(screen.queryByText('Paciente Viejo')).not.toBeInTheDocument()
    expect(screen.getByTestId('nombre-paciente')).toHaveTextContent('Paciente Nuevo')
  })

  it('el nombre del paciente es solo lectura (no es un input editable)', async () => {
    renderFormulario()

    await escribirYBuscar()
    const nombre = await screen.findByTestId('nombre-paciente')

    expect(nombre.tagName).not.toBe('INPUT')
    expect(screen.queryByDisplayValue('Paciente Prueba')).not.toBeInTheDocument()
  })

  it('el botón Agregar permanece deshabilitado sin fecha ni especialidad', async () => {
    renderFormulario()
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')

    expect(botonAgregar()).toBeDisabled()
  })

  it('habilita Agregar y entrega el payload correcto (sin pacienteId)', async () => {
    const onAgregar = renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')

    await waitFor(() => expect(botonAgregar()).toBeEnabled())
    await userEvent.click(botonAgregar())

    expect(onAgregar).toHaveBeenCalledTimes(1)
    expect(onAgregar).toHaveBeenCalledWith({
      numeroExpediente: EXPEDIENTE_FICTICIO,
      nombrePaciente: 'Paciente Prueba',
      fecha: '2026-10-06',
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
    })
    expect(onAgregar.mock.calls[0][0]).not.toHaveProperty('pacienteId')
  })

  it('si onAgregar devuelve true, limpia expediente y paciente y conserva fecha y especialidad', async () => {
    const onAgregar = vi.fn().mockReturnValue(true)
    render(<FormularioCita onAgregar={onAgregar} />)

    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')

    await userEvent.click(botonAgregar())

    expect(campoExpediente()).toHaveValue('')
    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
    expect(campoFecha()).toHaveValue('2026-10-06')
    expect(screen.getByRole('button', { name: 'Medicina Interna' })).toBeInTheDocument()
    expect(botonAgregar()).toBeDisabled()
  })

  it('si onAgregar devuelve false (duplicado), conserva expediente y paciente', async () => {
    const onAgregar = vi.fn().mockReturnValue(false)
    render(<FormularioCita onAgregar={onAgregar} />)

    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')

    await userEvent.click(botonAgregar())

    expect(campoExpediente()).toHaveValue(EXPEDIENTE_FICTICIO)
    expect(screen.getByTestId('nombre-paciente')).toBeInTheDocument()
  })

  it('no renderiza datos sensibles del paciente', async () => {
    renderFormulario()
    await escribirYBuscar()
    await screen.findByTestId('nombre-paciente')

    expect(screen.queryByText(/DPI/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tel[eé]fono/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/direcci[oó]n/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagn[oó]stico/i)).not.toBeInTheDocument()
  })
})
