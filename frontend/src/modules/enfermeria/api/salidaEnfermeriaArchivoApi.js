import client from '@/shared/api/client'
import { construirPdfSimple } from '@/modules/archivo/utils/pdfMock'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'
const desenvolver = (respuesta) => respuesta?.data ?? respuesta

const ETIQUETAS = {
  normal: 'Normal',
  privado_libertad: 'Privado de libertad',
  personal: 'Personal',
  presentacion: 'Presentación',
}

let salidasMock = []

export async function listarSalidasEnfermeriaArchivo({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    return salidasMock
      .filter((s) => s.fecha === fecha && String(s.estacionId) === String(estacionId))
      .map((s) => ({ ...s }))
  }
  return desenvolver(
    await client.get('/salidas-enfermeria-archivo', { params: { fecha, estacionId } }),
  )
}

export async function registrarSalidaEnfermeriaArchivo({
  numeroExpediente,
  estacionId,
  fecha,
  tipo = 'normal',
  primeraVez = false,
  clinicaPersonalId = null,
} = {}) {
  if (USE_MOCK) {
    const numero = String(numeroExpediente ?? '').trim()
    if (!numero) throw new Error('El número de expediente es obligatorio')
    if (
      salidasMock.some(
        (s) =>
          s.fecha === fecha &&
          String(s.estacionId) === String(estacionId) &&
          s.numeroExpediente === numero,
      )
    ) {
      const error = new Error(
        'El expediente ya fue registrado como salida de enfermería a archivo.',
      )
      error.status = 409
      throw error
    }
    const nueva = {
      id: `sea-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      fecha,
      estacionId,
      numeroExpediente: numero,
      pacienteNombre: 'Paciente de prueba',
      tipo,
      primeraVez,
      clinicaPersonalId,
      clinicaPersonalNombre: clinicaPersonalId ? `Clínica ${clinicaPersonalId}` : null,
      registradoPor: 'Enfermería',
      registradoEn: new Date().toISOString(),
    }
    salidasMock = [nueva, ...salidasMock]
    return nueva
  }
  return desenvolver(
    await client.post('/salidas-enfermeria-archivo', {
      numeroExpediente,
      estacionId,
      fecha,
      tipo,
      primeraVez,
      clinicaPersonalId,
    }),
  )
}

export async function descargarSalidasEnfermeriaArchivoPdf({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    const filas = salidasMock.filter(
      (s) => s.fecha === fecha && String(s.estacionId) === String(estacionId),
    )
    return construirPdfSimple([
      'HOSPITAL REGIONAL DE OCCIDENTE',
      'CONTROL DE SALIDA DE ENFERMERÍA A ARCHIVO',
      `Fecha: ${fecha ?? ''}`,
      ...filas.map(
        (s, indice) =>
          `${indice + 1}. ${s.numeroExpediente} · ${s.pacienteNombre} · ${ETIQUETAS[s.tipo] ?? 'Normal'} · Primera vez: ${s.primeraVez ? 'Sí' : 'No'}`,
      ),
    ])
  }
  return client.get('/salidas-enfermeria-archivo/pdf', {
    params: { fecha, estacionId },
    responseType: 'blob',
  })
}

export function reiniciarSalidasEnfermeriaArchivoMock() {
  salidasMock = []
}
