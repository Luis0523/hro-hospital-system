import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  anunciarTurnoMock,
  crearClienteTableroMock,
  estaDisponibleVozMock,
  estaEnModoMockMock,
  hablarMock,
  obtenerEstadoInicialMock,
  resolverConfiguracionSalaMock,
} = vi.hoisted(() => ({
  anunciarTurnoMock: vi.fn(),
  crearClienteTableroMock: vi.fn(),
  estaDisponibleVozMock: vi.fn(),
  estaEnModoMockMock: vi.fn(),
  hablarMock: vi.fn(),
  obtenerEstadoInicialMock: vi.fn(),
  resolverConfiguracionSalaMock: vi.fn(),
}))

vi.mock('../api/tableroSocket', () => ({
  crearClienteTablero: crearClienteTableroMock,
}))

vi.mock('../api/configuracionSala', () => ({
  resolverConfiguracionSala: resolverConfiguracionSalaMock,
}))

vi.mock('../api/comunicacionVoz', () => ({
  estaDisponibleVoz: estaDisponibleVozMock,
  hablar: hablarMock,
  anunciarTurno: anunciarTurnoMock,
  FRASE_ACTIVACION: 'Comunicación por voz activada.',
}))

vi.mock('../api/tableroApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    estaEnModoMock: estaEnModoMockMock,
    obtenerEstadoInicialTablero: obtenerEstadoInicialMock,
  }
})

import TablaTurnos, { dividirEnDos } from '../components/TablaTurnos.jsx'
import TableroPage from '../pages/TableroPage.jsx'
import {
  filtrarAsignaciones,
  mapearAsignacionDiaria,
  normalizarEstadoTablero,
  normalizarListaAsignaciones,
  ordenarAsignaciones,
} from '../api/tableroApi'
import {
  generarAsignacionesPrueba,
  generarEventoPrueba,
  generarIdsSala,
  generarJornadaPrueba,
} from './generadoresTablero'

function conteosSeccion() {
  return screen
    .getAllByTestId('tablero-tabla-cuerpo')
    .map((cuerpo) => within(cuerpo).getAllByRole('row').length)
}

function idsUnicosEnOrden(ids) {
  return ids.filter((id, indice) => indice === 0 || id !== ids[indice - 1])
}

let handlersRef

function configurarPagina({ inicial = [], permitidas = null } = {}) {
  vi.clearAllMocks()
  handlersRef = null
  estaEnModoMockMock.mockReturnValue(false)
  estaDisponibleVozMock.mockReturnValue(true)
  hablarMock.mockReturnValue(true)
  anunciarTurnoMock.mockReturnValue('mensaje')
  resolverConfiguracionSalaMock.mockResolvedValue({ modo: 'fallback', sala: null, permitidas })
  obtenerEstadoInicialMock.mockImplementation(() => Promise.resolve(inicial))
  crearClienteTableroMock.mockImplementation((opciones) => {
    handlersRef = opciones
    return { activar: vi.fn(), desactivar: vi.fn() }
  })
}

async function abrirTablero({ inicial, permitidas = null } = {}) {
  configurarPagina({ inicial, permitidas })
  const utils = render(<TableroPage />)
  await screen.findByTestId('tablero-tabla')
  return utils
}

function drenarLlamados(anuncios) {
  let indice = 0
  while (indice < anuncios.length) {
    const actual = anuncios[indice]
    act(() => actual.onEnd())
    indice += 1
  }
}

describe('volumen · estructura de asignaciones (TablaTurnos)', () => {
  it.each([
    [10, [5, 5]],
    [25, [13, 12]],
    [50, [25, 25]],
    [100, [50, 50]],
  ])('con %i asignaciones reparte %j sin duplicados', (cantidad, esperado) => {
    const asignaciones = generarAsignacionesPrueba(cantidad)
    render(<TablaTurnos asignaciones={asignaciones} />)

    expect(conteosSeccion()).toEqual(esperado)

    const ids = screen
      .getAllByTestId(/^fila-turno-/)
      .map((fila) => fila.getAttribute('data-testid'))
    expect(new Set(ids).size).toBe(cantidad)
  })

  it('ordena el volumen por consultorio y divide 101-105 / 106-110', () => {
    const lista = ordenarAsignaciones(generarAsignacionesPrueba(10))

    expect(lista.map((a) => a.espacioNumero)).toEqual([
      '101',
      '102',
      '103',
      '104',
      '105',
      '106',
      '107',
      '108',
      '109',
      '110',
    ])

    const [izquierda, derecha] = dividirEnDos(lista)
    expect(izquierda.map((a) => a.espacioNumero)).toEqual(['101', '102', '103', '104', '105'])
    expect(derecha.map((a) => a.espacioNumero)).toEqual(['106', '107', '108', '109', '110'])
  })
})

