import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8081'

  // HTTPS solo en desarrollo: la cámara (getUserMedia) exige contexto seguro.
  // Permite probar el escáner desde el teléfono por la red local (IP:5173).
  const plugins = [react()]
  if (mode === 'development') plugins.push(basicSsl())

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      global: 'globalThis',
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true, ws: true },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: false,
      include: ['src/**/*.{test,spec}.{js,jsx}'],
    },
  }
})
