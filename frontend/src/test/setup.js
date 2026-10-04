import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Node 22+ expone un global `localStorage` indefinido que eclipsa el de jsdom
// (el valor queda `undefined`). Lo reemplazamos por un Storage en memoria que
// imita el nativo (incluido `Object.keys(localStorage)` para enumerar claves).
// En Node 20 (CI) el nativo de jsdom ya existe y esto no aplica.
function crearStorage() {
  const datos = new Map()
  const api = {
    getItem: (clave) => (datos.has(String(clave)) ? datos.get(String(clave)) : null),
    setItem: (clave, valor) => {
      datos.set(String(clave), String(valor))
    },
    removeItem: (clave) => {
      datos.delete(String(clave))
    },
    clear: () => {
      datos.clear()
    },
    key: (indice) => Array.from(datos.keys())[indice] ?? null,
  }

  return new Proxy(api, {
    get(objetivo, propiedad) {
      if (propiedad in objetivo) return objetivo[propiedad]
      if (propiedad === 'length') return datos.size
      return datos.has(propiedad) ? datos.get(propiedad) : undefined
    },
    set(objetivo, propiedad, valor) {
      if (propiedad in objetivo) {
        objetivo[propiedad] = valor
        return true
      }
      datos.set(String(propiedad), String(valor))
      return true
    },
    has(objetivo, propiedad) {
      return propiedad in objetivo || datos.has(propiedad)
    },
    deleteProperty(objetivo, propiedad) {
      return datos.delete(String(propiedad))
    },
    ownKeys() {
      return Array.from(datos.keys())
    },
    getOwnPropertyDescriptor(objetivo, propiedad) {
      if (datos.has(propiedad)) {
        return {
          enumerable: true,
          configurable: true,
          writable: true,
          value: datos.get(propiedad),
        }
      }
      return undefined
    },
  })
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: crearStorage(),
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: crearStorage(),
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
