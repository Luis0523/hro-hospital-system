import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import {
  cargarLoteEstacion,
  entregarExpedienteCiclo,
  retornarExpedienteCiclo,
} from '../api/coexApi'
import MesaCoexPage from './MesaCoexPage.jsx'

vi.mock('../api/coexApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    cargarLoteEstacion: vi.fn(),
    entregarExpedienteCiclo: vi.fn(),
    retornarExpedienteCiclo: vi.fn(),
  }
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

// Lote con `n` expedientes en uso (entregado) en la sección "En uso".
const enUso = (n) =>
  Array.from({ length: n }, (_, i) =>
    fila({
      citaId: 100 + i,
      cicloId: `u${i + 1}`,
      numeroExpediente: `EXP-U0${i + 1}`,
      estadoActual: 'entregado',
    }),
  )

async function abrirYConfirmar(user, nombreBoton = 'Recibir') {
  await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))
  await screen.findByRole('dialog')
  await user.click(screen.getByRole('button', { name: nombreBoton }))
}

async function abrirYConfirmarDevolucion(user, nombreBoton = 'Devolver') {
  await user.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))
  await screen.findByRole('dialog')
  await user.click(screen.getByRole('button', { name: nombreBoton }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  activarEstacion()
})

afterEach(() => {
  vi.useRealTimers()
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
  it('muestra checkbox en Pendientes y en En uso (una por fila accionable)', async () => {
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' }),
        fila({ citaId: 2, cicloId: 'c2', numeroExpediente: 'EXP-002', estadoActual: 'entregado' }),
      ]),
    )

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUsoRegion = screen.getByRole('region', { name: 'En uso' })

    expect(
      within(pendientesRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    ).toBeInTheDocument()
    expect(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-002' }),
    ).toBeInTheDocument()
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

describe('MesaCoexPage - Fase 3 (devolución)', () => {
  it('lista en En uso solo filas entregado con checkbox seleccionable', async () => {
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001', estadoActual: 'localizado' }),
        fila({ citaId: 2, cicloId: 'c2', numeroExpediente: 'EXP-002', estadoActual: 'entregado' }),
      ]),
    )

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    expect(within(enUsoRegion).getByText('EXP-002')).toBeInTheDocument()
    expect(within(enUsoRegion).queryByText('EXP-001')).not.toBeInTheDocument()
    expect(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-002' }),
    ).toBeInTheDocument()
  })

  it('selecciona una fila en uso y refleja el contador', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(2)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )

    expect(within(enUsoRegion).getByText('1 seleccionado')).toBeInTheDocument()
  })

  it('deselecciona y vuelve a cero', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    const checkbox = within(enUsoRegion).getByRole('checkbox', {
      name: 'Seleccionar expediente EXP-U01',
    })
    await user.click(checkbox)
    expect(within(enUsoRegion).getByText('1 seleccionado')).toBeInTheDocument()

    await user.click(checkbox)
    expect(within(enUsoRegion).getByText('0 seleccionados')).toBeInTheDocument()
  })

  it('selecciona todo con el maestro de En uso', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(3)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', {
        name: 'Seleccionar todos los expedientes en uso',
      }),
    )

    expect(within(enUsoRegion).getByText('3 seleccionados')).toBeInTheDocument()
  })

  it('marca el maestro de En uso como indeterminado en selección parcial', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(2)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    const maestro = within(enUsoRegion).getByRole('checkbox', {
      name: 'Seleccionar todos los expedientes en uso',
    })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )

    expect(maestro.indeterminate).toBe(true)
  })

  it('deshabilita el botón de devolver sin selección', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(enUso(2)))

    renderPagina()

    const boton = await screen.findByRole('button', { name: /Devolver seleccionados/ })
    expect(boton).toBeDisabled()
  })

  it('mantiene independientes la selección de recepción y de devolución', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(
      lote([
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' }),
        ...enUso(1),
      ]),
    )

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUsoRegion = screen.getByRole('region', { name: 'En uso' })

    await user.click(
      within(pendientesRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )

    expect(within(pendientesRegion).getByText('1 seleccionado')).toBeInTheDocument()
    expect(within(enUsoRegion).getByText('0 seleccionados')).toBeInTheDocument()

    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )

    expect(within(pendientesRegion).getByText('1 seleccionado')).toBeInTheDocument()
    expect(within(enUsoRegion).getByText('1 seleccionado')).toBeInTheDocument()
  })

  it('abre el modal de confirmación de devolución', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await user.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirmar devolución')).toBeInTheDocument()
  })

  it('cancelar no envía la transición', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await user.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(retornarExpedienteCiclo).not.toHaveBeenCalled()
  })

  it('confirmar un expediente hace una sola llamada con su cicloId', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))
    retornarExpedienteCiclo.mockResolvedValue({ id: 'u1', estadoActual: 'en_transito_retorno' })

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await abrirYConfirmarDevolucion(user)

    await waitFor(() => expect(retornarExpedienteCiclo).toHaveBeenCalledTimes(1))
    expect(retornarExpedienteCiclo).toHaveBeenCalledWith('u1')
  })

  it('confirmar varios hace N llamadas', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(3)))
    retornarExpedienteCiclo.mockResolvedValue({ estadoActual: 'en_transito_retorno' })

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', {
        name: 'Seleccionar todos los expedientes en uso',
      }),
    )
    await abrirYConfirmarDevolucion(user)

    await waitFor(() => expect(retornarExpedienteCiclo).toHaveBeenCalledTimes(3))
  })

  it('éxito total: limpia selección, notifica y recarga el lote', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(2)))
    retornarExpedienteCiclo.mockResolvedValue({ estadoActual: 'en_transito_retorno' })

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', {
        name: 'Seleccionar todos los expedientes en uso',
      }),
    )
    await abrirYConfirmarDevolucion(user)

    expect(await screen.findByText(/2 expedientes devueltos/i)).toBeInTheDocument()
    await waitFor(() =>
      expect(within(enUsoRegion).getByText('0 seleccionados')).toBeInTheDocument(),
    )
    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
  })

  it('fallo parcial 4/1: conserva solo el fallido seleccionado y recarga', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(5)))
    retornarExpedienteCiclo.mockImplementation((cicloId) =>
      cicloId === 'u5'
        ? Promise.reject(Object.assign(new Error('Transición inválida'), { status: 400 }))
        : Promise.resolve({ id: cicloId, estadoActual: 'en_transito_retorno' }),
    )

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', {
        name: 'Seleccionar todos los expedientes en uso',
      }),
    )
    await abrirYConfirmarDevolucion(user)

    await waitFor(() => expect(retornarExpedienteCiclo).toHaveBeenCalledTimes(5))
    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText(/4 devueltos, 1 sin devolver/i)).toBeInTheDocument()
    expect(within(alerta).getByText(/EXP-U05/)).toBeInTheDocument()
    await waitFor(() =>
      expect(within(enUsoRegion).getByText('1 seleccionado')).toBeInTheDocument(),
    )
    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
  })

  it('fallo total: conserva la selección y reporta error', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(2)))
    retornarExpedienteCiclo.mockRejectedValue(
      Object.assign(new Error('Conflicto'), { status: 409 }),
    )

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', {
        name: 'Seleccionar todos los expedientes en uso',
      }),
    )
    await abrirYConfirmarDevolucion(user)

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText('No se pudo devolver ningún expediente')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(enUsoRegion).getByText('2 seleccionados')).toBeInTheDocument(),
    )
  })

  it('muestra el mensaje del error 400 por expediente', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))
    retornarExpedienteCiclo.mockRejectedValue(
      Object.assign(new Error('La transición no es válida'), { status: 400 }),
    )

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await abrirYConfirmarDevolucion(user)

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByText(/La transición no es válida/)).toBeInTheDocument()
  })

  it('no realiza doble envío ante doble clic', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))
    retornarExpedienteCiclo.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await user.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))
    const botonDevolver = await screen.findByRole('button', { name: 'Devolver' })

    fireEvent.click(botonDevolver)
    fireEvent.click(botonDevolver)

    expect(retornarExpedienteCiclo).toHaveBeenCalledTimes(1)
  })

  it('tras el refresco el expediente devuelto sale de En uso y no vuelve a Pendientes', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion
      .mockReset()
      .mockResolvedValueOnce(lote(enUso(1)))
      .mockResolvedValueOnce(
        lote([
          fila({
            citaId: 9,
            cicloId: 'c9',
            numeroExpediente: 'EXP-PEND',
            estadoActual: 'en_transito_entrega',
          }),
        ]),
      )
    retornarExpedienteCiclo.mockResolvedValue({ id: 'u1', estadoActual: 'en_transito_retorno' })

    renderPagina()

    const enUsoRegion = await screen.findByRole('region', { name: 'En uso' })
    await user.click(
      within(enUsoRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }),
    )
    await abrirYConfirmarDevolucion(user)

    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    expect(within(pendientesRegion).getByText('EXP-PEND')).toBeInTheDocument()
    expect(within(pendientesRegion).queryByText('EXP-U01')).not.toBeInTheDocument()
    expect(screen.queryByText('EXP-U01')).not.toBeInTheDocument()
  })

  it('regresión: recepción sigue funcionando igual', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockResolvedValue({ id: 'c1', estadoActual: 'entregado' })

    renderPagina()

    const pendientesRegion = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    await user.click(
      within(pendientesRegion).getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }),
    )
    await abrirYConfirmar(user)

    await waitFor(() => expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(1))
    expect(entregarExpedienteCiclo).toHaveBeenCalledWith('c1')
    expect(await screen.findByText(/1 expediente recibido/i)).toBeInTheDocument()
  })
})

