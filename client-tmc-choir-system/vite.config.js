import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Required for Docker
    proxy: {
      '/api': {
        // Uses VITE_API_TARGET env var when running in Docker,
        // falls back to localhost for normal dev
        target: process.env.VITE_API_TARGET || 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
