import { beforeEach, describe, expect, it } from 'vitest'
import {
  actualizarSalidaEnfermeriaArchivo,
  eliminarSalidaEnfermeriaArchivo,
  listarSalidasEnfermeriaArchivo,
  registrarSalidaEnfermeriaArchivo,
  reiniciarSalidasEnfermeriaArchivoMock,
} from './salidaEnfermeriaArchivoApi'

const fecha = '2026-10-27'
const estacionId = 1

beforeEach(() => {
  reiniciarSalidasEnfermeriaArchivoMock()
})

describe('salidaEnfermeriaArchivoApi', () => {
  it('actualiza los datos de una salida registrada', async () => {
    const creada = await registrarSalidaEnfermeriaArchivo({
      numeroExpediente: '123456',
      estacionId,
      fecha,
      tipo: 'normal',
    })

    const actualizada = await actualizarSalidaEnfermeriaArchivo(creada.id, {
      numeroExpediente: '654321',
      tipo: 'personal',
      primeraVez: true,
      clinicaPersonalId: '2',
    })

    expect(actualizada).toMatchObject({
      id: creada.id,
      numeroExpediente: '654321',
      tipo: 'personal',
      primeraVez: true,
      clinicaPersonalId: '2',
    })
    const lista = await listarSalidasEnfermeriaArchivo({ fecha, estacionId })
    expect(lista.find((salida) => salida.id === creada.id)).toMatchObject({
      numeroExpediente: '654321',
    })
  })

  it('elimina una salida de la lista', async () => {
    const creada = await registrarSalidaEnfermeriaArchivo({
      numeroExpediente: '123456',
      estacionId,
      fecha,
      tipo: 'normal',
    })

    await eliminarSalidaEnfermeriaArchivo(creada.id)

    const lista = await listarSalidasEnfermeriaArchivo({ fecha, estacionId })
    expect(lista).toHaveLength(0)
  })

  it('rechaza cambiar el expediente a uno ya registrado', async () => {
    await registrarSalidaEnfermeriaArchivo({
      numeroExpediente: '111111',
      estacionId,
      fecha,
      tipo: 'normal',
    })
    const segunda = await registrarSalidaEnfermeriaArchivo({
      numeroExpediente: '222222',
      estacionId,
      fecha,
      tipo: 'normal',
    })

    await expect(
      actualizarSalidaEnfermeriaArchivo(segunda.id, {
        numeroExpediente: '111111',
        tipo: 'normal',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })
})
