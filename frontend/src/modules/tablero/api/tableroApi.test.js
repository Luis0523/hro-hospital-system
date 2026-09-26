import { describe, expect, it, vi } from 'vitest'
import { hoyIso } from '@/shared/utils/fecha'
import {
  CAMPOS_PUBLICOS,
  estaEnModoMock,
  estaPermitida,
  filtrarAsignaciones,
  fusionarAsignacion,
  mapearAsignacionDiaria,
  normalizarEstadoTablero,
  normalizarListaAsignaciones,
  obtenerEstadoInicialTablero,
  ordenarAsignaciones,
  parsearAsignacionesFiltradas,
} from './tableroApi'

const PAYLOAD_CON_PRIVADOS = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
  ultimaActualizacion: '2026-09-20T08:05:32-06:00',
  nombrePaciente: 'Juan Perez',
  pacienteNombreCompleto: 'Juan Perez',
  pacienteNombre: 'Juan Perez',
  nombre: 'Juan',
  apellido: 'Perez',
  dpi: '1234567890101',
  expediente: 'HRO-123',
  numeroExpediente: 'HRO-123',
  telefono: '55555555',
  direccion: 'Zona 1',
  correo: 'juan@example.com',
  fechaNacimiento: '1990-01-01',
}

describe('tableroApi · normalización y privacidad', () => {
  it('construye un objeto nuevo con únicamente los campos públicos', () => {
    const normalizado = normalizarEstadoTablero(PAYLOAD_CON_PRIVADOS)

    expect(Object.keys(normalizado).sort()).toEqual([...CAMPOS_PUBLICOS].sort())
  })

  it('descarta cualquier dato personal aunque venga en el payload', () => {
    const normalizado = normalizarEstadoTablero(PAYLOAD_CON_PRIVADOS)
    const serializado = JSON.stringify(normalizado)

    expect(serializado).not.toContain('Juan')
    expect(serializado).not.toContain('Perez')
    expect(serializado).not.toContain('1234567890101')
    expect(serializado).not.toContain('HRO-123')
    expect(serializado).not.toContain('55555555')
    expect(serializado).not.toContain('juan@example.com')
    expect(normalizado).toEqual({
      asignacionDiariaEspacioId: 1,
      espacioNumero: '201',
      nivel: 2,
      subespecialidadNombre: 'Pediatría General',
      turnoActual: 7,
      turnoSiguiente: 8,
      ultimaActualizacion: '2026-09-20T14:05:32.000Z',
      intentosLlamado: null,
      tipoEvento: null,
    })
  })

  it('normaliza intentosLlamado y tipoEvento válidos', () => {
    const normalizado = normalizarEstadoTablero({
      asignacionDiariaEspacioId: 10,
      turnoActual: 8,
      intentosLlamado: 2,
      tipoEvento: 'LLAMADO',
    })

    expect(normalizado.intentosLlamado).toBe(2)
    expect(normalizado.tipoEvento).toBe('LLAMADO')
  })

  it('descarta intentosLlamado inválidos y tipoEvento desconocido', () => {
    const normalizado = normalizarEstadoTablero({
      asignacionDiariaEspacioId: 10,
      intentosLlamado: -1,
      tipoEvento: 'DESCONOCIDO',
    })

    expect(normalizado.intentosLlamado).toBeNull()
    expect(normalizado.tipoEvento).toBeNull()
  })

  it('acepta intentosLlamado 0 como válido', () => {
    const normalizado = normalizarEstadoTablero({
      asignacionDiariaEspacioId: 10,
      intentosLlamado: 0,
      tipoEvento: 'ACTUALIZACION',
    })

    expect(normalizado.intentosLlamado).toBe(0)
    expect(normalizado.tipoEvento).toBe('ACTUALIZACION')
  })

  it('ignora payloads sin identificador de asignación', () => {
    expect(normalizarEstadoTablero(null)).toBeNull()
    expect(normalizarEstadoTablero({ espacioNumero: '201' })).toBeNull()
  })

  it('trata turnos nulos o cero como ausencia de turno', () => {
    const normalizado = normalizarEstadoTablero({
      asignacionDiariaEspacioId: 4,
      espacioNumero: '302',
      turnoActual: 0,
      turnoSiguiente: null,
    })

    expect(normalizado.turnoActual).toBeNull()
    expect(normalizado.turnoSiguiente).toBeNull()
  })

  it('normaliza listas y descarta entradas inválidas', () => {
    const lista = normalizarListaAsignaciones([
      PAYLOAD_CON_PRIVADOS,
      { sinId: true },
      { asignacionDiariaEspacioId: 2, espacioNumero: '202', turnoActual: 1 },
    ])

    expect(lista).toHaveLength(2)
    expect(lista.map((a) => a.asignacionDiariaEspacioId)).toEqual([1, 2])
    expect(lista[0]).not.toHaveProperty('dpi')
  })
})

