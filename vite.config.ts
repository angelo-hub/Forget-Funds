import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-tabs']
        }
      }
    }
  },
  server: {
    port: 3000
  }
})
