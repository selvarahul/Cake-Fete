// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // forward any /api request to backend
      '/api': {
        target: 'http://localhost:1573',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api') // identity, but explicit
      },
      // optional: serve uploads through proxy too if you warm to use /uploads
      '/uploads': {
        target: 'http://localhost:1573',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/uploads/, '/uploads')
      }
    }
  }
})
