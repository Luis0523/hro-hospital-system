import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// jsdom no implementa ResizeObserver y Headless UI (Modal/Dialog) puede requerirlo.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listarUsuarios: vi.fn(actual.listarUsuarios),
    obtenerAuditoria: vi.fn(actual.obtenerAuditoria),
  }
})

import { listarUsuarios, obtenerAuditoria } from '../api/administracionApi.js'
import AuditoriaPage from './AuditoriaPage.jsx'

function pagina({ content = [], number = 0, totalPages = 1 } = {}) {
  return {
    content,
    number,
    size: 20,
    totalElements: content.length,
    totalPages,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  }
}

function registro(overrides = {}) {
  return {
    id: 1,
    tablaAfectada: 'cita',
    entidadId: '10231',
    accion: 'crear',
    usuarioId: 1,
    usuarioNombre: 'Ana Pérez',
    valoresAnteriores: null,
    valoresNuevos: '{"estado":"confirmada"}',
    fecha: '2026-09-26T14:20:00Z',
    ...overrides,
  }
}

const USUARIOS = [
  { id: 1, idExterno: 'ana-perez', nombreMostrar: 'Ana Pérez', rolPrincipal: 'administrador', activo: true },
  { id: 4, idExterno: 'jorge-salas', nombreMostrar: 'Jorge Salas', rolPrincipal: 'personal_citas', activo: true },
]

