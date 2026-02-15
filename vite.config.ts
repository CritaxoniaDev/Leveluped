import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { v4 as uuidv4 } from 'uuid'

// Generate a unique build ID
const buildId = uuidv4()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', 'lucide-react'],
          'map-vendor': ['react-leaflet', 'leaflet'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils': ['sonner', 'clsx']
        },
        chunkFileNames: `_vite/_assets/_chunks/[name]-v=levelupedv1_${buildId}-[hash].js`,
        entryFileNames: `_vite/_assets/_chunks/[name]-v=levelupedv1-${buildId}-[hash].js`,
        assetFileNames: `_vite/_assets/_chunks/[name]-v=levelupedv1-${buildId}-[hash].[ext]`
      }
    }
  },
})