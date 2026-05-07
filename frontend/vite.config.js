import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['robust-education-production-f62d.up.railway.app', '*.up.railway.app', 'localhost'],
  },
})
