import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      input: './src/main.tsx'
    }
  }
})