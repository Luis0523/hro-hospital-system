import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
})

const {
  construirSecuenciaPacienteMock,
  crearClienteTableroMock,
  estaEnModoMockMock,
  estaPermitidaMock,
  obtenerEstadoInicialEstacionMock,
  obtenerEstadoInicialMock,
  reproducirSecuenciaMock,
  resolverConfiguracionEstacionMock,
  resolverConfiguracionSalaMock,
  topicEstacionMock,
} = vi.hoisted(() => ({
  construirSecuenciaPacienteMock: vi.fn(),
  crearClienteTableroMock: vi.fn(),
  estaEnModoMockMock: vi.fn(),
  estaPermitidaMock: vi.fn(),
  obtenerEstadoInicialEstacionMock: vi.fn(),
  obtenerEstadoInicialMock: vi.fn(),
  reproducirSecuenciaMock: vi.fn(),
  resolverConfiguracionEstacionMock: vi.fn(),
  resolverConfiguracionSalaMock: vi.fn(),
  topicEstacionMock: vi.fn(),
}))

vi.mock('../api/tableroSocket', () => ({
  crearClienteTablero: crearClienteTableroMock,
  TOPIC_TABLERO: '/topic/tablero',
  topicEstacion: topicEstacionMock,
}))

vi.mock('../api/configuracionSala', () => ({
  resolverConfiguracionSala: resolverConfiguracionSalaMock,
}))

vi.mock('../api/configuracionEstacion', () => ({
  resolverConfiguracionEstacion: resolverConfiguracionEstacionMock,
}))

vi.mock('../api/segmentosVoz', () => ({
  construirSecuenciaPaciente: construirSecuenciaPacienteMock,
}))

vi.mock('../api/reproductorVoz', () => ({
  reproducirSecuencia: reproducirSecuenciaMock,
}))

vi.mock('../api/tableroApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    estaEnModoMock: estaEnModoMockMock,
    estaPermitida: estaPermitidaMock,
    obtenerEstadoInicialEstacion: obtenerEstadoInicialEstacionMock,
    obtenerEstadoInicialTablero: obtenerEstadoInicialMock,
  }
})

import TableroPage, {
  DURACION_LLAMADO_SIN_VOZ_MS,
  debeLimpiarRecientes,
  resolverDuracionLlamadoMs,
} from './TableroPage.jsx'

const ASIGNACIONES_INICIALES = [
  {
    asignacionDiariaEspacioId: 1,
    espacioNumero: '6A',
    nivel: 2,
    subespecialidadNombre: 'Pediatría General',
    turnoActual: 7,
    turnoSiguiente: 8,
    ultimaActualizacion: null,
  },
  {
    asignacionDiariaEspacioId: 2,
    espacioNumero: '6B',
    nivel: 2,
    subespecialidadNombre: 'Medicina General',
    turnoActual: 14,
    turnoSiguiente: 15,
    ultimaActualizacion: null,
  },
  {
    asignacionDiariaEspacioId: 3,
    espacioNumero: '6A',
    nivel: 3,
    subespecialidadNombre: 'Cardiología',
    turnoActual: 3,
    turnoSiguiente: 4,
    ultimaActualizacion: null,
  },
  {
    asignacionDiariaEspacioId: 4,
    espacioNumero: '6B',
    nivel: 3,
    subespecialidadNombre: 'Traumatología',
    turnoActual: 21,
    turnoSiguiente: 22,
    ultimaActualizacion: null,
  },
]

function mensaje(asignacion) {
  return {
    espacioNumero: '000',
    nivel: 1,
    subespecialidadNombre: 'General',
    turnoActual: 1,
    turnoSiguiente: 2,
    ultimaActualizacion: '2026-09-20T08:05:32-06:00',
    tipoEvento: 'ACTUALIZACION',
    intentosLlamado: null,
    ...asignacion,
  }
}

let handlers

function filasTabla() {
  return screen
    .getAllByTestId('tablero-tabla-cuerpo')
    .flatMap((cuerpo) => within(cuerpo).getAllByRole('row'))
}

function configurarAntesDeCada({ capturarHandlers = true } = {}) {
  vi.clearAllMocks()
  try {
    globalThis.localStorage?.clear()
  } catch {
    // localStorage no disponible: se ignora.
  }
  handlers = null
  estaEnModoMockMock.mockReturnValue(false)
  estaPermitidaMock.mockImplementation((id, permitidas) =>
    permitidas == null ? true : permitidas.includes(Number(id)),
  )
  obtenerEstadoInicialMock.mockImplementation(({ permitidas } = {}) =>
    Promise.resolve(
      permitidas == null
        ? ASIGNACIONES_INICIALES
        : ASIGNACIONES_INICIALES.filter((a) => permitidas.includes(a.asignacionDiariaEspacioId)),
    ),
  )
  resolverConfiguracionSalaMock.mockResolvedValue({
    modo: 'fallback',
    sala: null,
    permitidas: null,
  })
  resolverConfiguracionEstacionMock.mockResolvedValue(null)
  obtenerEstadoInicialEstacionMock.mockResolvedValue(ASIGNACIONES_INICIALES)
  topicEstacionMock.mockImplementation((estacionId) => `/topic/estacion/${estacionId}`)
  construirSecuenciaPacienteMock.mockReturnValue([
    '/audio/tablero/generales/paciente.mp3',
  ])
  reproducirSecuenciaMock.mockImplementation(() => new Promise(() => {}))
  if (capturarHandlers) {
    crearClienteTableroMock.mockImplementation((opciones) => {
      handlers = opciones
      return { activar: vi.fn(), desactivar: vi.fn() }
    })
  } else {
    crearClienteTableroMock.mockImplementation(() => ({ activar: vi.fn(), desactivar: vi.fn() }))
  }
}