describe('AuditoriaPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    listarUsuarios.mockReset()
    obtenerAuditoria.mockReset()
    listarUsuarios.mockResolvedValue(USUARIOS)
    obtenerAuditoria.mockResolvedValue(pagina({ content: [registro()], totalPages: 1 }))
  })

  it('muestra el heading y los filtros con etiquetas accesibles', async () => {
    render(<AuditoriaPage />)

    expect(screen.getByRole('heading', { name: 'Auditoría' })).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Tabla')).toBeInTheDocument()
    expect(screen.getByLabelText('Acción')).toBeInTheDocument()

    await screen.findByRole('table')
  })

  it('consulta con page 0, size 20 y sin filtros (params omitidos)', async () => {
    render(<AuditoriaPage />)

    await waitFor(() => expect(obtenerAuditoria).toHaveBeenCalledTimes(1))
    expect(obtenerAuditoria).toHaveBeenCalledWith({
      tabla: undefined,
      usuarioId: undefined,
      accion: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      page: 0,
      size: 20,
    })
  })

  it('muestra registros y la paginación (Página 1 de 1, extremos deshabilitados)', async () => {
    render(<AuditoriaPage />)

    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(tabla).getByText('Crear')).toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: 'Paginación de resultados' })).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('filtra por usuario y reinicia a la página 0', async () => {
    const user = userEvent.setup()
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    await user.selectOptions(screen.getByLabelText('Usuario'), '4')

    await waitFor(() =>
      expect(obtenerAuditoria).toHaveBeenLastCalledWith(
        expect.objectContaining({ usuarioId: 4, page: 0 }),
      ),
    )
  })

  it('tabla y acción son campos libres con sugerencias no exhaustivas', async () => {
    const { container } = render(<AuditoriaPage />)
    await screen.findByRole('table')

    const inputTabla = screen.getByLabelText('Tabla')
    const inputAccion = screen.getByLabelText('Acción')
    expect(inputTabla).toHaveAttribute('list')
    expect(inputAccion).toHaveAttribute('list')
    expect(container.querySelector('datalist option[value="cita"]')).not.toBeNull()
    expect(container.querySelector('datalist option[value="crear"]')).not.toBeNull()

    fireEvent.change(inputTabla, { target: { value: 'cita' } })
    fireEvent.change(inputAccion, { target: { value: 'crear' } })

    await waitFor(() =>
      expect(obtenerAuditoria).toHaveBeenLastCalledWith(
        expect.objectContaining({ tabla: 'cita', accion: 'crear', page: 0 }),
      ),
    )
  })

  it('envía fechas tal cual sin bloquear cuando fin < inicio', async () => {
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-30' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-01' } })

    await waitFor(() =>
      expect(obtenerAuditoria).toHaveBeenLastCalledWith(
        expect.objectContaining({ fechaInicio: '2026-09-30', fechaFin: '2026-09-01' }),
      ),
    )
    expect(screen.queryByText(/no puede ser anterior/i)).not.toBeInTheDocument()
  })

  it('permite navegar entre páginas', async () => {
    obtenerAuditoria.mockImplementation(async ({ page = 0 } = {}) =>
      pagina({ content: [registro()], number: page, totalPages: 3 }),
    )
    const user = userEvent.setup()
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() =>
      expect(obtenerAuditoria).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })),
    )
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() =>
      expect(obtenerAuditoria).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0 })),
    )
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay coincidencias', async () => {
    obtenerAuditoria.mockResolvedValueOnce(pagina({ content: [], totalPages: 0 }))
    render(<AuditoriaPage />)

    expect(await screen.findByText('Sin registros de auditoría')).toBeInTheDocument()
  })

  it('muestra error genérico y permite reintentar', async () => {
    obtenerAuditoria.mockRejectedValueOnce(new Error('Fallo de red'))
    const user = userEvent.setup()
    render(<AuditoriaPage />)

    expect(await screen.findByText('Fallo de red')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()
  })

  it('ante 403 muestra una vista de permisos sin stack trace', async () => {
    obtenerAuditoria.mockRejectedValueOnce({
      status: 403,
      codigo: 'ACCESO_DENEGADO',
      message: 'No tiene permisos para realizar esta operación.',
    })
    const { container } = render(<AuditoriaPage />)

    expect(
      await screen.findByRole('heading', { name: /No tienes permisos para consultar la auditoría/i }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Error:|at \w+ \(/)
  })

  it('no renderiza el JSON en la tabla y lo muestra en el detalle', async () => {
    const user = userEvent.setup()
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    expect(screen.queryByText(/"estado":"confirmada"/)).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Ver detalle del registro 1/ })[0])

    expect(await screen.findByRole('heading', { name: 'Detalle de auditoría' })).toBeInTheDocument()
    expect(screen.getByText('Valores anteriores')).toBeInTheDocument()
    expect(screen.getByText('Valores nuevos')).toBeInTheDocument()
    expect(screen.getByText(/"estado": "confirmada"/)).toBeInTheDocument()
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0)
  })

  it('en el detalle muestra el texto original si el JSON es inválido', async () => {
    obtenerAuditoria.mockResolvedValueOnce(
      pagina({
        content: [registro({ valoresNuevos: 'texto plano no JSON' })],
        totalPages: 1,
      }),
    )
    const user = userEvent.setup()
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    await user.click(screen.getAllByRole('button', { name: /Ver detalle del registro 1/ })[0])

    expect(await screen.findByText('texto plano no JSON')).toBeInTheDocument()
  })

  it('es solo lectura: sin copiar, exportar, restaurar ni editar', async () => {
    render(<AuditoriaPage />)
    await screen.findByRole('table')

    expect(
      screen.queryByRole('button', { name: /copiar|exportar|restaurar|editar|eliminar|excel|pdf|csv|imprimir/i }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('un fallo al cargar usuarios no rompe la auditoría', async () => {
    listarUsuarios.mockRejectedValueOnce(new Error('usuarios no disponibles'))
    render(<AuditoriaPage />)

    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()

    const select = screen.getByLabelText('Usuario')
    expect(select.querySelectorAll('option')).toHaveLength(1)
  })

  it('usa tabla semántica y muestra loading accesible', async () => {
    obtenerAuditoria.mockReturnValue(new Promise(() => {}))
    render(<AuditoriaPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando auditoría...')
  })

  it('expone encabezados de columna con scope', async () => {
    render(<AuditoriaPage />)
    const tabla = await screen.findByRole('table')

    const encabezados = within(tabla).getAllByRole('columnheader')
    expect(encabezados).toHaveLength(6)
    expect(encabezados[0]).toHaveAttribute('scope', 'col')
  })
})
