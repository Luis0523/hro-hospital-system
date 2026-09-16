import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8081'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      global: 'globalThis',
    },
    server: {
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