describe('TableroPage', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  it('en modo mock muestra los datos de prueba y no conecta WebSocket', async () => {
    estaEnModoMockMock.mockReturnValue(true)

    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
    expect(screen.getByText('Datos de prueba')).toBeInTheDocument()
    expect(crearClienteTableroMock).not.toHaveBeenCalled()
  })

  it('en modo real prepara la conexión WebSocket', async () => {
    render(<TableroPage />)

    await screen.findByTestId('tablero-tabla')

    expect(crearClienteTableroMock).toHaveBeenCalledTimes(1)
    expect(handlers).toBeTruthy()
  })

  it('con ?estacion usa el snapshot por estación y se suscribe a su topic', async () => {
    resolverConfiguracionEstacionMock.mockResolvedValue({
      estacionId: 9,
      codigo: 'TRIAGE',
      nombre: 'Triage',
      subespecialidadIds: [],
    })

    render(<TableroPage />)

    await screen.findByTestId('tablero-tabla')

    expect(obtenerEstadoInicialEstacionMock).toHaveBeenCalledWith({ estacionId: 9 })
    expect(obtenerEstadoInicialMock).not.toHaveBeenCalled()
    expect(resolverConfiguracionSalaMock).not.toHaveBeenCalled()
    expect(handlers.topic()).toBe('/topic/estacion/9')
  })

  it('renderiza una tabla con una fila por asignación y su turno actual', async () => {
    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
    expect(screen.queryByText('Medicina General')).not.toBeInTheDocument()

    const primera = screen.getByTestId('fila-turno-1')
    expect(within(primera).getByText('#007')).toBeInTheDocument()
    expect(within(primera).getByText('6A')).toBeInTheDocument()
    // La tabla muestra también el siguiente turno de cada consultorio.
    expect(within(primera).getByText('#008')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader', { name: /en espera/i }).length).toBeGreaterThan(0)
  })

  it('muestra un guion cuando no hay turno actual', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce([
      {
        asignacionDiariaEspacioId: 9,
        espacioNumero: '401',
        nivel: 4,
        subespecialidadNombre: 'Dermatología',
        turnoActual: null,
        turnoSiguiente: null,
        ultimaActualizacion: null,
      },
    ])

    render(<TableroPage />)

    const fila = await screen.findByTestId('fila-turno-9')
    const [turno, consultorio, siguiente, cola] = within(fila).getAllByRole('cell')

    expect(turno).toHaveTextContent('—')
    expect(consultorio).toHaveTextContent('401')
    expect(siguiente).toHaveTextContent('—')
    expect(cola).toHaveTextContent('—')
  })

  it('actualiza únicamente la asignación que coincide por asignacionDiariaEspacioId', async () => {
    reproducirSecuenciaMock.mockImplementation(() => Promise.resolve())

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({ asignacionDiariaEspacioId: 1, turnoActual: 9, turnoSiguiente: 10 }),
      )
    })

    expect(within(screen.getByTestId('fila-turno-1')).getByText('#009')).toBeInTheDocument()
    expect(within(screen.getByTestId('fila-turno-2')).getByText('#014')).toBeInTheDocument()
  })

  it('agrega una asignación nueva sin duplicar las existentes', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 99,
          espacioNumero: '999',
          subespecialidadNombre: 'Nueva Clínica',
          turnoActual: 1,
          turnoSiguiente: 2,
        }),
      )
    })

    expect(filasTabla()).toHaveLength(5)
    expect(screen.getByTestId('fila-turno-99')).toBeInTheDocument()
    expect(screen.getAllByTestId('fila-turno-1')).toHaveLength(1)
  })

  it('refleja el estado de la conexión WebSocket', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(screen.getByText('Reconectando…')).toBeInTheDocument()

    act(() => handlers.onConnected())
    expect(screen.getByText('En línea')).toBeInTheDocument()

    act(() => handlers.onDisconnected())
    expect(screen.getByText('Reconectando…')).toBeInTheDocument()

    act(() => handlers.onError('fallo'))
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
  })

  it('se recupera si el snapshot falla pero luego llega un evento WebSocket válido', async () => {
    obtenerEstadoInicialMock.mockRejectedValueOnce(
      new Error('El backend todavía no expone el estado inicial del tablero.'),
    )

    render(<TableroPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-1')).not.toBeInTheDocument()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 5,
          espacioNumero: '205',
          subespecialidadNombre: 'Oftalmología',
          turnoActual: 2,
          turnoSiguiente: 3,
        }),
      )
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-5')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay asignaciones', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce([])

    render(<TableroPage />)

    expect(await screen.findByText('No hay consultorios con turnos activos')).toBeInTheDocument()
  })

  it('muestra el error controlado cuando no hay snapshot disponible', async () => {
    obtenerEstadoInicialMock.mockRejectedValueOnce(
      new Error('El backend todavía no expone el estado inicial del tablero.'),
    )

    render(<TableroPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByText('El backend todavía no expone el estado inicial del tablero.'),
    ).toBeInTheDocument()
  })

  it('ignora eventos WebSocket de asignaciones fuera del filtro configurado', async () => {
    estaPermitidaMock.mockImplementation((id) => [1, 2].includes(Number(id)))

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 3,
          turnoActual: 50,
          turnoSiguiente: 51,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
      handlers.onMensaje(
        mensaje({ asignacionDiariaEspacioId: 99, subespecialidadNombre: 'Fuera de filtro' }),
      )
    })

    expect(screen.queryByText('Fuera de filtro')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-99')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('fila-turno-3')).getByText('#003')).toBeInTheDocument()
    expect(screen.queryByText('#050')).not.toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
  })

  it('no muestra datos personales aunque lleguen por WebSocket', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          nombrePaciente: 'Juan Perez',
          pacienteNombreCompleto: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
        }),
      )
    })

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
  })

  it('no anuncia durante la carga inicial', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
    expect(reproducirSecuenciaMock).not.toHaveBeenCalled()
  })

  it('el snapshot parcial con turno desconocido no abre LlamadoGrande ni anuncia', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce([
      {
        asignacionDiariaEspacioId: 7,
        espacioNumero: '205',
        nivel: 2,
        subespecialidadNombre: 'Pediatría General',
        turnoActual: null,
        turnoSiguiente: null,
        ultimaActualizacion: null,
      },
    ])

    render(<TableroPage />)

    const fila = await screen.findByTestId('fila-turno-7')
    expect(within(fila).getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('comienza con la voz desactivada y la activa sin reproducir audio', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(screen.getByRole('button', { name: /activar voz/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    expect(reproducirSecuenciaMock).not.toHaveBeenCalled()
    expect(screen.getByText('Voz activa')).toBeInTheDocument()
  })

  it('no anuncia si la voz no está activada', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('anuncia cuando cambia el turno actual tras activar la voz', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          espacioNumero: '201',
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledWith({
      numero: 8,
      destino: '201',
      accion: 'pasara_a',
    })
  })

  it('un evento ACTUALIZACION no anuncia aunque cambie el turno', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('no anuncia si solo cambia el siguiente turno', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({ asignacionDiariaEspacioId: 1, turnoActual: 7, turnoSiguiente: 9 }),
      )
    })

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('no anuncia asignaciones fuera del filtro aunque cambie el turno', async () => {
    estaPermitidaMock.mockImplementation((id) => [1, 2].includes(Number(id)))

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 3,
          turnoActual: 50,
          turnoSiguiente: 51,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('muestra "Voz no disponible" sin romper el tablero', async () => {
    vi.stubGlobal('Audio', undefined)

    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(screen.getByText('Voz no disponible')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /activar voz/i })).not.toBeInTheDocument()
  })
})

describe('TableroPage · voz local', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  it('construye y reproduce la secuencia local dos veces', async () => {
    const secuencia = ['/audio/tablero/generales/paciente.mp3']
    construirSecuenciaPacienteMock.mockReturnValue(secuencia)
    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 25,
          espacioNumero: '6A',
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledWith({
      numero: 25,
      destino: '6A',
      accion: 'pasara_a',
    })
    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(1)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(1, secuencia)

    await act(async () => terminaciones[0]())

    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(2)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(2, secuencia)

    await act(async () => terminaciones[1]())

    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('reproduce la secuencia local para el turno 7 en 6A con el constructor real', async () => {
    const actual = await vi.importActual('../api/segmentosVoz')
    construirSecuenciaPacienteMock.mockImplementation(actual.construirSecuenciaPaciente)

    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    const secuencia = [
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/numeros/007.mp3',
      '/audio/tablero/generales/pasara_a.mp3',
      '/audio/tablero/numeros/6a.mp3',
    ]

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 7,
          espacioNumero: '6A',
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledWith({
      numero: 7,
      destino: '6A',
      accion: 'pasara_a',
    })
    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(1)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(1, secuencia)

    await act(async () => terminaciones[0]())

    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(2)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(2, secuencia)

    await act(async () => terminaciones[1]())

    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('reproduce la secuencia local para el turno 14 en 6B con el constructor real', async () => {
    const actual = await vi.importActual('../api/segmentosVoz')
    construirSecuenciaPacienteMock.mockImplementation(actual.construirSecuenciaPaciente)

    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    const secuencia = [
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/numeros/014.mp3',
      '/audio/tablero/generales/pasara_a.mp3',
      '/audio/tablero/numeros/6b.mp3',
    ]

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 14,
          espacioNumero: '6B',
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledWith({
      numero: 14,
      destino: '6B',
      accion: 'pasara_a',
    })
    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(1)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(1, secuencia)

    await act(async () => terminaciones[0]())

    expect(reproducirSecuenciaMock).toHaveBeenCalledTimes(2)
    expect(reproducirSecuenciaMock).toHaveBeenNthCalledWith(2, secuencia)

    await act(async () => terminaciones[1]())

    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('no reproduce audio ni bloquea si la secuencia es null', async () => {
    construirSecuenciaPacienteMock.mockReturnValue(null)

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    vi.useFakeTimers()
    try {
      act(() => {
        handlers.onMensaje(
          mensaje({
            asignacionDiariaEspacioId: 1,
            turnoActual: 200,
            espacioNumero: '999',
            tipoEvento: 'LLAMADO',
            intentosLlamado: 1,
          }),
        )
      })

      expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
      expect(reproducirSecuenciaMock).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(DURACION_LLAMADO_SIN_VOZ_MS)
      })

      expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
      expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('TableroPage · tabla dinámica', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: false })
  })

  it('muestra la tabla con una fila por asignación visible', async () => {
    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
  })

  it('ajusta el número de filas a la cantidad de asignaciones', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce(ASIGNACIONES_INICIALES.slice(0, 2))

    render(<TableroPage />)

    await screen.findByTestId('tablero-tabla')
    expect(filasTabla()).toHaveLength(2)
  })
})

describe('TableroPage · modo llamado (SCRUM-101)', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  it('usa 6000 ms por defecto y respeta VITE_TABLERO_LLAMADO_MS', () => {
    expect(DURACION_LLAMADO_SIN_VOZ_MS).toBe(6000)
    expect(resolverDuracionLlamadoMs({})).toBe(6000)
    expect(resolverDuracionLlamadoMs({ VITE_TABLERO_LLAMADO_MS: '3000' })).toBe(3000)
    expect(resolverDuracionLlamadoMs({ VITE_TABLERO_LLAMADO_MS: 'abc' })).toBe(6000)
    expect(resolverDuracionLlamadoMs({ VITE_TABLERO_LLAMADO_MS: '-5' })).toBe(6000)
  })

  it('muestra LlamadoGrande y oculta la tabla al cambiar el turno actual', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')
    expect(screen.queryByTestId('tablero-tabla')).not.toBeInTheDocument()
  })

  it('vuelve a la tabla tras las dos repeticiones de voz', async () => {
    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)

    await act(async () => terminaciones[0]())

    // Segunda repetición: mismo turno visible, misma asignación.
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)

    await act(async () => terminaciones[1]())

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('procesa dos llamados FIFO con dos repeticiones cada uno sin interrumpir', async () => {
    const anuncios = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => anuncios.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
          subespecialidadNombre: 'Pediatría General',
          espacioNumero: '6A',
        }),
      )
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 15,
          turnoSiguiente: 16,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
          subespecialidadNombre: 'Medicina General',
          espacioNumero: '6B',
        }),
      )
    })

    // Primer llamado visible (turno #008), sin interrumpir la cola.
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
    expect(anuncios).toHaveLength(1)
    expect(construirSecuenciaPacienteMock).toHaveBeenLastCalledWith({
      numero: 8,
      destino: '6A',
      accion: 'pasara_a',
    })

    // Pediatría, repetición 2.
    await act(async () => anuncios[0]())
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')

    // Avanza a Medicina.
    await act(async () => anuncios[1]())
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(3)
    expect(construirSecuenciaPacienteMock).toHaveBeenLastCalledWith({
      numero: 15,
      destino: '6B',
      accion: 'pasara_a',
    })
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#015')

    // Medicina, repetición 2 y fin de la cola.
    await act(async () => anuncios[2]())
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(4)
    await act(async () => anuncios[3]())

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('fila-turno-1')).getByText('#008')).toBeInTheDocument()
    expect(screen.getByTestId('ultimo-llamado-2-15')).toBeInTheDocument()
  })

  it('avanza correctamente al recibir onError sin bloquear el tablero', async () => {
    const fallos = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((_, reject) => fallos.push(reject)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()

    await act(async () => fallos[0](new Error('fallo de audio')))
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)

    await act(async () => fallos[1](new Error('fallo de audio')))

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('usa el fallback por timeout si el audio no termina', async () => {
    construirSecuenciaPacienteMock.mockReturnValue([
      '/audio/tablero/generales/paciente.mp3',
    ])

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    vi.useFakeTimers()
    try {
      act(() => {
        handlers.onMensaje(
          mensaje({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            turnoSiguiente: 9,
            tipoEvento: 'LLAMADO',
            intentosLlamado: 1,
          }),
        )
      })
      expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(40000)
      })

      // El fallback no duplica: dos repeticiones y vuelve a la tabla.
      expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)
      expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
      expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('con la voz desactivada muestra el llamado y vuelve por tiempo visual', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    vi.useFakeTimers()
    try {
      act(() => {
        handlers.onMensaje(
          mensaje({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            turnoSiguiente: 9,
            tipoEvento: 'LLAMADO',
            intentosLlamado: 1,
          }),
        )
      })

      expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
      expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(7000)
      })

      expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
      expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('sin SpeechSynthesis muestra el llamado y avanza por tiempo sin errores', async () => {
    vi.stubGlobal('Audio', undefined)

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    vi.useFakeTimers()
    try {
      act(() => {
        handlers.onMensaje(
          mensaje({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            turnoSiguiente: 9,
            tipoEvento: 'LLAMADO',
            intentosLlamado: 1,
          }),
        )
      })

      expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
      expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(7000)
      })

      expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
      expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('un evento ACTUALIZACION con cambio de turno no activa el llamado', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('no activa el llamado si solo cambia el siguiente turno', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({ asignacionDiariaEspacioId: 1, turnoActual: 7, turnoSiguiente: 99 }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('no activa el llamado para asignaciones fuera del filtro', async () => {
    estaPermitidaMock.mockImplementation((id) => [1, 2].includes(Number(id)))

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 3,
          turnoActual: 50,
          turnoSiguiente: 51,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('un evento fuera del filtro no ocupa la cola FIFO ni la voz', async () => {
    estaPermitidaMock.mockImplementation((id) => [1, 2].includes(Number(id)))

    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 3,
          turnoActual: 50,
          turnoSiguiente: 51,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)

    await act(async () => terminaciones[0]())
    await act(async () => terminaciones[1]())

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('no muestra datos personales en el llamado', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
          nombrePaciente: 'Juan Perez',
          pacienteNombreCompleto: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
  })

  it('integra el control de pantalla completa en el encabezado', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    // En jsdom la Fullscreen API no existe: el control se muestra como no disponible.
    expect(screen.getByText('Pantalla completa no disponible')).toBeInTheDocument()
  })

  it('limpia el temporizador del llamado al desmontar', async () => {
    const { unmount } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    vi.useFakeTimers()
    try {
      act(() => {
        handlers.onMensaje(
          mensaje({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            turnoSiguiente: 9,
            tipoEvento: 'LLAMADO',
            intentosLlamado: 1,
          }),
        )
      })
      expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()

      unmount()

      expect(() => vi.advanceTimersByTime(60000)).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('un callback tardío tras desmontar no rompe ni continúa la cola pendiente', async () => {
    let terminar
    reproducirSecuenciaMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          terminar = resolve
        }),
    )

    const { unmount } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 15,
          turnoSiguiente: 16,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
          subespecialidadNombre: 'Medicina General',
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()

    unmount()

    await act(async () => terminar())
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
  })

  it('un re-llamado con distinto intento vuelve a anunciar', async () => {
    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })
    await act(async () => terminaciones[0]())
    await act(async () => terminaciones[1]())
    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)

    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 2,
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
  })

  it('un LLAMADO duplicado (misma firma) no vuelve a anunciar', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    const eventoLlamado = () =>
      mensaje({
        asignacionDiariaEspacioId: 1,
        turnoActual: 8,
        turnoSiguiente: 9,
        tipoEvento: 'LLAMADO',
        intentosLlamado: 2,
      })

    act(() => handlers.onMensaje(eventoLlamado()))
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)

    construirSecuenciaPacienteMock.mockClear()

    act(() => handlers.onMensaje(eventoLlamado()))

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('un ACTUALIZACION no borra la deduplicación del último llamado', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 2,
        }),
      )
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'ACTUALIZACION',
          intentosLlamado: null,
        }),
      )
    })
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)

    construirSecuenciaPacienteMock.mockClear()

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 2,
        }),
      )
    })

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('arranque de TV a mitad de jornada: snapshot nulo y ACTUALIZACION no llama', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce([
      {
        asignacionDiariaEspacioId: 1,
        espacioNumero: '201',
        nivel: 2,
        subespecialidadNombre: 'Pediatría General',
        turnoActual: null,
        turnoSiguiente: null,
        ultimaActualizacion: null,
        intentosLlamado: null,
        tipoEvento: null,
      },
    ])

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('fila-turno-1')).getByText('#008')).toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('arranque de TV a mitad de jornada: snapshot nulo y LLAMADO real sí llama', async () => {
    obtenerEstadoInicialMock.mockResolvedValueOnce([
      {
        asignacionDiariaEspacioId: 1,
        espacioNumero: '201',
        nivel: 2,
        subespecialidadNombre: 'Pediatría General',
        turnoActual: null,
        turnoSiguiente: null,
        ultimaActualizacion: null,
        intentosLlamado: null,
        tipoEvento: null,
      },
    ])

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')
  })

  it('una asignación nueva por LLAMADO se agrega y llama', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 99,
          espacioNumero: '999',
          subespecialidadNombre: 'Nueva Clínica',
          turnoActual: 5,
          turnoSiguiente: 6,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#005')
  })
})