describe('volumen · snapshot masivo y privacidad', () => {
  function dtoRest(n) {
    return {
      id: n,
      fecha: '2026-09-20',
      espacioFisicoId: `uuid-${n}`,
      espacioNumero: String(100 + n),
      nivel: 1 + (n % 3),
      subespecialidadId: n,
      subespecialidadNombre: `Clínica ${String(n).padStart(3, '0')}`,
      especialidadId: 1,
      especialidadNombre: 'General',
    }
  }

  it.each([50, 100])('normaliza y filtra %i DTOs del snapshot', (cantidad) => {
    const dtos = generarIdsSala(cantidad).map(dtoRest)

    const normalizadas = filtrarAsignaciones(
      normalizarListaAsignaciones(dtos.map(mapearAsignacionDiaria)),
      null,
    )

    expect(normalizadas).toHaveLength(cantidad)
    expect(normalizadas.every((a) => a.turnoActual === null)).toBe(true)
    expect(normalizadas.every((a) => a.tipoEvento === null)).toBe(true)
  })

  it('descarta campos personales en volumen', () => {
    const dtos = generarIdsSala(50).map((n) => ({
      ...dtoRest(n),
      nombrePaciente: 'Ficticio',
      dpi: '0000000000000',
      expediente: 'EXP-000',
      telefono: '0000-0000',
    }))

    const normalizadas = normalizarListaAsignaciones(dtos.map(mapearAsignacionDiaria))

    expect(
      normalizadas.some(
        (a) => 'nombrePaciente' in a || 'dpi' in a || 'expediente' in a || 'telefono' in a,
      ),
    ).toBe(false)
  })
})

describe('volumen · 4 TVs (80 asignaciones)', () => {
  const asignaciones = generarAsignacionesPrueba(80)
  const salas = [
    generarIdsSala(20, { desde: 1 }),
    generarIdsSala(20, { desde: 21 }),
    generarIdsSala(20, { desde: 41 }),
    generarIdsSala(20, { desde: 61 }),
  ]

  it.each([0, 1, 2, 3])('TV %i ve exactamente sus 20 asignaciones', (indice) => {
    const permitidas = salas[indice]
    const visibles = filtrarAsignaciones(asignaciones, permitidas)

    expect(visibles).toHaveLength(20)
    expect(visibles.every((a) => permitidas.includes(a.asignacionDiariaEspacioId))).toBe(true)

    const permitidasAjenas = salas.filter((_, i) => i !== indice).flat()
    expect(visibles.some((a) => permitidasAjenas.includes(a.asignacionDiariaEspacioId))).toBe(false)
  })
})

describe('volumen · tema claro/oscuro estructural', () => {
  it.each([10, 50, 100])('renderiza %i filas dentro de un wrapper dark', (cantidad) => {
    render(
      <div className="dark">
        <TablaTurnos asignaciones={generarAsignacionesPrueba(cantidad)} />
      </div>,
    )

    const total = conteosSeccion().reduce((suma, n) => suma + n, 0)
    expect(total).toBe(cantidad)
  })
})

describe('volumen · errores de React', () => {
  it('no emite errores de keys con 100 filas', () => {
    const errores = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errores.push(args.join(' '))
    })

    try {
      render(<TablaTurnos asignaciones={generarAsignacionesPrueba(100)} />)
      const claves = errores.filter((mensaje) =>
        /duplicate key|each child|unique "key"/i.test(mensaje),
      )
      expect(claves).toEqual([])
    } finally {
      spy.mockRestore()
    }
  })
})

describe('volumen · performance informativo', () => {
  it('mide render 10/25/50/100 (sin umbral)', () => {
    const medidas = {}
    for (const cantidad of [10, 25, 50, 100]) {
      const inicio = performance.now()
      const { unmount } = render(<TablaTurnos asignaciones={generarAsignacionesPrueba(cantidad)} />)
      medidas[cantidad] = Math.round(performance.now() - inicio)
      unmount()
    }

    console.info('[tablero][perf] render ms:', medidas)
    expect(Object.values(medidas).every((valor) => Number.isFinite(valor))).toBe(true)
  })
})

