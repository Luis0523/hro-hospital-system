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
  archivarCiclo,
  buscarExpedientePorCodigo,
  checkInExpediente,
  despacharCiclo,
  iniciarBusquedaCiclo,
  listarJornadaArchivo,
  listarSubespecialidades,
  localizarCiclo,
  noLocalizadoCiclo,
  obtenerCicloPorCita,
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

function fila({ id, citaId, estadoActual, numeroExpediente, cicloId, expedienteId = id, ...rest }) {
  return {
    id,
    expedienteId,
    citaId,
    cicloId: cicloId === undefined ? (estadoActual === 'sin_ciclo' ? null : `c-${id}`) : cicloId,
    numeroExpediente: numeroExpediente ?? `EXP-${id}`,
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
    fila({ id: 'e1', citaId: 101, estadoActual: 'pendiente_localizar' }),
    fila({ id: 'e2', citaId: 102, estadoActual: 'en_busqueda' }),
    fila({ id: 'e3', citaId: 103, estadoActual: 'localizado' }),
    fila({ id: 'e4', citaId: 104, estadoActual: 'en_transito_entrega' }),
    fila({ id: 'e5', citaId: 105, estadoActual: 'entregado' }),
    fila({ id: 'e6', citaId: 106, estadoActual: 'en_transito_retorno' }),
    fila({ id: 'e7', citaId: 107, estadoActual: 'archivado' }),
    fila({ id: 'e8', citaId: 108, estadoActual: 'sin_ciclo', cicloId: null }),
    fila({ id: 'e9', citaId: 109, estadoActual: 'no_localizado' }),
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

const esperarJornada = () => screen.findByText('EXP-e1')
const filaDe = (numero) => screen.getByText(numero).closest('li')
const botonEn = (numero, nombre) => within(filaDe(numero)).getByRole('button', { name: nombre })
const hayBoton = (nombre) => screen.queryByRole('button', { name: nombre })

beforeEach(() => {
  vi.clearAllMocks()
  jornadaActual = jornadaBase()

  listarSubespecialidades.mockResolvedValue([
    { id: 1, nombre: 'Medicina General' },
    { id: 2, nombre: 'Pediatría General' },
    { id: 4, nombre: 'Cardiología Clínica' },
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
  obtenerCicloPorCita.mockResolvedValue({ cicloId: 'c-e2', citaId: 102, movimientos: [] })

  const porCiclo = (cicloId, estado) => {
    const filaActual = jornadaActual.find((f) => f.cicloId === cicloId)
    if (!filaActual) {
      return Promise.reject(Object.assign(new Error('Ciclo no encontrado'), { status: 404 }))
    }
    filaActual.estadoActual = estado
    return Promise.resolve({ ...filaActual })
  }

  checkInExpediente.mockImplementation((expedienteId, datos) => {
    const filaActual = jornadaActual.find((f) => f.expedienteId === expedienteId)
    if (!filaActual) {
      return Promise.reject(Object.assign(new Error('Expediente no encontrado'), { status: 404 }))
    }
    filaActual.cicloId = filaActual.cicloId ?? `c-${filaActual.id}`
    filaActual.estadoActual = 'en_busqueda'
    if (datos?.citaId) filaActual.citaId = datos.citaId
    return Promise.resolve({ ...filaActual })
  })

  iniciarBusquedaCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'en_busqueda'))
  localizarCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'localizado'))
  despacharCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'en_transito_entrega'))
  archivarCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'archivado'))
  reintentarBusquedaCiclo.mockImplementation((cicloId) => porCiclo(cicloId, 'en_busqueda'))
  noLocalizadoCiclo.mockImplementation((cicloId, datos) => {
    if (!datos?.observacion) {
      return Promise.reject(Object.assign(new Error('observación requerida'), { status: 400 }))
    }
    return porCiclo(cicloId, 'no_localizado')
  })
})

