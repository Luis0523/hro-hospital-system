import { beforeEach, describe, expect, it } from 'vitest'
import { hoyIso } from '@/shared/utils/fecha'
import { expedientesMock } from './mockData'
import { reiniciarDepuracionesMock } from './depuracionMock'
import {
  buscarExpedienteParaDepurar,
  listarDepuraciones,
  marcarDepurado,
} from './depuracionArchivoApi'

const EXISTENTE = expedientesMock.find((expediente) => expediente.numeroExpediente).numeroExpediente

describe('depuracionArchivoApi (mock)', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('encuentra un expediente por número con su paciente', async () => {
    const expediente = await buscarExpedienteParaDepurar(EXISTENTE)

    expect(expediente).toMatchObject({
      numeroExpediente: EXISTENTE,
      depurado: false,
    })
    expect(expediente.pacienteNombre).toBeTruthy()
  })

  it('devuelve null si el número no existe', async () => {
    expect(await buscarExpedienteParaDepurar('NO-EXISTE')).toBeNull()
  })

  it('marca un expediente como depurado y lo registra en la bitácora del día', async () => {
    const registro = await marcarDepurado({ numeroExpediente: EXISTENTE, motivo: 'Extraviado' })

    expect(registro).toMatchObject({ numeroExpediente: EXISTENTE, motivo: 'Extraviado' })
    expect(registro.depuradoEn).toBeTruthy()

    const bitacora = await listarDepuraciones({ fecha: hoyIso() })
    expect(bitacora).toHaveLength(1)
    expect(bitacora[0].numeroExpediente).toBe(EXISTENTE)
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
    await expect(marcarDepurado({ numeroExpediente: 'NO-EXISTE' })).rejects.toMatchObject({
      status: 404,
    })
  })
})