describe('MesaCoexPage - Fase 4 (refresco en vivo)', () => {
  it('20. muestra el botón Actualizar', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()

    expect(await screen.findByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
  })

  it('21. el botón Actualizar dispara el refresco manual', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()
    await screen.findByText('EXP-001')

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(2))
  })

  it('22. muestra "Actualizando…" mientras refresca', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    renderPagina()
    await screen.findByText('EXP-001')

    cargarLoteEstacion.mockImplementationOnce(() => new Promise(() => {}))
    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(await screen.findByRole('button', { name: 'Actualizando…' })).toBeDisabled()
  })

  it('23. muestra la última actualización con aria-live', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()

    const indicador = await screen.findByText(/Última actualización: /)
    expect(indicador).toHaveAttribute('aria-live', 'polite')
  })

  it('24. un error de refresco silencioso muestra una advertencia no destructiva', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-001' })]))

    renderPagina()
    await screen.findByText('EXP-001')

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(await screen.findByText('No se pudo actualizar el lote')).toBeInTheDocument()
  })

  it('25. los datos permanecen visibles después del error de refresco', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-001' })]))

    renderPagina()
    await screen.findByText('EXP-001')

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    await screen.findByText('No se pudo actualizar el lote')

    expect(screen.getByText('EXP-001')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('26. "Reintentar" vuelve a refrescar y limpia la advertencia', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-001' })]))

    renderPagina()
    await screen.findByText('EXP-001')

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    await screen.findByText('No se pudo actualizar el lote')

    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-002' })]))
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await screen.findByText('EXP-002')
    await waitFor(() =>
      expect(screen.queryByText('No se pudo actualizar el lote')).not.toBeInTheDocument(),
    )
  })

  it('27. el polling se pausa durante Recibir', async () => {
    vi.useFakeTimers()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockReturnValue(new Promise(() => {}))

    renderPagina()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText('EXP-001')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }))
    fireEvent.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })

    expect(cargarLoteEstacion).toHaveBeenCalledTimes(1)
  })

  it('28. el polling se pausa durante Devolver', async () => {
    vi.useFakeTimers()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))
    retornarExpedienteCiclo.mockReturnValue(new Promise(() => {}))

    renderPagina()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText('EXP-U01')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }))
    fireEvent.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Devolver' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })

    expect(cargarLoteEstacion).toHaveBeenCalledTimes(1)
  })

  it('29. recepción continúa funcionando con el refresco en vivo activo', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))
    entregarExpedienteCiclo.mockResolvedValue({ id: 'c1', estadoActual: 'entregado' })

    renderPagina()
    await screen.findByText('EXP-001')

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }))
    await abrirYConfirmar(user)

    await waitFor(() => expect(entregarExpedienteCiclo).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/1 expediente recibido/i)).toBeInTheDocument()
  })

  it('30. devolución continúa funcionando con el refresco en vivo activo', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))
    retornarExpedienteCiclo.mockResolvedValue({ id: 'u1', estadoActual: 'en_transito_retorno' })

    renderPagina()
    await screen.findByText('EXP-U01')

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }))
    await abrirYConfirmarDevolucion(user)

    await waitFor(() => expect(retornarExpedienteCiclo).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/1 expediente devuelto/i)).toBeInTheDocument()
  })

  it('31. no muestra Spinner de página completa durante el refresco silencioso', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-001' })]))

    renderPagina()
    await screen.findByText('EXP-001')

    let resolver
    cargarLoteEstacion.mockImplementationOnce(() => new Promise((r) => (resolver = r)))
    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('EXP-001')).toBeInTheDocument()

    await act(async () => {
      resolver(lote([fila({ numeroExpediente: 'EXP-002' })]))
    })
    await screen.findByText('EXP-002')
  })
})

