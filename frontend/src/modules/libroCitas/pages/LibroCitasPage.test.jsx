import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

const { buscarPacientePorExpedienteMock, guardarLibroCitasMock } = vi.hoisted(() => ({
  buscarPacientePorExpedienteMock: vi.fn(),
  guardarLibroCitasMock: vi.fn(),
}))

vi.mock('../api/libroCitasApi', () => ({
  buscarPacientePorExpediente: buscarPacientePorExpedienteMock,
  guardarLibroCitas: guardarLibroCitasMock,
}))

// jsdom no implementa ResizeObserver y Headless UI (Listbox) lo usa al cerrar.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

import LibroCitasPage from './LibroCitasPage.jsx'

// Valores ficticios reservados para tests. NO son expedientes/datos reales.
const EXPEDIENTE_A = '999999999999'
const EXPEDIENTE_B = '888888888888'

function renderPagina() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <LibroCitasPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function elegirEspecialidad(nombre) {
  const form = screen.getByRole('button', { name: /agregar a la lista/i }).closest('form')
  await userEvent.click(
    within(form).getByRole('button', {
      name: /seleccione una especialidad|Medicina Interna|Medicina General/i,
    }),
  )
  await userEvent.click(screen.getByRole('option', { name: nombre }))
}

async function agregarCita({
  expediente = EXPEDIENTE_A,
  nombre = 'Paciente Prueba',
  especialidad = 'Medicina Interna',
  fecha = '2026-10-06',
} = {}) {
  buscarPacientePorExpedienteMock.mockResolvedValue({ numeroExpediente: expediente, nombre })
  fireEvent.change(screen.getByLabelText('Fecha de la cita'), { target: { value: fecha } })
  await elegirEspecialidad(especialidad)
  fireEvent.change(screen.getByLabelText(/Número de expediente/i), {
    target: { value: expediente },
  })
  await userEvent.click(screen.getByRole('button', { name: /buscar expediente/i }))
  await screen.findByTestId('nombre-paciente')
  await userEvent.click(screen.getByRole('button', { name: /agregar a la lista/i }))
}

const filas = () => screen.queryAllByTestId(/^fila-cita-/)

beforeEach(() => {
  buscarPacientePorExpedienteMock.mockReset()
  guardarLibroCitasMock.mockReset()
  guardarLibroCitasMock.mockResolvedValue({ ok: true, total: 1 })
})

