import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import { cargarLoteEstacion, entregarExpedienteCiclo } from '../api/coexApi'
import MesaCoexPage from './MesaCoexPage.jsx'

vi.mock('../api/coexApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, cargarLoteEstacion: vi.fn(), entregarExpedienteCiclo: vi.fn() }
})

function activarEstacion() {
  localStorage.setItem(
    'hro_estacion',
    JSON.stringify({
      id: 3,
      codigo: 'BOX-03',
      nombre: 'COEX Consulta Externa',
      ubicacion: 'Nivel 1',
    }),
  )
}

function renderPagina(ui = <MesaCoexPage />) {
  return render(
    <MemoryRouter initialEntries={['/coex']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>{ui}</ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const fila = (over = {}) => ({
  citaId: 1,
  horaEstimada: '08:30:00',
  pacienteId: 'p1',
  pacienteNombre: 'María López',
  numeroExpediente: 'EXP-001',
  expedienteId: 'e1',
  subespecialidadId: 1,
  subespecialidadNombre: 'Medicina General',
  cicloId: 'c1',
  estadoActual: 'en_transito_entrega',
  ubicacionBase: null,
  ...over,
})

// Lote con `n` pendientes accionables (c1..cn) más opcionalmente filas extra.
const pendientes = (n) =>
  Array.from({ length: n }, (_, i) =>
    fila({
      citaId: i + 1,
      cicloId: `c${i + 1}`,
      numeroExpediente: `EXP-00${i + 1}`,
    }),
  )

const lote = (filas) => ({ subespecialidades: [{ id: 1 }], filas })

async function abrirYConfirmar(user, nombreBoton = 'Recibir') {
  await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))
  await screen.findByRole('dialog')
  await user.click(screen.getByRole('button', { name: nombreBoton }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  activarEstacion()
})

describe('MesaCoexPage - Fase 1 (lectura)', () => {
  it('renderiza el título y la estación activa', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()

    expect(screen.getByRole('heading', { name: 'Mesa COEX' })).toBeInTheDocument()
    expect(screen.getByText('COEX Consulta Externa')).toBeInTheDocument()
    expect(await screen.findByText('EXP-001')).toBeInTheDocument()
  })

  it('muestra el estado de carga', () => {
    cargarLoteEstacion.mockReturnValue(new Promise(() => {}))

    renderPagina()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando el lote no tiene filas', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([]))

    renderPagina()

    expect(
      await screen.findByText('Sin expedientes para la fecha seleccionada'),
    ).toBeInTheDocument()
  })

  it('muestra el error cuando falla la carga', async () => {
    cargarLoteEstacion.mockRejectedValue(new Error('fallo de red'))

    renderPagina()

    expect(await screen.findByRole('alert')).toHaveTextContent('fallo de red')
  })

  it('agrupa en_transito_entrega en Pendientes y entregado en En uso', async () => {
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' }),
        fila({
          citaId: 2,
          cicloId: 'c2',
          numeroExpediente: 'EXP-002',
          estadoActual: 'entregado',
        }),
      ]),
    )

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUso = screen.getByRole('region', { name: 'En uso' })

    expect(within(pendientesRegion).getByText('EXP-001')).toBeInTheDocument()
    expect(within(pendientesRegion).queryByText('EXP-002')).not.toBeInTheDocument()
    expect(within(enUso).getByText('EXP-002')).toBeInTheDocument()
    expect(within(enUso).queryByText('EXP-001')).not.toBeInTheDocument()
  })

  it('no muestra como accionables las filas sin_ciclo o sin cicloId', async () => {
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({
          citaId: 1,
          cicloId: null,
          estadoActual: 'sin_ciclo',
          numeroExpediente: null,
          expedienteId: null,
        }),
        fila({ citaId: 2, cicloId: null, estadoActual: 'en_transito_entrega' }),
      ]),
    )

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUso = screen.getByRole('region', { name: 'En uso' })

    expect(within(pendientesRegion).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(enUso).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(pendientesRegion).queryByText('Sin número de expediente')).not.toBeInTheDocument()
  })

  it('está registrada en la ruta /coex', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina(<AppRouter />)

    expect(await screen.findByRole('heading', { name: 'Mesa COEX' })).toBeInTheDocument()
  })
})

