import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { expedientesMock } from '../api/mockData'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import { marcarDepurado } from '../api/depuracionArchivoApi'
import { useDepuracionExpediente } from './useDepuracionExpediente'

const EXPEDIENTES = expedientesMock.filter((expediente) => expediente.numeroExpediente)
const PRIMERO = EXPEDIENTES[0].numeroExpediente
const SEGUNDO = EXPEDIENTES[1].numeroExpediente

describe('useDepuracionExpediente', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('busca automáticamente y encuentra el expediente', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(PRIMERO))

    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    expect(result.current.resultado.numeroExpediente).toBe(PRIMERO)
    expect(result.current.resultado.pacienteNombre).toBeTruthy()
  })

  it('reporta no_encontrado cuando el número no existe', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero('NO-EXISTE'))

    await waitFor(() => expect(result.current.estado).toBe('no_encontrado'))
  })

  it('confirma la baja y la agrega a la bitácora', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(SEGUNDO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    await waitFor(() => expect(result.current.depurados).toHaveLength(1))
    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.numero).toBe('')
  })

  it('reporta duplicado cuando el expediente ya estaba depurado', async () => {
    await marcarDepurado({ numeroExpediente: SEGUNDO })

    const { result } = renderHook(() => useDepuracionExpediente())
    act(() => result.current.setNumero(SEGUNDO))

    await waitFor(() => expect(result.current.estado).toBe('duplicado'))
  })
})
