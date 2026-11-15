import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // erlaubt Zugriff vom iPhone im selben WLAN
    host: true,
    port: 5173,
  },
})
