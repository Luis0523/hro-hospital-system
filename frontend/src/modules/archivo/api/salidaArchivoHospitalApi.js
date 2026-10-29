import client from '@/shared/api/client'
import { construirPdfSimple } from '../utils/pdfMock'

// Salidas de archivo consultadas DIRECTAMENTE al API del hospital (Registro
// Médico). Registro compartido por estación y fecha.
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// Estado del mock (solo dev/test): lista en memoria por sesión.
let mockSalidas = []

const UMBRAL_MOCK = 840999

function clasificarMock(numeroExpediente) {
  try {
    return Number.parseInt(numeroExpediente, 10) > UMBRAL_MOCK ? 'activo' : 'pasivo'
  } catch {
    return null
  }
}

export async function listarSalidasHospital({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    return mockSalidas
      .filter((s) => (!fecha || s.fecha === fecha) && (!estacionId || s.estacionId === estacionId))
      .map((s) => ({ ...s }))
  }
  return desenvolver(
    await client.get('/salidas-archivo-hospital', { params: { fecha, estacionId } }),
  )
}

/**
 * Registra una salida consultando al hospital (vía backend). Lanza error con
 * `status`: 404 expediente inexistente · 409 ya marcado · 502 integración.
 */
export async function registrarSalidaHospital({
  numeroExpediente,
  estacionId,
  etiqueta = null,
} = {}) {
  const idEtiqueta = Number(etiqueta?.id)
  const etiquetaId = Number.isFinite(idEtiqueta) ? idEtiqueta : null
  const esClinicaMujer = etiqueta?.codigo === 'clinica_mujer'

  if (USE_MOCK) {
    const nueva = {
      id: `s-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      fecha: new Date().toISOString().slice(0, 10),
      estacionId,
      numeroExpediente,
      pacienteNombre: 'Paciente de prueba',
      etiqueta: etiqueta ? { ...etiqueta } : null,
      esClinicaMujer,
      clasificacion: clasificarMock(numeroExpediente),
      registradoEn: new Date().toISOString(),
    }
    mockSalidas = [nueva, ...mockSalidas]
    return nueva
  }
  return desenvolver(
    await client.post('/salidas-archivo-hospital', {
      numeroExpediente,
      estacionId,
      ...(etiquetaId ? { etiquetaId } : {}),
      esClinicaMujer,
    }),
  )
}

export async function descargarSalidasHospitalPdf({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    return construirPdfSimple([
      'HOSPITAL REGIONAL DE OCCIDENTE',
      'CONTROL DE SALIDA DE EXPEDIENTES',
      `Fecha: ${fecha ?? ''}`,
      '(Documento simulado en modo mock)',
    ])
  }
  return client.get('/salidas-archivo-hospital/pdf', {
    params: { fecha, estacionId },
    responseType: 'blob',
  })
}
