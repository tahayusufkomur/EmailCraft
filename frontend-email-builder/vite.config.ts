import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const hmrHost = process.env.VITE_HMR_HOST
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || '')
const hmrProtocol = process.env.VITE_HMR_PROTOCOL
const hmrPath = process.env.VITE_HMR_PATH
const hmr =
  hmrHost || hmrClientPort || hmrProtocol || hmrPath
    ? {
        host: hmrHost,
        clientPort: hmrClientPort || undefined,
        protocol: hmrProtocol,
        path: hmrPath || undefined,
      }
    : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/builder/',
  clearScreen: false,
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    // Host-native dev (make local-dev): the /api → /api/v1 rewrite Caddy does in prod.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (path) => path.replace(/^\/api\//, '/api/v1/'),
      },
    },
    ...(hmr ? { hmr } : {}),
  },
})
