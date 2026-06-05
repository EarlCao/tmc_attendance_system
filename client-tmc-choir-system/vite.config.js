import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Required for Docker
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3302',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3302',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  define: {
    // Makes VITE_API_URL available in the built app as import.meta.env.VITE_API_URL
  },
})
