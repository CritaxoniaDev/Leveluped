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
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom','react-hook-form', '@hookform/resolvers'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', 'lucide-react','@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio','@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible','@radix-ui/react-context-menu', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card','@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu','@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group','@radix-ui/react-scroll-area', '@radix-ui/react-separator', '@radix-ui/react-slider','@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs','@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip','@radix-ui/react-use-controllable-state', 'cmdk', 'vaul', 'input-otp'],
          'map-vendor': ['react-leaflet', 'leaflet', 'leaflet-draw', 'leaflet.fullscreen', 'leaflet.markercluster', 'maplibre-gl', '@turf/turf'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'stripe-vendor': ['@stripe/react-stripe-js', '@stripe/stripe-js', 'stripe'],
          'utils': ['sonner', 'clsx', 'class-variance-authority', 'tailwind-merge', 'zod', 'date-fns', 'i18n-iso-countries', 'world-countries'],
          'editor-vendor': ['monaco-editor', '@monaco-editor/react', 'react-code-blocks'],
          'carousel-vendor': ['embla-carousel-react'],
          'emoji-vendor': ['emoji-picker-react'],
          'chart-vendor': ['recharts']
        },
        chunkFileNames: `_vite/_assets/_chunks/[name]-v=levelupedv1-${buildId}-[hash].js`,
        entryFileNames: `_vite/_assets/_chunks/[name]-v=levelupedv1-${buildId}-[hash].js`,
        assetFileNames: (assetInfo) => {
          const names = assetInfo.names || [];
          if (names.some((n) => n.endsWith('.css'))) {
            return `_vite/_assets/_chunks/tailwindcss-v=levelupedv1-${buildId}-[hash].css`
          }
          return `_vite/_assets/_chunks/[name]-v=levelupedv1-${buildId}-[hash].[ext]`
        }
      }
    }
  },
})