describe('MesaCoexPage - Fase 5 (responsive y targets táctiles)', () => {
  it('32. el header expone el título y la estación activa en su propio bloque', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()

    expect(screen.getByRole('heading', { name: 'Mesa COEX' })).toBeInTheDocument()
    expect(screen.getByText('COEX Consulta Externa')).toBeInTheDocument()
    await screen.findByText('EXP-001')
  })

  it('33. el botón Actualizar tiene un target táctil de al menos 44px (min-h-11)', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    renderPagina()

    const boton = await screen.findByRole('button', { name: 'Actualizar' })
    expect(boton.className).toContain('min-h-11')
  })

  it('34. el checkbox de fila es nativo y vive en un contenedor de target 44x44', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()
    await screen.findByText('EXP-001')

    const checkbox = screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' })
    expect(checkbox).toHaveAttribute('type', 'checkbox')
    expect(checkbox.parentElement.className).toContain('h-11')
    expect(checkbox.parentElement.className).toContain('w-11')
  })

  it('35. el checkbox maestro conserva aria-label y target táctil en su label', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()
    await screen.findByText('EXP-001')

    const maestro = screen.getByRole('checkbox', {
      name: 'Seleccionar todos los expedientes pendientes de recibir',
    })
    expect(maestro).toHaveAttribute('type', 'checkbox')
    expect(maestro.closest('label').className).toContain('min-h-11')
  })

  it('36. los botones de acción están deshabilitados sin selección y tienen target táctil', async () => {
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()
    await screen.findByText('EXP-001')

    const recibir = screen.getByRole('button', { name: /Recibir seleccionados/ })
    expect(recibir).toBeDisabled()
    expect(recibir.className).toContain('min-h-11')
    expect(recibir.className).toContain('w-full')
  })

  it('37. el modal de recepción conserva role dialog y botones táctiles', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(pendientes(1)))

    renderPagina()
    await screen.findByText('EXP-001')

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-001' }))
    await user.click(screen.getByRole('button', { name: /Recibir seleccionados/ }))

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' }).className).toContain('min-h-11')
    expect(within(dialogo).getByRole('button', { name: 'Recibir' }).className).toContain('min-h-11')
  })

  it('38. el modal de devolución conserva role dialog y botones táctiles', async () => {
    const user = userEvent.setup()
    cargarLoteEstacion.mockResolvedValue(lote(enUso(1)))

    renderPagina()
    await screen.findByText('EXP-U01')

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar expediente EXP-U01' }))
    await user.click(screen.getByRole('button', { name: /Devolver seleccionados/ }))

    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' }).className).toContain('min-h-11')
    expect(within(dialogo).getByRole('button', { name: 'Devolver' }).className).toContain('min-h-11')
  })
})
