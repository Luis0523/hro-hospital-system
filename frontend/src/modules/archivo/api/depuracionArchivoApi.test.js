import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from '@/shared/api/client'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import { expedientesDepuracionMock } from './depuracionFixtures'
import {
  crearDepuracionMock,
  listarDepuracionesMock,
  obtenerHistoricoDepuracionMock,
  reiniciarDepuracionesMock,
} from './depuracionMock'
import {
  buscarExpedienteParaDepurar,
  deshacerUltimaDepuracion,
  listarDepuraciones,
  listarDepuracionesEnRango,
  marcarDepurado,
} from './depuracionArchivoApi'

const EXISTENTE = expedientesDepuracionMock[0].numeroExpediente
const SEGUNDO = expedientesDepuracionMock[1].numeroExpediente
const INEXISTENTE = '999999'

describe('depuracionArchivoApi (mock)', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('encuentra un expediente numérico por número con su paciente', async () => {
    const expediente = await buscarExpedienteParaDepurar(EXISTENTE)

    expect(expediente).toMatchObject({
      numeroExpediente: EXISTENTE,
      depurado: false,
    })
    expect(expediente.pacienteNombre).toBeTruthy()
  })

  it('devuelve null si el número no existe', async () => {
    expect(await buscarExpedienteParaDepurar(INEXISTENTE)).toBeNull()
  })

  it('marca un expediente como depurado y lo registra en la bitácora del día', async () => {
    const registro = await marcarDepurado({ numeroExpediente: EXISTENTE, motivo: 'Extraviado' })

    expect(registro).toMatchObject({ numeroExpediente: EXISTENTE, motivo: 'Extraviado' })
    expect(registro.depuradoEn).toBeTruthy()

    const bitacora = await listarDepuraciones({ fecha: hoyIsoGuatemala() })
    expect(bitacora.length).toBeGreaterThan(1)
    expect(bitacora.some((item) => item.numeroExpediente === EXISTENTE)).toBe(true)
  })

  it('refleja depurado=true al volver a buscar el expediente', async () => {
    await marcarDepurado({ numeroExpediente: EXISTENTE })

    const expediente = await buscarExpedienteParaDepurar(EXISTENTE)
    expect(expediente.depurado).toBe(true)
  })

  it('lanza 409 si el expediente ya estaba depurado', async () => {
    await marcarDepurado({ numeroExpediente: EXISTENTE })

    await expect(marcarDepurado({ numeroExpediente: EXISTENTE })).rejects.toMatchObject({
      status: 409,
    })
  })

  it('lanza 404 si el expediente no existe', async () => {
    await expect(marcarDepurado({ numeroExpediente: INEXISTENTE })).rejects.toMatchObject({
      status: 404,
    })
  })

  it('registra la baja mock con el día operativo de Guatemala', async () => {
    const registro = crearDepuracionMock({ numeroExpediente: EXISTENTE })

    expect(registro.fecha).toBe(hoyIsoGuatemala())
    expect(listarDepuracionesMock({ fecha: hoyIsoGuatemala() })).toContainEqual(registro)
  })

  it('no realiza solicitudes HTTP en modo mock', async () => {
    const get = vi.spyOn(client, 'get')
    const post = vi.spyOn(client, 'post')

    await buscarExpedienteParaDepurar(EXISTENTE)
    await marcarDepurado({ numeroExpediente: EXISTENTE })
    await listarDepuraciones({ fecha: hoyIsoGuatemala() })

    expect(get).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('encuentra un expediente histórico ya depurado y conserva el 409', async () => {
    reiniciarDepuracionesMock({ hoy: '2026-11-02' })
    const historico = obtenerHistoricoDepuracionMock()
    const registro = historico.depuraciones[0]

    const expediente = await buscarExpedienteParaDepurar(registro.numeroExpediente)
    expect(expediente).toMatchObject({
      numeroExpediente: registro.numeroExpediente,
      depurado: true,
    })

    await expect(
      marcarDepurado({ numeroExpediente: registro.numeroExpediente }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('devuelve el mismo conjunto para un día sin importar el filtro que lo consulte', async () => {
    reiniciarDepuracionesMock({ hoy: '2026-11-02' })
    const historico = obtenerHistoricoDepuracionMock()
    const fecha = historico.depuraciones[0].fecha

    const primero = await listarDepuraciones({ fecha })
    const segundo = await listarDepuraciones({ fecha })

    expect(segundo.map((registro) => registro.id)).toEqual(primero.map((registro) => registro.id))
    expect(primero.length).toBeGreaterThan(0)
  })

  it('mantiene separados los registros de sesión de los históricos', async () => {
    const hoyIso = hoyIsoGuatemala()
    reiniciarDepuracionesMock({ hoy: hoyIso })
    const historico = obtenerHistoricoDepuracionMock()
    const fixturesHoy = historico.depuraciones.filter((registro) => registro.fecha === hoyIso)

    expect(fixturesHoy).toHaveLength(12)
    expect(historico.depuraciones.some((registro) => registro.fecha < hoyIso)).toBe(true)

    await marcarDepurado({ numeroExpediente: EXISTENTE })
    const hoy = await listarDepuraciones({ fecha: hoyIso })

    expect(hoy).toHaveLength(fixturesHoy.length + 1)
    expect(hoy.some((registro) => registro.numeroExpediente === EXISTENTE)).toBe(true)
  })

  it('deshace únicamente la última depuración y no permite una cadena de reversiones', async () => {
    await marcarDepurado({ numeroExpediente: EXISTENTE })
    await marcarDepurado({ numeroExpediente: SEGUNDO })

    const revertida = await deshacerUltimaDepuracion()

    expect(revertida.numeroExpediente).toBe(SEGUNDO)
    const hoy = await listarDepuraciones({ fecha: hoyIsoGuatemala() })
    expect(hoy.map((registro) => registro.numeroExpediente)).toContain(EXISTENTE)
    expect(hoy.map((registro) => registro.numeroExpediente)).not.toContain(SEGUNDO)
    expect((await buscarExpedienteParaDepurar(SEGUNDO)).depurado).toBe(false)
    expect((await buscarExpedienteParaDepurar(EXISTENTE)).depurado).toBe(true)

    await expect(deshacerUltimaDepuracion()).rejects.toMatchObject({ status: 409 })
  })

  it('permite volver a depurar el expediente después de deshacer', async () => {
    await marcarDepurado({ numeroExpediente: SEGUNDO })
    await deshacerUltimaDepuracion()

    const nuevo = await marcarDepurado({ numeroExpediente: SEGUNDO })
    const revertida = await deshacerUltimaDepuracion()

    expect(nuevo.numeroExpediente).toBe(SEGUNDO)
    expect(revertida.numeroExpediente).toBe(SEGUNDO)
    expect((await buscarExpedienteParaDepurar(SEGUNDO)).depurado).toBe(false)
  })

  it('no permite deshacer fixtures históricos ni una sesión reiniciada', async () => {
    reiniciarDepuracionesMock({ hoy: '2026-11-02' })
    const historico = obtenerHistoricoDepuracionMock()

    await expect(deshacerUltimaDepuracion()).rejects.toMatchObject({ status: 409 })
    expect(
      (await buscarExpedienteParaDepurar(historico.depuraciones[0].numeroExpediente)).depurado,
    ).toBe(true)

    await marcarDepurado({ numeroExpediente: EXISTENTE })
    reiniciarDepuracionesMock()
    await expect(deshacerUltimaDepuracion()).rejects.toMatchObject({ status: 409 })
    expect((await buscarExpedienteParaDepurar(EXISTENTE)).depurado).toBe(false)
  })

  it('no realiza HTTP al deshacer en modo mock', async () => {
    await marcarDepurado({ numeroExpediente: EXISTENTE })
    const get = vi.spyOn(client, 'get')
    const post = vi.spyOn(client, 'post')

    await deshacerUltimaDepuracion()

    expect(get).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('consulta un rango histórico local sin simular una petición por día', async () => {
    reiniciarDepuracionesMock({ hoy: hoyIsoGuatemala() })
    const historico = obtenerHistoricoDepuracionMock()
    const fechaHistorica = historico.depuraciones[0].fecha
    const historicosFecha = historico.depuraciones.filter(
      (registro) => registro.fecha === fechaHistorica,
    ).length
    const hoyBase = (await listarDepuraciones({ fecha: hoyIsoGuatemala() })).length
    await marcarDepurado({ numeroExpediente: EXISTENTE })

    const get = vi.spyOn(client, 'get')
    const post = vi.spyOn(client, 'post')
    const registros = await listarDepuracionesEnRango({
      dias: [fechaHistorica, hoyIsoGuatemala()],
    })

    expect(registros).toHaveLength(historicosFecha + hoyBase + 1)
    expect(registros.map((registro) => registro.numeroExpediente)).toContain(EXISTENTE)
    expect(get).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })
})