describe('TableroPage · configuración de sala (runtime)', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  it('sin ?sala conserva el fallback build-time (todas)', async () => {
    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
  })

  it('sala 1 muestra solo sus asignaciones', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(1)
    expect(screen.getByTestId('fila-turno-1')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-2')).not.toBeInTheDocument()
  })

  it('sala 2 muestra únicamente las suyas', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '2',
      permitidas: [2],
    })

    render(<TableroPage />)

    expect(await screen.findByTestId('fila-turno-2')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(1)
    expect(screen.getByTestId('fila-turno-2')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-1')).not.toBeInTheDocument()
  })

  it('un WS ACTUALIZACION fuera de sala se ignora', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 9,
          turnoSiguiente: 10,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    })

    expect(filasTabla()).toHaveLength(1)
    expect(screen.queryByTestId('fila-turno-2')).not.toBeInTheDocument()
  })

  it('un WS LLAMADO fuera de sala no habla', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 9,
          turnoSiguiente: 10,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('un WS LLAMADO dentro de sala sí llama', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 1,
          turnoActual: 9,
          turnoSiguiente: 10,
          tipoEvento: 'LLAMADO',
          intentosLlamado: 1,
        }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
  })

  it('una sala inválida muestra estado seguro (sin mostrar todas)', async () => {
    resolverConfiguracionSalaMock.mockRejectedValueOnce(
      new Error(
        'Esta pantalla no tiene una sala configurada correctamente. Verifique la configuración del tablero.',
      ),
    )

    render(<TableroPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/no tiene una sala configurada/i)).toBeInTheDocument()
    expect(screen.queryByTestId('tablero-tabla')).not.toBeInTheDocument()
  })

  it('un fallo de configuración muestra estado seguro', async () => {
    resolverConfiguracionSalaMock.mockRejectedValueOnce(new Error('fallo de config'))

    render(<TableroPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('fallo de config')).toBeInTheDocument()
    expect(screen.queryByTestId('tablero-tabla')).not.toBeInTheDocument()
  })

  it('una sala válida sin asignaciones muestra estado vacío', async () => {
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '2',
      permitidas: [],
    })

    render(<TableroPage />)

    expect(await screen.findByText('No hay consultorios con turnos activos')).toBeInTheDocument()
    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
  })
})

