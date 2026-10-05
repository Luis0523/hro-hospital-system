import { describe, expect, it } from 'vitest'
import { ACCIONES_ARCHIVO, accionesParaEstado, mensajeSinAccion } from './accionesArchivo'

describe('accionesParaEstado (matriz Operador de Archivo)', () => {
  it('sin_ciclo solo permite check-in', () => {
    expect(accionesParaEstado('sin_ciclo').map((accion) => accion.id)).toEqual(['check_in'])
  })

  it('pendiente_localizar permite iniciar búsqueda', () => {
    expect(accionesParaEstado('pendiente_localizar').map((accion) => accion.id)).toEqual([
      'iniciar_busqueda',
    ])
  })

  it('en_busqueda permite localizar y no localizado', () => {
    expect(accionesParaEstado('en_busqueda').map((accion) => accion.id)).toEqual([
      'localizar',
      'no_localizado',
    ])
  })

  it('no_localizado permite reintentar búsqueda', () => {
    expect(accionesParaEstado('no_localizado').map((accion) => accion.id)).toEqual([
      'reintentar_busqueda',
    ])
  })

  it('localizado permite despachar', () => {
    expect(accionesParaEstado('localizado').map((accion) => accion.id)).toEqual(['despachar'])
  })

  it('en_transito_entrega y entregado no ofrecen acción de Archivo', () => {
    expect(accionesParaEstado('en_transito_entrega')).toEqual([])
    expect(accionesParaEstado('entregado')).toEqual([])
  })

  it('en_transito_retorno permite archivar; archivado no ofrece acción', () => {
    expect(accionesParaEstado('en_transito_retorno').map((accion) => accion.id)).toEqual([
      'archivar',
    ])
    expect(accionesParaEstado('archivado')).toEqual([])
  })

  it('no existe ninguna acción entregar ni retornar (Enfermería)', () => {
    const ids = Object.values(ACCIONES_ARCHIVO).map((accion) => accion.id)
    expect(ids).not.toContain('entregar')
    expect(ids).not.toContain('retornar')
  })
})

describe('mensajeSinAccion', () => {
  it('informa el estado de espera/custodia para estados sin acción', () => {
    expect(mensajeSinAccion('en_transito_entrega')).toMatch(/COEX/i)
    expect(mensajeSinAccion('entregado')).toBe('En COEX')
    expect(mensajeSinAccion('archivado')).toBeTruthy()
  })

  it('no devuelve mensaje para estados con acción', () => {
    expect(mensajeSinAccion('localizado')).toBeNull()
    expect(mensajeSinAccion('sin_ciclo')).toBeNull()
  })
})
