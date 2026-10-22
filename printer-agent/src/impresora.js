import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config, RAIZ } from './config.js'

const EXE = path.join(RAIZ, 'bin', 'RawPrint.exe')
const FUENTE = path.join(RAIZ, 'src', 'RawPrint.cs')

function buscarCsc() {
  const windir = process.env.WINDIR || 'C:\\Windows'
  return [
    path.join(windir, 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe'),
    path.join(windir, 'Microsoft.NET', 'Framework', 'v4.0.30319', 'csc.exe'),
  ].find((ruta) => fs.existsSync(ruta))
}

let estadoCompilacion = null

export function prepararImpresora() {
  if (estadoCompilacion) return estadoCompilacion
  if (fs.existsSync(EXE)) {
    estadoCompilacion = { ok: true }
    return estadoCompilacion
  }

  const csc = buscarCsc()
  if (!csc) {
    estadoCompilacion = {
      ok: false,
      mensaje: 'No se encontró csc.exe (.NET Framework 4). Instale .NET Framework o compile bin/RawPrint.exe aparte.',
    }
    return estadoCompilacion
  }

  fs.mkdirSync(path.dirname(EXE), { recursive: true })
  const compilacion = spawnSync(
    csc,
    ['/nologo', '/target:exe', `/out:${EXE}`, FUENTE],
    { encoding: 'utf8', windowsHide: true },
  )

  if (compilacion.status !== 0 || !fs.existsSync(EXE)) {
    estadoCompilacion = {
      ok: false,
      mensaje: `No se pudo compilar RawPrint.exe: ${(compilacion.stderr || compilacion.stdout || '').trim()}`,
    }
    return estadoCompilacion
  }

  estadoCompilacion = { ok: true }
  return estadoCompilacion
}

export function imprimir(buffer, { impresora = config.impresora, copias = 1 } = {}) {
  const preparacion = prepararImpresora()
  if (!preparacion.ok) return preparacion

  const total = Math.max(1, Math.min(5, Number(copias) || 1))
  const archivo = path.join(os.tmpdir(), `hro-ticket-${process.pid}-${Date.now()}.bin`)
  fs.writeFileSync(archivo, buffer)

  try {
    for (let i = 0; i < total; i++) {
      const resultado = spawnSync(EXE, [impresora, archivo], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 15000,
      })

      if (resultado.error) {
        return { ok: false, mensaje: resultado.error.message }
      }
      if (resultado.status !== 0) {
        const detalle = (resultado.stderr || resultado.stdout || '').trim()
        return {
          ok: false,
          mensaje: detalle || `RawPrint terminó con código ${resultado.status}`,
        }
      }
    }
    return { ok: true }
  } finally {
    try {
      fs.unlinkSync(archivo)
    } catch {
      /* el archivo temporal se limpia en el siguiente intento */
    }
  }
}
