import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
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
  crearDiaNoLaborable,
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
  eliminarDiaNoLaborable,
  listarDiasNoLaborables,
  listarDiasNoLaborablesFuturos,
  listarDiasNoLaborablesPorRango,
  listarEspecialidades,
  listarEspaciosFisicos,
  listarMedicos,
  listarProgramacionesPorMedico,
  listarProgramacionesPorSubespecialidad,
  listarProgramaciones,
  listarSubespecialidades,
  actualizarProgramacion,
  reactivarEspecialidad,
  reactivarEspacioFisico,
  reactivarMedico,
  reactivarProgramacion,
  reactivarSubespecialidad,
} from './administracionApi'
import { reiniciarCatalogosMock } from './mockData'
import { aISO, desdeISO, hoyISO, sumarMes } from '../utils/fechas'

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
    const diaCreado = await crearDiaNoLaborable({ fecha: '2026-09-10', motivo: 'Prueba' })
    await listarDiasNoLaborables()
    await listarDiasNoLaborablesFuturos()
    await listarDiasNoLaborablesPorRango('2026-09-01', '2026-09-30')
    await eliminarDiaNoLaborable(diaCreado.id)

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

    it('filtra especialidades por estado', async () => {
      expect((await listarEspecialidades()).every((item) => item.activo)).toBe(true)

      const inactivas = await listarEspecialidades('inactivos')
      expect(inactivas.length).toBeGreaterThan(0)
      expect(inactivas.every((item) => !item.activo)).toBe(true)

      const todas = await listarEspecialidades('todos')
      expect(todas.some((item) => !item.activo)).toBe(true)
    })

    it('reactiva una especialidad desactivada', async () => {
      const [primera] = await listarEspecialidades()
      await desactivarEspecialidad(primera.id)
      expect((await listarEspecialidades()).some((item) => item.id === primera.id)).toBe(false)

      const reactivada = await reactivarEspecialidad(primera.id)
      expect(reactivada.activo).toBe(true)
      expect((await listarEspecialidades()).some((item) => item.id === primera.id)).toBe(true)
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

    it('filtra subespecialidades por estado y especialidad', async () => {
      const pediatria = (await listarEspecialidades()).find((item) => item.nombre === 'Pediatría')

      const activas = await listarSubespecialidades(pediatria.id, 'activos')
      expect(activas.every((item) => item.activo)).toBe(true)

      const inactivas = await listarSubespecialidades(pediatria.id, 'inactivos')
      expect(inactivas).toHaveLength(1)
      expect(inactivas[0].nombre).toBe('Alergología Pediátrica')

      const todas = await listarSubespecialidades(pediatria.id, 'todos')
      expect(todas.length).toBeGreaterThan(activas.length)
    })

    it('reactiva una subespecialidad cuya especialidad padre está activa', async () => {
      const [inactiva] = await listarSubespecialidades(2, 'inactivos')
      const reactivada = await reactivarSubespecialidad(inactiva.id)

      expect(reactivada.activo).toBe(true)
      expect(
        (await listarSubespecialidades(2, 'activos')).some((item) => item.id === inactiva.id),
      ).toBe(true)
    })

    it('rechaza reactivar una subespecialidad con especialidad padre inactiva (400)', async () => {
      const [hijaInactiva] = await listarSubespecialidades(7, 'inactivos')

      await expect(reactivarSubespecialidad(hijaInactiva.id)).rejects.toMatchObject({ status: 400 })
      await expect(reactivarSubespecialidad(hijaInactiva.id)).rejects.toThrow(/especialidad padre/i)
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

    it('filtra espacios físicos por estado y reactiva', async () => {
      const inactivos = await listarEspaciosFisicos(undefined, 'inactivos')
      expect(inactivos.length).toBeGreaterThan(0)
      expect(inactivos.every((item) => !item.activo)).toBe(true)

      const reactivado = await reactivarEspacioFisico(inactivos[0].id)
      expect(reactivado.activo).toBe(true)
      expect(
        (await listarEspaciosFisicos(undefined, 'activos')).some(
          (item) => item.id === inactivos[0].id,
        ),
      ).toBe(true)
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

    it('filtra médicos por estado y reactiva', async () => {
      expect((await listarMedicos()).every((item) => item.activo)).toBe(true)

      const inactivos = await listarMedicos('inactivos')
      expect(inactivos.length).toBeGreaterThan(0)
      expect(inactivos.every((item) => !item.activo)).toBe(true)

      const todas = await listarMedicos('todos')
      expect(todas.length).toBeGreaterThan(inactivos.length)

      const reactivado = await reactivarMedico(inactivos[0].id)
      expect(reactivado.activo).toBe(true)
      expect(
        (await listarMedicos('activos')).some((item) => item.id === inactivos[0].id),
      ).toBe(true)
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

    it('lista la programación general con filtros combinados', async () => {
      const medico = await primerMedico()

      const todas = await listarProgramaciones()
      expect(todas.length).toBeGreaterThan(0)
      expect(todas.every((item) => item.activo)).toBe(true)

      const porMedico = await listarProgramaciones({ medicoId: medico.id })
      expect(porMedico.length).toBeGreaterThan(0)
      expect(porMedico.every((item) => item.medicoId === medico.id)).toBe(true)

      const porDia = await listarProgramaciones({ diaSemana: 1 })
      expect(porDia.length).toBeGreaterThan(0)
      expect(porDia.every((item) => item.diaSemana === 1)).toBe(true)

      const inactivas = await listarProgramaciones({ estado: 'inactivos' })
      expect(inactivas.length).toBeGreaterThan(0)
      expect(inactivas.every((item) => !item.activo)).toBe(true)
    })

    it('actualiza horario, capacidad y duración sin cambiar médico/subespecialidad/día', async () => {
      const medico = await primerMedico()
      const [programacion] = await listarProgramaciones({ medicoId: medico.id })

      const actualizada = await actualizarProgramacion(programacion.id, {
        horaInicio: '08:00',
        horaFin: '11:00',
        capacidadMaxima: 6,
        duracionConsultaMinutos: 30,
      })

      expect(actualizada.medicoId).toBe(programacion.medicoId)
      expect(actualizada.subespecialidadId).toBe(programacion.subespecialidadId)
      expect(actualizada.diaSemana).toBe(programacion.diaSemana)
      expect(actualizada.horaInicio).toBe('08:00:00')
      expect(actualizada.horaFin).toBe('11:00:00')
      expect(actualizada.capacidadMaxima).toBe(6)
      expect(actualizada.duracionConsultaMinutos).toBe(30)
    })

    it('rechaza una actualización con capacidad que no cabe en la jornada', async () => {
      const medico = await primerMedico()
      const [programacion] = await listarProgramaciones({ medicoId: medico.id })

      await expect(
        actualizarProgramacion(programacion.id, {
          horaInicio: '08:00',
          horaFin: '09:00',
          capacidadMaxima: 50,
          duracionConsultaMinutos: 60,
        }),
      ).rejects.toThrow(/no cabe en la jornada/i)
    })

    it('reactiva una programación con médico y subespecialidad activos', async () => {
      const reactivable = await reactivarProgramacion(
        '6f0d3a2c-1a11-4d21-9c01-000000000207',
      )

      expect(reactivable.activo).toBe(true)
    })

    it('rechaza reactivar una programación con médico inactivo', async () => {
      await expect(
        reactivarProgramacion('6f0d3a2c-1a11-4d21-9c01-000000000205'),
      ).rejects.toThrow(/médico/i)
    })

    it('rechaza reactivar una programación con subespecialidad inactiva', async () => {
      await expect(
        reactivarProgramacion('6f0d3a2c-1a11-4d21-9c01-000000000206'),
      ).rejects.toThrow(/subespecialidad/i)
    })

    it('no expone operaciones que el backend no ofrece', () => {
      expect(typeof actualizarProgramacion).toBe('function')
      expect(typeof reactivarProgramacion).toBe('function')
      expect(typeof reactivarMedico).toBe('function')
    })
  })

  describe('días no laborables', () => {
    it('lista todos los días no laborables ordenados', async () => {
      const lista = await listarDiasNoLaborables()

      expect(lista.length).toBeGreaterThan(0)
      expect(typeof lista[0].id).toBe('number')
      expect(lista[0]).toHaveProperty('fecha')
      expect(lista[0]).toHaveProperty('motivo')
      expect(lista[0]).toHaveProperty('creadoPorId')
      expect(lista[0]).toHaveProperty('creadoPorNombre')
      expect(lista[0]).toHaveProperty('creadoEn')
      const fechas = lista.map((item) => item.fecha)
      expect([...fechas].sort()).toEqual(fechas)
    })

    it('lista por rango de forma inclusiva', async () => {
      const lista = await listarDiasNoLaborablesPorRango('2026-09-01', '2026-10-31')
      const fechas = lista.map((item) => item.fecha)

      expect(fechas).toContain('2026-09-15')
      expect(fechas).toContain('2026-10-20')
      expect(fechas).not.toContain('2026-11-01')
      expect(fechas).not.toContain('2025-12-25')
    })

    it('lista solo fechas futuras incluyendo una recién creada', async () => {
      const hoy = desdeISO(hoyISO())
      const destino = sumarMes(hoy.anio, hoy.mes, 3)
      const fecha = aISO(destino.anio, destino.mes, 10)
      await crearDiaNoLaborable({ fecha, motivo: 'Asueto futuro' })

      const lista = await listarDiasNoLaborablesFuturos()
      expect(lista.some((item) => item.fecha === fecha)).toBe(true)
      expect(lista.every((item) => item.fecha >= hoyISO())).toBe(true)
    })

    it('crea un día no laborable y recorta el motivo', async () => {
      const creado = await crearDiaNoLaborable({
        fecha: '2026-09-10',
        motivo: '  Asueto local  ',
      })

      expect(typeof creado.id).toBe('number')
      expect(creado.fecha).toBe('2026-09-10')
      expect(creado.motivo).toBe('Asueto local')
      expect(creado.creadoPorNombre).toBeTruthy()
    })

    it('rechaza una fecha duplicada', async () => {
      await expect(
        crearDiaNoLaborable({ fecha: '2026-09-15', motivo: 'Repetido' }),
      ).rejects.toThrow(/ya está registrada como día no laborable/i)
    })

    it('rechaza una fecha con citas activas', async () => {
      await expect(
        crearDiaNoLaborable({ fecha: '2026-09-20', motivo: 'Mantenimiento' }),
      ).rejects.toThrow(/cita\(s\) programada\(s\)/i)
    })

    it('elimina un día no laborable y deja de listarse', async () => {
      const creado = await crearDiaNoLaborable({ fecha: '2026-09-11', motivo: 'Temporal' })
      await eliminarDiaNoLaborable(creado.id)

      const lista = await listarDiasNoLaborables()
      expect(lista.some((item) => item.id === creado.id)).toBe(false)
    })

    it('devuelve 404 al eliminar un id inexistente', async () => {
      await expect(eliminarDiaNoLaborable(999999)).rejects.toMatchObject({ status: 404 })
    })

    it('no expone operaciones que el backend no ofrece', () => {
      expect(administracionApi.actualizarDiaNoLaborable).toBeUndefined()
      expect(administracionApi.reactivarDiaNoLaborable).toBeUndefined()
      expect(administracionApi.forzarDiaNoLaborable).toBeUndefined()
    })
  })
})
