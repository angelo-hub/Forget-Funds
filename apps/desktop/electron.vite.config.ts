import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      // Help resolve workspace packages
      alias: {
        '@forgetfunds/shared-types': resolve(__dirname, '../../packages/shared-types/src'),
        '@forgetfunds/business-logic': resolve(__dirname, '../../packages/business-logic/src'),
        '@forgetfunds/data-layer': resolve(__dirname, '../../packages/data-layer/src')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        // Add workspace package aliases for renderer
        '@forgetfunds/shared-types': resolve(__dirname, '../../packages/shared-types/src'),
        '@forgetfunds/business-logic': resolve(__dirname, '../../packages/business-logic/src'),
        '@forgetfunds/data-layer': resolve(__dirname, '../../packages/data-layer/src')
      }
    },
    plugins: [react()],
    build: {
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
    }
  }
})
