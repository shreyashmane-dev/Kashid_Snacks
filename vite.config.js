import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fix 404 on page refresh for SPA routes (e.g. /profile, /shop, /admin)
    historyApiFallback: true,
  },
})
