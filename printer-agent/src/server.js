import http from 'node:http'
import { config } from './config.js'
import { construirTicketPrueba } from './escpos.js'
import { imprimir, prepararImpresora } from './impresora.js'

const VERSION = '0.1.0'
const LIMITE_CUERPO = 64 * 1024

function aplicarCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Print-Token')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Access-Control-Max-Age', '600')
}

function responderJson(res, estado, cuerpo) {
  const texto = JSON.stringify(cuerpo)
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
  })
  res.end(texto)
}

function leerCuerpo(req, limite = LIMITE_CUERPO) {
  return new Promise((resolve, reject) => {
    let total = 0
    const partes = []
    req.on('data', (parte) => {
      total += parte.length
      if (total > limite) {
        reject(new Error('El cuerpo de la solicitud es demasiado grande'))
        req.destroy()
        return
      }
      partes.push(parte)
    })
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')))
    req.on('error', reject)
  })
}

function autorizado(req) {
  if (!config.token) return true
  return req.headers['x-print-token'] === config.token
}

function texto(valor, defecto, maximo = 64) {
  const limpio = String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
  return (limpio || defecto).slice(0, maximo)
}

const preparacion = prepararImpresora()
if (!preparacion.ok) {
  console.warn(`[aviso] ${preparacion.mensaje}`)
}

const servidor = http.createServer(async (req, res) => {
  aplicarCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    responderJson(res, 200, {
      ok: true,
      version: VERSION,
      impresora: config.impresora,
      columnas: config.columnas,
      corte: config.corte,
      listoParaImprimir: preparacion.ok,
      detalle: preparacion.ok ? null : preparacion.mensaje,
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/') {
    responderJson(res, 200, {
      ok: true,
      servicio: 'HRO Print Agent',
      version: VERSION,
      endpoints: ['GET /health', 'POST /print', 'POST /print/test'],
    })
    return
  }

  if (req.method === 'POST' && (url.pathname === '/print' || url.pathname === '/print/test')) {
    if (!autorizado(req)) {
      responderJson(res, 401, { ok: false, mensaje: 'Token de impresión inválido' })
      return
    }

    let datos = {}
    try {
      const cuerpo = await leerCuerpo(req)
      datos = cuerpo ? JSON.parse(cuerpo) : {}
    } catch (error) {
      responderJson(res, 400, { ok: false, mensaje: `Solicitud inválida: ${error.message}` })
      return
    }

    const esPrueba = url.pathname.endsWith('/test')
    const turno = esPrueba ? Number(datos.turno ?? 1) : Number(datos.turno)

    if (!Number.isInteger(turno) || turno < 0) {
      responderJson(res, 400, { ok: false, mensaje: 'Falta el número de turno (entero >= 0)' })
      return
    }

    const ticket = {
      turno,
      especialidad: texto(datos.especialidad, 'Medicina General'),
      clinica: texto(datos.clinica, '01', 16),
      fechaHora: texto(datos.fechaHora, '', 40) || undefined,
    }

    try {
      const buffer = construirTicketPrueba(ticket, {
        columnas: config.columnas,
        corte: config.corte,
      })
      const inicio = Date.now()
      const resultado = imprimir(buffer, {
        impresora: texto(datos.impresora, config.impresora, 120),
        copias: datos.copias,
      })
      const duracionMs = Date.now() - inicio

      if (!resultado.ok) {
        console.error(`[error] ${resultado.mensaje}`)
        responderJson(res, 503, { ok: false, mensaje: resultado.mensaje, duracionMs })
        return
      }

      console.log(
        `[ticket] #${String(turno).padStart(3, '0')} | ${ticket.especialidad} | clinica ${ticket.clinica} | ${duracionMs} ms`,
      )
      responderJson(res, 200, {
        ok: true,
        turno,
        impresora: config.impresora,
        duracionMs,
      })
    } catch (error) {
      responderJson(res, 400, { ok: false, mensaje: error.message })
    }
    return
  }

  responderJson(res, 404, { ok: false, mensaje: 'Ruta no encontrada' })
})

servidor.listen(config.puerto, '127.0.0.1', () => {
  console.log(`HRO Print Agent v${VERSION} escuchando en http://127.0.0.1:${config.puerto}`)
  console.log(
    `Impresora: ${config.impresora} | ${config.columnas} columnas | corte: ${config.corte ? 'si' : 'no'}`,
  )
  if (!preparacion.ok) console.log(`Impresión no disponible: ${preparacion.mensaje}`)
})

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `El puerto ${config.puerto} ya está en uso. Cierre la otra instancia o cambie HRO_PRINT_PORT.`,
    )
  } else {
    console.error(error)
  }
  process.exit(1)
})