describe('tableroApi · orden y fusión', () => {
  it('ordena por nivel y luego por número de consultorio', () => {
    const orden = ordenarAsignaciones([
      { asignacionDiariaEspacioId: 4, nivel: 3, espacioNumero: '302' },
      { asignacionDiariaEspacioId: 2, nivel: 2, espacioNumero: '202' },
      { asignacionDiariaEspacioId: 3, nivel: 3, espacioNumero: '301' },
      { asignacionDiariaEspacioId: 1, nivel: 2, espacioNumero: '201' },
    ])

    expect(orden.map((a) => a.asignacionDiariaEspacioId)).toEqual([1, 2, 3, 4])
  })

  it('actualiza solo la asignación que coincide por id', () => {
    const actuales = normalizarListaAsignaciones([
      { asignacionDiariaEspacioId: 1, espacioNumero: '201', turnoActual: 7, turnoSiguiente: 8 },
      { asignacionDiariaEspacioId: 2, espacioNumero: '202', turnoActual: 14, turnoSiguiente: 15 },
    ])

    const fusionadas = fusionarAsignacion(actuales, {
      asignacionDiariaEspacioId: 1,
      espacioNumero: '201',
      turnoActual: 9,
      turnoSiguiente: 10,
    })

    expect(fusionadas).toHaveLength(2)
    expect(fusionadas.find((a) => a.asignacionDiariaEspacioId === 1).turnoActual).toBe(9)
    expect(fusionadas.find((a) => a.asignacionDiariaEspacioId === 2).turnoActual).toBe(14)
  })

  it('agrega una asignación nueva sin duplicar las existentes', () => {
    const actuales = normalizarListaAsignaciones([
      { asignacionDiariaEspacioId: 1, espacioNumero: '201', turnoActual: 7 },
    ])

    const fusionadas = fusionarAsignacion(actuales, {
      asignacionDiariaEspacioId: 5,
      espacioNumero: '305',
      turnoActual: 1,
    })

    expect(fusionadas).toHaveLength(2)
    expect(fusionadas.map((a) => a.asignacionDiariaEspacioId)).toEqual([1, 5])
  })
})

describe('tableroApi · estado inicial', () => {
  it('devuelve el estado inicial mock en modo test', async () => {
    const estado = await obtenerEstadoInicialTablero({ permitidas: [] })

    expect(estado.length).toBeGreaterThanOrEqual(4)
    expect(estado[0]).toHaveProperty('asignacionDiariaEspacioId')
    expect(estado.every((a) => !('nombrePaciente' in a))).toBe(true)
  })
})