describe('TableroPage · tema claro/oscuro', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  it('por defecto usa tema claro (sin clase dark)', async () => {
    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(container.firstChild).not.toHaveClass('dark')
  })

  it('una preferencia dark guardada aplica el wrapper dark', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')

    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(container.firstChild).toHaveClass('dark')
  })

  it('el botón alterna dark y de nuevo claro, persistiendo', async () => {
    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    await userEvent.click(screen.getByRole('button', { name: 'Modo oscuro' }))
    expect(container.firstChild).toHaveClass('dark')
    expect(globalThis.localStorage.getItem('hro-tablero-tema')).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Modo claro' }))
    expect(container.firstChild).not.toHaveClass('dark')
    expect(globalThis.localStorage.getItem('hro-tablero-tema')).toBe('light')
  })

  it('mantiene la tabla y las asignaciones visibles en tema oscuro', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')

    render(<TableroPage />)

    expect(await screen.findByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasTabla()).toHaveLength(4)
  })

  it('el tema no altera la configuración de sala', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)

    expect(await screen.findByTestId('fila-turno-1')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-2')).not.toBeInTheDocument()
  })

  it('mantiene TableroVacio y TableroError en tema oscuro', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')
    obtenerEstadoInicialMock.mockResolvedValueOnce([])

    const { unmount } = render(<TableroPage />)
    expect(await screen.findByText('No hay consultorios con turnos activos')).toBeInTheDocument()
    unmount()

    obtenerEstadoInicialMock.mockRejectedValueOnce(new Error('fallo'))
    render(<TableroPage />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('un fullscreenchange no altera el tema', async () => {
    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    await userEvent.click(screen.getByRole('button', { name: 'Modo oscuro' }))

    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'))
    })

    expect(container.firstChild).toHaveClass('dark')
  })
})

