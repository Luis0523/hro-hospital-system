import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./archivoApi', () => ({
  buscarExpedientePorCodigo: vi.fn(),
}))

import { buscarExpedientePorCodigo } from './archivoApi'
import {
  CODIGO_EXPEDIENTE_NO_ENCONTRADO,
  CODIGO_VERIFICACION_FALLIDA,
  MODO_VERIFICACION_DESHABILITADA,
  MODO_VERIFICACION_NO_DISPONIBLE,
  MODO_VERIFICACION_REAL,
  VERIFICACION_DESHABILITADA,
  VERIFICACION_ENCONTRADO,
  VERIFICACION_ERROR_AUTENTICACION,
  VERIFICACION_ERROR_CONEXION,
  VERIFICACION_ERROR_INCONSISTENTE,
  VERIFICACION_NO_DISPONIBLE,
  VERIFICACION_NO_ENCONTRADO,
  errorDeVerificacion,
  obtenerModoVerificacion,
  verificacionBloqueaRegistro,
  verificarExistenciaExpediente,
} from './verificacionExpedienteApi'

function activarVerificacionReal() {
  vi.stubEnv('VITE_VERIFICACION_EXPEDIENTES', 'true')
  vi.stubEnv('VITE_USE_MOCK', 'false')
}

function errorConEstado(status) {
  const error = new Error('fallo del servidor')
  if (status != null) error.status = status
  return error
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('verificacionExpedienteApi', () => {
  it('queda deshabilitada por defecto y no consulta el servidor', async () => {
    expect(obtenerModoVerificacion()).toBe(MODO_VERIFICACION_DESHABILITADA)

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado).toMatchObject({
      estado: VERIFICACION_DESHABILITADA,
      modo: MODO_VERIFICACION_DESHABILITADA,
      expediente: null,
    })
    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
  })

  it('no está disponible si se pide verificar pero el backend no está configurado', async () => {
    vi.stubEnv('VITE_VERIFICACION_EXPEDIENTES', 'true')
    vi.stubEnv('VITE_USE_MOCK', 'true')

    expect(obtenerModoVerificacion()).toBe(MODO_VERIFICACION_NO_DISPONIBLE)

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado.estado).toBe(VERIFICACION_NO_DISPONIBLE)
    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
  })

  it('consulta el endpoint reutilizado en modo real y confirma el expediente', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({
      id: '3f1c-uuid',
      numeroExpediente: '927581',
      activo: true,
      depurado: false,
    })

    const resultado = await verificarExistenciaExpediente('927581')

    expect(obtenerModoVerificacion()).toBe(MODO_VERIFICACION_REAL)
    expect(buscarExpedientePorCodigo).toHaveBeenCalledWith('927581')
    expect(resultado.estado).toBe(VERIFICACION_ENCONTRADO)
    expect(resultado.expediente.numeroExpediente).toBe('927581')
  })

  it('normaliza el número antes de consultar', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({ numeroExpediente: '911330' })

    await verificarExistenciaExpediente(' 91-1330 ')

    expect(buscarExpedientePorCodigo).toHaveBeenCalledWith('911330')
  })

  it('rechaza un expediente cuyo número no coincide con el consultado', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({
      id: 'otro-uuid',
      numeroExpediente: '927582',
    })

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado.estado).toBe(VERIFICACION_ERROR_INCONSISTENTE)
    expect(resultado.expediente).toBeNull()
  })

  it('acepta la coincidencia cuando el guion es solo visual', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({ numeroExpediente: '91-1330' })

    const resultado = await verificarExistenciaExpediente('911330')

    expect(resultado.estado).toBe(VERIFICACION_ENCONTRADO)
  })

  it('acepta una consulta por UUID cuando el id coincide', async () => {
    activarVerificacionReal()
    const uuid = '8a7d1f2e-3b4c-4d5e-8f90-123456789abc'
    buscarExpedientePorCodigo.mockResolvedValue({
      id: '8A7D1F2E-3B4C-4D5E-8F90-123456789ABC',
      numeroExpediente: '927581',
    })

    const resultado = await verificarExistenciaExpediente(uuid)

    expect(buscarExpedientePorCodigo).toHaveBeenCalledWith(uuid)
    expect(resultado.estado).toBe(VERIFICACION_ENCONTRADO)
  })

  it('rechaza un UUID que no corresponde al expediente devuelto', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({
      id: 'otro-uuid',
      numeroExpediente: '927581',
    })

    const resultado = await verificarExistenciaExpediente('8a7d1f2e-3b4c-4d5e-8f90-123456789abc')

    expect(resultado.estado).toBe(VERIFICACION_ERROR_INCONSISTENTE)
  })

  it('distingue expediente inexistente cuando la búsqueda devuelve null', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue(null)

    const resultado = await verificarExistenciaExpediente('123456')

    expect(resultado.estado).toBe(VERIFICACION_NO_ENCONTRADO)
    expect(resultado.expediente).toBeNull()
  })

  it('distingue expediente inexistente cuando el backend responde 404', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockRejectedValue(errorConEstado(404))

    const resultado = await verificarExistenciaExpediente('123456')

    expect(resultado.estado).toBe(VERIFICACION_NO_ENCONTRADO)
  })

  it('trata un expediente depurado como inexistente', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockResolvedValue({ numeroExpediente: '927581', depurado: true })

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado.estado).toBe(VERIFICACION_NO_ENCONTRADO)
    expect(resultado.motivo).toBe('depurado')
  })

  it('informa el fallo de autenticación sin presentarlo como inexistente', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockRejectedValue(errorConEstado(401))

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado.estado).toBe(VERIFICACION_ERROR_AUTENTICACION)
    expect(resultado.status).toBe(401)
  })

  it('informa 403 como fallo de autorización', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockRejectedValue(errorConEstado(403))

    expect((await verificarExistenciaExpediente('927581')).estado).toBe(
      VERIFICACION_ERROR_AUTENTICACION,
    )
  })

  it('informa el error de red sin bloquear por "inexistente"', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockRejectedValue(errorConEstado(null))

    const resultado = await verificarExistenciaExpediente('927581')

    expect(resultado.estado).toBe(VERIFICACION_ERROR_CONEXION)
    expect(resultado.status).toBeNull()
  })

  it('informa un 500 como fallo de conexión con el servidor', async () => {
    activarVerificacionReal()
    buscarExpedientePorCodigo.mockRejectedValue(errorConEstado(500))

    expect((await verificarExistenciaExpediente('927581')).estado).toBe(VERIFICACION_ERROR_CONEXION)
  })

  it('considera inexistente una captura vacía sin consultar', async () => {
    activarVerificacionReal()

    const resultado = await verificarExistenciaExpediente('   ')

    expect(resultado).toMatchObject({ estado: VERIFICACION_NO_ENCONTRADO, motivo: 'invalido' })
    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
  })

  it('solo bloquea el registro ante inexistencia o fallo de verificación', () => {
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_ENCONTRADO })).toBe(false)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_DESHABILITADA })).toBe(false)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_NO_DISPONIBLE })).toBe(false)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_NO_ENCONTRADO })).toBe(true)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_ERROR_CONEXION })).toBe(true)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_ERROR_AUTENTICACION })).toBe(true)
    expect(verificacionBloqueaRegistro({ estado: VERIFICACION_ERROR_INCONSISTENTE })).toBe(true)
  })

  it('traduce la inexistencia a un error de negocio con código propio', () => {
    const error = errorDeVerificacion({ estado: VERIFICACION_NO_ENCONTRADO })

    expect(error.codigo).toBe(CODIGO_EXPEDIENTE_NO_ENCONTRADO)
    expect(error.status).toBe(404)
    expect(error.message).toMatch(/No se encontró/)
  })

  it('traduce el expediente depurado a un mensaje propio', () => {
    const error = errorDeVerificacion({
      estado: VERIFICACION_NO_ENCONTRADO,
      motivo: 'depurado',
    })

    expect(error.message).toMatch(/depurado/)
  })

  it('traduce los fallos de verificación sin confundirlos con inexistencia', () => {
    const conexion = errorDeVerificacion({ estado: VERIFICACION_ERROR_CONEXION, status: 503 })
    expect(conexion.codigo).toBe(CODIGO_VERIFICACION_FALLIDA)
    expect(conexion.status).toBe(503)
    expect(conexion.data.motivo).toBe('conexion')

    const autenticacion = errorDeVerificacion({
      estado: VERIFICACION_ERROR_AUTENTICACION,
      status: 401,
    })
    expect(autenticacion.codigo).toBe(CODIGO_VERIFICACION_FALLIDA)
    expect(autenticacion.data.motivo).toBe('autenticacion')
  })

  it('traduce la respuesta inconsistente sin presentarla como inexistente', () => {
    const error = errorDeVerificacion({ estado: VERIFICACION_ERROR_INCONSISTENTE })

    expect(error.codigo).toBe(CODIGO_VERIFICACION_FALLIDA)
    expect(error.data.motivo).toBe('inconsistente')
    expect(error.message).toMatch(/no coincide/)
  })
})