describe('tableroApi · modo mock', () => {
  it('activa el mock explícitamente en test o con VITE_USE_MOCK=true', () => {
    expect(estaEnModoMock({ MODE: 'test' })).toBe(true)
    expect(estaEnModoMock({ MODE: 'test', VITE_USE_MOCK: 'false' })).toBe(true)
    expect(estaEnModoMock({ MODE: 'development', VITE_USE_MOCK: 'true' })).toBe(true)
    expect(estaEnModoMock({ MODE: 'development', VITE_USE_MOCK: 'false' })).toBe(false)
  })

  it('no usa mock por defecto cuando la variable no existe', () => {
    expect(estaEnModoMock({ MODE: 'development' })).toBe(false)
    expect(estaEnModoMock({ MODE: 'production' })).toBe(false)
    expect(estaEnModoMock({ MODE: 'development', VITE_USE_MOCK: undefined })).toBe(false)
    expect(estaEnModoMock({ MODE: 'development', VITE_USE_MOCK: '' })).toBe(false)
  })
})

describe('tableroApi · filtro de asignaciones', () => {
  it('parsea IDs, elimina duplicados e ignora valores inválidos', () => {
    expect(parsearAsignacionesFiltradas('1, 2,2,abc,5')).toEqual([1, 2, 5])
    expect(parsearAsignacionesFiltradas('')).toEqual([])
    expect(parsearAsignacionesFiltradas(null)).toEqual([])
    expect(parsearAsignacionesFiltradas('0,-1,3.5,')).toEqual([])
  })

  it('permite todo cuando la lista de permitidas está vacía', () => {
    expect(estaPermitida(99, [])).toBe(true)
    expect(estaPermitida(2, [1, 2])).toBe(true)
    expect(estaPermitida(3, [1, 2])).toBe(false)
  })

  it('filtra el estado inicial dejando solo las asignaciones permitidas', async () => {
    const estado = await obtenerEstadoInicialTablero({ permitidas: [1, 2] })

    expect(estado.map((a) => a.asignacionDiariaEspacioId)).toEqual([1, 2])
  })

  it('muestra todas las asignaciones cuando no hay filtro configurado', async () => {
    const estado = await obtenerEstadoInicialTablero({ permitidas: [] })

    expect(estado.length).toBeGreaterThanOrEqual(4)
  })

  it('filtrarAsignaciones respeta la lista permitida', () => {
    const lista = [
      { asignacionDiariaEspacioId: 1 },
      { asignacionDiariaEspacioId: 2 },
      { asignacionDiariaEspacioId: 3 },
    ]

    expect(filtrarAsignaciones(lista, [1, 2]).map((a) => a.asignacionDiariaEspacioId)).toEqual([
      1, 2,
    ])
    expect(filtrarAsignaciones(lista, [])).toHaveLength(3)
  })

  it('no duplica resultados cuando la lista permitida tiene duplicados', () => {
    const lista = [
      { asignacionDiariaEspacioId: 1 },
      { asignacionDiariaEspacioId: 2 },
      { asignacionDiariaEspacioId: 3 },
    ]

    expect(filtrarAsignaciones(lista, [1, 1, 2]).map((a) => a.asignacionDiariaEspacioId)).toEqual([
      1, 2,
    ])
  })
})