describe('MesaCoexPage - Fase 2 (recepción)', () => {
  it('muestra checkbox solo en Pendientes de recibir', async () => {
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' }),
        fila({ citaId: 2, cicloId: 'c2', numeroExpediente: 'EXP-002', estadoActual: 'entregado' }),
      ]),
    )

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUso = screen.getByRole('region', { name: 'En uso' })

    expect(
      within(pendientesRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    ).toBeInTheDocument()
    expect(within(enUso).queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('selecciona una fila y refleja el contador', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(2)))

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )

    expect(screen.getByText('1 seleccionado')).toBeInTheDocument()
  })

  it('deselecciona y vuelve a cero', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()

    const checkbox = await screen.findByRole('checkbox', {
      name: 'Seleccionar expediente EXP-001',
    })
    await user.click(checkbox)
    expect(screen.getByText('1 seleccionado')).toBeInTheDocument()

    await user.click(checkbox)
    expect(screen.getByText('0 seleccionados')).toBeInTheDocument()
  })

  it('selecciona todo con el maestro', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(3)))

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Seleccionar todos los expedientes pendientes de recibir',
      }),
    )

    expect(screen.getByText('3 seleccionados')).toBeInTheDocument()
  })

  it('marca el maestro como indeterminado en selección parcial', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(2)))

    renderPagina()

    const maestro = await screen.findByRole('checkbox', {
      name: 'Seleccionar todos los expedientes pendientes de recibir',
    })
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }))

    expect(maestro.indeterminate).toBe(true)
  })

  it('deshabilita el botón de recibir sin selección', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(2)))

    renderPagina()

    const boton = await screen.findByRole('button', { name: /Recibir seleccionados/ })
    expect(boton).toBeDisabled()
  })

  it('abre el modal de confirmación', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirmar recepción')).toBeInTheDocument()
  })

  it('cancelar no envía la transición', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(entregarExpedienteCiclo).not.toHaveBeenCalled()
  })

  it('confirmar un expediente hace una sola llamada con su cicloId', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockResolvedValue({ id: 'c1', estadoActual: 'entregado' })

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await abrirYConfirmar(user)

    await waitFor(() => expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(1))
    expect(entregarExpedienteCiclo).toHaveBeenCalledWith('c1')
  })

  it('confirmar varios hace N llamadas', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(3)))
    entregarExpedienteCiclo.mockResolvedValue({ estadoActual: 'entregado' })

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Seleccionar todos los expedientes pendientes de recibir',
      }),
    )
    await abrirYConfirmar(user)

    await waitFor(() => expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(3))
  })

  it('éxito total: limpia selección, notifica y recarga el lote', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(2)))
    entregarExpedienteCiclo.mockResolvedValue({ estadoActual: 'entregado' })

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Seleccionar todos los expedientes pendientes de recibir',
      }),
    )
    await abrirYConfirmar(user)

    expect(await screen.findByText(/2 expedientes recibidos/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('0 seleccionados')).toBeInTheDocument())
    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
  })

  it('fallo parcial 4/1: conserva solo el fallido seleccionado y recarga', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(5)))
    entregarExpedienteCiclo.mockImplementation((cicloId) =>
      cicloId === 'c5'
        ? Promise.reject(Object.assign(new Error('Transición inválida'), { status: 400 }))
        : Promise.resolve({ id: cicloId, estadoActual: 'entregado' }),
    )

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Seleccionar todos los expedientes pendientes de recibir',
      }),
    )
    await abrirYConfirmar(user)

    await waitFor(() => expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(5))
    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText(/4 recibidos, 1 sin recibir/i)).toBeInTheDocument()
    expect(within(alerta).getByText(/EXP-005/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('1 seleccionado')).toBeInTheDocument())
    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
  })

  it('fallo total: conserva la selección y reporta error', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(2)))
    entregarExpedienteCiclo.mockRejectedValue(
      Object.assign(new Error('Conflicto'), { status: 409 }),
    )

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Seleccionar todos los expedientes pendientes de recibir',
      }),
    )
    await abrirYConfirmar(user)

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText('No se pudo recibir ningún expediente')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('2 seleccionados')).toBeInTheDocument())
  })

  it('muestra el mensaje del error 400 por expediente', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockRejectedValue(
      Object.assign(new Error('La transición no es válida'), { status: 400 }),
    )

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await abrirYConfirmar(user)

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText(/La transición no es válida/)).toBeInTheDocument()
  })

  it('no realiza doble envío ante doble clic', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))
    const botonRecibir = await screen.findByRole('button', { name: 'Recibir' })

    fireEvent.click(botonRecibir)
    fireEvent.click(botonRecibir)

    expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(1)
  })

  it('tras el refresco el expediente recibido sale de Pendientes y aparece en En uso', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion
      .mockReset()
      .mockResolvedValueOnce(lote([fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' })]))
      .mockResolvedValueOnce(
        lote([
          fila({
            citaId: 1,
            cicloId: 'c1',
            numeroExpediente: 'EXP-001',
            estadoActual: 'entregado',
          }),
        ]),
      )
    entregarExpedienteCiclo.mockResolvedValue({ id: 'c1', estadoActual: 'entregado' })

    renderPagina()

    await user.click(
      await screen.findByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await abrirYConfirmar(user)

    const enUso = await screen.findByRole('region', { name: 'En uso' })
    await waitFor(() => expect(within(enUso).getByText('EXP-001')).toBeInTheDocument())

    const pendientesRegion = screen.getByRole('region', { name: 'Pendientes de recibir' })
    expect(within(pendientesRegion).queryByText('EXP-001')).not.toBeInTheDocument()
    expect(within(pendientesRegion).queryAllByRole('listitem')).toHaveLength(0)
  })
})
