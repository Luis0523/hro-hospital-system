import { beforeEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import client from '@/shared/api/client'
import { AuthProvider, useAuth } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import ArchivoLayout from '@/modules/archivo/components/ArchivoLayout.jsx'
import { useIdentidadEstacionArchivo } from './useIdentidadEstacionArchivo'

function Estacion() {
  useIdentidadEstacionArchivo()
  return null
}

function Sonda() {
  const { usuario } = useAuth()
  return <span data-testid="rol">{usuario?.rol ?? 'sin-rol'}</span>
}

function montarConLayout(hijo) {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <ArchivoLayout>{hijo}</ArchivoLayout>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('useIdentidadEstacionArchivo (hook)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('asume el rol archivo mientras la estación está montada', async () => {
    render(
      <AuthProvider>
        <Estacion />
        <Sonda />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('archivo'))
  })

  it('restaura la identidad previa al desmontar la estación', async () => {
    function Demo({ activo }) {
      return (
        <>
          {activo ? <Estacion /> : null}
          <Sonda />
        </>
      )
    }

    const { rerender } = render(
      <AuthProvider>
        <Demo activo />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('archivo'))

    rerender(
      <AuthProvider>
        <Demo activo={false} />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('enfermeria'))
  })

  it('montar/desmontar varias veces no corrompe la identidad', async () => {
    function Demo({ activo }) {
      return (
        <>
          {activo ? <Estacion /> : null}
          <Sonda />
        </>
      )
    }

    const { rerender } = render(
      <AuthProvider>
        <Demo activo />
      </AuthProvider>,
    )

    for (let i = 0; i < 3; i += 1) {
      await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('archivo'))
      rerender(
        <AuthProvider>
          <Demo activo={false} />
        </AuthProvider>,
      )
      await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('enfermeria'))
      rerender(
        <AuthProvider>
          <Demo activo />
        </AuthProvider>,
      )
    }
  })
})

describe('ArchivoLayout — identidad antes de los requests', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'hro_usuario',
      JSON.stringify({ rol: 'enfermeria', idExterno: 'enfermeria-01' }),
    )
  })

  it('la PRIMERA petición de la estación ya usa el rol archivo', async () => {
    const rolesEnviados = []
    const adaptadorOriginal = client.defaults.adapter
    client.defaults.adapter = async (config) => {
      rolesEnviados.push(config.headers['X-Usuario-Rol'])
      return { data: { data: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    function HijoQuePideAlMontar() {
      useEffect(() => {
        client.get('/expedientes/jornada').catch(() => {})
      }, [])
      return null
    }

    try {
      montarConLayout(<HijoQuePideAlMontar />)

      await waitFor(() => expect(rolesEnviados.length).toBeGreaterThan(0))
      expect(rolesEnviados[0]).toBe('archivo')
    } finally {
      client.defaults.adapter = adaptadorOriginal
    }
  })

  it('no entra en bucle de renders', async () => {
    let rendersHijo = 0

    function HijoQueCuenta() {
      rendersHijo += 1
      return null
    }

    montarConLayout(<HijoQueCuenta />)

    await waitFor(() => expect(rendersHijo).toBeGreaterThan(0))
    const enReposo = rendersHijo
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(rendersHijo).toBe(enReposo)
  })
})
