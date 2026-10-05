import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import { cargarLoteEstacion } from '../api/coexApi'
import MesaCoexPage from './MesaCoexPage.jsx'

vi.mock('../api/coexApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, cargarLoteEstacion: vi.fn() }
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

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  activarEstacion()
})

describe('MesaCoexPage', () => {
  it('renderiza el título y la estación activa', async () => {
    cargarLoteEstacion.mockResolvedValue({ subespecialidades: [{ id: 1 }], filas: [fila()] })

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
    cargarLoteEstacion.mockResolvedValue({ subespecialidades: [{ id: 1 }], filas: [] })

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
    cargarLoteEstacion.mockResolvedValue({
      subespecialidades: [{ id: 1 }],
      filas: [
        fila({ citaId: 1, cicloId: 'c1', numeroExpediente: 'EXP-001' }),
        fila({
          citaId: 2,
          cicloId: 'c2',
          numeroExpediente: 'EXP-002',
          estadoActual: 'entregado',
        }),
      ],
    })

    renderPagina()

    const pendientes = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUso = screen.getByRole('region', { name: 'En uso' })

    expect(within(pendientes).getByText('EXP-001')).toBeInTheDocument()
    expect(within(pendientes).queryByText('EXP-002')).not.toBeInTheDocument()
    expect(within(enUso).getByText('EXP-002')).toBeInTheDocument()
    expect(within(enUso).queryByText('EXP-001')).not.toBeInTheDocument()
  })

  it('no muestra como accionables las filas sin_ciclo o sin cicloId', async () => {
    cargarLoteEstacion.mockResolvedValue({
      subespecialidades: [{ id: 1 }],
      filas: [
        fila({
          citaId: 1,
          cicloId: null,
          estadoActual: 'sin_ciclo',
          numeroExpediente: null,
          expedienteId: null,
        }),
        fila({ citaId: 2, cicloId: null, estadoActual: 'en_transito_entrega' }),
      ],
    })

    renderPagina()

    const pendientes = await screen.findByRole('region', { name: 'Pendientes de recibir' })
    const enUso = screen.getByRole('region', { name: 'En uso' })

    expect(within(pendientes).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(enUso).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(pendientes).queryByText('Sin número de expediente')).not.toBeInTheDocument()
  })

  it('está registrada en la ruta /coex', async () => {
    cargarLoteEstacion.mockResolvedValue({ subespecialidades: [{ id: 1 }], filas: [fila()] })

    renderPagina(<AppRouter />)

    expect(await screen.findByRole('heading', { name: 'Mesa COEX' })).toBeInTheDocument()
  })
})
