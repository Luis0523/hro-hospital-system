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

const PACIENTE = { numeroExpediente: '837871', nombre: 'Paciente Prueba' }

function renderFormulario(onAgregar = vi.fn()) {
  render(<FormularioCita onAgregar={onAgregar} />)
  return onAgregar
}

const campoFecha = () => screen.getByLabelText('Fecha de la cita')
const campoExpediente = () => screen.getByLabelText(/Número de expediente/i)
const botonAgregar = () => screen.getByRole('button', { name: /agregar a la lista/i })

async function elegirEspecialidad(nombre) {
  await userEvent.click(screen.getByRole('button', { name: /seleccione una especialidad/i }))
  await userEvent.click(screen.getByRole('option', { name: nombre }))
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

  it('ofrece exactamente las dos especialidades permitidas', async () => {
    renderFormulario()

    await userEvent.click(screen.getByRole('button', { name: /seleccione una especialidad/i }))

    const opciones = screen.getAllByRole('option').map((opcion) => opcion.textContent)
    expect(opciones).toEqual(['Medicina Interna', 'Medicina General'])
  })

  it('rechaza el formato con guion sin consultar', () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
    expect(screen.getByText(/solo números/i)).toBeInTheDocument()
  })

  it('rechaza letras sin consultar', () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: 'ABC123' } })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
    expect(screen.getByText(/solo números/i)).toBeInTheDocument()
  })

  it('muestra el nombre cuando el expediente existe', async () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '837871' } })

    expect(await screen.findByTestId('nombre-paciente')).toHaveTextContent('Paciente Prueba')
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledWith('837871')
  })

  it('muestra "Expediente no encontrado" ante 404 (null)', async () => {
    buscarPacientePorExpedienteMock.mockResolvedValue(null)
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '999999' } })

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

    fireEvent.change(campoExpediente(), { target: { value: '837871' } })

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'No fue posible consultar el sistema hospitalario. Intente de nuevo.',
    )
    expect(screen.queryByText('Expediente no encontrado')).not.toBeInTheDocument()
  })

  it('al cambiar el expediente limpia el paciente anterior y muestra "Buscando…"', async () => {
    renderFormulario()
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    let resolver
    buscarPacientePorExpedienteMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    fireEvent.change(campoExpediente(), { target: { value: '999999' } })

    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
    expect(screen.getByText('Buscando…')).toBeInTheDocument()

    resolver(null)
    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
  })

  it('una respuesta async obsoleta no pisa la búsqueda nueva', async () => {
    const pendientes = []
    buscarPacientePorExpedienteMock.mockImplementation(
      () => new Promise((resolve) => pendientes.push(resolve)),
    )
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '111111' } })
    fireEvent.change(campoExpediente(), { target: { value: '222222' } })
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

    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    const nombre = await screen.findByTestId('nombre-paciente')

    expect(nombre.tagName).not.toBe('INPUT')
    expect(screen.queryByDisplayValue('Paciente Prueba')).not.toBeInTheDocument()
  })

  it('el botón permanece deshabilitado sin fecha', async () => {
    renderFormulario()
    await elegirEspecialidad('Medicina Interna')
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    expect(botonAgregar()).toBeDisabled()
  })

  it('el botón permanece deshabilitado sin especialidad', async () => {
    renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    expect(botonAgregar()).toBeDisabled()
  })

  it('el botón permanece deshabilitado sin expediente encontrado', async () => {
    renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')

    expect(botonAgregar()).toBeDisabled()
  })

  it('habilita el botón y entrega el payload correcto (sin pacienteId)', async () => {
    const onAgregar = renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    await waitFor(() => expect(botonAgregar()).toBeEnabled())
    await userEvent.click(botonAgregar())

    expect(onAgregar).toHaveBeenCalledTimes(1)
    expect(onAgregar).toHaveBeenCalledWith({
      numeroExpediente: '837871',
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
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
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
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    await userEvent.click(botonAgregar())

    expect(campoExpediente()).toHaveValue('837871')
    expect(screen.getByTestId('nombre-paciente')).toBeInTheDocument()
  })

  it('no renderiza datos sensibles del paciente', async () => {
    renderFormulario()
    fireEvent.change(campoExpediente(), { target: { value: '837871' } })
    await screen.findByTestId('nombre-paciente')

    expect(screen.queryByText(/DPI/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tel[eé]fono/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/direcci[oó]n/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagn[oó]stico/i)).not.toBeInTheDocument()
  })
})
