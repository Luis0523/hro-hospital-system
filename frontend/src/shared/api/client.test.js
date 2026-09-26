import { afterEach, describe, expect, it } from 'vitest'
import client from './client.js'

const adapterOriginal = client.defaults.adapter

afterEach(() => {
  client.defaults.adapter = adapterOriginal
})

function respuestaError(status, data, message = 'Request failed') {
  const response = { status, data, statusText: '', headers: {}, config: {} }
  const error = new Error(message)
  error.response = response
  return { error, response }
}

function simularRechazo({ status, data, message }) {
  const { error, response } = respuestaError(status, data, message)
  client.defaults.adapter = () => Promise.reject(error)
  return response
}

function simularRed() {
  client.defaults.adapter = () => Promise.reject(new Error('Network Error'))
}

function simularExito(body) {
  client.defaults.adapter = async (config) => ({
    data: body,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

async function capturarError() {
  return client.get('/recurso').catch((error) => error)
}

describe('client (normalización de errores)', () => {
  it('A. conserva message y status en un error 500 sin codigo ni data', async () => {
    const response = simularRechazo({ status: 500, data: { message: 'boom' } })

    const error = await capturarError()

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('boom')
    expect(error.status).toBe(500)
    expect(error.codigo).toBeUndefined()
    expect(error.data).toBeUndefined()
    expect(error.response).toBe(response)
  })

  it('B. preserva codigo y data sin transformación en el conflicto de calendario', async () => {
    const data = {
      fecha: '2026-12-25',
      totalCitas: 1,
      citas: [
        {
          id: 7,
          horaEstimada: '08:30:00',
          estado: 'confirmada',
          pacienteNombre: 'Juan López',
          medicoNombre: 'Dra. Carmen Fuentes',
          subespecialidadNombre: 'Cardiología',
        },
      ],
    }
    const response = simularRechazo({
      status: 409,
      data: {
        success: false,
        codigo: 'DIA_NO_LABORABLE_CON_CITAS',
        message: 'Existen 1 cita(s) activa(s)',
        data,
      },
    })

    const error = await capturarError()

    expect(error.status).toBe(409)
    expect(error.codigo).toBe('DIA_NO_LABORABLE_CON_CITAS')
    expect(error.data).toEqual(data)
    expect(error.response).toBe(response)
  })

  it('C. preserva exactamente el mapa de validación 400', async () => {
    const mapa = { nombre: 'El nombre es obligatorio', fecha: 'La fecha es obligatoria' }
    simularRechazo({
      status: 400,
      data: { success: false, codigo: null, message: 'Validación', data: mapa },
    })

    const error = await capturarError()

    expect(error.status).toBe(400)
    expect(error.data).toEqual(mapa)
  })

  it('D. expone codigo en un acceso denegado 403', async () => {
    simularRechazo({
      status: 403,
      data: { success: false, codigo: 'ACCESO_DENEGADO', message: 'Acceso denegado', data: null },
    })

    const error = await capturarError()

    expect(error.status).toBe(403)
    expect(error.codigo).toBe('ACCESO_DENEGADO')
  })

  it('E. maneja errores de red sin response sin lanzar un error secundario', async () => {
    simularRed()

    const error = await capturarError()

    expect(error.message).toBe('Network Error')
    expect(error.status).toBeUndefined()
    expect(error.codigo).toBeUndefined()
    expect(error.data).toBeUndefined()
    expect(error.response).toBeUndefined()
  })

  it('F. mantiene la referencia original de Axios y su data.codigo', async () => {
    const response = simularRechazo({
      status: 409,
      data: { success: false, codigo: 'DIA_NO_LABORABLE_CON_CITAS', message: 'conflicto' },
    })

    const error = await capturarError()

    expect(error.response).toBe(response)
    expect(error.response.data.codigo).toBe('DIA_NO_LABORABLE_CON_CITAS')
  })

  it('G. prioriza message del backend, luego error.message y luego el default', async () => {
    simularRechazo({ status: 500, data: { message: 'mensaje backend' }, message: 'mensaje axios' })
    const conBackend = await capturarError()
    expect(conBackend.message).toBe('mensaje backend')

    simularRechazo({ status: 500, data: {}, message: 'mensaje axios' })
    const conAxios = await capturarError()
    expect(conAxios.message).toBe('mensaje axios')

    simularRechazo({ status: 500, data: {}, message: '' })
    const porDefecto = await capturarError()
    expect(porDefecto.message).toBe('Error de comunicación con el servidor')
  })

  it('H. el interceptor de éxito sigue devolviendo response.data', async () => {
    const body = { success: true, codigo: null, message: 'ok', data: { id: 1 } }
    simularExito(body)

    const resultado = await client.get('/recurso')

    expect(resultado).toEqual(body)
  })
})
