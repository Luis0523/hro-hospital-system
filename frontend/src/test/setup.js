import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Node 22+ expone un global `localStorage` indefinido que eclipsa el de jsdom
// (el valor queda `undefined`). Lo reemplazamos por una implementación en memoria
// cuando jsdom no lo provee. En Node 20 (CI) el nativo de jsdom ya existe y esto no aplica.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  const storage = {
    getItem: (clave) => (store.has(String(clave)) ? store.get(String(clave)) : null),
    setItem: (clave, valor) => store.set(String(clave), String(valor)),
    removeItem: (clave) => store.delete(String(clave)),
    clear: () => store.clear(),
    key: (indice) => Array.from(store.keys())[indice] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