describe('volumen · TableroPage · llamados y eventos', () => {
  beforeEach(() => {
    configurarPagina()
  })

  it('FIFO con 6 clínicas conserva el orden', async () => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(6) })
    const anuncios = []
    anunciarTurnoMock.mockImplementation((asignacion, opciones) => {
      anuncios.push({ id: asignacion.asignacionDiariaEspacioId, onEnd: opciones.onEnd })
      return 'mensaje'
    })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      ;[1, 2, 3, 4, 5, 6].forEach((id, indice) => {
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: id,
            turnoActual: 8 + indice,
            intentosLlamado: 1,
            tipoEvento: 'LLAMADO',
          }),
        )
      })
    })

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    drenarLlamados(anuncios)

    expect(idsUnicosEnOrden(anuncios.map((a) => a.id))).toEqual([1, 2, 3, 4, 5, 6])
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it.each([10, 25, 50])('FIFO con %i llamados procesa en orden y termina', async (cantidad) => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(cantidad) })
    const anuncios = []
    anunciarTurnoMock.mockImplementation((asignacion, opciones) => {
      anuncios.push({ id: asignacion.asignacionDiariaEspacioId, onEnd: opciones.onEnd })
      return 'mensaje'
    })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      for (let n = 1; n <= cantidad; n += 1) {
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: n,
            turnoActual: n,
            intentosLlamado: 1,
            tipoEvento: 'LLAMADO',
          }),
        )
      }
    })

    drenarLlamados(anuncios)

    expect(idsUnicosEnOrden(anuncios.map((a) => a.id))).toEqual(
      generarIdsSala(cantidad, { desde: 1 }),
    )
    expect(anuncios).toHaveLength(cantidad * 2)
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('10 duplicados de la misma firma generan un solo llamado', async () => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(1) })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      for (let i = 0; i < 10; i += 1) {
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            intentosLlamado: 2,
            tipoEvento: 'LLAMADO',
          }),
        )
      }
    })

    expect(anunciarTurnoMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
  })

  it('re-llamado i1/i2/i3 anuncia los tres y no repite el i3', async () => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(1) })
    const anuncios = []
    anunciarTurnoMock.mockImplementation((asignacion, opciones) => {
      anuncios.push({ id: asignacion.asignacionDiariaEspacioId, onEnd: opciones.onEnd })
      return 'mensaje'
    })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      ;[1, 2, 3].forEach((intento) => {
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: 1,
            turnoActual: 8,
            intentosLlamado: intento,
            tipoEvento: 'LLAMADO',
          }),
        )
      })
    })

    drenarLlamados(anuncios)
    expect(anuncios).toHaveLength(6)
    expect(idsUnicosEnOrden(anuncios.map((a) => a.id))).toEqual([1])

    anunciarTurnoMock.mockClear()
    act(() => {
      handlersRef.onMensaje(
        generarEventoPrueba({
          asignacionDiariaEspacioId: 1,
          turnoActual: 8,
          intentosLlamado: 3,
          tipoEvento: 'LLAMADO',
        }),
      )
    })

    expect(anunciarTurnoMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('jornada de 700 eventos entre 20 asignaciones no rompe el estado', async () => {
    const asignaciones = generarAsignacionesPrueba(20)
    const jornada = generarJornadaPrueba({ asignaciones, totalEventos: 700 })
    await abrirTablero({ inicial: asignaciones })
    anunciarTurnoMock.mockImplementation((asignacion, opciones) => {
      opciones.onEnd()
      return 'mensaje'
    })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      jornada.forEach((evento) => handlersRef.onMensaje(evento))
    })

    const filas = screen.getAllByTestId(/^fila-turno-/)
    const ids = filas.map((fila) => fila.getAttribute('data-testid'))
    expect(filas).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    expect(screen.getByTestId('tablero-tabla')).toBeInTheDocument()
  })

  it('1000 eventos WS: solo entran las asignaciones de la sala', async () => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(3), permitidas: [1, 2, 3] })

    act(() => {
      for (let i = 0; i < 1000; i += 1) {
        const id = 1 + (i % 50)
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: id,
            turnoActual: 1 + (i % 30),
            intentosLlamado: null,
            tipoEvento: 'ACTUALIZACION',
          }),
        )
      }
    })

    const filas = screen.getAllByTestId(/^fila-turno-/)
    const ids = new Set(filas.map((fila) => fila.getAttribute('data-testid')))
    expect(filas).toHaveLength(3)
    expect(ids).toEqual(new Set(['fila-turno-1', 'fila-turno-2', 'fila-turno-3']))
    expect(screen.queryByTestId('fila-turno-4')).not.toBeInTheDocument()
  })

  it('eventos LLAMADO fuera de sala no generan llamado', async () => {
    await abrirTablero({ inicial: generarAsignacionesPrueba(2), permitidas: [1, 2] })
    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    act(() => {
      for (let i = 0; i < 20; i += 1) {
        handlersRef.onMensaje(
          generarEventoPrueba({
            asignacionDiariaEspacioId: 10 + i,
            turnoActual: 8,
            intentosLlamado: 1,
            tipoEvento: 'LLAMADO',
          }),
        )
      }
    })

    expect(anunciarTurnoMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('llamado-grande')).not.toBeInTheDocument()
  })
})

describe('volumen · normalización directa', () => {
  it('normalizarEstadoTablero sigue descartando datos personales', () => {
    const normalizado = normalizarEstadoTablero({
      asignacionDiariaEspacioId: 1,
      espacioNumero: '101',
      nombrePaciente: 'Ficticio',
      dpi: '0000000000000',
    })

    expect(normalizado).not.toHaveProperty('nombrePaciente')
    expect(normalizado).not.toHaveProperty('dpi')
  })
})
