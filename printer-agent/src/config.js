import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function leerArchivo() {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.json'), 'utf8'))
  } catch {
    return {}
  }
}

const archivo = leerArchivo()
const entorno = process.env

function numero(valor, defecto) {
  const n = Number(valor)
  return Number.isFinite(n) && n > 0 ? n : defecto
}

function booleano(valor, defecto) {
  if (valor == null || valor === '') return defecto
  return String(valor).toLowerCase() === 'true' || String(valor) === '1'
}

export const config = {
  puerto: numero(entorno.HRO_PRINT_PORT || archivo.puerto, 17777),
  impresora: entorno.HRO_PRINT_PRINTER || archivo.impresora || 'AON Printer',
  columnas: numero(entorno.HRO_PRINT_COLUMNAS || archivo.columnas, 48),
  corte: booleano(entorno.HRO_PRINT_CORTE ?? archivo.corte, true),
  token: entorno.HRO_PRINT_TOKEN || archivo.token || '',
  origen: entorno.HRO_PRINT_ORIGEN || archivo.origen || '*',
}
