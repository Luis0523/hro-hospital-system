import { describe, expect, it } from 'vitest'
import {
  avanzarEstado,
  buscarExpedientePorCodigo,
  crearExpediente,
  listarExpedientes,
  marcarNoLocalizado,
  obtenerExpediente,
} from './archivoApi'

describe('archivoApi (mock)', () => {
  it('lista expedientes con la forma esperada', async () => {
    const lista = await listarExpedientes()

    expect(lista.length).toBeGreaterThan(0)
    expect(lista[0]).toHaveProperty('pacienteNombre')
    expect(lista[0]).toHaveProperty('estado')
    expect(lista[0]).toHaveProperty('historial')
  })

  it('filtra por fecha, clínica y médico', async () => {
    const [primero] = await listarExpedientes()

    const porFecha = await listarExpedientes({ fecha: primero.fechaCita })
    expect(porFecha.every((expediente) => expediente.fechaCita === primero.fechaCita)).toBe(true)

    const porClinica = await listarExpedientes({ clinicaId: primero.clinicaId })
    expect(porClinica.every((expediente) => expediente.clinicaId === primero.clinicaId)).toBe(true)

    const porMedico = await listarExpedientes({ medicoId: primero.medicoId })
    expect(porMedico.every((expediente) => expediente.medicoId === primero.medicoId)).toBe(true)
  })

  it('devuelve el detalle con historial', async () => {
    const detalle = await obtenerExpediente(1)

    expect(detalle.id).toBe(1)
    expect(Array.isArray(detalle.historial)).toBe(true)
  })

  it('avanza al siguiente estado sin que el frontend lo decida', async () => {
    const antes = await obtenerExpediente(1)
    const despues = await avanzarEstado(1)

    expect(despues.estado).not.toBe(antes.estado)
    expect(despues.historial.length).toBe(antes.historial.length + 1)
  })

  it('marca un expediente como no localizado', async () => {
    const actualizado = await marcarNoLocalizado(3)

    expect(actualizado.estado).toBe('no_localizado')
  })

  it('busca por código escaneado', async () => {
    const encontrado = await buscarExpedientePorCodigo('EXP-004521')

    expect(encontrado?.id).toBe(1)
    expect(await buscarExpedientePorCodigo('NO-EXISTE')).toBeNull()
  })

  it('crea el expediente físico de un paciente nuevo', async () => {
    const creado = await crearExpediente(7)

    expect(creado.expedienteNuevo).toBe(false)
    expect(creado.numeroExpediente).toBeTruthy()
    expect(creado.estado).toBe('pendiente_localizar')

    const detalle = await obtenerExpediente(7)
    expect(detalle.numeroExpediente).toBe(creado.numeroExpediente)
  })
})
