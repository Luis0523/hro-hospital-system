import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '@/shared/api/client'
import * as administracionApi from './administracionApi'
import {
  actualizarEspecialidad,
  actualizarEspacioFisico,
  actualizarMedico,
  actualizarSubespecialidad,
  crearEspecialidad,
  crearEspacioFisico,
  crearMedico,
  crearProgramacion,
  crearSubespecialidad,
  desactivarEspecialidad,
  desactivarEspacioFisico,
  desactivarMedico,
  desactivarProgramacion,
  desactivarSubespecialidad,
  listarEspecialidades,
  listarEspaciosFisicos,
  listarMedicos,
  listarProgramacionesPorMedico,
  listarProgramacionesPorSubespecialidad,
  listarSubespecialidades,
} from './administracionApi'
import { reiniciarCatalogosMock } from './mockData'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('administracionApi (mock)', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    vi.clearAllMocks()
  })

  it('no usa HTTP real en modo test', async () => {
    await listarEspecialidades()
    await listarSubespecialidades()
    await listarEspaciosFisicos()
    await listarMedicos()
    await listarProgramacionesPorMedico('6f0d3a2c-1a11-4d21-9c01-000000000101')
    await listarProgramacionesPorSubespecialidad(1)
    await crearMedico({ nombres: 'Dr. Prueba', numeroColegiado: 'COL-90001' })
    await crearProgramacion({
      medicoId: '6f0d3a2c-1a11-4d21-9c01-000000000101',
      subespecialidadId: 6,
      diaSemana: 5,
      horaInicio: '08:00',
      horaFin: '11:00',
      capacidadMaxima: 4,
      duracionConsultaMinutos: 30,
    })
    await actualizarMedico('6f0d3a2c-1a11-4d21-9c01-000000000101', {
      nombres: 'Dr. Prueba',
      numeroColegiado: 'COL-10021',
      usuarioReferenciaId: 5,
      activo: true,
    })
    await desactivarMedico('6f0d3a2c-1a11-4d21-9c01-000000000103')
    await desactivarProgramacion('6f0d3a2c-1a11-4d21-9c01-000000000204')

    expect(client.get).not.toHaveBeenCalled()
    expect(client.post).not.toHaveBeenCalled()
    expect(client.put).not.toHaveBeenCalled()
    expect(client.delete).not.toHaveBeenCalled()
  })

  describe('especialidades', () => {
    it('lista especialidades activas con id numérico', async () => {
      const lista = await listarEspecialidades()

      expect(lista.length).toBeGreaterThan(0)
      expect(typeof lista[0].id).toBe('number')
      expect(lista[0]).toHaveProperty('nombre')
      expect(lista[0]).toHaveProperty('activo')
    })

    it('crea una especialidad', async () => {
      const creada = await crearEspecialidad({ nombre: 'Neurología' })

      expect(typeof creada.id).toBe('number')
      expect(creada.nombre).toBe('Neurología')
      expect((await listarEspecialidades()).some((item) => item.nombre === 'Neurología')).toBe(true)
    })

    it('rechaza nombres duplicados como lo hace el backend', async () => {
      await expect(crearEspecialidad({ nombre: 'Pediatría' })).rejects.toThrow(/Ya existe/)
    })

    it('edita el nombre de una especialidad', async () => {
      const [primera] = await listarEspecialidades()
      const actualizada = await actualizarEspecialidad(primera.id, {
        nombre: 'Medicina Interna HRO',
      })

      expect(actualizada.nombre).toBe('Medicina Interna HRO')
    })

    it('desactiva una especialidad y deja de listarse', async () => {
      const [primera] = await listarEspecialidades()
      await desactivarEspecialidad(primera.id)

      const lista = await listarEspecialidades()
      expect(lista.some((item) => item.id === primera.id)).toBe(false)
    })
  })

  describe('subespecialidades', () => {
    it('lista subespecialidades con su especialidad', async () => {
      const lista = await listarSubespecialidades()

      expect(lista.length).toBeGreaterThan(0)
      expect(typeof lista[0].id).toBe('number')
      expect(lista[0]).toHaveProperty('especialidadId')
      expect(lista[0]).toHaveProperty('especialidadNombre')
    })

    it('filtra subespecialidades por especialidad', async () => {
      const pediatria = (await listarEspecialidades()).find((item) => item.nombre === 'Pediatría')
      const lista = await listarSubespecialidades(pediatria.id)

      expect(lista.length).toBeGreaterThan(0)
      expect(lista.every((item) => item.especialidadId === pediatria.id)).toBe(true)
    })

    it('crea, edita y desactiva una subespecialidad', async () => {
      const pediatria = (await listarEspecialidades()).find((item) => item.nombre === 'Pediatría')
      const creada = await crearSubespecialidad({
        especialidadId: pediatria.id,
        nombre: 'Neuropediatría',
      })

      expect(creada.especialidadNombre).toBe('Pediatría')

      const editada = await actualizarSubespecialidad(creada.id, {
        especialidadId: pediatria.id,
        nombre: 'Neuropediatría Infantil',
      })
      expect(editada.nombre).toBe('Neuropediatría Infantil')

      await desactivarSubespecialidad(creada.id)
      const lista = await listarSubespecialidades(pediatria.id)
      expect(lista.some((item) => item.id === creada.id)).toBe(false)
    })
  })

  describe('espacios físicos', () => {
    it('lista espacios físicos con id UUID', async () => {
      const lista = await listarEspaciosFisicos()

      expect(lista.length).toBeGreaterThan(0)
      expect(lista[0].id).toMatch(UUID)
      expect(lista[0]).toHaveProperty('numero')
      expect(lista[0]).toHaveProperty('nivel')
      expect(lista[0]).toHaveProperty('capacidadCamillas')
    })

    it('crea, edita y desactiva un espacio físico sin mezclar capacidades', async () => {
      const creado = await crearEspacioFisico({
        numero: '501',
        nivel: 5,
        capacidadCamillas: 3,
        nombre: 'Sala 501',
        ubicacion: 'Edificio Consulta Externa, Nivel 5',
      })

      expect(creado.id).toMatch(UUID)
      expect(creado.activo).toBe(true)
      expect(creado.capacidadCamillas).toBe(3)

      const editado = await actualizarEspacioFisico(creado.id, {
        ...creado,
        nombre: 'Sala 501 A',
        activo: true,
      })
      expect(editado.nombre).toBe('Sala 501 A')

      await desactivarEspacioFisico(creado.id)
      const lista = await listarEspaciosFisicos()
      expect(lista.some((item) => item.id === creado.id)).toBe(false)
    })

    it('filtra espacios físicos por nivel', async () => {
      const lista = await listarEspaciosFisicos(2)

      expect(lista.length).toBeGreaterThan(0)
      expect(lista.every((item) => item.nivel === 2)).toBe(true)
    })
  })

  describe('médicos', () => {
    it('lista médicos activos con id UUID', async () => {
      const lista = await listarMedicos()

      expect(lista.length).toBeGreaterThan(0)
      expect(lista[0].id).toMatch(UUID)
      expect(lista[0]).toHaveProperty('nombres')
      expect(lista[0]).toHaveProperty('numeroColegiado')
      expect(lista[0]).toHaveProperty('usuarioReferenciaId')
      expect(lista[0].activo).toBe(true)
    })

    it('crea un médico con id UUID y activo', async () => {
      const creado = await crearMedico({
        nombres: 'Dr. Andrés Lima',
        numeroColegiado: 'COL-50001',
      })

      expect(creado.id).toMatch(UUID)
      expect(creado.activo).toBe(true)
      expect((await listarMedicos()).some((item) => item.id === creado.id)).toBe(true)
    })

    it('rechaza un número de colegiado duplicado', async () => {
      await expect(
        crearMedico({ nombres: 'Otro médico', numeroColegiado: 'COL-10021' }),
      ).rejects.toThrow(/colegiado/i)
    })

    it('edita preservando usuarioReferenciaId y activo', async () => {
      const [primero] = await listarMedicos()
      const actualizado = await actualizarMedico(primero.id, {
        nombres: 'Dr. Carlos Méndez Actualizado',
        numeroColegiado: primero.numeroColegiado,
        usuarioReferenciaId: primero.usuarioReferenciaId,
        activo: primero.activo,
      })

      expect(actualizado.nombres).toBe('Dr. Carlos Méndez Actualizado')
      expect(actualizado.usuarioReferenciaId).toBe(primero.usuarioReferenciaId)
      expect(actualizado.activo).toBe(true)
    })

    it('desactiva un médico y deja de listarse', async () => {
      const [primero] = await listarMedicos()
      await desactivarMedico(primero.id)

      expect((await listarMedicos()).some((item) => item.id === primero.id)).toBe(false)
    })
  })

  describe('programación médico-subespecialidad', () => {
    async function primerMedico() {
      const [medico] = await listarMedicos()
      return medico
    }

    it('lista por médico con campos derivados y UUID', async () => {
      const medico = await primerMedico()
      const lista = await listarProgramacionesPorMedico(medico.id)

      expect(lista.length).toBeGreaterThan(0)
      expect(lista[0].id).toMatch(UUID)
      expect(lista[0].medicoId).toBe(medico.id)
      expect(lista[0]).toHaveProperty('medicoNombre')
      expect(lista[0]).toHaveProperty('subespecialidadNombre')
      expect(lista[0]).toHaveProperty('especialidadNombre')
      expect(lista[0].activo).toBe(true)
    })

    it('lista por subespecialidad', async () => {
      const lista = await listarProgramacionesPorSubespecialidad(1)

      expect(lista.length).toBeGreaterThan(0)
      expect(lista.every((item) => item.subespecialidadId === 1)).toBe(true)
    })

    it('crea una programación con día, diaSemanaNombre y normaliza HH:mm:ss', async () => {
      const medico = await primerMedico()
      const creada = await crearProgramacion({
        medicoId: medico.id,
        subespecialidadId: 5,
        diaSemana: 3,
        horaInicio: '09:00',
        horaFin: '11:00',
        capacidadMaxima: 3,
        duracionConsultaMinutos: 30,
      })

      expect(creada.id).toMatch(UUID)
      expect(creada.diaSemana).toBe(3)
      expect(creada.diaSemanaNombre).toBe('Miércoles')
      expect(creada.horaInicio).toBe('09:00:00')
      expect(creada.horaFin).toBe('11:00:00')
      expect(creada.duracionConsultaMinutos).toBe(30)
    })

    it('usa duración estimada 35 por defecto', async () => {
      const medico = await primerMedico()
      const creada = await crearProgramacion({
        medicoId: medico.id,
        subespecialidadId: 6,
        diaSemana: 6,
        horaInicio: '08:00',
        horaFin: '11:00',
        capacidadMaxima: 4,
      })

      expect(creada.duracionConsultaMinutos).toBe(35)
    })

    it('rechaza una programación duplicada por médico, subespecialidad y día', async () => {
      const medico = await primerMedico()

      await expect(
        crearProgramacion({
          medicoId: medico.id,
          subespecialidadId: 1,
          diaSemana: 1,
          horaInicio: '07:00',
          horaFin: '09:00',
          capacidadMaxima: 2,
          duracionConsultaMinutos: 30,
        }),
      ).rejects.toThrow(/ya tiene asignado/i)
    })

    it('rechaza una hora de fin anterior a la hora de inicio', async () => {
      const medico = await primerMedico()

      await expect(
        crearProgramacion({
          medicoId: medico.id,
          subespecialidadId: 7,
          diaSemana: 3,
          horaInicio: '11:00',
          horaFin: '10:00',
          capacidadMaxima: 2,
          duracionConsultaMinutos: 30,
        }),
      ).rejects.toThrow(/hora de fin/i)
    })

    it('rechaza una capacidad/duración incompatible con la jornada (mock backend)', async () => {
      const medico = await primerMedico()

      await expect(
        crearProgramacion({
          medicoId: medico.id,
          subespecialidadId: 8,
          diaSemana: 2,
          horaInicio: '07:00',
          horaFin: '08:00',
          capacidadMaxima: 100,
          duracionConsultaMinutos: 60,
        }),
      ).rejects.toThrow(/no cabe en la jornada/i)
    })

    it('desactiva una programación y deja de listarse', async () => {
      const medico = await primerMedico()
      const creada = await crearProgramacion({
        medicoId: medico.id,
        subespecialidadId: 6,
        diaSemana: 6,
        horaInicio: '08:00',
        horaFin: '11:00',
        capacidadMaxima: 4,
        duracionConsultaMinutos: 30,
      })

      await desactivarProgramacion(creada.id)

      const lista = await listarProgramacionesPorMedico(medico.id)
      expect(lista.some((item) => item.id === creada.id)).toBe(false)
    })

    it('no expone funciones que el contrato backend no ofrece', () => {
      expect(administracionApi.actualizarProgramacion).toBeUndefined()
      expect(administracionApi.reactivarMedico).toBeUndefined()
      expect(administracionApi.reactivarProgramacion).toBeUndefined()
    })
  })
})