describe('ArchivoPage — ruta oficial', () => {
  it('/archivo renderiza la vista oficial', async () => {
    renderRuta('/archivo')

    expect(
      screen.getByRole('heading', { name: 'Estación de Archivo / Registro Médico' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('region', { name: 'Jornada de expedientes' }),
    ).toBeInTheDocument()
  })

  it('la ruta experimental /archivo/listado-prueba ya no existe', () => {
    renderRuta('/archivo/listado-prueba')

    expect(screen.queryByText('Vista experimental de listado')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Jornada de expedientes' })).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — jornada real', () => {
  it('carga con la fecha de HOY (YYYY-MM-DD local)', async () => {
    renderPagina()
    await esperarJornada()

    expect(listarJornadaArchivo).toHaveBeenCalledWith({ fecha: hoyIso(), subespecialidadId: '' })
  })

  it('muestra el estado real del backend en la fila', async () => {
    renderPagina()
    await esperarJornada()

    expect(within(filaDe('EXP-e3')).getByText('Localizado')).toBeInTheDocument()
    expect(within(filaDe('EXP-e4')).getByText('En tránsito a COEX')).toBeInTheDocument()
    expect(within(filaDe('EXP-e8')).getByText('Sin ciclo')).toBeInTheDocument()
  })

  it('ya no usa checkbox reversible', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('refleja el resumen por estados reales (sin contar el checklist local)', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('9')
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('4')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('1')
  })

  it('informa las citas sin expediente físico', async () => {
    renderPagina()
    await esperarJornada()

    expect(screen.getByText('Citas sin expediente físico')).toBeInTheDocument()
  })
})

describe('ArchivoPage — matriz de acciones por estado', () => {
  it('sin_ciclo muestra Check-in; pendiente_localizar muestra Iniciar búsqueda', async () => {
    renderPagina()
    await esperarJornada()

    expect(
      within(filaDe('EXP-e8')).getByRole('button', { name: /^check-in$/i }),
    ).toBeInTheDocument()
    expect(
      within(filaDe('EXP-e1')).getByRole('button', { name: /iniciar búsqueda/i }),
    ).toBeInTheDocument()
  })

  it('en_busqueda muestra Localizar y No localizado; localizado muestra Despachar', async () => {
    renderPagina()
    await esperarJornada()

    expect(
      within(filaDe('EXP-e2')).getByRole('button', { name: /^localizar$/i }),
    ).toBeInTheDocument()
    expect(
      within(filaDe('EXP-e2')).getByRole('button', { name: /^no localizado$/i }),
    ).toBeInTheDocument()
    expect(
      within(filaDe('EXP-e3')).getByRole('button', { name: /^despachar$/i }),
    ).toBeInTheDocument()
  })

  it('no_localizado muestra Reintentar; en_transito_retorno muestra Archivar', async () => {
    renderPagina()
    await esperarJornada()

    expect(
      within(filaDe('EXP-e9')).getByRole('button', { name: /reintentar búsqueda/i }),
    ).toBeInTheDocument()
    expect(
      within(filaDe('EXP-e6')).getByRole('button', { name: /^archivar$/i }),
    ).toBeInTheDocument()
  })

  it('en_transito_entrega y entregado no ofrecen acción de Archivo', async () => {
    renderPagina()
    await esperarJornada()

    expect(within(filaDe('EXP-e4')).getByText(/esperando recepción en coex/i)).toBeInTheDocument()
    expect(within(filaDe('EXP-e5')).getByText('En COEX')).toBeInTheDocument()
    expect(within(filaDe('EXP-e7')).getByText(/ciclo cerrado/i)).toBeInTheDocument()
  })

  it('nunca muestra acciones Entregar/Retornar (Enfermería)', async () => {
    renderPagina()
    await esperarJornada()

    expect(hayBoton(/^entregar$/i)).not.toBeInTheDocument()
    expect(hayBoton(/^retornar$/i)).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — transiciones reales', () => {
  it('check-in usa expedienteId + citaId y deja en_busqueda', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e8', /^check-in$/i))

    await waitFor(() => expect(checkInExpediente).toHaveBeenCalledWith('e8', { citaId: 108 }))
    await waitFor(() =>
      expect(within(filaDe('EXP-e8')).getByText('En búsqueda')).toBeInTheDocument(),
    )
  })

  it('iniciar búsqueda llama al ciclo y refleja el estado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e1', /iniciar búsqueda/i))

    await waitFor(() => expect(iniciarBusquedaCiclo).toHaveBeenCalledWith('c-e1'))
    await waitFor(() =>
      expect(within(filaDe('EXP-e1')).getByText('En búsqueda')).toBeInTheDocument(),
    )
  })

  it('localizar y despachar encadenan el estado real', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e2', /^localizar$/i))
    await waitFor(() =>
      expect(within(filaDe('EXP-e2')).getByText('Localizado')).toBeInTheDocument(),
    )

    await user.click(botonEn('EXP-e2', /^despachar$/i))
    await waitFor(() =>
      expect(within(filaDe('EXP-e2')).getByText('En tránsito a COEX')).toBeInTheDocument(),
    )
  })

  it('archivar desde retorno cierra el ciclo', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e6', /^archivar$/i))

    await waitFor(() => expect(archivarCiclo).toHaveBeenCalledWith('c-e6'))
    await waitFor(() => expect(within(filaDe('EXP-e6')).getByText('Archivado')).toBeInTheDocument())
  })

  it('reintentar búsqueda vuelve a en_busqueda', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e9', /reintentar búsqueda/i))

    await waitFor(() => expect(reintentarBusquedaCiclo).toHaveBeenCalledWith('c-e9'))
    await waitFor(() =>
      expect(within(filaDe('EXP-e9')).getByText('En búsqueda')).toBeInTheDocument(),
    )
  })
})

describe('ArchivoPage — no localizado con observación', () => {
  it('exige observación, la envía y refleja el estado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e2', /^no localizado$/i))

    const confirmar = await screen.findByRole('button', { name: /marcar no localizado/i })
    expect(confirmar).toBeDisabled()

    await user.type(screen.getByLabelText('Observación'), 'No estaba en la ubicación')
    await waitFor(() => expect(confirmar).toBeEnabled())
    await user.click(confirmar)

    await waitFor(() =>
      expect(noLocalizadoCiclo).toHaveBeenCalledWith('c-e2', {
        observacion: 'No estaba en la ubicación',
      }),
    )
    await waitFor(() =>
      expect(within(filaDe('EXP-e2')).getByText('No localizado')).toBeInTheDocument(),
    )
  })

  it('cancelar no cambia el estado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e2', /^no localizado$/i))
    await user.click(await screen.findByRole('button', { name: /cancelar/i }))

    expect(noLocalizadoCiclo).not.toHaveBeenCalled()
    expect(within(filaDe('EXP-e2')).getByText('En búsqueda')).toBeInTheDocument()
  })
})

