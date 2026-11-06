import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { expedientesDepuracionMock } from '../api/depuracionFixtures'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import { marcarDepurado } from '../api/depuracionArchivoApi'
import { useDepuracionExpediente } from './useDepuracionExpediente'

const PRIMERO = expedientesDepuracionMock[0].numeroExpediente
const SEGUNDO = expedientesDepuracionMock[1].numeroExpediente
const INEXISTENTE = '999999'
const FIXTURES_HOY = 12

async function esperarBitacora(result) {
  await waitFor(() => expect(result.current.bitacoraCargada).toBe(true))
}

describe('useDepuracionExpediente', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('no consulta nada mientras se escribe', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.setNumero(PRIMERO))

    expect(result.current.procesando).toBe(false)
    expect(result.current.pendientes).toHaveLength(0)
    expect(result.current.ultimaDepuracion).toBeNull()
    expect(result.current.depurados).toHaveLength(FIXTURES_HOY)
  })

  it('procesa el expediente al enviarlo y lo agrega a la bitácora', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    let aceptado
    act(() => {
      aceptado = result.current.agregar(PRIMERO)
    })

    expect(aceptado).toBe(true)
    await waitFor(() => expect(result.current.depurados).toHaveLength(FIXTURES_HOY + 1))
    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(PRIMERO)
    expect(result.current.procesando).toBe(false)
    expect(result.current.pendientes).toHaveLength(0)
  })

  it('normaliza un número con guion antes de enviarlo', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.agregar('9275-81'))

    await waitFor(() => expect(result.current.ultimaDepuracion?.numeroExpediente).toBe('927581'))
  })

  it('rechaza un formato inválido sin procesar', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    let aceptado
    act(() => {
      aceptado = result.current.agregar('ABC-123')
    })

    expect(aceptado).toBe(false)
    expect(result.current.estado).toBe('formato_invalido')
    expect(result.current.mensaje).toMatch(/solo dígitos|guion/i)
    expect(result.current.depurados).toHaveLength(FIXTURES_HOY)
  })

  it('reporta no_encontrado cuando el número no existe', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.agregar(INEXISTENTE))

    await waitFor(() => expect(result.current.estado).toBe('no_encontrado'))
    expect(result.current.depurados).toHaveLength(FIXTURES_HOY)
  })

  it('reporta duplicado cuando el expediente ya estaba depurado', async () => {
    await marcarDepurado({ numeroExpediente: SEGUNDO })

    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.agregar(SEGUNDO))

    await waitFor(() => expect(result.current.estado).toBe('duplicado'))
  })

  it('expone la última depuración y la revierte sin dejarla en la bitácora', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.agregar(SEGUNDO))
    await waitFor(() => expect(result.current.depurados).toHaveLength(FIXTURES_HOY + 1))
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(SEGUNDO)

    act(() => result.current.abrirDeshacer())
    expect(result.current.confirmacionDeshacerAbierta).toBe(true)

    await act(async () => {
      await result.current.confirmarDeshacer()
    })

    await waitFor(() => expect(result.current.ultimaDepuracion).toBeNull())
    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
    expect(result.current.depurados).toHaveLength(FIXTURES_HOY)
    expect(result.current.exitoDeshacer).toMatch(/revertida/i)
  })

  it('cancelar el deshacer conserva la última depuración disponible', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())
    await esperarBitacora(result)

    act(() => result.current.agregar(SEGUNDO))
    await waitFor(() => expect(result.current.ultimaDepuracion).toBeTruthy())

    act(() => result.current.abrirDeshacer())
    act(() => result.current.cerrarDeshacer())

    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(SEGUNDO)
  })

  it('no ofrece deshacer si no existe una operación reversible', () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    expect(result.current.ultimaDepuracion).toBeNull()
    act(() => result.current.abrirDeshacer())
    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
  })
})
