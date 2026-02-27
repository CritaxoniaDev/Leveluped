import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { v4 as uuidv4 } from 'uuid'
import { minify } from 'html-minifier-terser'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'

const buildId = uuidv4()
dotenv.config()

// Custom plugin to minify index.html in production
function minifyHtmlPlugin() {
  return {
    name: 'minify-html',
    apply: 'build' as const,
    enforce: 'post' as const,
    async closeBundle() {
      if (process.env.NODE_ENV === 'production') {
        const distDir = path.resolve(__dirname, 'dist')
        const indexPath = path.join(distDir, 'index.html')
        const jwtSecret = process.env.VITE_PUBLIC_JWT_SECRET
        if (!jwtSecret) throw new Error('JWT_SECRET is not set')
        const jwtToken = jwt.sign({ buildId, env: 'production' }, jwtSecret, { expiresIn: '7d' })

        // Inject JWT into index.html as a meta tag
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8')
          html = html.replace(
            '</head>',
            `<noscript>${jwtToken}</noscript></head>`
          )
          const minified = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            minifyJS: true,
            useShortDoctype: true,
          })
          fs.writeFileSync(indexPath, minified)
        }

        // Write application.json with buildId
        const jsonPath = path.join(distDir, 'application.json')
        fs.writeFileSync(jsonPath, JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2), 'utf8')
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), minifyHtmlPlugin()],
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
          'react': ['react'],
          'react-dom': ['react-dom'],
          'react-router-dom': ['react-router-dom'],
          'react-hook-form': ['react-hook-form'],
          '@hookform/resolvers': ['@hookform/resolvers'],
          'lucide-react': ['lucide-react'],
          // Radix UI components
          '@radix-ui/react-dialog': ['@radix-ui/react-dialog'],
          '@radix-ui/react-select': ['@radix-ui/react-select'],
          '@radix-ui/react-accordion': ['@radix-ui/react-accordion'],
          '@radix-ui/react-alert-dialog': ['@radix-ui/react-alert-dialog'],
          '@radix-ui/react-aspect-ratio': ['@radix-ui/react-aspect-ratio'],
          '@radix-ui/react-avatar': ['@radix-ui/react-avatar'],
          '@radix-ui/react-checkbox': ['@radix-ui/react-checkbox'],
          '@radix-ui/react-collapsible': ['@radix-ui/react-collapsible'],
          '@radix-ui/react-context-menu': ['@radix-ui/react-context-menu'],
          '@radix-ui/react-dropdown-menu': ['@radix-ui/react-dropdown-menu'],
          '@radix-ui/react-hover-card': ['@radix-ui/react-hover-card'],
          '@radix-ui/react-label': ['@radix-ui/react-label'],
          '@radix-ui/react-menubar': ['@radix-ui/react-menubar'],
          '@radix-ui/react-navigation-menu': ['@radix-ui/react-navigation-menu'],
          '@radix-ui/react-popover': ['@radix-ui/react-popover'],
          '@radix-ui/react-progress': ['@radix-ui/react-progress'],
          '@radix-ui/react-radio-group': ['@radix-ui/react-radio-group'],
          '@radix-ui/react-scroll-area': ['@radix-ui/react-scroll-area'],
          '@radix-ui/react-separator': ['@radix-ui/react-separator'],
          '@radix-ui/react-slider': ['@radix-ui/react-slider'],
          '@radix-ui/react-slot': ['@radix-ui/react-slot'],
          '@radix-ui/react-switch': ['@radix-ui/react-switch'],
          '@radix-ui/react-tabs': ['@radix-ui/react-tabs'],
          '@radix-ui/react-toggle': ['@radix-ui/react-toggle'],
          '@radix-ui/react-toggle-group': ['@radix-ui/react-toggle-group'],
          '@radix-ui/react-tooltip': ['@radix-ui/react-tooltip'],
          '@radix-ui/react-use-controllable-state': ['@radix-ui/react-use-controllable-state'],
          // Map libraries
          'react-leaflet': ['react-leaflet'],
          'leaflet': ['leaflet'],
          'leaflet-draw': ['leaflet-draw'],
          'leaflet.fullscreen': ['leaflet.fullscreen'],
          'leaflet.markercluster': ['leaflet.markercluster'],
          'maplibre-gl': ['maplibre-gl'],
          '@turf/turf': ['@turf/turf'],
          'react-leaflet-markercluster': ['react-leaflet-markercluster'],
          // Backend & Auth
          '@supabase/supabase-js': ['@supabase/supabase-js'],
          // Stripe
          '@stripe/react-stripe-js': ['@stripe/react-stripe-js'],
          '@stripe/stripe-js': ['@stripe/stripe-js'],
          'stripe': ['stripe'],
          // UI & Utils
          'sonner': ['sonner'],
          'clsx': ['clsx'],
          'class-variance-authority': ['class-variance-authority'],
          'tailwind-merge': ['tailwind-merge'],
          'zod': ['zod'],
          'date-fns': ['date-fns'],
          'i18n-iso-countries': ['i18n-iso-countries'],
          'world-countries': ['world-countries'],
          // Editor
          'monaco-editor': ['monaco-editor'],
          '@monaco-editor/react': ['@monaco-editor/react'],
          'react-code-blocks': ['react-code-blocks'],
          // Carousel
          'embla-carousel-react': ['embla-carousel-react'],
          // Emoji
          'emoji-picker-react': ['emoji-picker-react'],
          // Charts
          'recharts': ['recharts'],
          // Other UI
          'cmdk': ['cmdk'],
          'vaul': ['vaul'],
          'input-otp': ['input-otp'],
        },
        chunkFileNames: `levelupedapp/_vite/_assets/_chunks/[hash].js`,
        entryFileNames: `levelupedapp/_vite/_assets/_chunks/[hash].js`,
        assetFileNames: (assetInfo) => {
          const names = assetInfo.names || [];
          // For Tailwind CSS
          if (names.some((n) => n.includes('tailwind'))) {
            return `levelupedapp/_vite/_assets/_chunks/${buildId}[hash].css`
          }
          // For Monaco Editor CSS
          if (names.some((n) => n.toLowerCase().includes('monaco'))) {
            return `levelupedapp/_vite/_assets/_chunks/${buildId}[hash].css`
          }
          // For other CSS files
          if (names.some((n) => n.endsWith('.css'))) {
            return `levelupedapp/_vite/_assets/_chunks/${buildId}[hash].css`
          }
          // For all other assets
          return `levelupedapp/_vite/_assets/_chunks/${buildId}[hash].[ext]`
        }
      }
    }
  },
})