describe('tableroApi · estado inicial real (REST)', () => {
  const DTO = {
    id: 10,
    fecha: '2026-09-25',
    espacioFisicoId: 'uuid-1',
    espacioNumero: '201',
    nivel: 2,
    subespecialidadId: 5,
    subespecialidadNombre: 'Pediatría General',
    especialidadId: 1,
    especialidadNombre: 'Pediatría',
  }

  function clienteConRespuesta(cuerpo) {
    return { get: vi.fn().mockResolvedValue(cuerpo) }
  }

  it('en modo real consulta GET /asignaciones-diarias', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [DTO] })

    await obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] })

    expect(cliente.get).toHaveBeenCalledTimes(1)
    expect(cliente.get.mock.calls[0][0]).toBe('/asignaciones-diarias')
  })

  it('envía el parámetro fecha indicado', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [] })

    await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [],
      fecha: '2026-09-25',
    })

    expect(cliente.get.mock.calls[0][1]).toEqual({ params: { fecha: '2026-09-25' } })
  })

  it('usa la fecha local del cliente por defecto', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [] })

    await obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] })

    expect(cliente.get.mock.calls[0][1].params.fecha).toBe(hoyIso())
  })

  it('interpreta el wrapper ApiResponse y mapea el DTO al modelo del tablero', async () => {
    const cliente = clienteConRespuesta({
      timestamp: '2026-09-25T08:00:00',
      success: true,
      message: 'Asignación del día',
      data: [DTO],
    })

    const [asignacion] = await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [],
    })

    expect(asignacion).toEqual({
      asignacionDiariaEspacioId: 10,
      espacioNumero: '201',
      nivel: 2,
      subespecialidadNombre: 'Pediatría General',
      turnoActual: null,
      turnoSiguiente: null,
      ultimaActualizacion: null,
      intentosLlamado: null,
      tipoEvento: null,
    })
  })

  it('el snapshot REST no representa un evento: intentosLlamado y tipoEvento quedan null', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [DTO] })

    const [asignacion] = await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [],
    })

    expect(asignacion.intentosLlamado).toBeNull()
    expect(asignacion.tipoEvento).toBeNull()
  })

  it('acepta una respuesta en arreglo directo sin wrapper', async () => {
    const cliente = clienteConRespuesta([DTO])

    const estado = await obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] })

    expect(estado).toHaveLength(1)
    expect(estado[0].asignacionDiariaEspacioId).toBe(10)
  })

  it('deja turnoActual, turnoSiguiente y ultimaActualizacion en null (no inventa turnos)', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [DTO] })

    const [asignacion] = await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [],
    })

    expect(asignacion.turnoActual).toBeNull()
    expect(asignacion.turnoSiguiente).toBeNull()
    expect(asignacion.ultimaActualizacion).toBeNull()
  })

  it('devuelve [] ante una respuesta exitosa vacía', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [] })

    await expect(
      obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] }),
    ).resolves.toEqual([])
  })

  it('propaga errores HTTP/red', async () => {
    const cliente = { get: vi.fn().mockRejectedValue(new Error('boom')) }

    await expect(
      obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] }),
    ).rejects.toThrow('boom')
  })

  it('lanza error controlado ante una estructura inesperada sin inventar información', async () => {
    const cliente = clienteConRespuesta({ success: true, message: 'sin data' })

    await expect(
      obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] }),
    ).rejects.toMatchObject({ code: 'RESPUESTA_INESPERADA' })
  })

  it('descarta entradas sin id válido', async () => {
    const cliente = clienteConRespuesta({ success: true, data: [DTO, { espacioNumero: '999' }] })

    const estado = await obtenerEstadoInicialTablero({ modoMock: false, cliente, permitidas: [] })

    expect(estado).toHaveLength(1)
    expect(estado[0].asignacionDiariaEspacioId).toBe(10)
  })

  it('aplica el filtro por pantalla (permitidas)', async () => {
    const dto2 = { ...DTO, id: 11, espacioNumero: '202' }
    const cliente = clienteConRespuesta({ success: true, data: [DTO, dto2] })

    const estado = await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [11],
    })

    expect(estado.map((a) => a.asignacionDiariaEspacioId)).toEqual([11])
  })

  it('no incorpora datos personales aunque vengan en el DTO', async () => {
    const cliente = clienteConRespuesta({
      success: true,
      data: [
        {
          ...DTO,
          nombrePaciente: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
        },
      ],
    })

    const [asignacion] = await obtenerEstadoInicialTablero({
      modoMock: false,
      cliente,
      permitidas: [],
    })

    expect(asignacion).not.toHaveProperty('nombrePaciente')
    expect(asignacion).not.toHaveProperty('dpi')
    expect(asignacion).not.toHaveProperty('expediente')
    expect(asignacion).not.toHaveProperty('telefono')
  })

  it('mapearAsignacionDiaria produce solo el modelo público del tablero', () => {
    expect(Object.keys(mapearAsignacionDiaria(DTO)).sort()).toEqual([...CAMPOS_PUBLICOS].sort())
    expect(mapearAsignacionDiaria(DTO).turnoActual).toBeNull()
  })
})