describe('TableroPage · simulador de llamado (DEV + MOCK)', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
    estaEnModoMockMock.mockReturnValue(true)
    vi.stubEnv('VITE_TABLERO_SIMULADOR_LLAMADO', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('no muestra el simulador cuando está deshabilitado', async () => {
    vi.unstubAllEnvs()
    estaEnModoMockMock.mockReturnValue(false)

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(screen.queryByRole('button', { name: 'Simular llamado' })).not.toBeInTheDocument()
  })

  it('Simular llamado produce LlamadoGrande con la primera asignación visible', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#001')
    expect(screen.queryByTestId('tablero-tabla')).not.toBeInTheDocument()
  })

  it('con voz activa, Simular llamado anuncia exactamente 2 veces y vuelve a tabla', async () => {
    const anuncios = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => anuncios.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
    expect(construirSecuenciaPacienteMock).toHaveBeenLastCalledWith({
      numero: 1,
      destino: '6A',
      accion: 'pasara_a',
    })

    await act(async () => anuncios[0]())
    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(2)

    await act(async () => anuncios[1]())
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('Re-llamar conserva el turno y aumenta el intento', async () => {
    const anuncios = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => anuncios.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))
    await act(async () => anuncios[0]())
    await act(async () => anuncios[1]())
    expect(construirSecuenciaPacienteMock.mock.calls.at(-1)[0]).toMatchObject({
      numero: 1,
      destino: '6A',
      accion: 'pasara_a',
    })

    construirSecuenciaPacienteMock.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Re-llamar' }))

    expect(construirSecuenciaPacienteMock).toHaveBeenCalledTimes(1)
    expect(construirSecuenciaPacienteMock.mock.calls.at(-1)[0]).toMatchObject({
      numero: 1,
      destino: '6A',
      accion: 'pasara_a',
    })
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
  })

  it('un nuevo Simular llamado avanza al siguiente turno (turno 2 / intento 1)', async () => {
    const anuncios = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => anuncios.push(resolve)),
    )

    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))
    await act(async () => anuncios[0]())
    await act(async () => anuncios[1]())
    construirSecuenciaPacienteMock.mockClear()

    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))

    expect(construirSecuenciaPacienteMock.mock.calls.at(-1)[0]).toMatchObject({
      numero: 2,
      destino: '6A',
      accion: 'pasara_a',
    })
  })

  it('el WebSocket normal sigue funcionando con el simulador habilitado', async () => {
    // En modo mock no hay handlers WS; se valida que el simulador no rompe el
    // pipeline al no existir cliente. La cobertura WS real está en otros bloques.
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(screen.getByRole('button', { name: 'Simular llamado' })).toBeInTheDocument()
  })
})