describe('LibroCitasPage', () => {
  it('renderiza el título y el texto breve de la vista', () => {
    renderPagina()

    expect(screen.getAllByRole('heading', { name: 'Libro de Citas' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Registro digital de citas')).toBeInTheDocument()
  })

  it('incluye el formulario de captura con el botón deshabilitado al inicio', () => {
    renderPagina()

    expect(screen.getByLabelText('Fecha de la cita')).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de expediente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar a la lista/i })).toBeDisabled()
  })

  it('no consulta al API al escribir el expediente (requiere acción explícita)', async () => {
    renderPagina()

    fireEvent.change(screen.getByLabelText(/Número de expediente/i), {
      target: { value: EXPEDIENTE_A },
    })

    expect(buscarPacientePorExpedienteMock).not.toHaveBeenCalled()
  })

  it('muestra la sección "Contadores diarios" con los 8 indicadores', () => {
    renderPagina()

    expect(screen.getByText('Contadores diarios')).toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(8)
    expect(screen.getByRole('spinbutton', { name: 'Historias Archivadas' })).toBeInTheDocument()
    expect(
      screen.getByRole('spinbutton', { name: 'Tarjetas Índices Archivadas' }),
    ).toBeInTheDocument()
  })

  it('muestra el estado vacío de la tabla y "Guardar registro" deshabilitado', () => {
    renderPagina()

    expect(screen.getByText('No hay citas agregadas.')).toBeInTheDocument()
    expect(screen.getByTestId('total-expedientes')).toHaveTextContent('0')
    expect(screen.getByText('Resumen por especialidad')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeDisabled()
  })

  it('agrega una fila y muestra el resumen y el conteo', async () => {
    renderPagina()
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })

    expect(filas()).toHaveLength(1)
    expect(screen.getByTestId('total-expedientes')).toHaveTextContent('1')
    expect(screen.getByTestId('resumen-especialidad-1')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeEnabled()
  })

  it('rechaza duplicados (mismo expediente + fecha + especialidad)', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })

    expect(filas()).toHaveLength(1)
    expect(
      screen.getByText('El expediente ya fue agregado para esta fecha y especialidad.'),
    ).toBeInTheDocument()
  })

  it('permite el mismo expediente con fecha distinta', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, fecha: '2026-10-06' })
    await agregarCita({ expediente: EXPEDIENTE_A, fecha: '2026-10-07' })

    expect(filas()).toHaveLength(2)
  })

  it('permite el mismo expediente con especialidad distinta', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina General' })

    expect(filas()).toHaveLength(2)
    expect(screen.getByTestId('resumen-especialidad-1')).toHaveTextContent('1')
    expect(screen.getByTestId('resumen-especialidad-2')).toHaveTextContent('1')
  })

  it('elimina solo la fila seleccionada y recalcula el resumen', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    await agregarCita({
      expediente: EXPEDIENTE_B,
      especialidad: 'Medicina General',
      nombre: 'Paciente Dos',
    })

    expect(screen.getByTestId('resumen-especialidad-2')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: `Eliminar expediente ${EXPEDIENTE_B}` }),
    )

    expect(filas()).toHaveLength(1)
    expect(screen.queryByTestId('resumen-especialidad-2')).not.toBeInTheDocument()
    expect(screen.getByTestId('resumen-especialidad-1')).toHaveTextContent('1')
  })

  it('guarda con el servicio mock (payload sin pacienteId) y conserva contadores', async () => {
    renderPagina()
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Historias Archivadas' }), {
      target: { value: '4' },
    })

    await userEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(guardarLibroCitasMock).toHaveBeenCalledTimes(1)
    const payload = guardarLibroCitasMock.mock.calls[0][0]
    expect(payload.contadores).toMatchObject({ ha: 4 })
    expect(payload.items).toHaveLength(1)
    expect(payload.items[0]).toMatchObject({
      numeroExpediente: EXPEDIENTE_A,
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
    })
    expect(payload.items[0]).not.toHaveProperty('pacienteId')
    expect(payload.items[0]).not.toHaveProperty('idLocal')
    expect(payload).not.toHaveProperty('total')
    expect(payload).not.toHaveProperty('resumenPorEspecialidad')

    expect(await screen.findByText('Registro guardado correctamente.')).toBeInTheDocument()
    expect(screen.getByText('No hay citas agregadas.')).toBeInTheDocument()
    expect(screen.getByTestId('total-contadores')).toHaveTextContent('4')
  })

  it('limpia el mensaje de duplicado al eliminar la fila existente', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    expect(
      screen.getByText('El expediente ya fue agregado para esta fecha y especialidad.'),
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: `Eliminar expediente ${EXPEDIENTE_A}` }),
    )

    expect(
      screen.queryByText('El expediente ya fue agregado para esta fecha y especialidad.'),
    ).not.toBeInTheDocument()
  })

  it('limpia el mensaje de duplicado al guardar correctamente y conserva contadores', async () => {
    renderPagina()

    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    await agregarCita({ expediente: EXPEDIENTE_A, especialidad: 'Medicina Interna' })
    expect(
      screen.getByText('El expediente ya fue agregado para esta fecha y especialidad.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Historias Archivadas' }), {
      target: { value: '3' },
    })

    await userEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('Registro guardado correctamente.')).toBeInTheDocument()
    expect(screen.getByText('No hay citas agregadas.')).toBeInTheDocument()
    expect(
      screen.queryByText('El expediente ya fue agregado para esta fecha y especialidad.'),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('total-contadores')).toHaveTextContent('3')
  })
})
