import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import {
  buscarExpedientePorCodigo,
  checkInExpediente,
  iniciarBusquedaCiclo,
  listarJornadaArchivo,
  listarSubespecialidades,
  localizarCiclo,
  obtenerResumenArchivo,
  obtenerResumenArchivoPdf,
  reintentarBusquedaCiclo,
} from '../api/archivoApi'
import ArchivoPage from './ArchivoPage.jsx'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

vi.mock('../api/archivoApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listarSubespecialidades: vi.fn(),
    listarJornadaArchivo: vi.fn(),
    buscarExpedientePorCodigo: vi.fn(),
    obtenerResumenArchivo: vi.fn(),
    obtenerResumenArchivoPdf: vi.fn(),
    crearActaRecepcion: vi.fn(),
    obtenerActaRecepcion: vi.fn(),
    obtenerActaRecepcionPdf: vi.fn(),
    checkInExpediente: vi.fn(),
    obtenerCicloPorCita: vi.fn(),
    iniciarBusquedaCiclo: vi.fn(),
    localizarCiclo: vi.fn(),
    despacharCiclo: vi.fn(),
    archivarCiclo: vi.fn(),
    noLocalizadoCiclo: vi.fn(),
    reintentarBusquedaCiclo: vi.fn(),
  }
})

function fila({ id, numeroExpediente, estadoActual, cicloId, citaId, ...rest }) {
  return {
    id,
    expedienteId: id,
    citaId,
    cicloId: cicloId === undefined ? (estadoActual === 'sin_ciclo' ? null : `c-${id}`) : cicloId,
    numeroExpediente,
    pacienteNombre: `Paciente ${id}`,
    estadoActual,
    horaEstimada: '08:00:00',
    ubicacion: `Pasillo ${id}`,
    subespecialidadId: 1,
    subespecialidadNombre: 'Medicina General',
    ...rest,
  }
}

function jornadaBase() {
  return [
    fila({
      id: 'e1',
      citaId: 101,
      numeroExpediente: '111010',
      estadoActual: 'pendiente_localizar',
    }),
    fila({ id: 'e2', citaId: 102, numeroExpediente: '111015', estadoActual: 'en_busqueda' }),
    fila({ id: 'e3', citaId: 103, numeroExpediente: '111016', estadoActual: 'localizado' }),
    fila({
      id: 'e4',
      citaId: 104,
      numeroExpediente: '111012',
      estadoActual: 'en_transito_entrega',
    }),
    fila({ id: 'e5', citaId: 105, numeroExpediente: '111018', estadoActual: 'entregado' }),
    fila({ id: 'e6', citaId: 106, numeroExpediente: '111017', estadoActual: 'no_localizado' }),
    fila({
      id: 'e8',
      citaId: 108,
      numeroExpediente: '111020',
      estadoActual: 'sin_ciclo',
      cicloId: null,
    }),
    {
      id: 'cita-110',
      expedienteId: null,
      citaId: 110,
      cicloId: null,
      numeroExpediente: null,
      pacienteNombre: 'Paciente sin expediente',
      estadoActual: 'sin_ciclo',
      horaEstimada: '12:30:00',
      ubicacion: null,
      subespecialidadId: 2,
      subespecialidadNombre: 'Pediatría General',
    },
  ]
}

let jornadaActual

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <ArchivoPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const esperarJornada = () => screen.findByText('111010')
const regionPendientes = () => screen.getByRole('region', { name: 'Pendientes de localizar' })
const regionLocalizados = () => screen.getByRole('region', { name: 'Expedientes localizados' })
const filaDe = (numero) => screen.getByText(numero).closest('li')
const checkboxDe = (numero) => within(filaDe(numero)).getByRole('checkbox')

