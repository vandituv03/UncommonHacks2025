import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,           // You can change the dev server port here
    open: true,           // Automatically opens the browser
  }
})
