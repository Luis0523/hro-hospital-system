// Fixtures propios de Mesa COEX para `ExpedienteCicloResponseDTO`, separados
// del dataset visual de `mockDataCoex.js`. Se usan en:
//   - modo mock de las funciones nuevas de coexApi;
//   - tests del normalizador y de la fuente de lote.
//
// Reproducen la forma del backend, NO la de la UI.

export function cicloCoexFixture(over = {}) {
  return {
    id: 'ciclo-001',
    expedienteId: 'exp-001',
    numeroExpediente: 'EXP-2024-035',
    paciente: {
      id: 'pac-001',
      nombres: 'María Fernanda',
      apellidos: 'López García',
      dpi: '2456789010101',
    },
    citaId: 101,
    estadoActual: 'en_transito_entrega',
    version: 1,
    creadoEn: '2026-10-05T08:30:00Z',
    actualizadoEn: '2026-10-05T08:30:00Z',
    movimientos: [],
    ...over,
  }
}

export const CICLO_EN_TRANSITO_ENTREGA = cicloCoexFixture()

export const CICLO_ENTREGADO = cicloCoexFixture({
  id: 'ciclo-002',
  expedienteId: 'exp-002',
  numeroExpediente: 'EXP-2024-002',
  paciente: {
    id: 'pac-002',
    nombres: 'Carlos Eduardo',
    apellidos: 'Ramírez Soto',
    dpi: '1899234560101',
  },
  citaId: 102,
  estadoActual: 'entregado',
})

export const CICLO_EN_TRANSITO_RETORNO = cicloCoexFixture({
  id: 'ciclo-003',
  expedienteId: 'exp-003',
  numeroExpediente: 'EXP-2024-016',
  paciente: {
    id: 'pac-003',
    nombres: 'Ana Lucía',
    apellidos: 'Pérez Morales',
    dpi: '3012456780101',
  },
  citaId: 103,
  estadoActual: 'en_transito_retorno',
})

// Paciente parcial (sin apellidos) para probar composición tolerante.
export const CICLO_PACIENTE_PARCIAL = cicloCoexFixture({
  id: 'ciclo-004',
  expedienteId: 'exp-004',
  numeroExpediente: 'EXP-2024-099',
  paciente: { id: 'pac-004', nombres: 'José', apellidos: null, dpi: null },
  citaId: 104,
  estadoActual: 'en_transito_entrega',
})

export const CICLOS_COEX_FIXTURE = [
  CICLO_EN_TRANSITO_ENTREGA,
  CICLO_ENTREGADO,
  CICLO_EN_TRANSITO_RETORNO,
  CICLO_PACIENTE_PARCIAL,
]

// --- Mocks de las funciones nuevas de coexApi (contrato backend) ---

// El fixture no modela fecha: se ignora al filtrar (se devuelve la lista igual).
export function ciclosCoexMock({ estado, subespecialidadId } = {}) {
  return CICLOS_COEX_FIXTURE.filter((dto) => {
    if (estado && dto.estadoActual !== estado) return false
    if (
      subespecialidadId != null &&
      dto.subespecialidadId !== Number(subespecialidadId)
    ) {
      return false
    }
    return true
  }).map((dto) => ({ ...dto }))
}

export function detalleCicloCoexMock(cicloId) {
  return (
    CICLOS_COEX_FIXTURE.find((dto) => dto.id === cicloId) ??
    cicloCoexFixture({ id: cicloId })
  )
}

export function salidaExpedientesCoexMock(fecha) {
  const items = ciclosCoexMock()
    .filter((dto) => ['localizado', 'en_transito_entrega'].includes(dto.estadoActual))
    .map((dto) => ({
      expedienteId: dto.expedienteId,
      numeroExpediente: dto.numeroExpediente,
      pacienteNombre: [dto.paciente?.nombres, dto.paciente?.apellidos]
        .filter(Boolean)
        .join(' '),
      citaId: dto.citaId,
      subespecialidadNombre: null,
      horaEstimada: null,
      estadoActual: dto.estadoActual,
    }))
  return {
    fecha: fecha ?? null,
    total: items.length,
    items,
  }
}

export function salidaPdfCoexMock() {
  return new Blob(['%PDF-1.4 salida de expedientes (mock)'], { type: 'application/pdf' })
}