beforeEach(() => {
  vi.clearAllMocks()
  jornadaActual = jornadaBase()

  listarSubespecialidades.mockResolvedValue([
    { id: 1, nombre: 'Medicina General' },
    { id: 2, nombre: 'Pediatría General' },
  ])

  listarJornadaArchivo.mockImplementation(({ subespecialidadId } = {}) =>
    Promise.resolve(
      jornadaActual
        .filter((f) => !subespecialidadId || f.subespecialidadId === Number(subespecialidadId))
        .map((f) => ({ ...f })),
    ),
  )

  buscarExpedientePorCodigo.mockResolvedValue(null)
  obtenerResumenArchivo.mockResolvedValue({ fecha: null, totalCiclos: 0 })
  obtenerResumenArchivoPdf.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }))

  const porCiclo = (cicloId, estado) => {
    const filaActual = jornadaActual.find((f) => f.cicloId === cicloId)
    if (!filaActual)
      return Promise.reject(Object.assign(new Error('Ciclo no encontrado'), { status: 404 }))
    filaActual.estadoActual = estado
    return Promise.resolve({ ...filaActual })
  }

  checkInExpediente.mockImplementation((expedienteId, datos) => {
    const filaActual = jornadaActual.find((f) => f.expedienteId === expedienteId)
    if (!filaActual)
      return Promise.reject(Object.assign(new Error('Expediente no encontrado'), { status: 404 }))
    filaActual.cicloId = filaActual.cicloId ?? `c-${filaActual.id}`
    filaActual.estadoActual = 'en_busqueda'
    if (datos?.citaId) filaActual.citaId = datos.citaId
    return Promise.resolve({ ...filaActual, cicloId: filaActual.cicloId })
  })

  iniciarBusquedaCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'en_busqueda'))
  localizarCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'localizado'))
  reintentarBusquedaCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'en_busqueda'))
})

