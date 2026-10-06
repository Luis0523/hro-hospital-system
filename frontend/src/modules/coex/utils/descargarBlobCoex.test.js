import { afterEach, describe, expect, it, vi } from 'vitest'
import { descargarBlobCoex, nombreArchivoSalidaCoex } from './descargarBlobCoex'

describe('nombreArchivoSalidaCoex', () => {
  it('usa la fecha ISO en el nombre', () => {
    expect(nombreArchivoSalidaCoex('2026-10-05')).toBe('salida-expedientes-2026-10-05.pdf')
  })

  it('usa un fallback determinista si la fecha falta o es inválida', () => {
    expect(nombreArchivoSalidaCoex()).toBe('salida-expedientes-sin-fecha.pdf')
    expect(nombreArchivoSalidaCoex('')).toBe('salida-expedientes-sin-fecha.pdf')
    expect(nombreArchivoSalidaCoex('05/10/2026')).toBe('salida-expedientes-sin-fecha.pdf')
  })
})

describe('descargarBlobCoex', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('crea la descarga, usa el nombre esperado y limpia el enlace', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const click = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})
    const remove = vi.spyOn(Element.prototype, 'remove').mockImplementation(() => {})

    const resultado = descargarBlobCoex(blob, 'salida-expedientes-2026-10-05.pdf')

    expect(resultado).toBe(true)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    expect(click).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('retorna false si no hay blob', () => {
    expect(descargarBlobCoex(null, 'x.pdf')).toBe(false)
  })
})