describe('TableroPage · últimos llamados en columna derecha', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  function capturarTerminaciones() {
    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )
    return terminaciones
  }

  function mensajeLlamado(overrides) {
    return mensaje({
      tipoEvento: 'LLAMADO',
      intentosLlamado: 1,
      ...overrides,
    })
  }

  async function completar(terminaciones, indices) {
    for (const indice of indices) {
      await act(async () => {
        terminaciones[indice]()
      })
    }
  }

  function filasRecientes() {
    return screen.queryAllByTestId(/^ultimo-llamado-/)
  }

  it('sin llamados recientes mantiene las dos secciones normales', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('tablero-tabla-cuerpo')).toHaveLength(2)
  })

  it('durante LlamadoGrande no muestra tabla ni últimos llamados', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.queryByTestId('tablero-tabla')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
  })

  it('al completar un LLAMADO aparece en Últimos llamados', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])

    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(screen.getByTestId('ultimo-llamado-1-5')).toHaveTextContent('#005')
    expect(screen.getByTestId('ultimo-llamado-1-5')).toHaveTextContent('103')
  })

  it('ordena los recientes con el más reciente primero', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
      )
    })
    await completar(terminaciones, [2, 3])

    expect(filasRecientes().map((fila) => fila.getAttribute('data-testid'))).toEqual([
      'ultimo-llamado-2-14',
      'ultimo-llamado-1-5',
    ])
  })

  it('limita a 5 los últimos llamados', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    for (let i = 1; i <= 6; i += 1) {
      act(() => {
        handlers.onMensaje(
          mensajeLlamado({
            asignacionDiariaEspacioId: i,
            turnoActual: 100 + i,
            espacioNumero: String(200 + i),
          }),
        )
      })
      const base = (i - 1) * 2
      await completar(terminaciones, [base, base + 1])
    }

    const filas = filasRecientes()
    expect(filas).toHaveLength(5)
    expect(filas[0]).toHaveAttribute('data-testid', 'ultimo-llamado-6-106')
    expect(filas[4]).toHaveAttribute('data-testid', 'ultimo-llamado-2-102')
  })

  it('FIFO A/B/C: durante los llamados no hay recientes y al final quedan los tres', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
      )
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 3, turnoActual: 21, espacioNumero: '107' }),
      )
    })

    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#005')
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()

    await completar(terminaciones, [0, 1])
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#014')
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()

    await completar(terminaciones, [2, 3])
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#021')
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()

    await completar(terminaciones, [4, 5])
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
    expect(filasRecientes().map((fila) => fila.getAttribute('data-testid'))).toEqual([
      'ultimo-llamado-3-21',
      'ultimo-llamado-2-14',
      'ultimo-llamado-1-5',
    ])
  })

  it('expira exactamente a los 120000 ms', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))
    try {
      render(<TableroPage />)
      await act(async () => {})
      expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(119999))
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(1))
      expect(screen.queryByTestId('ultimo-llamado-1-5')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('expira cada llamado de forma independiente', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))
    try {
      render(<TableroPage />)
      await act(async () => {})

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))

      act(() => vi.advanceTimersByTime(10000))
      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))

      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-2-14')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(103999))
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-2-14')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(1))
      expect(screen.queryByTestId('ultimo-llamado-1-5')).not.toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-2-14')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(16000))
      expect(screen.queryByTestId('ultimo-llamado-2-14')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('al expirar el último vuelve la columna derecha normal', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))
    try {
      render(<TableroPage />)
      await act(async () => {})

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))

      expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
      expect(screen.queryByTestId('fila-turno-4')).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(120000))

      expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
      expect(screen.getByTestId('fila-turno-3')).toBeInTheDocument()
      expect(screen.getByTestId('fila-turno-4')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('un re-llamado no duplica, sube y reinicia el tiempo', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))
    try {
      render(<TableroPage />)
      await act(async () => {})

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000)) // A completa t=+6s

      act(() => vi.advanceTimersByTime(16000)) // t=+22s
      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000)) // B completa t=+22s

      expect(filasRecientes().map((fila) => fila.getAttribute('data-testid'))).toEqual([
        'ultimo-llamado-2-14',
        'ultimo-llamado-1-5',
      ])

      act(() => vi.advanceTimersByTime(16000)) // t=+38s
      act(() => {
        handlers.onMensaje(
          mensajeLlamado({
            asignacionDiariaEspacioId: 1,
            turnoActual: 5,
            espacioNumero: '103',
            intentosLlamado: 2,
          }),
        )
      })
      act(() => vi.advanceTimersByTime(6000)) // re-llamado A completa t=+38s

      expect(filasRecientes()).toHaveLength(2)
      expect(filasRecientes()[0]).toHaveAttribute('data-testid', 'ultimo-llamado-1-5')

      // A reinició su ventana: a t=+148s B ya expiró (t=+142s) y A sigue (vence t=+158s).
      act(() => vi.advanceTimersByTime(110000))
      expect(screen.queryByTestId('ultimo-llamado-2-14')).not.toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('permite dos turnos distintos de la misma asignación', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 6, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [2, 3])

    expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
    expect(screen.getByTestId('ultimo-llamado-1-6')).toBeInTheDocument()
    expect(filasRecientes()).toHaveLength(2)
  })

  it('un duplicado WS no crea una entrada adicional', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    const evento = () =>
      mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' })

    act(() => handlers.onMensaje(evento()))
    await completar(terminaciones, [0, 1])

    construirSecuenciaPacienteMock.mockClear()
    act(() => handlers.onMensaje(evento()))

    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
    expect(filasRecientes()).toHaveLength(1)
  })

  it('un ACTUALIZACION no afecta los recientes', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])
    expect(filasRecientes()).toHaveLength(1)

    act(() => {
      handlers.onMensaje(
        mensaje({
          asignacionDiariaEspacioId: 2,
          turnoActual: 8,
          turnoSiguiente: 9,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    })

    expect(filasRecientes()).toHaveLength(1)
    expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
  })

  it('un LLAMADO fuera de sala no aparece', async () => {
    capturarTerminaciones()
    resolverConfiguracionSalaMock.mockResolvedValueOnce({
      modo: 'sala',
      sala: '1',
      permitidas: [1],
    })

    render(<TableroPage />)
    await screen.findByTestId('fila-turno-1')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
      )
    })

    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    expect(construirSecuenciaPacienteMock).not.toHaveBeenCalled()
  })

  it('una reconexión/error de conexión conserva los recientes', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])
    expect(filasRecientes()).toHaveLength(1)

    act(() => handlers.onError('fallo'))
    act(() => handlers.onDisconnected())

    expect(filasRecientes()).toHaveLength(1)
    expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
  })

  it('debeLimpiarRecientes limpia solo ante un cambio real de sala', () => {
    expect(debeLimpiarRecientes({ salaAnterior: undefined, salaNueva: '1' })).toBe(false)
    expect(debeLimpiarRecientes({ salaAnterior: '1', salaNueva: '1' })).toBe(false)
    expect(debeLimpiarRecientes({ salaAnterior: null, salaNueva: null })).toBe(false)
    expect(debeLimpiarRecientes({ salaAnterior: '1', salaNueva: '2' })).toBe(true)
    expect(debeLimpiarRecientes({ salaAnterior: '1', salaNueva: null })).toBe(true)
  })

  it('no muestra datos personales en los recientes', async () => {
    const terminaciones = capturarTerminaciones()
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({
          asignacionDiariaEspacioId: 1,
          turnoActual: 5,
          espacioNumero: '103',
          nombrePaciente: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
        }),
      )
    })
    await completar(terminaciones, [0, 1])

    expect(screen.getByTestId('ultimo-llamado-1-5')).toHaveTextContent('#005')
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
  })

  it('mantiene los recientes en tema oscuro', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')
    const terminaciones = capturarTerminaciones()
    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])

    expect(container.firstChild).toHaveClass('dark')
    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
  })

  it('el simulador DEV deja el llamado en Últimos llamados', async () => {
    vi.stubEnv('VITE_TABLERO_SIMULADOR_LLAMADO', 'true')
    try {
      configurarAntesDeCada({ capturarHandlers: true })
      estaEnModoMockMock.mockReturnValue(true)
      const terminaciones = capturarTerminaciones()

      render(<TableroPage />)
      await screen.findByTestId('tablero-tabla')
      await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
      await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))

      await completar(terminaciones, [0, 1])

      expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-1-1')).toHaveTextContent('#001')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('TableroPage · limpieza manual de últimos llamados', () => {
  beforeEach(() => {
    configurarAntesDeCada({ capturarHandlers: true })
  })

  function capturarTerminaciones() {
    const terminaciones = []
    reproducirSecuenciaMock.mockImplementation(
      () => new Promise((resolve) => terminaciones.push(resolve)),
    )
    return terminaciones
  }

  function mensajeLlamado(overrides) {
    return mensaje({
      tipoEvento: 'LLAMADO',
      intentosLlamado: 1,
      ...overrides,
    })
  }

  async function completar(terminaciones, indices) {
    for (const indice of indices) {
      await act(async () => {
        terminaciones[indice]()
      })
    }
  }

  function botonLimpiar() {
    return screen.queryByRole('button', { name: /limpiar últimos/i })
  }

  async function prepararConReciente(terminaciones) {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))
    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])
  }

  it('sin recientes no muestra el botón "Limpiar últimos"', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    expect(botonLimpiar()).not.toBeInTheDocument()
  })

  it('con un reciente completado aparece el botón', async () => {
    const terminaciones = capturarTerminaciones()
    await prepararConReciente(terminaciones)

    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(botonLimpiar()).toBeInTheDocument()
  })

  it('limpiar manualmente restaura la tabla normal y conserva la izquierda', async () => {
    const terminaciones = capturarTerminaciones()
    await prepararConReciente(terminaciones)

    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-4')).not.toBeInTheDocument()

    await userEvent.click(botonLimpiar())

    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    expect(botonLimpiar()).not.toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-1')).toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-2')).toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-3')).toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-4')).toBeInTheDocument()
    expect(screen.getAllByTestId('tablero-tabla-cuerpo')).toHaveLength(2)
  })

  it('limpiar no vuelve a cargar asignaciones', async () => {
    const terminaciones = capturarTerminaciones()
    await prepararConReciente(terminaciones)

    expect(obtenerEstadoInicialMock).toHaveBeenCalledTimes(1)

    await userEvent.click(botonLimpiar())

    expect(obtenerEstadoInicialMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('fila-turno-1')).toBeInTheDocument()
  })

  it('tras limpiar, un nuevo LLAMADO vuelve a crear Últimos llamados', async () => {
    const terminaciones = capturarTerminaciones()
    await prepararConReciente(terminaciones)

    await userEvent.click(botonLimpiar())
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
      )
    })
    await completar(terminaciones, [2, 3])

    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(screen.getByTestId('ultimo-llamado-2-14')).toHaveTextContent('#014')
  })

  it('durante LlamadoGrande el botón no es visible', async () => {
    render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(botonLimpiar()).not.toBeInTheDocument()
  })

  it('el timer automático de 2 minutos sigue funcionando tras limpiar', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))
    try {
      render(<TableroPage />)
      await act(async () => {})

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()

      act(() => botonLimpiar().click())
      expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()

      act(() => {
        handlers.onMensaje(
          mensajeLlamado({ asignacionDiariaEspacioId: 2, turnoActual: 14, espacioNumero: '101' }),
        )
      })
      act(() => vi.advanceTimersByTime(6000))
      expect(screen.getByTestId('ultimo-llamado-2-14')).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(120000))
      expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('el control es visible en tema oscuro', async () => {
    globalThis.localStorage.setItem('hro-tablero-tema', 'dark')
    const terminaciones = capturarTerminaciones()
    const { container } = render(<TableroPage />)
    await screen.findByTestId('tablero-tabla')
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      handlers.onMensaje(
        mensajeLlamado({ asignacionDiariaEspacioId: 1, turnoActual: 5, espacioNumero: '103' }),
      )
    })
    await completar(terminaciones, [0, 1])

    expect(container.firstChild).toHaveClass('dark')
    expect(botonLimpiar()).toBeInTheDocument()
  })
})
