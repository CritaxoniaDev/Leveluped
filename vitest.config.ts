/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import viteConfig from './vite.config'

export default defineConfig({
  ...viteConfig,
  plugins: [react()],
  test: {
    ...viteConfig.test,
    globals: true,     
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})