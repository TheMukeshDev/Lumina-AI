import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({

  // Use a relative base by default so the build works when served from a subpath
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // REQUIRED: This tells Vite to accept connections from Ngrok
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    }
  },
  preview: {
    port: 4173,
    open: true
  }
})