describe('ArchivoPage — errores y concurrencia', () => {
  it('un error no altera el estado anterior', async () => {
    localizarCiclo.mockRejectedValueOnce(new Error('Transición inválida'))
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e2', /^localizar$/i))

    expect(await screen.findByText('No se pudo completar la acción')).toBeInTheDocument()
    expect(within(filaDe('EXP-e2')).getByText('En búsqueda')).toBeInTheDocument()
  })

  it('doble clic no ejecuta dos mutaciones', async () => {
    let resolver
    checkInExpediente.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolver = res
        }),
    )
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    const boton = botonEn('EXP-e8', /^check-in$/i)
    await user.click(boton)
    await user.click(boton)

    expect(checkInExpediente).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolver({ id: 'e8', estadoActual: 'en_busqueda' })
    })
  })
})

describe('ArchivoPage — scanner / búsqueda', () => {
  async function buscar(user, codigo) {
    await user.type(screen.getByLabelText('Buscar expediente por código'), codigo)
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
  }

  it('si el expediente escaneado está sin ciclo, hace check-in una vez sin localizar', async () => {
    buscarExpedientePorCodigo.mockResolvedValue({
      expedienteId: 'e8',
      numeroExpediente: 'EXP-e8',
    })
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await buscar(user, 'EXP-e8')

    await waitFor(() => expect(checkInExpediente).toHaveBeenCalledTimes(1))
    expect(localizarCiclo).not.toHaveBeenCalled()
    expect(await screen.findByText('Resultado de búsqueda')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(filaDe('EXP-e8')).getByText('En búsqueda')).toBeInTheDocument(),
    )
  })

  it('si el expediente ya tiene ciclo, solo resalta (sin mutaciones)', async () => {
    buscarExpedientePorCodigo.mockResolvedValue({
      expedienteId: 'e2',
      numeroExpediente: 'EXP-e2',
    })
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await buscar(user, 'EXP-e2')

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
    expect(screen.queryByText('Resultado de búsqueda')).not.toBeInTheDocument()
  })

  it('no busca con código vacío', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
  })
})

describe('ArchivoPage — fila sin expediente físico', () => {
  it('no permite check-in ni operar', async () => {
    renderPagina()
    await esperarJornada()

    const filaSin = within(screen.getByText('Paciente sin expediente').closest('li'))
    expect(filaSin.getByText(/cita sin expediente físico/i)).toBeInTheDocument()
    expect(filaSin.queryByRole('button', { name: /^check-in$/i })).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — detalle del ciclo', () => {
  it('abre el detalle y consulta los movimientos del ciclo', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarJornada()

    await user.click(botonEn('EXP-e2', /ver detalle/i))

    await waitFor(() => expect(obtenerCicloPorCita).toHaveBeenCalledWith(102))
    expect(await screen.findByText('Detalle del expediente')).toBeInTheDocument()
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

  it('consulta el resumen del servidor y muestra el panel', async () => {
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
    const createObjectURL = vi.fn(() => 'blob:mock')
    URL.createObjectURL = createObjectURL
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
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
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
