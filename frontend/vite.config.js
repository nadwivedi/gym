import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // BACKEND_URL comes from .env; it is used here only and never reaches the browser.
  const { BACKEND_URL } = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: true, // reachable from a phone on the same Wi-Fi
      proxy: { '/api': BACKEND_URL || 'http://localhost:4000' },
      fs: { allow: ['..'] }, // ../shared holds the rules used by both sides
    },
  }
})
