import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { expedientesDepuracionMock } from '../api/depuracionFixtures'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import { marcarDepurado } from '../api/depuracionArchivoApi'
import { useDepuracionExpediente } from './useDepuracionExpediente'

const PRIMERO = expedientesDepuracionMock[0].numeroExpediente
const SEGUNDO = expedientesDepuracionMock[1].numeroExpediente
const INEXISTENTE = '999999'

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
    expect(result.current.confirmacionAbierta).toBe(false)
  })

  it('normaliza un número pegado con guion antes de buscar', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero('9275-81'))

    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    expect(result.current.resultado.numeroExpediente).toBe('927581')
  })

  it('en modo manual exige un guion interior y no busca un número sin guion', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.establecerModoCaptura('manual'))
    act(() => result.current.setNumero(PRIMERO))

    await waitFor(() => expect(result.current.estado).toBe('formato_invalido'))
    expect(result.current.mensaje).toMatch(/guion/i)
  })

  it('en modo manual busca la identidad canónica sin enviar el guion', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.establecerModoCaptura('manual'))
    act(() => result.current.setNumero('9275-81'))

    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    expect(result.current.resultado.numeroExpediente).toBe('927581')
    expect(result.current.numero).toBe('9275-81')
  })

  it('reporta no_encontrado cuando el número no existe', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(INEXISTENTE))

    await waitFor(() => expect(result.current.estado).toBe('no_encontrado'))
  })

  it('rechaza un formato inválido sin iniciar búsqueda', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero('ABC-123'))

    await waitFor(() => expect(result.current.estado).toBe('formato_invalido'))
    expect(result.current.resultado).toBeNull()
    expect(result.current.mensaje).toMatch(/solo dígitos|guion/i)
  })

  it('abre y cierra el modal sin depurar automáticamente', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(PRIMERO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))

    act(() => result.current.abrirConfirmacion())
    expect(result.current.confirmacionAbierta).toBe(true)

    act(() => result.current.cerrarConfirmacion())
    expect(result.current.confirmacionAbierta).toBe(false)
    expect(result.current.resultado.numeroExpediente).toBe(PRIMERO)
  })

  it('no ejecuta POST si el modal está cerrado', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(PRIMERO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toBeNull()
    expect(result.current.estado).toBe('encontrado')
  })

  it('confirma la baja desde el modal y la agrega a la bitácora', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(SEGUNDO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    act(() => result.current.abrirConfirmacion())

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    await waitFor(() => expect(result.current.depurados).toHaveLength(1))
    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.numero).toBe('')
    expect(result.current.confirmacionAbierta).toBe(false)
  })

  it('reporta duplicado cuando el expediente ya estaba depurado', async () => {
    await marcarDepurado({ numeroExpediente: SEGUNDO })

    const { result } = renderHook(() => useDepuracionExpediente())
    act(() => result.current.setNumero(SEGUNDO))

    await waitFor(() => expect(result.current.estado).toBe('duplicado'))
    expect(result.current.confirmacionAbierta).toBe(false)
  })

  it('expone la última depuración y la revierte sin dejarla en la bitácora', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(SEGUNDO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    act(() => result.current.abrirConfirmacion())
    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    await waitFor(() => expect(result.current.depurados).toHaveLength(1))
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(SEGUNDO)

    act(() => result.current.abrirDeshacer())
    expect(result.current.confirmacionDeshacerAbierta).toBe(true)

    await act(async () => {
      await result.current.confirmarDeshacer()
    })

    await waitFor(() => expect(result.current.ultimaDepuracion).toBeNull())
    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
    expect(result.current.depurados).toHaveLength(0)
    expect(result.current.exitoDeshacer).toMatch(/revertida/i)

    act(() => result.current.setNumero(SEGUNDO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    expect(result.current.resultado.numeroExpediente).toBe(SEGUNDO)
  })

  it('cancelar el modal conserva la última depuración disponible', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero(SEGUNDO))
    await waitFor(() => expect(result.current.estado).toBe('encontrado'))
    act(() => result.current.abrirConfirmacion())
    await act(async () => {
      await result.current.confirmarDepuracion()
    })
    await waitFor(() => expect(result.current.ultimaDepuracion).toBeTruthy())

    act(() => result.current.abrirDeshacer())
    act(() => result.current.cerrarDeshacer())

    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(SEGUNDO)
    expect(result.current.depurados).toHaveLength(1)
  })

  it('no ofrece deshacer si no existe una operación reversible', () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    expect(result.current.ultimaDepuracion).toBeNull()
    act(() => result.current.abrirDeshacer())
    expect(result.current.confirmacionDeshacerAbierta).toBe(false)
  })
})
