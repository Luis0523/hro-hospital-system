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
import {
  actualizarEspecialidad,
  actualizarEspacioFisico,
  actualizarSubespecialidad,
  crearEspecialidad,
  crearEspacioFisico,
  crearSubespecialidad,
  desactivarEspecialidad,
  desactivarEspacioFisico,
  desactivarSubespecialidad,
  listarEspecialidades,
  listarEspaciosFisicos,
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
})
