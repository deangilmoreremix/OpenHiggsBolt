import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/shared/components'),
      '@/api': resolve(__dirname, './src/shared/api'),
      '@/types': resolve(__dirname, './src/shared/types')
    }
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