describe('ArchivoPage — ruta oficial', () => {
  it('/archivo renderiza la vista oficial', async () => {
    renderRuta('/archivo')

    expect(
      screen.getByRole('heading', { name: 'Estación de Archivo / Registro Médico' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('region', { name: 'Pendientes de localizar' }),
    ).toBeInTheDocument()
  })

  it('la ruta experimental /archivo/listado-prueba ya no existe', () => {
    renderRuta('/archivo/listado-prueba')

    expect(screen.queryByText('Vista experimental de listado')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Pendientes de localizar' }),
    ).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — dos secciones derivadas del backend', () => {
  it('carga con la fecha de HOY (YYYY-MM-DD local)', async () => {
    renderPagina()
    await esperarJornada()

    expect(listarJornadaArchivo).toHaveBeenCalledWith({ fecha: hoyIso(), subespecialidadId: '' })
  })

  it('separa Pendientes de localizar y Expedientes localizados', async () => {
    renderPagina()
    await esperarJornada()

    expect(regionPendientes()).toBeInTheDocument()
    expect(regionLocalizados()).toBeInTheDocument()

    expect(within(regionPendientes()).getByText('111010')).toBeInTheDocument()
    expect(within(regionPendientes()).getByText('111015')).toBeInTheDocument()
    expect(within(regionPendientes()).getByText('111017')).toBeInTheDocument()
    expect(within(regionPendientes()).getByText('111020')).toBeInTheDocument()

    expect(within(regionLocalizados()).getByText('111016')).toBeInTheDocument()
    expect(within(regionLocalizados()).getByText('111018')).toBeInTheDocument()
  })

  it('el checkbox refleja estadoActual (no un Set local)', async () => {
    renderPagina()
    await esperarJornada()

    expect(checkboxDe('111015')).not.toBeChecked()
    expect(checkboxDe('111016')).toBeChecked()
    expect(checkboxDe('111020')).not.toBeChecked()
  })

  it('los estados posteriores a localizado siguen marcados', async () => {
    renderPagina()
    await esperarJornada()

    expect(checkboxDe('111016')).toBeChecked() // localizado
    expect(checkboxDe('111012')).toBeChecked() // en_transito_entrega
    expect(checkboxDe('111018')).toBeChecked() // entregado
  })

  it('el resumen deriva de los estados reales', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('7')
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('4')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('3')
  })

  it('informa las citas sin expediente físico (sin checkbox operativo)', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.getByText('Citas sin expediente físico')).toBeInTheDocument()
    // Solo las filas operativas tienen checkbox (7 operativas en el fixture).
    expect(screen.getAllByRole('checkbox')).toHaveLength(7)
  })

  it('no muestra estados técnicos ni botones de transición ni stepper', async () => {
    renderPagina()
    await esperarJornada()

    for (const nombre of [
      /^check-in$/i,
      /iniciar búsqueda/i,
      /^localizar$/i,
      /no localizado/i,
      /reintentar búsqueda/i,
      /^despachar$/i,
      /^archivar$/i,
      /ver detalle/i,
    ]) {
      expect(screen.queryByRole('button', { name: nombre })).not.toBeInTheDocument()
    }
    expect(screen.queryByLabelText('Trazabilidad del expediente')).not.toBeInTheDocument()
    expect(screen.queryByText(/en búsqueda/i)).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — checkbox ejecuta la secuencia interna de localización', () => {
  it('sin_ciclo: check-in + localizar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111020'))

    await waitFor(() => expect(checkInExpediente).toHaveBeenCalledWith('e8', { citaId: 108 }))
    await waitFor(() => expect(localizarCiclo).toHaveBeenCalledWith('c-e8'))
    await waitFor(() => expect(within(regionLocalizados()).getByText('111020')).toBeInTheDocument())
  })

  it('pendiente_localizar: iniciar búsqueda + localizar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111010'))

    await waitFor(() => expect(iniciarBusquedaCiclo).toHaveBeenCalledWith('c-e1'))
    await waitFor(() => expect(localizarCiclo).toHaveBeenCalledWith('c-e1'))
    await waitFor(() => expect(within(regionLocalizados()).getByText('111010')).toBeInTheDocument())
  })

  it('en_busqueda: solo localizar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111015'))

    await waitFor(() => expect(localizarCiclo).toHaveBeenCalledWith('c-e2'))
    expect(iniciarBusquedaCiclo).not.toHaveBeenCalled()
    expect(checkInExpediente).not.toHaveBeenCalled()
    await waitFor(() => expect(within(regionLocalizados()).getByText('111015')).toBeInTheDocument())
  })

  it('no_localizado: reintentar + localizar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111017'))

    await waitFor(() => expect(reintentarBusquedaCiclo).toHaveBeenCalledWith('c-e6'))
    await waitFor(() => expect(localizarCiclo).toHaveBeenCalledWith('c-e6'))
    await waitFor(() => expect(within(regionLocalizados()).getByText('111017')).toBeInTheDocument())
  })
})

describe('ArchivoPage — errores y concurrencia', () => {
  it('si falla el primer paso, no ejecuta el segundo y no marca', async () => {
    checkInExpediente.mockRejectedValueOnce(Object.assign(new Error('403'), { status: 403 }))
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111020'))

    expect(await screen.findByText('No se pudo localizar el expediente')).toBeInTheDocument()
    expect(localizarCiclo).not.toHaveBeenCalled()
    expect(checkboxDe('111020')).not.toBeChecked()
    expect(within(regionPendientes()).getByText('111020')).toBeInTheDocument()
  })

  it('si falla localizar, el expediente sigue pendiente', async () => {
    localizarCiclo.mockRejectedValueOnce(Object.assign(new Error('400'), { status: 400 }))
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111015'))

    expect(await screen.findByText('No se pudo localizar el expediente')).toBeInTheDocument()
    expect(checkboxDe('111015')).not.toBeChecked()
    expect(within(regionPendientes()).getByText('111015')).toBeInTheDocument()
  })

  it('doble clic no ejecuta dos veces la secuencia', async () => {
    let resolver
    localizarCiclo.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolver = res
        }),
    )
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    const casilla = checkboxDe('111015')
    await user.click(casilla)
    await user.click(casilla)

    expect(localizarCiclo).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolver({ id: 'e2', estadoActual: 'localizado' })
    })
  })

  it('un checkbox localizado no ejecuta reversión', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(checkboxDe('111016'))

    expect(localizarCiclo).not.toHaveBeenCalled()
    expect(iniciarBusquedaCiclo).not.toHaveBeenCalled()
    expect(checkboxDe('111016')).toBeChecked()
  })
})

