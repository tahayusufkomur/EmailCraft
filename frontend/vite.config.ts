import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const hmrHost = process.env.VITE_HMR_HOST
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || '')
const hmrProtocol = process.env.VITE_HMR_PROTOCOL
const hmr =
  hmrHost || hmrClientPort || hmrProtocol
    ? {
        host: hmrHost,
        clientPort: hmrClientPort || undefined,
        protocol: hmrProtocol,
      }
    : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    ...(hmr ? { hmr } : {}),
  },
})
