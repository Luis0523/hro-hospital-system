import { beforeEach, describe, expect, it } from 'vitest'
import {
  alternarFavorito,
  claveMedicamento,
  eliminarMedicamentoDelCatalogo,
  guardarMedicamentoEnCatalogo,
  leerMedicamentosGuardados,
  limpiarCatalogoMedicamentos,
} from './medicamentosGuardados'

const AMOXICILINA = {
  nombre: 'Amoxicilina',
  dosis: '500 mg',
  via: 'Oral',
  frecuencia: 'Cada 8 horas',
}

beforeEach(() => {
  localStorage.clear()
})

describe('medicamentosGuardados', () => {
  it('inicia vacío y guarda un medicamento con id', () => {
    expect(leerMedicamentosGuardados()).toEqual([])

    const lista = guardarMedicamentoEnCatalogo(AMOXICILINA)

    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject(AMOXICILINA)
    expect(lista[0].id).toBeTruthy()
    expect(leerMedicamentosGuardados()).toHaveLength(1)
  })

  it('normaliza espacios y mayúsculas sin duplicar', () => {
    guardarMedicamentoEnCatalogo(AMOXICILINA)
    const lista = guardarMedicamentoEnCatalogo({
      ...AMOXICILINA,
      nombre: '  amoxicilina ',
      dosis: '500  mg',
    })

    expect(lista).toHaveLength(1)
    expect(lista[0].nombre).toBe('amoxicilina')
    expect(lista[0].dosis).toBe('500 mg')
  })

  it('mantiene medicamentos distintos y los ordena por nombre', () => {
    guardarMedicamentoEnCatalogo({ ...AMOXICILINA, nombre: 'Ibuprofeno', dosis: '400 mg' })
    guardarMedicamentoEnCatalogo(AMOXICILINA)

    expect(leerMedicamentosGuardados().map((item) => item.nombre)).toEqual([
      'Amoxicilina',
      'Ibuprofeno',
    ])
  })

  it('elimina por id y permite vaciar el catálogo', () => {
    const [guardado] = guardarMedicamentoEnCatalogo(AMOXICILINA)

    expect(eliminarMedicamentoDelCatalogo(guardado.id)).toEqual([])

    guardarMedicamentoEnCatalogo(AMOXICILINA)
    expect(limpiarCatalogoMedicamentos()).toEqual([])
    expect(leerMedicamentosGuardados()).toEqual([])
  })

  it('ignora registros inválidos o dañados', () => {
    localStorage.setItem(
      'hro_recetario_medicamentos_guardados',
      JSON.stringify([{ nombre: 'Sin dosis' }, { ...AMOXICILINA, id: 'a' }]),
    )

    const lista = leerMedicamentosGuardados()
    expect(lista).toHaveLength(1)
    expect(lista[0].nombre).toBe('Amoxicilina')

    localStorage.setItem('hro_recetario_medicamentos_guardados', '{')
    expect(leerMedicamentosGuardados()).toEqual([])
  })

  it('marca favoritos y los ordena antes que el resto', () => {
    const [amoxicilina] = guardarMedicamentoEnCatalogo(AMOXICILINA)
    guardarMedicamentoEnCatalogo({ ...AMOXICILINA, nombre: 'Ibuprofeno', dosis: '400 mg' })

    const conFavorito = alternarFavorito(amoxicilina.id)

    expect(conFavorito[0].nombre).toBe('Amoxicilina')
    expect(conFavorito[0].favorito).toBe(true)
    expect(conFavorito[1].favorito).toBe(false)
  })

  it('genera claves lógicas estables', () => {
    expect(claveMedicamento(AMOXICILINA)).toBe('amoxicilina|500 mg|oral|cada 8 horas')
    expect(claveMedicamento({ ...AMOXICILINA, nombre: '  AMOXICILINA  ' })).toBe(
      'amoxicilina|500 mg|oral|cada 8 horas',
    )
  })
})
