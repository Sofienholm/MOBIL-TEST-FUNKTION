import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// WebXR kræver HTTPS på rigtige enheder. `vite dev --host` eksponerer
// serveren på dit LAN, så du kan åbne den på mobilen (se README).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
