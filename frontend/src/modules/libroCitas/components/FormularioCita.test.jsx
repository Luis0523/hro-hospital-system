import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const PACIENTE = {
  id: 'pac-1323',
  numeroExpediente: '1323-23',
  nombre: 'Paciente Demo Uno',
}

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

  it('un formato inválido NO consulta el mock y muestra el error', () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '1234' } })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
    expect(screen.getByText(/formato inválido/i)).toBeInTheDocument()
  })

  it('muestra el nombre cuando el expediente existe', async () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })

    expect(await screen.findByTestId('nombre-paciente')).toHaveTextContent(
      'Paciente Demo Uno',
    )
    expect(buscarPacientePorExpedienteMock).toHaveBeenCalledWith('1323-23')
  })

  it('muestra "Expediente no encontrado" cuando no existe', async () => {
    buscarPacientePorExpedienteMock.mockResolvedValue(null)
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '9999-99' } })

    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
  })

  it('al cambiar el expediente limpia el paciente anterior y muestra "Buscando…"', async () => {
    renderFormulario()
    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    await screen.findByTestId('nombre-paciente')

    let resolver
    buscarPacientePorExpedienteMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    fireEvent.change(campoExpediente(), { target: { value: '1401-24' } })

    expect(screen.queryByTestId('nombre-paciente')).not.toBeInTheDocument()
    expect(screen.getByText('Buscando…')).toBeInTheDocument()

    resolver(null)
    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
  })

  it('el nombre del paciente es solo lectura (no es un input editable)', async () => {
    renderFormulario()

    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    const nombre = await screen.findByTestId('nombre-paciente')

    expect(nombre.tagName).not.toBe('INPUT')
    expect(screen.queryByDisplayValue('Paciente Demo Uno')).not.toBeInTheDocument()
  })

  it('el botón permanece deshabilitado sin fecha', async () => {
    renderFormulario()
    await elegirEspecialidad('Medicina Interna')
    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    await screen.findByTestId('nombre-paciente')

    expect(botonAgregar()).toBeDisabled()
  })

  it('el botón permanece deshabilitado sin especialidad', async () => {
    renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    await screen.findByTestId('nombre-paciente')

    expect(botonAgregar()).toBeDisabled()
  })

  it('el botón permanece deshabilitado sin expediente encontrado', async () => {
    renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')

    expect(botonAgregar()).toBeDisabled()
  })

  it('habilita el botón y entrega el payload correcto en onAgregar', async () => {
    const onAgregar = renderFormulario()
    fireEvent.change(campoFecha(), { target: { value: '2026-10-06' } })
    await elegirEspecialidad('Medicina Interna')
    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    await screen.findByTestId('nombre-paciente')

    await waitFor(() => expect(botonAgregar()).toBeEnabled())
    await userEvent.click(botonAgregar())

    expect(onAgregar).toHaveBeenCalledTimes(1)
    expect(onAgregar).toHaveBeenCalledWith({
      numeroExpediente: '1323-23',
      pacienteId: 'pac-1323',
      nombrePaciente: 'Paciente Demo Uno',
      fecha: '2026-10-06',
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
    })
  })

  it('no renderiza datos sensibles del paciente', async () => {
    renderFormulario()
    fireEvent.change(campoExpediente(), { target: { value: '1323-23' } })
    await screen.findByTestId('nombre-paciente')

    expect(screen.queryByText(/DPI/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tel[eé]fono/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/direcci[oó]n/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagn[oó]stico/i)).not.toBeInTheDocument()
  })
})
