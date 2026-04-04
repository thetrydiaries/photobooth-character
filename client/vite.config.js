import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyse': 'http://localhost:3001',
      '/variants': 'http://localhost:3001',
    },
  },
})