describe('ArchivoPage — scanner / búsqueda', () => {
  async function buscar(user, codigo) {
    await user.type(screen.getByLabelText('Buscar expediente por código'), codigo)
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
  }

  it('al escanear sin ciclo hace check-in pero NO localiza', async () => {
    buscarExpedientePorCodigo.mockResolvedValue({ expedienteId: 'e8', numeroExpediente: '111020' })
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await buscar(user, '111020')

    await waitFor(() => expect(checkInExpediente).toHaveBeenCalledTimes(1))
    expect(localizarCiclo).not.toHaveBeenCalled()
    expect(await screen.findByText('Resultado de búsqueda')).toBeInTheDocument()
    expect(checkboxDe('111020')).not.toBeChecked()
    expect(within(regionPendientes()).getByText('111020')).toBeInTheDocument()
  })

  it('si ya tiene ciclo, solo resalta sin mutaciones', async () => {
    buscarExpedientePorCodigo.mockResolvedValue({ expedienteId: 'e2', numeroExpediente: '111015' })
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await buscar(user, '111015')

    expect(await screen.findByText('Resultado de búsqueda')).toBeInTheDocument()
    expect(checkInExpediente).not.toHaveBeenCalled()
    expect(localizarCiclo).not.toHaveBeenCalled()
  })

  it('feedback de error cuando el código no existe', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await buscar(user, 'NO-EXISTE')

    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
  })
})

describe('ArchivoPage — clasificación Activo/Pasivo', () => {
  it('muestra Pasivo (111015) y Activo (111016/111017)', async () => {
    renderPagina()
    await esperarJornada()

    expect(within(filaDe('111015')).getByText('Pasivo')).toBeInTheDocument()
    expect(within(filaDe('111016')).getByText('Activo')).toBeInTheDocument()
    expect(within(filaDe('111017')).getByText('Activo')).toBeInTheDocument()
  })
})

describe('ArchivoPage — estructura y acciones del día', () => {
  it('conserva buscador, cámara y filtros', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escanear con cámara/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de consulta')).toBeInTheDocument()
    expect(screen.getByText('Subespecialidad')).toBeInTheDocument()
  })

  it('consulta el resumen del servidor', async () => {
    obtenerResumenArchivo.mockResolvedValue({ fecha: null, totalCiclos: 3 })
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(screen.getByRole('button', { name: /consultar resumen del día/i }))

    expect(await screen.findByText('Total de ciclos')).toBeInTheDocument()
    expect(await screen.findByText(/actualizado:/i)).toBeInTheDocument()
    expect(screen.getByText('Datos simulados')).toBeInTheDocument()
  })

  it('descarga el PDF del resumen', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(screen.getByRole('button', { name: /descargar resumen \(pdf\)/i }))

    await waitFor(() =>
      expect(obtenerResumenArchivoPdf).toHaveBeenCalledWith({ fecha: expect.any(String) }),
    )
  })
})

describe('ArchivoPage — navegación de la estación', () => {
  it('muestra la navegación de la estación', async () => {
    renderPagina()
    await esperarJornada()

    const nav = screen.getByRole('navigation', { name: 'Navegación de la Estación de Archivo' })
    expect(within(nav).getByRole('link', { name: 'Expedientes para COEX' })).toHaveAttribute(
      'href',
      '/archivo',
    )
  })

  it('cerrar sesión navega a /sesion-cerrada', async () => {
    const user = userEvent.setup()
    renderRuta('/archivo')
    await esperarJornada()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument()
  })
})
