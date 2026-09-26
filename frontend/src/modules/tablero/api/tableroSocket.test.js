import { beforeEach, describe, expect, it, vi } from 'vitest'

const { suscripciones, clientes } = vi.hoisted(() => ({ suscripciones: [], clientes: [] }))

vi.mock('@stomp/stompjs', () => {
  class Client {
    constructor(config) {
      this.config = config
      this.subscribe = vi.fn((topic, callback) => {
        const suscripcion = { topic, callback, unsubscribe: vi.fn() }
        suscripciones.push(suscripcion)
        return suscripcion
      })
      this.activate = vi.fn()
      this.deactivate = vi.fn()
      clientes.push(this)
    }
  }
  return { Client }
})

vi.mock('sockjs-client', () => ({ default: vi.fn(function SockJS() {}) }))

import { crearClienteTablero, TOPIC_TABLERO, topicAsignacion, WS_URL } from './tableroSocket'

describe('tableroSocket', () => {
  beforeEach(() => {
    suscripciones.length = 0
    clientes.length = 0
  })

  it('usa el endpoint real del backend y los topics acordados', () => {
    expect(WS_URL).toBe('/api/v1/ws-turnos')
    expect(TOPIC_TABLERO).toBe('/topic/tablero')
    expect(topicAsignacion(5)).toBe('/topic/clinica/5')
  })

  it('se suscribe a /topic/tablero al conectar y saneo el payload recibido', () => {
    const recibidos = []
    const onConnected = vi.fn()

    crearClienteTablero({ onMensaje: (estado) => recibidos.push(estado), onConnected })
    const cliente = clientes[0]

    cliente.onConnect()

    expect(onConnected).toHaveBeenCalledTimes(1)
    expect(suscripciones).toHaveLength(1)
    expect(suscripciones[0].topic).toBe('/topic/tablero')

    suscripciones[0].callback({
      body: JSON.stringify({
        asignacionDiariaEspacioId: 1,
        espacioNumero: '201',
        nivel: 2,
        subespecialidadNombre: 'Pediatría General',
        turnoActual: 7,
        turnoSiguiente: 8,
        nombrePaciente: 'Juan Perez',
        dpi: '1234567890101',
      }),
    })

    expect(recibidos).toHaveLength(1)
    expect(recibidos[0]).not.toHaveProperty('nombrePaciente')
    expect(recibidos[0]).not.toHaveProperty('dpi')
    expect(recibidos[0].turnoActual).toBe(7)
  })

  it('no propaga payloads inválidos', () => {
    const recibidos = []
    crearClienteTablero({ onMensaje: (estado) => recibidos.push(estado) })
    const cliente = clientes[0]
    cliente.onConnect()

    suscripciones[0].callback({ body: 'no-json' })
    suscripciones[0].callback({ body: JSON.stringify({ sinId: true }) })

    expect(recibidos).toHaveLength(0)
  })

  it('expone activar y desactivar hacia el cliente STOMP', () => {
    const controlador = crearClienteTablero({})
    controlador.activar()
    controlador.desactivar()

    expect(clientes[0].activate).toHaveBeenCalledTimes(1)
    expect(clientes[0].deactivate).toHaveBeenCalledTimes(1)
  })
})
